import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User as UserIcon, LogOut, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api from '../lib/api';

interface AdminNavbarSummary {
  total_orders: number;
  total_cart_items: number;
}

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [adminSummary, setAdminSummary] = useState<AdminNavbarSummary | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminSummary = async () => {
      if (!user?.is_admin) {
        setAdminSummary(null);
        return;
      }

      try {
        const response = await api.get('/admin/navbar-summary');
        setAdminSummary(response.data);
      } catch (error) {
        console.error('Failed to fetch admin navbar summary', error);
      }
    };

    fetchAdminSummary();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatShortCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1).replace('.0', '')}k`;
    }
    return String(count);
  };

  const cartBadgeCount = user?.is_admin ? adminSummary?.total_cart_items ?? 0 : totalItems;
  const orderBadgeCount = user?.is_admin ? adminSummary?.total_orders ?? 0 : 0;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors">
            <Package className="h-8 w-8" />
            <span className="font-bold text-xl tracking-tight text-gray-900">Antigravity<span className="text-primary-600">Store</span></span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Shop</Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/cart" className="relative text-gray-600 hover:text-primary-600 transition-colors group">
                  <ShoppingCart className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  {cartBadgeCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-fade-in shadow-sm">
                      {formatShortCount(cartBadgeCount)}
                    </span>
                  )}
                </Link>
                <Link to="/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 font-medium transition-colors">
                  <span>Orders</span>
                  {orderBadgeCount > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
                      {formatShortCount(orderBadgeCount)}
                    </span>
                  )}
                </Link>
                {user.is_admin && (
                  <Link to="/admin/dashboard" className="text-primary-600 bg-primary-50 px-3 py-1 rounded-md text-sm font-semibold hover:bg-primary-100 transition-colors">
                    Admin Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-1 text-gray-600 hover:text-red-600 font-medium transition-colors">
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1 text-gray-600 hover:text-primary-600 font-medium transition-colors">
                <UserIcon className="h-5 w-5" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
