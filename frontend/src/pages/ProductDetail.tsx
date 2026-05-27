import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Check, ShieldCheck, Truck } from 'lucide-react';
import api from '../lib/api';
import type { Product } from '../contexts/CartContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Failed to fetch product', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-20 text-2xl text-gray-500">Product not found</div>;
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-8 transition-colors font-medium">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Catalog
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="bg-gray-50 p-8 md:p-12 flex items-center justify-center">
            <img 
              src={product.image_url || 'https://via.placeholder.com/600'} 
              alt={product.name} 
              className="w-full max-w-md object-contain rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-500"
            />
          </div>
          
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-2">
              <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold tracking-wide">
                {product.category}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">{product.name}</h1>
            <p className="text-4xl font-black text-gray-900 mb-6">${Number(product.price).toFixed(2)}</p>
            
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              {product.description}
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex items-center text-gray-700">
                <ShieldCheck className="h-6 w-6 text-green-500 mr-3" />
                <span>1 Year Premium Warranty</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Truck className="h-6 w-6 text-primary-500 mr-3" />
                <span>Free shipping on orders over $50</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-8 mt-auto">
              {user ? (
                <div className="flex items-center gap-6">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-5 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary-600 font-bold text-xl transition-colors"
                    >
                      -
                    </button>
                    <span className="px-6 py-3 font-semibold text-lg min-w-[3rem] text-center">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="px-5 py-3 text-gray-600 hover:bg-gray-50 hover:text-primary-600 font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>

                  <button 
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-bold transition-all duration-300 shadow-md hover:shadow-lg ${
                      product.stock === 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : added 
                          ? 'bg-green-500 text-white'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="h-6 w-6" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-6 w-6" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gray-100 px-6 py-4 text-lg font-bold text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-600"
                >
                  Login to place order
                </Link>
              )}
              {product.stock > 0 ? (
                <p className="mt-4 text-sm text-gray-500 text-center">{product.stock} units available in stock</p>
              ) : (
                <p className="mt-4 text-sm text-red-500 font-medium text-center">Currently out of stock</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
