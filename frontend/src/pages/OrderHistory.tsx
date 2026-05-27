import { useEffect, useState } from 'react';
import { Package, Clock, CheckCircle, Truck } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  user_id?: string | null;
  total_amount: number;
  status: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  card_last4?: string | null;
  created_at: string;
  items: OrderItem[];
}

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        return;
      }

      try {
        const response = await api.get(user.is_admin ? '/admin/orders' : '/orders');
        setOrders(response.data);
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'order placed': return <Package className="h-5 w-5 text-indigo-500" />;
      case 'shipped': return <Truck className="h-5 w-5 text-blue-500" />;
      case 'delivered': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'order placed': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
        {user?.is_admin ? 'All Orders' : 'Your Orders'}
      </h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {user?.is_admin ? 'No orders found' : 'No orders yet'}
          </h3>
          <p className="text-gray-500">
            {user?.is_admin ? 'Orders from all users will appear here.' : 'When you place an order, it will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Order Placed</p>
                    <p className="text-gray-900 font-bold">{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Total</p>
                    <p className="text-gray-900 font-bold">${Number(order.total_amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Order ID</p>
                    <p className="text-gray-900 font-mono text-xs mt-1">{order.id}</p>
                  </div>
                  {user?.is_admin && (
                    <div>
                      <p className="text-gray-500 font-medium">Customer ID</p>
                      <p className="text-gray-900 font-mono text-xs mt-1">{order.user_id || 'Unknown'}</p>
                    </div>
                  )}
                </div>
                
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </div>
              </div>

              <div className="p-6">
                {(order.customer_name || order.payment_method || order.address_line1) && (
                  <div className="mb-6 grid gap-4 rounded-2xl bg-gray-50 p-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Delivery Details</p>
                      <p className="mt-2 font-bold text-gray-900">{order.customer_name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{order.customer_email || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{order.customer_phone || 'N/A'}</p>
                      <p className="mt-2 text-sm text-gray-600">
                        {[order.address_line1, order.address_line2, order.city, order.state, order.postal_code, order.country].filter(Boolean).join(', ') || 'Address not available'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Payment</p>
                      <p className="mt-2 font-bold text-gray-900">{order.payment_method || 'N/A'}</p>
                      <p className="text-sm text-gray-500">Status: {order.payment_status || 'N/A'}</p>
                      {order.card_last4 && (
                        <p className="text-sm text-gray-500">Card ending in {order.card_last4}</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-6">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-6">
                      <div className="shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img 
                          src={item.product?.image_url || 'https://via.placeholder.com/150'} 
                          alt={item.product?.name || 'Product'} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 line-clamp-1">{item.product?.name || 'Unknown Product'}</h4>
                        <div className="text-gray-500 mt-1 space-x-4 text-sm font-medium">
                          <span>Qty: {item.quantity}</span>
                          <span>${Number(item.price).toFixed(2)} each</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
