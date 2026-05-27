import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { token } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!token) {
      setCart([]);
      return;
    }
    try {
      const response = await api.get('/cart');
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart', error);
    }
  }, [token]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, quantity: number) => {
    if (!token) return;
    try {
      await api.post('/cart/items', { product_id: productId, quantity });
      await fetchCart();
    } catch (error) {
      console.error('Failed to add to cart', error);
      throw error;
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!token) return;
    try {
      await api.put(`/cart/items/${productId}`, { quantity });
      await fetchCart();
    } catch (error) {
      console.error('Failed to update quantity', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!token) return;
    try {
      await api.delete(`/cart/items/${productId}`);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove from cart', error);
    }
  };

  const clearCart = async () => {
    if (!token) return;
    try {
      await api.delete('/cart');
      await fetchCart();
    } catch (error) {
      console.error('Failed to clear cart', error);
    }
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, fetchCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
