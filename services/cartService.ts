import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  id_cart: string;
  id_product: string;
  name_product: string;
  price_product: number;
  count: number;
  image: string;
  size: string;
  originalPrice?: number; // For sale items
}

export interface CartSummary {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}

const CART_STORAGE_KEY = 'cart_items';

const cartService = {
  // Get all cart items
  getCartItems: async (): Promise<CartItem[]> => {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  },

  // Add product to cart
  addProduct: async (data: Omit<CartItem, 'id_cart'>): Promise<boolean> => {
    try {
      const existingCart = await cartService.getCartItems();
      
      // Generate unique cart ID
      const newItem: CartItem = {
        ...data,
        id_cart: Math.random().toString()
      };

      console.log('🛒 Adding product to cart:', newItem);

      if (existingCart.length < 1) {
        // First item in cart
        const newCart = [newItem];
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
        console.log('✅ Added first item to cart');
        return true;
      }

      // Check if product with same size already exists
      let found = false;
      const updatedCart = existingCart.map(item => {
        if (item.id_product === newItem.id_product && item.size === newItem.size) {
          found = true;
          return {
            ...item,
            count: item.count + newItem.count
          };
        }
        return item;
      });

      if (!found) {
        // Add as new item
        updatedCart.push(newItem);
        console.log('✅ Added new item to cart');
      } else {
        console.log('✅ Updated existing item quantity');
      }

      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
      return true;
    } catch (error) {
      console.error('❌ Error adding product to cart:', error);
      return false;
    }
  },

  // Update cart item quantity
  updateQuantity: async (id_cart: string, newCount: number): Promise<boolean> => {
    try {
      const existingCart = await cartService.getCartItems();
      const updatedCart = existingCart.map(item => {
        if (item.id_cart === id_cart) {
          return { ...item, count: newCount };
        }
        return item;
      });

      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
      console.log('✅ Updated cart item quantity');
      return true;
    } catch (error) {
      console.error('❌ Error updating cart quantity:', error);
      return false;
    }
  },

  // Remove item from cart
  removeItem: async (id_cart: string): Promise<boolean> => {
    try {
      const existingCart = await cartService.getCartItems();
      const updatedCart = existingCart.filter(item => item.id_cart !== id_cart);
      
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
      console.log('✅ Removed item from cart');
      return true;
    } catch (error) {
      console.error('❌ Error removing cart item:', error);
      return false;
    }
  },

  // Clear entire cart
  clearCart: async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      console.log('✅ Cart cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      return false;
    }
  },

  // Get cart summary
  getCartSummary: async (): Promise<CartSummary> => {
    try {
      const items = await cartService.getCartItems();
      const totalPrice = items.reduce((sum, item) => sum + (item.price_product * item.count), 0);
      const totalItems = items.reduce((sum, item) => sum + item.count, 0);

      return {
        items,
        totalPrice,
        totalItems
      };
    } catch (error) {
      console.error('❌ Error getting cart summary:', error);
      return {
        items: [],
        totalPrice: 0,
        totalItems: 0
      };
    }
  }
};

export default cartService; 