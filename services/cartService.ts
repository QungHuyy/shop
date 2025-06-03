import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from './productService';

export interface CartItem {
  id: string;
  product: Product;
  size: string;
  quantity: number;
  addedAt: string;
}

export interface CartSummary {
  totalItems: number;
  subtotal: number;
  shipping: number;
  total: number;
}

const CART_STORAGE_KEY = '@shopping_cart';

class CartService {
  private cartItems: CartItem[] = [];
  private listeners: ((items: CartItem[]) => void)[] = [];

  constructor() {
    this.loadCartFromStorage();
  }

  // Load cart from AsyncStorage
  async loadCartFromStorage() {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        this.cartItems = JSON.parse(cartData);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }

  // Save cart to AsyncStorage
  async saveCartToStorage() {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cartItems));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  // Subscribe to cart changes
  subscribe(listener: (items: CartItem[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.cartItems]));
  }

  // Add item to cart
  async addToCart(product: Product, size: string, quantity: number = 1): Promise<boolean> {
    try {
      const existingItemIndex = this.cartItems.findIndex(
        item => item.product._id === product._id && item.size === size
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        this.cartItems[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `${product._id}_${size}_${Date.now()}`,
          product,
          size,
          quantity,
          addedAt: new Date().toISOString()
        };
        this.cartItems.push(newItem);
      }

      await this.saveCartToStorage();
      this.notifyListeners();
      console.log('✅ Added to cart:', { productName: product.name_product, size, quantity });
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  }

  // Update item quantity
  async updateQuantity(itemId: string, newQuantity: number): Promise<boolean> {
    try {
      if (newQuantity <= 0) {
        return this.removeFromCart(itemId);
      }

      const itemIndex = this.cartItems.findIndex(item => item.id === itemId);
      if (itemIndex >= 0) {
        this.cartItems[itemIndex].quantity = newQuantity;
        await this.saveCartToStorage();
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating quantity:', error);
      return false;
    }
  }

  // Remove item from cart
  async removeFromCart(itemId: string): Promise<boolean> {
    try {
      const initialLength = this.cartItems.length;
      this.cartItems = this.cartItems.filter(item => item.id !== itemId);
      
      if (this.cartItems.length < initialLength) {
        await this.saveCartToStorage();
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  }

  // Clear entire cart
  async clearCart(): Promise<boolean> {
    try {
      this.cartItems = [];
      await this.saveCartToStorage();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }

  // Get all cart items
  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  // Get cart summary
  getCartSummary(): CartSummary {
    const totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const subtotal = this.cartItems.reduce((sum, item) => {
      const price = (item.product as any).salePrice || parseInt(item.product.price_product);
      return sum + (price * item.quantity);
    }, 0);

    const shipping = subtotal >= 500000 ? 0 : 30000; // Free shipping over 500k
    const total = subtotal + shipping;

    return {
      totalItems,
      subtotal,
      shipping,
      total
    };
  }

  // Get cart item count
  getCartItemCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Check if product is in cart
  isInCart(productId: string, size?: string): boolean {
    if (size) {
      return this.cartItems.some(item => 
        item.product._id === productId && item.size === size
      );
    }
    return this.cartItems.some(item => item.product._id === productId);
  }

  // Get item quantity in cart
  getItemQuantity(productId: string, size: string): number {
    const item = this.cartItems.find(item => 
      item.product._id === productId && item.size === size
    );
    return item ? item.quantity : 0;
  }

  // Format price utility
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
  }
}

// Export singleton instance
const cartService = new CartService();
export default cartService; 