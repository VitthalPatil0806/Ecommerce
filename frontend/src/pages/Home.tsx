import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import api from '../lib/api';
import type { Product } from '../contexts/CartContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter((category): category is string => Boolean(category)),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [products],
  );

  const selectedCategory = searchParams.get('category');
  const filteredProducts = useMemo(
    () =>
      selectedCategory
        ? products.filter((product) => product.category === selectedCategory)
        : products,
    [products, selectedCategory],
  );

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId);
    try {
      await addToCart(productId, 1);
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setAddingToCart(null), 500); // UI feedback
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Featured Products</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Discover our premium collection of handpicked items designed to elevate your everyday life.</p>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            !selectedCategory
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 shadow-sm hover:text-primary-600'
          }`}
        >
          All Categories
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSearchParams({ category })}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              selectedCategory === category
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 shadow-sm hover:text-primary-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="mb-8 text-center text-sm font-medium text-gray-500">
          Showing products in <span className="text-gray-900">{selectedCategory}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.map((product) => (
          <div key={product.id} className="card group overflow-hidden flex flex-col h-full bg-white rounded-2xl">
            <Link to={`/product/${product.id}`} className="relative block overflow-hidden aspect-w-4 aspect-h-3 bg-gray-100">
              <img 
                src={product.image_url || 'https://via.placeholder.com/500'} 
                alt={product.name} 
                className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              {product.stock <= 5 && product.stock > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                  Only {product.stock} left!
                </div>
              )}
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg bg-gray-900 px-4 py-2 rounded-md">Out of Stock</span>
                </div>
              )}
            </Link>
            
            <div className="p-5 flex flex-col flex-grow">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">{product.category}</span>
                {product.stock === 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
                    Out of Stock
                  </span>
                )}
              </div>
              <Link to={`/product/${product.id}`}>
                <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-primary-600 transition-colors line-clamp-2">{product.name}</h3>
              </Link>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-xl font-black text-gray-900">${Number(product.price).toFixed(2)}</span>

                {user ? (
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={product.stock === 0 || addingToCart === product.id}
                    className={`flex items-center justify-center p-2 rounded-full transition-all duration-300 ${
                      product.stock === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : addingToCart === product.id
                          ? 'bg-green-500 text-white scale-110'
                          : 'bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white shadow-sm hover:shadow-md'
                    }`}
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600"
                  >
                    Login to buy
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!filteredProducts.length && (
        <div className="mt-12 rounded-2xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">No products in this category yet</h2>
          <p className="mt-3 text-gray-500">Try another category or return to the full catalog.</p>
        </div>
      )}
    </div>
  );
};

export default Home;
