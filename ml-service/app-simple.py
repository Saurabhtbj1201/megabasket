from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import pymongo
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv
from collections import defaultdict, Counter

load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB connection
mongo_client = pymongo.MongoClient(os.getenv('MONGO_URI'))
db = mongo_client[os.getenv('MONGO_DB_NAME', 'ecommerce')]

class SimpleRecommendationEngine:
    def __init__(self):
        self.event_weights = {
            'view': 1,
            'add_to_cart': 3,
            'purchase': 10,
            'wishlist': 5,
            'rating': 7
        }
    
    def get_user_interactions(self, user_id, days=90):
        """Get user's recent interactions"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Check if user_id is a valid ObjectId
        user_query = {}
        if len(user_id) == 24:
            try:
                user_query = {'userId': ObjectId(user_id)}
            except:
                user_query = {'sessionId': user_id}
        else:
            user_query = {'sessionId': user_id}
        
        events = list(db.events.find({
            '$or': [
                user_query,
                {'sessionId': user_id}
            ],
            'createdAt': {'$gte': cutoff_date}
        }))
        
        return events
    
    def get_user_preferences(self, user_id):
        """Build user preference profile"""
        events = self.get_user_interactions(user_id)
        
        category_scores = defaultdict(int)
        product_scores = defaultdict(int)
        brand_scores = defaultdict(int)
        
        for event in events:
            if event.get('productId'):
                product = db.products.find_one({'_id': event['productId']})
                if product:
                    weight = self.event_weights.get(event.get('eventType'), 1)
                    
                    if product.get('category'):
                        category_scores[str(product['category'])] += weight
                    
                    product_scores[str(event['productId'])] += weight
                    
                    if product.get('brand'):
                        brand_scores[product['brand']] += weight
        
        return {
            'categories': category_scores,
            'products': product_scores,
            'brands': brand_scores
        }
    
    def collaborative_filtering_simple(self, user_id, limit=10):
        """Simple collaborative filtering"""
        # Get user's interacted products
        user_events = self.get_user_interactions(user_id)
        user_products = set(str(e['productId']) for e in user_events if e.get('productId'))
        
        if not user_products:
            return []
        
        # Convert string product IDs to ObjectId for MongoDB query
        product_object_ids = []
        for pid in user_products:
            try:
                product_object_ids.append(ObjectId(pid))
            except:
                continue
        
        if not product_object_ids:
            return []
        
        # Find similar users (users who interacted with same products)
        try:
            # Build query for similar users
            user_id_query = {}
            if len(user_id) == 24:
                try:
                    user_id_query = {'userId': {'$ne': ObjectId(user_id)}}
                except:
                    user_id_query = {'sessionId': {'$ne': user_id}}
            else:
                user_id_query = {'sessionId': {'$ne': user_id}}
            
            similar_users = list(db.events.aggregate([
                {
                    '$match': {
                        'productId': {'$in': product_object_ids},
                        **user_id_query
                    }
                },
                {
                    '$group': {
                        '_id': {'$ifNull': ['$userId', '$sessionId']},
                        'commonProducts': {'$addToSet': '$productId'}
                    }
                },
                {'$limit': 20}
            ]))
        except Exception as e:
            print(f"Error in collaborative filtering aggregation: {e}")
            return []
        
        # Get products from similar users
        recommended_products = Counter()
        for similar_user in similar_users:
            similar_user_id = str(similar_user['_id'])
            similar_events = self.get_user_interactions(similar_user_id, days=30)
            
            for event in similar_events:
                if event.get('productId'):
                    pid = str(event['productId'])
                    if pid not in user_products:
                        weight = self.event_weights.get(event.get('eventType'), 1)
                        recommended_products[pid] += weight
        
        # Get top recommendations
        top_products = [pid for pid, _ in recommended_products.most_common(limit)]
        return top_products
    
    def content_based_filtering_simple(self, user_id, limit=10):
        """Simple content-based filtering"""
        preferences = self.get_user_preferences(user_id)
        
        if not preferences['categories']:
            return []
        
        # Get top categories
        top_categories = sorted(preferences['categories'].items(), 
                               key=lambda x: x[1], reverse=True)[:3]
        
        # Convert category IDs to ObjectId
        category_ids = []
        for cat_id, _ in top_categories:
            try:
                category_ids.append(ObjectId(cat_id))
            except:
                continue
        
        if not category_ids:
            return []
        
        # Convert already viewed product IDs to ObjectId
        viewed_product_ids = []
        for pid in preferences['products'].keys():
            try:
                viewed_product_ids.append(ObjectId(pid))
            except:
                continue
        
        # Find products from preferred categories
        products = list(db.products.find({
            'category': {'$in': category_ids},
            'status': 'Published',
            '_id': {'$nin': viewed_product_ids}
        }).sort('discount', -1).limit(limit))
        
        return [str(p['_id']) for p in products]
    
    def get_trending(self, days=7, limit=10):
        """Get trending products"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        try:
            pipeline = [
                {
                    '$match': {
                        'createdAt': {'$gte': cutoff_date},
                        'eventType': {'$in': ['view', 'purchase', 'add_to_cart']}
                    }
                },
                {
                    '$group': {
                        '_id': '$productId',
                        'score': {
                            '$sum': {
                                '$switch': {
                                    'branches': [
                                        {'case': {'$eq': ['$eventType', 'purchase']}, 'then': 10},
                                        {'case': {'$eq': ['$eventType', 'add_to_cart']}, 'then': 3},
                                        {'case': {'$eq': ['$eventType', 'view']}, 'then': 1}
                                    ],
                                    'default': 0
                                }
                            }
                        }
                    }
                },
                {'$sort': {'score': -1}},
                {'$limit': limit}
            ]
            
            results = list(db.events.aggregate(pipeline))
            return [str(r['_id']) for r in results]
        except Exception as e:
            print(f"Error getting trending products: {e}")
            # Fallback: return some published products
            try:
                products = list(db.products.find({'status': 'Published'}).sort('discount', -1).limit(limit))
                return [str(p['_id']) for p in products]
            except:
                return []

# Initialize engine
engine = SimpleRecommendationEngine()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'version': 'simple'})

@app.route('/train', methods=['POST'])
def train_model():
    """Training endpoint (no-op for simple engine)"""
    try:
        event_count = db.events.count_documents({})
        product_count = db.products.count_documents({'status': 'Published'})
        
        return jsonify({
            'success': True,
            'message': 'Simple recommendation engine is ready',
            'stats': {
                'events': event_count,
                'products': product_count
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/recommendations/personalized', methods=['POST'])
def get_personalized_recommendations():
    """Get personalized recommendations"""
    try:
        data = request.json
        user_id = data.get('userId') or data.get('sessionId')
        limit = int(data.get('limit', 10))
        
        if not user_id:
            # Cold start - return trending
            recommendations = engine.get_trending(limit=limit)
        else:
            # Try collaborative filtering first
            collab_recs = engine.collaborative_filtering_simple(user_id, limit)
            
            if len(collab_recs) < limit:
                # Supplement with content-based
                content_recs = engine.content_based_filtering_simple(
                    user_id, limit - len(collab_recs)
                )
                recommendations = collab_recs + content_recs
            else:
                recommendations = collab_recs[:limit]
            
            # If still not enough, add trending
            if len(recommendations) < limit:
                trending = engine.get_trending(limit=limit - len(recommendations))
                recommendations.extend(trending)
        
        return jsonify({
            'productIds': recommendations[:limit],
            'method': 'simple_hybrid' if user_id else 'trending'
        })
    except Exception as e:
        print(f"Error in personalized recommendations: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/recommendations/also-bought', methods=['POST'])
def get_also_bought():
    """Get 'customers also bought' recommendations"""
    try:
        data = request.json
        product_id = data.get('productId')
        limit = int(data.get('limit', 6))
        
        # Convert product_id to ObjectId
        try:
            product_oid = ObjectId(product_id)
        except:
            return jsonify({'productIds': []})
        
        # Find users who purchased this product
        purchase_events = list(db.events.find({
            'productId': product_oid,
            'eventType': 'purchase'
        }).limit(100))
        
        if not purchase_events:
            return jsonify({'productIds': []})
        
        user_ids = []
        session_ids = []
        for e in purchase_events:
            if e.get('userId'):
                user_ids.append(e['userId'])
            if e.get('sessionId'):
                session_ids.append(e['sessionId'])
        
        # Find what else they bought
        query_parts = []
        if user_ids:
            query_parts.append({'userId': {'$in': user_ids}})
        if session_ids:
            query_parts.append({'sessionId': {'$in': session_ids}})
        
        if not query_parts:
            return jsonify({'productIds': []})
        
        other_purchases = list(db.events.find({
            '$or': query_parts,
            'eventType': 'purchase',
            'productId': {'$ne': product_oid}
        }))
        
        # Count occurrences
        product_counts = Counter()
        for event in other_purchases:
            if event.get('productId'):
                product_counts[str(event['productId'])] += 1
        
        # Get top recommendations
        top_products = [pid for pid, _ in product_counts.most_common(limit)]
        
        return jsonify({'productIds': top_products})
    except Exception as e:
        print(f"Error in also-bought: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('ML_SERVICE_PORT', 5001))
    print(f"Starting Simple ML Recommendation Service on port {port}...")
    print("This version uses basic algorithms without heavy ML dependencies")
    app.run(host='0.0.0.0', port=port, debug=True)
