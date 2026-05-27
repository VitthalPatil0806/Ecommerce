import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface CheckoutForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  payment_method: 'Card' | 'Cash on Delivery';
  card_holder_name: string;
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
}

interface AdminCartItem {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name?: string | null;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    category: string;
    stock: number;
  };
}

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems, fetchCart } = useCart();
  const { user } = useAuth();
  const [adminCartItems, setAdminCartItems] = useState<AdminCartItem[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    payment_method: 'Card',
    card_holder_name: '',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    setCheckoutForm((current) => ({
      ...current,
      customer_name: current.customer_name || user?.full_name || '',
      customer_email: current.customer_email || user?.email || '',
    }));
  }, [user]);

  useEffect(() => {
    const fetchAdminCart = async () => {
      if (!user?.is_admin) {
        setAdminCartItems([]);
        return;
      }

      setAdminLoading(true);
      try {
        const response = await api.get('/admin/cart');
        setAdminCartItems(response.data);
      } catch (fetchError) {
        console.error('Failed to fetch admin cart items', fetchError);
      } finally {
        setAdminLoading(false);
      }
    };

    fetchAdminCart();
  }, [user]);

  const handleFieldChange = (field: keyof CheckoutForm, value: string) => {
    setCheckoutForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCheckout = async () => {
    if (
      !checkoutForm.customer_name.trim()
      || !checkoutForm.customer_email.trim()
      || !checkoutForm.customer_phone.trim()
      || !checkoutForm.address_line1.trim()
      || !checkoutForm.city.trim()
      || !checkoutForm.state.trim()
      || !checkoutForm.postal_code.trim()
      || !checkoutForm.country.trim()
    ) {
      setError('Please complete your customer and address details before checkout.');
      return;
    }

    setIsCheckingOut(true);
    setError('');
    try {
      const payload = {
        ...checkoutForm,
        address_line2: checkoutForm.address_line2 || null,
        expiry_month: checkoutForm.expiry_month ? Number(checkoutForm.expiry_month) : null,
        expiry_year: checkoutForm.expiry_year ? Number(checkoutForm.expiry_year) : null,
        card_holder_name: checkoutForm.payment_method === 'Card' ? checkoutForm.card_holder_name : null,
        card_number: checkoutForm.payment_method === 'Card' ? checkoutForm.card_number : null,
        cvv: checkoutForm.payment_method === 'Card' ? checkoutForm.cvv : null,
      };
      await api.post('/orders', payload);
      await fetchCart();
      navigate('/orders');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (user?.is_admin) {
    return (
      <div className="animate-fade-in max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">All Cart Items</h1>

        {adminLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : adminCartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="bg-gray-50 p-6 rounded-full mb-6">
              <ShoppingBag className="h-16 w-16 text-gray-300" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">No cart items found</h2>
            <p className="text-gray-500 max-w-md text-center text-lg">Cart items from all users will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {adminCartItems.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6 sm:flex-row sm:items-center">
                <Link to={`/product/${item.product.id}`} className="shrink-0 overflow-hidden rounded-xl bg-gray-50">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-32 h-32 object-cover"
                  />
                </Link>

                <div className="flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Link to={`/product/${item.product.id}`} className="hover:text-primary-600 transition-colors">
                        <h3 className="text-xl font-bold text-gray-900">{item.product.name}</h3>
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">{item.product.category}</p>
                    </div>
                    <p className="text-xl font-black text-gray-900">${Number(item.product.price).toFixed(2)}</p>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-2xl bg-gray-50 p-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Customer</p>
                      <p className="mt-1 font-bold text-gray-900">{item.user_full_name || 'Unnamed User'}</p>
                      <p className="text-sm text-gray-500">{item.user_email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Cart Details</p>
                      <p className="mt-1 text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Customer ID: {item.user_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="bg-gray-50 p-6 rounded-full mb-6">
          <ShoppingBag className="h-16 w-16 text-gray-300" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-md text-center text-lg">Looks like you haven't added anything to your cart yet. Discover our latest products!</p>
        <Link to="/" className="btn-primary flex items-center px-8 py-4 rounded-xl text-lg">
          Start Shopping
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Shopping Cart</h1>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 space-y-6">
          {cart.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-md transition-shadow">
              <Link to={`/product/${item.product.id}`} className="shrink-0 overflow-hidden rounded-xl bg-gray-50">
                <img 
                  src={item.product.image_url} 
                  alt={item.product.name} 
                  className="w-32 h-32 object-cover transform group-hover:scale-105 transition-transform duration-300" 
                />
              </Link>
              
              <div className="flex-1 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                  <Link to={`/product/${item.product.id}`} className="hover:text-primary-600 transition-colors">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{item.product.name}</h3>
                  </Link>
                  <p className="text-xl font-black text-gray-900 mt-2 sm:mt-0">${Number(item.product.price).toFixed(2)}</p>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">{item.product.category}</p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-primary-600 font-bold transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-semibold min-w-[2.5rem] text-center border-x border-gray-200">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-primary-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                className="input-field"
                placeholder="Full name"
                value={checkoutForm.customer_name}
                onChange={(event) => handleFieldChange('customer_name', event.target.value)}
              />
              <input
                required
                type="email"
                className="input-field"
                placeholder="Email address"
                value={checkoutForm.customer_email}
                onChange={(event) => handleFieldChange('customer_email', event.target.value)}
              />
              <input
                required
                className="input-field"
                placeholder="Phone number"
                value={checkoutForm.customer_phone}
                onChange={(event) => handleFieldChange('customer_phone', event.target.value)}
              />
              <select
                className="input-field"
                value={checkoutForm.payment_method}
                onChange={(event) => handleFieldChange('payment_method', event.target.value as CheckoutForm['payment_method'])}
              >
                <option value="Card">Card</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
              </select>
              <input
                required
                className="input-field md:col-span-2"
                placeholder="Address line 1"
                value={checkoutForm.address_line1}
                onChange={(event) => handleFieldChange('address_line1', event.target.value)}
              />
              <input
                className="input-field md:col-span-2"
                placeholder="Address line 2"
                value={checkoutForm.address_line2}
                onChange={(event) => handleFieldChange('address_line2', event.target.value)}
              />
              <input
                required
                className="input-field"
                placeholder="City"
                value={checkoutForm.city}
                onChange={(event) => handleFieldChange('city', event.target.value)}
              />
              <input
                required
                className="input-field"
                placeholder="State"
                value={checkoutForm.state}
                onChange={(event) => handleFieldChange('state', event.target.value)}
              />
              <input
                required
                className="input-field"
                placeholder="Postal code"
                value={checkoutForm.postal_code}
                onChange={(event) => handleFieldChange('postal_code', event.target.value)}
              />
              <input
                required
                className="input-field"
                placeholder="Country"
                value={checkoutForm.country}
                onChange={(event) => handleFieldChange('country', event.target.value)}
              />
            </div>

            {checkoutForm.payment_method === 'Card' && (
              <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="input-field md:col-span-2 bg-white"
                    placeholder="Card holder name"
                    value={checkoutForm.card_holder_name}
                    onChange={(event) => handleFieldChange('card_holder_name', event.target.value)}
                  />
                  <input
                    className="input-field md:col-span-2 bg-white"
                    placeholder="Card number"
                    value={checkoutForm.card_number}
                    onChange={(event) => handleFieldChange('card_number', event.target.value)}
                  />
                  <input
                    className="input-field bg-white"
                    placeholder="Expiry month"
                    value={checkoutForm.expiry_month}
                    onChange={(event) => handleFieldChange('expiry_month', event.target.value)}
                  />
                  <input
                    className="input-field bg-white"
                    placeholder="Expiry year"
                    value={checkoutForm.expiry_year}
                    onChange={(event) => handleFieldChange('expiry_year', event.target.value)}
                  />
                  <input
                    className="input-field bg-white"
                    placeholder="CVV"
                    value={checkoutForm.cvv}
                    onChange={(event) => handleFieldChange('cvv', event.target.value)}
                  />
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  Successful card payment creates an order with <span className="font-semibold text-gray-700">Order Placed</span> status. Missing or failed payment keeps it <span className="font-semibold text-gray-700">Pending</span>.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-1/3">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 sticky top-24">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h3>
            
            <div className="space-y-4 mb-6 text-gray-600 font-medium">
              <div className="flex justify-between">
                <span>Subtotal ({totalItems} items)</span>
                <span className="text-gray-900">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600 font-bold">Free</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span className="text-gray-900">${(totalPrice * 0.08).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-3xl font-black text-gray-900">${(totalPrice * 1.08).toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-md text-lg font-bold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <CreditCard className="mr-2 h-6 w-6" />
                  Proceed to Checkout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
