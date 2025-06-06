import React, { createContext, useContext, useState, useEffect } from 'react';
import cartService, { CartItem, CartSummary } from '../services/cartService';
import couponService, { Coupon } from '../services/couponService';

interface CartContextType {
  cartItems: CartItem[];
  cartSummary: CartSummary;
  loading: boolean;
  coupon: Coupon | null;
  couponId: string;
  discount: number;
  finalPrice: number;
  addToCart: (product: Omit<CartItem, 'id_cart'>) => Promise<boolean>;
  updateQuantity: (id_cart: string, newCount: number) => Promise<boolean>;
  removeFromCart: (id_cart: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  applyCoupon: (code: string, userId: string) => Promise<{success: boolean; message: string}>;
  removeCoupon: () => Promise<void>;
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
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponId, setCouponId] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [finalPrice, setFinalPrice] = useState<number>(0);

  // Load cart data and saved coupon on initialization
  useEffect(() => {
    const init = async () => {
      await refreshCart();
      await loadSavedCoupon();
    };
    init();
  }, []);

  const refreshCart = async () => {
    try {
      setLoading(true);
      const summary = await cartService.getCartSummary();
      setCartItems(summary.items);
      setCartSummary(summary);
      
      // Recalculate final price if there's a coupon
      if (coupon) {
        calculateDiscount(summary.totalPrice);
      } else {
        setFinalPrice(summary.totalPrice);
      }
    } catch (error) {
      console.error('Error refreshing cart:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadSavedCoupon = async () => {
    try {
      const { id, coupon: savedCoupon } = await couponService.getSavedCoupon();
      if (savedCoupon && id) {
        setCoupon(savedCoupon);
        setCouponId(id);
        calculateDiscount(cartSummary.totalPrice);
      }
    } catch (error) {
      console.error('Error loading saved coupon:', error);
    }
  };
  
  const calculateDiscount = (totalPrice: number) => {
    if (!coupon) {
      setDiscount(0);
      setFinalPrice(totalPrice);
      return;
    }
    
    const discountAmount = (totalPrice * parseInt(coupon.promotion)) / 100;
    setDiscount(discountAmount);
    setFinalPrice(totalPrice - discountAmount);
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
  
  const applyCoupon = async (code: string, userId: string): Promise<{success: boolean; message: string}> => {
    try {
      const response = await couponService.checkCoupon(code, userId);
      
      if (response.msg === "Thành công" && response.coupon) {
        // Save coupon to state and storage
        setCoupon(response.coupon);
        setCouponId(response.coupon._id);
        await couponService.saveCoupon(response.coupon);
        
        // Calculate discount
        calculateDiscount(cartSummary.totalPrice);
        
        return { success: true, message: "Áp dụng mã giảm giá thành công" };
      } else {
        // Handle various error messages
        let errorMessage = "Mã giảm giá không hợp lệ";
        
        if (response.msg === "Không tìm thấy") {
          errorMessage = "Mã giảm giá không tồn tại";
        } else if (response.msg === "Bạn đã sử dụng mã này rồi") {
          errorMessage = "Bạn đã sử dụng mã này rồi";
        } else if (response.msg === "Mã giảm giá đã hết lượt sử dụng") {
          errorMessage = "Mã giảm giá đã hết lượt sử dụng";
        }
        
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      return { success: false, message: "Lỗi khi áp dụng mã giảm giá" };
    }
  };
  
  const removeCoupon = async (): Promise<void> => {
    setCoupon(null);
    setCouponId('');
    setDiscount(0);
    setFinalPrice(cartSummary.totalPrice);
    await couponService.removeCoupon();
  };

  const value = {
    cartItems,
    cartSummary,
    loading,
    coupon,
    couponId,
    discount,
    finalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext; 