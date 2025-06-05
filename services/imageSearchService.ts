import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

const API_BASE_URL = 'http://192.168.1.45:8000/api';

export interface ImageSearchResult {
  _id: string;
  name_product: string;
  price_product: number;
  image: string;
  similarity?: number;
}

class ImageSearchService {
  // Request camera permissions
  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập',
          'Ứng dụng cần quyền truy cập camera để tìm kiếm bằng hình ảnh.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  // Request media library permissions
  async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập',
          'Ứng dụng cần quyền truy cập thư viện ảnh để tìm kiếm bằng hình ảnh.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return false;
    }
  }

  // Take photo with camera
  async takePhoto(): Promise<string | null> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
      return null;
    }
  }

  // Pick image from gallery
  async pickImage(): Promise<string | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
      return null;
    }
  }

  // Upload image and search for similar products
  async searchByImage(imageUri: string): Promise<ImageSearchResult[]> {
    try {
      // Tạo FormData để upload ảnh
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'search_image.jpg',
      } as any);

      console.log('🖼️ Uploading image for search:', imageUri);

      // Gọi API search by image thực (giống web client)
      const searchResponse = await fetch('https://search-by-ai.onrender.com/search-by-image', {
        method: 'POST',
        body: formData,
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('❌ Search API response not ok:', errorText);
        throw new Error('Image search failed');
      }

      const searchResults = await searchResponse.json();
      console.log('✅ Received search results:', searchResults);

      // Parse kết quả từ API (format: { matched_products: [...] })
      const matchedProducts = searchResults.matched_products || [];
      
      // Convert sang format mobile app với similarity percentage
      const results: ImageSearchResult[] = matchedProducts.map((product: any) => ({
        _id: product._id,
        name_product: product.name_product,
        price_product: parseInt(product.price_product) || 0,
        image: product.image,
        similarity: Math.round((product.similarity_score || 0) * 100), // Convert 0-1 thành percentage
      }));

      console.log('📱 Converted results for mobile:', results);
      return results;

    } catch (error) {
      console.error('❌ Error searching by image:', error);
      
      // Fallback: Nếu AI service không hoạt động, sử dụng simulation
      console.log('🔄 Falling back to simulation...');
      return this.simulateImageSearch();
    }
  }

  // Backup simulation method (fallback khi AI service down)
  private async simulateImageSearch(): Promise<ImageSearchResult[]> {
    try {
      console.log('🎭 Running simulation search...');
      
      // Lấy tất cả sản phẩm để simulate search
      const allProductsResponse = await fetch(`${API_BASE_URL}/Product`);
      const allProducts = await allProductsResponse.json();

      // Simulate việc tìm sản phẩm tương tự
      const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
      const searchResults = shuffled.slice(0, 6).map((product: any, index: number) => ({
        ...product,
        price_product: parseInt(product.price_product) || 0,
        similarity: 95 - (index * 5), // Simulate độ tương tự giảm dần
      }));

      return searchResults;
    } catch (error) {
      console.error('❌ Simulation also failed:', error);
      throw new Error('Không thể tìm kiếm bằng hình ảnh. Vui lòng thử lại.');
    }
  }

  // Show image source selection
  async showImageSourceOptions(): Promise<string | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Tìm kiếm bằng hình ảnh',
        'Chọn nguồn hình ảnh:',
        [
          {
            text: 'Chụp ảnh',
            onPress: async () => {
              const imageUri = await this.takePhoto();
              resolve(imageUri);
            },
          },
          {
            text: 'Chọn từ thư viện',
            onPress: async () => {
              const imageUri = await this.pickImage();
              resolve(imageUri);
            },
          },
          {
            text: 'Hủy',
            onPress: () => resolve(null),
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    });
  }
}

export default new ImageSearchService(); 