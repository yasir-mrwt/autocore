import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";

const ProductCard = ({ product }) => {
  return (
    <div className="product-card group">
      <div className="product-card-image-wrapper">
        <div className="product-card-badge">
          {product.badge === "sale" ? (
            <span className="badge-sale">SALE</span>
          ) : (
            <span className="badge-hot">HOT</span>
          )}
        </div>
        <img
          src={product.image}
          alt={product.name}
          className="product-card-image"
        />
        <div className="product-card-overlay">
          <Link
            to="/cars?page=1"
            className="product-card-cart-btn"
          >
            <ShoppingCart size={18} />
            <span>View Details</span>
          </Link>
        </div>
      </div>
      <div className="product-card-info">
        <span className="product-card-category">{product.category}</span>
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-rating">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              fill={i < product.rating ? "#F59E0B" : "none"}
              className={i < product.rating ? "text-amber-500" : "text-gray-300"}
            />
          ))}
          <span className="product-card-reviews">({product.reviews})</span>
        </div>
        <div className="product-card-pricing">
          {product.originalPrice && (
            <span className="product-card-original-price">
              ₹{product.originalPrice.toLocaleString("en-IN")}
            </span>
          )}
          <span className="product-card-price">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
