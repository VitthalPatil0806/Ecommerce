import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { PackagePlus, PackageSearch, ShoppingCart, DollarSign, RefreshCw, Trash2, Save } from 'lucide-react';
import api from '../lib/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category: string;
}

interface ProductDraft {
  price: string;
  stock: string;
}

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  stock: string;
  image_url: string;
  category: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_id: string | null;
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
  items: {
    id: string;
    quantity: number;
    price: number;
    product?: {
      name: string;
    };
  }[];
}

const emptyProductForm: ProductFormState = {
  name: '',
  description: '',
  price: '',
  stock: '',
  image_url: '',
  category: '',
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, ProductDraft>>({});
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [inventoryMessage, setInventoryMessage] = useState('');
  const [ordersMessage, setOrdersMessage] = useState('');
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes] = await Promise.all([
        api.get('/products'),
        api.get('/admin/orders')
      ]);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setDrafts(
        Object.fromEntries(
          productsRes.data.map((product: Product) => [
            product.id,
            { price: String(product.price), stock: String(product.stock) },
          ]),
        ),
      );
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDraftChange = (productId: string, field: keyof ProductDraft, value: string) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [productId]: {
        ...currentDrafts[productId],
        [field]: value,
      },
    }));
  };

  const handleSaveProduct = async (productId: string) => {
    const draft = drafts[productId];
    if (!draft) {
      return;
    }

    setSavingProductId(productId);
    setInventoryMessage('');
    try {
      await api.put(`/admin/products/${productId}`, {
        price: Number(draft.price),
        stock: Number(draft.stock),
      });
      setInventoryMessage('Inventory updated successfully.');
      await fetchData();
    } catch (error: any) {
      setInventoryMessage(error.response?.data?.detail || 'Failed to update product.');
    } finally {
      setSavingProductId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeletingProductId(productId);
    setInventoryMessage('');
    try {
      await api.delete(`/admin/products/${productId}`);
      setInventoryMessage('Product deleted successfully.');
      await fetchData();
    } catch (error: any) {
      setInventoryMessage(error.response?.data?.detail || 'Failed to delete product.');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleCreateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingProduct(true);
    setInventoryMessage('');
    try {
      await api.post('/admin/products', {
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      });
      setProductForm(emptyProductForm);
      setInventoryMessage('Product created successfully.');
      await fetchData();
    } catch (error: any) {
      setInventoryMessage(error.response?.data?.detail || 'Failed to create product.');
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);
    setOrdersMessage('');
    try {
      await api.patch(`/admin/orders/${orderId}`, { status });
      setOrdersMessage('Order status updated successfully.');
      await fetchData();
    } catch (error: any) {
      setOrdersMessage(error.response?.data?.detail || 'Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const totalOrders = orders.length;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your store's inventory and monitor incoming orders.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm font-medium"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-primary-50 rounded-xl">
            <DollarSign className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="text-2xl font-black text-gray-900">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <p className="text-2xl font-black text-gray-900">{totalOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-purple-50 rounded-xl">
            <PackageSearch className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Products</p>
            <p className="text-2xl font-black text-gray-900">{products.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-4 text-center font-bold text-sm tracking-wide transition-colors ${
              activeTab === 'inventory' 
                ? 'bg-gray-50 text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Inventory Management
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-4 text-center font-bold text-sm tracking-wide transition-colors ${
              activeTab === 'orders' 
                ? 'bg-gray-50 text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Global Order Tracker
          </button>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : activeTab === 'inventory' ? (
            <div className="space-y-8 p-6">
              <form onSubmit={handleCreateProduct} className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <PackagePlus className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Add a Product</h2>
                    <p className="text-sm text-gray-500">Create new inventory items right from the dashboard.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <input
                    required
                    className="input-field bg-white"
                    placeholder="Product name"
                    value={productForm.name}
                    onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                  />
                  <input
                    required
                    className="input-field bg-white"
                    placeholder="Category"
                    value={productForm.category}
                    onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
                  />
                  <input
                    required
                    type="url"
                    className="input-field bg-white"
                    placeholder="Image URL"
                    value={productForm.image_url}
                    onChange={(event) => setProductForm((current) => ({ ...current, image_url: event.target.value }))}
                  />
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="input-field bg-white"
                    placeholder="Price"
                    value={productForm.price}
                    onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
                  />
                  <input
                    required
                    type="number"
                    min="0"
                    className="input-field bg-white"
                    placeholder="Stock"
                    value={productForm.stock}
                    onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))}
                  />
                  <textarea
                    required
                    className="input-field bg-white md:col-span-2 xl:col-span-3"
                    rows={3}
                    placeholder="Description"
                    value={productForm.description}
                    onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-sm text-gray-500">Name, description, price, stock, category, and image URL are all required.</p>
                  <button
                    type="submit"
                    disabled={creatingProduct}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <PackagePlus className="h-4 w-4" />
                    {creatingProduct ? 'Creating...' : 'Create Product'}
                  </button>
                </div>
              </form>

              {inventoryMessage && (
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">
                  {inventoryMessage}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Product</th>
                      <th className="px-6 py-4 font-semibold">Category</th>
                      <th className="px-6 py-4 font-semibold text-right">Price</th>
                      <th className="px-6 py-4 font-semibold text-right">Stock</th>
                      <th className="px-6 py-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img src={product.image_url} alt={product.name} className="h-14 w-14 rounded-xl object-cover" />
                            <div>
                              <div className="font-bold text-gray-900">{product.name}</div>
                              <div className="max-w-sm text-sm text-gray-500 line-clamp-2">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">{product.category}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className="input-field ml-auto w-28 bg-white text-right"
                            value={drafts[product.id]?.price ?? String(product.price)}
                            onChange={(event) => handleDraftChange(product.id, 'price', event.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <input
                            type="number"
                            min="0"
                            className="input-field ml-auto w-24 bg-white text-right"
                            value={drafts[product.id]?.stock ?? String(product.stock)}
                            onChange={(event) => handleDraftChange(product.id, 'stock', event.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleSaveProduct(product.id)}
                              disabled={savingProductId === product.id}
                              className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                            >
                              <Save className="h-4 w-4" />
                              {savingProductId === product.id ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingProductId === product.id}
                              className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingProductId === product.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              {ordersMessage && (
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">
                  {ordersMessage}
                </div>
              )}

              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Order</div>
                        <div className="font-mono text-xs text-gray-500">{order.id}</div>
                        <div className="text-sm text-gray-500">
                          Customer ID: <span className="font-mono text-xs text-gray-700">{order.user_id ?? 'Unknown'}</span>
                        </div>
                        {order.customer_name && (
                          <div className="text-sm text-gray-500">
                            Customer: <span className="font-medium text-gray-700">{order.customer_name}</span>
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          Placed on {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="rounded-xl bg-gray-50 px-4 py-3 text-right">
                          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total</div>
                          <div className="text-2xl font-black text-gray-900">${Number(order.total_amount).toFixed(2)}</div>
                        </div>
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(event) => handleOrderStatusUpdate(order.id, event.target.value)}
                          className="input-field min-w-40 bg-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Order Placed">Order Placed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    </div>

                    {(order.payment_method || order.address_line1) && (
                      <div className="mt-5 grid gap-4 rounded-2xl bg-gray-50 p-4 lg:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Shipping</div>
                          <div className="mt-2 text-sm text-gray-600">
                            {[order.address_line1, order.address_line2, order.city, order.state, order.postal_code, order.country].filter(Boolean).join(', ') || 'Address not available'}
                          </div>
                          {order.customer_email && <div className="mt-2 text-sm text-gray-500">{order.customer_email}</div>}
                          {order.customer_phone && <div className="text-sm text-gray-500">{order.customer_phone}</div>}
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Payment</div>
                          <div className="mt-2 text-sm font-medium text-gray-700">{order.payment_method || 'N/A'}</div>
                          <div className="text-sm text-gray-500">Status: {order.payment_status || 'N/A'}</div>
                          {order.card_last4 && <div className="text-sm text-gray-500">Card ending in {order.card_last4}</div>}
                        </div>
                      </div>
                    )}

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="rounded-xl bg-gray-50 px-4 py-3">
                          <div className="font-semibold text-gray-900">{item.product?.name || 'Unknown Product'}</div>
                          <div className="mt-1 text-sm text-gray-500">
                            Qty {item.quantity} at ${Number(item.price).toFixed(2)} each
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
