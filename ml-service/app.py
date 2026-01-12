from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
from scipy.sparse import csr_matrix
from datetime import datetime, timedelta
import pymongo
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB connection
mongo_client = pymongo.MongoClient(os.getenv('MONGO_URI'))
db = mongo_client[os.getenv('MONGO_DB_NAME', 'ecommerce')]

class RecommendationEngine:
    def __init__(self):
        self.user_item_matrix = None
        self.item_features = None
        self.user_features = None
        self.scaler = StandardScaler()
        
    def load_data(self, days=90):
        """Load events and product data from MongoDB"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Load events
        events = list(db.events.find({
            'createdAt': {'$gte': cutoff_date}
        }))
        
        # Load products
        products = list(db.products.find({'status': 'Published'}))
        
        # Load user profiles
        user_profiles = list(db.userprofiles.find())
        
        return events, products, user_profiles
    
    def build_user_item_matrix(self, events):
        """Build user-item interaction matrix with weighted events"""
        # Event weights
        event_weights = {
            'view': 1,
            'add_to_cart': 3,
            'purchase': 10,
            'wishlist': 5,
            'rating': 7
        }
        
        interactions = []
        for event in events:
            user_id = str(event.get('userId') or event.get('sessionId'))
            product_id = str(event.get('productId'))
            event_type = event.get('eventType')
            weight = event_weights.get(event_type, 1)
            
            if user_id and product_id:
                interactions.append({
                    'user_id': user_id,
                    'product_id': product_id,
                    'weight': weight
                })
        
        df = pd.DataFrame(interactions)
        if df.empty:
            return None
        
        # Aggregate weights
        df = df.groupby(['user_id', 'product_id'])['weight'].sum().reset_index()
        
        # Create pivot table
        matrix = df.pivot(index='user_id', columns='product_id', values='weight').fillna(0)
        return matrix
    
    def extract_product_features(self, products):
        """Extract features from products for content-based filtering"""
        features = []
        product_ids = []
        
        for product in products:
            product_id = str(product['_id'])
            product_ids.append(product_id)
            
            # Numeric features
            price = product.get('price', 0)
            discount = product.get('discount', 0)
            stock = product.get('stock', 0)
            rating = product.get('rating', 0)
            
            # Categorical features (one-hot encoded)
            category_id = str(product.get('category', ''))
            brand = product.get('brand', '')
            
            features.append({
                'product_id': product_id,
                'price': price,
                'discount': discount,
                'stock': stock,
                'rating': rating,
                'category': category_id,
                'brand': brand
            })
        
        df = pd.DataFrame(features)
        
        # One-hot encode categorical features
        df = pd.get_dummies(df, columns=['category', 'brand'])
        
        return df.set_index('product_id')
    
    def collaborative_filtering(self, user_id, k=10):
        """Collaborative filtering recommendations"""
        if self.user_item_matrix is None or user_id not in self.user_item_matrix.index:
            return []
        
        # Get user vector
        user_vector = self.user_item_matrix.loc[user_id].values.reshape(1, -1)
        
        # Calculate similarity with all users
        similarities = cosine_similarity(user_vector, self.user_item_matrix.values)[0]
        
        # Get top similar users
        similar_users_idx = np.argsort(similarities)[::-1][1:11]  # Top 10, excluding self
        
        # Aggregate items from similar users
        recommendations = {}
        for idx in similar_users_idx:
            similar_user_id = self.user_item_matrix.index[idx]
            user_items = self.user_item_matrix.loc[similar_user_id]
            
            for product_id, score in user_items.items():
                if score > 0 and product_id not in self.user_item_matrix.loc[user_id]:
                    recommendations[product_id] = recommendations.get(product_id, 0) + score * similarities[idx]
        
        # Sort and return top k
        sorted_recs = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)[:k]
        return [product_id for product_id, score in sorted_recs]
    
    def content_based_filtering(self, user_id, k=10):
        """Content-based recommendations based on user preferences"""
        if self.user_item_matrix is None or user_id not in self.user_item_matrix.index:
            return []
        
        # Get user's previously interacted items
        user_items = self.user_item_matrix.loc[user_id]
        interacted_items = user_items[user_items > 0].index.tolist()
        
        if not interacted_items or self.item_features is None:
            return []
        
        # Calculate average features of items user liked
        interacted_features = self.item_features.loc[
            self.item_features.index.isin(interacted_items)
        ]
        avg_features = interacted_features.mean().values.reshape(1, -1)
        
        # Find similar items
        similarities = cosine_similarity(avg_features, self.item_features.values)[0]
        
        # Exclude already interacted items
        for item in interacted_items:
            if item in self.item_features.index:
                item_idx = self.item_features.index.get_loc(item)
                similarities[item_idx] = -1
        
        # Get top k
        top_indices = np.argsort(similarities)[::-1][:k]
        return [self.item_features.index[idx] for idx in top_indices]
    
    def hybrid_recommendations(self, user_id, k=10):
        """Hybrid approach combining collaborative and content-based"""
        collab_recs = self.collaborative_filtering(user_id, k * 2)
        content_recs = self.content_based_filtering(user_id, k * 2)
        
        # Merge with weighted scores
        combined = {}
        for i, prod_id in enumerate(collab_recs):
            combined[prod_id] = combined.get(prod_id, 0) + (len(collab_recs) - i) * 0.6
        
        for i, prod_id in enumerate(content_recs):
            combined[prod_id] = combined.get(prod_id, 0) + (len(content_recs) - i) * 0.4
        
        sorted_recs = sorted(combined.items(), key=lambda x: x[1], reverse=True)[:k]
        return [product_id for product_id, score in sorted_recs]
    
    def cold_start_recommendations(self, k=10):
        """Recommendations for new users with no history"""
        # Return trending/popular items
        cutoff_date = datetime.now() - timedelta(days=7)
        
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
            {'$limit': k}
        ]
        
        results = list(db.events.aggregate(pipeline))
        return [str(r['_id']) for r in results]

# Initialize engine
engine = RecommendationEngine()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/train', methods=['POST'])
def train_model():
    """Train/update the recommendation models"""
    try:
        events, products, user_profiles = engine.load_data()
        
        # Build matrices
        engine.user_item_matrix = engine.build_user_item_matrix(events)
        engine.item_features = engine.extract_product_features(products)
        
        return jsonify({
            'success': True,
            'message': 'Model trained successfully',
            'stats': {
                'events': len(events),
                'products': len(products),
                'users': len(engine.user_item_matrix.index) if engine.user_item_matrix is not None else 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/recommendations/personalized', methods=['POST'])
def get_personalized_recommendations():
    """Get personalized recommendations for a user"""
    try:
        data = request.json
        user_id = data.get('userId') or data.get('sessionId')
        limit = int(data.get('limit', 10))
        
        if not user_id:
            # Cold start
            recommendations = engine.cold_start_recommendations(limit)
        else:
            # Hybrid recommendations
            recommendations = engine.hybrid_recommendations(user_id, limit)
            
            # Fallback to cold start if no recommendations
            if not recommendations:
                recommendations = engine.cold_start_recommendations(limit)
        
        return jsonify({
            'productIds': recommendations,
            'method': 'cold_start' if not user_id else 'hybrid'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/recommendations/also-bought', methods=['POST'])
def get_also_bought():
    """Get 'customers also bought' recommendations"""
    try:
        data = request.json
        product_id = data.get('productId')
        limit = int(data.get('limit', 6))
        
        # Find users who purchased this product
        purchase_events = list(db.events.find({
            'productId': pymongo.ObjectId(product_id),
            'eventType': 'purchase'
        }).limit(100))
        
        user_ids = [str(e.get('userId') or e.get('sessionId')) for e in purchase_events]
        
        # Find what else they bought
        other_purchases = list(db.events.find({
            '$or': [
                {'userId': {'$in': [pymongo.ObjectId(uid) for uid in user_ids if uid.startswith('session_') is False]}},
                {'sessionId': {'$in': [uid for uid in user_ids if uid.startswith('session_')]}}
            ],
            'eventType': 'purchase',
            'productId': {'$ne': pymongo.ObjectId(product_id)}
        }))
        
        # Count occurrences
        product_counts = {}
        for event in other_purchases:
            pid = str(event['productId'])
            product_counts[pid] = product_counts.get(pid, 0) + 1
        
        # Sort and return top
        sorted_products = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        recommendations = [pid for pid, count in sorted_products]
        
        return jsonify({'productIds': recommendations})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Train model on startup
    print("Training initial model...")
    try:
        events, products, user_profiles = engine.load_data()
        engine.user_item_matrix = engine.build_user_item_matrix(events)
        engine.item_features = engine.extract_product_features(products)
        print("Model trained successfully!")
    except Exception as e:
        print(f"Error training model: {e}")
    
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
