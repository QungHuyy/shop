import React, { createContext, useContext, useState, useEffect } from 'react';
import cartService, { CartItem, CartSummary } from '../services/cartService';

interface CartContextType {
  cartItems: CartItem[];
  cartSummary: CartSummary;
  loading: boolean;
  addToCart: (product: Omit<CartItem, 'id_cart'>) => Promise<boolean>;
  updateQuantity: (id_cart: string, newCount: number) => Promise<boolean>;
  removeFromCart: (id_cart: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSummary, setCartSummary] = useState<CartSummary>({
    items: [],
    totalPrice: 0,
    totalItems: 0
  });
  const [loading, setLoading] = useState(true);

  // Load cart data on initialization
  useEffect(() => {
    refreshCart();
  }, []);

  const refreshCart = async () => {
    try {
      setLoading(true);
      const summary = await cartService.getCartSummary();
      setCartItems(summary.items);
      setCartSummary(summary);
    } catch (error) {
      console.error('Error refreshing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: Omit<CartItem, 'id_cart'>): Promise<boolean> => {
    try {
      const success = await cartService.addProduct(product);
      if (success) {
        await refreshCart(); // Refresh cart after adding
      }
      return success;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  const updateQuantity = async (id_cart: string, newCount: number): Promise<boolean> => {
    try {
      const success = await cartService.updateQuantity(id_cart, newCount);
      if (success) {
        await refreshCart(); // Refresh cart after updating
      }
      return success;
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      return false;
    }
  };

  const removeFromCart = async (id_cart: string): Promise<boolean> => {
    try {
      const success = await cartService.removeItem(id_cart);
      if (success) {
        await refreshCart(); // Refresh cart after removing
      }
      return success;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  };

  const clearCart = async (): Promise<boolean> => {
    try {
      const success = await cartService.clearCart();
      if (success) {
        await refreshCart(); // Refresh cart after clearing
      }
      return success;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  };

  const value = {
    cartItems,
    cartSummary,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext; 