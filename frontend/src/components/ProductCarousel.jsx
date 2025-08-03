import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Mousewheel, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import ProductCard from './ProductCard';
import './ProductCarousel.css';
import { Link } from 'react-router-dom';

const ProductCarousel = ({ title, products, viewAllLink }) => {
    if (!products || products.length === 0) return null;

    return (
        <div className="product-carousel-section">
            <div className="section-header">
                <h2>{title}</h2>
                {viewAllLink && <Link to={viewAllLink} className="view-all-btn">View All</Link>}
            </div>
            <Swiper
                modules={[Navigation, Mousewheel, FreeMode]}
                spaceBetween={16}
                slidesPerView={'auto'}
                navigation
                freeMode={true}
                mousewheel={{ forceToAxis: true }}
            >
                {products.map(product => (
                    <SwiperSlide key={product._id} style={{ width: 'auto' }}>
                        <ProductCard product={product} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default ProductCarousel;
