// Mock data service cho demo UI
export interface Product {
  _id: string;
  id_category: string;
  name_product: string;
  price_product: string;
  image: string;
  describe: string;
  gender: string;
  inventory: {
    S: number;
    M: number;
    L: number;
  };
  number: number;
  // Optional promotion fields
  promotion?: number;
  saleId?: string;
  salePrice?: number;
}

export interface Category {
  _id: string;
  category: string;
}

export interface SaleProduct extends Product {
  promotion: number;
  saleId: string;
  salePrice: number;
}

// API Base URL - Giống như web client
const API_BASE_URL = 'http://192.168.1.45:8000'; // Thay IP này bằng IP máy tính của bạn

const productService = {
  // Lấy danh sách sản phẩm đang sale từ server (như client_app-main)
  getSaleProductsFromServer: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/sale/list/product`);
      const saleList = await response.json();
      
      // Tạo mảng chứa thông tin đầy đủ của sản phẩm sale
      const productsWithDetails = [];
      
      // Lặp qua từng sản phẩm sale để lấy thông tin chi tiết
      for (const sale of saleList) {
        if (sale && sale.id_product && sale.id_product._id) {
          // Thêm thông tin sale vào sản phẩm
          productsWithDetails.push({
            ...sale.id_product,
            promotion: sale.promotion,
            saleId: sale._id,
            salePrice: parseInt(sale.id_product.price_product) - 
                      (parseInt(sale.id_product.price_product) * parseInt(sale.promotion) / 100)
          });
        }
      }
      
      console.log('✅ Loaded sale products from server:', productsWithDetails.length);
      return productsWithDetails;
    } catch (error) {
      console.log('❌ Server error, using mock sale data');
      return productService.getSaleProducts();
    }
  },

  // Lấy tất cả sản phẩm từ server với thông tin promotion (cách hiệu quả hơn)
  getAllProducts: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Product`);
      const products = await response.json();
      
      // Lấy danh sách sản phẩm sale
      const saleProducts = await productService.getSaleProductsFromServer();
      const saleProductIds = new Set(saleProducts.map(p => p._id));
      
      // Merge thông tin promotion vào sản phẩm thường
      const productsWithPromotion = products.map((product: Product) => {
        const saleProduct = saleProducts.find(sp => sp._id === product._id);
        if (saleProduct) {
          return {
            ...product,
            promotion: saleProduct.promotion,
            saleId: saleProduct.saleId,
            salePrice: saleProduct.salePrice
          };
        }
        return product;
      });
      
      console.log('✅ Loaded products from server:', productsWithPromotion.length);
      return productsWithPromotion;
    } catch (error) {
      console.log('❌ Server error, using mock data');
      return productService.getMockProducts();
    }
  },

  // Lấy sản phẩm theo giới tính từ server với thông tin promotion
  getProductsByGender: async (gender: string, limit?: number): Promise<Product[]> => {
    try {
      let url = `${API_BASE_URL}/api/Product/category?id_category=all`;
      if (gender !== 'all') {
        url += `&gender=${gender}`;
      }
      
      const response = await fetch(url);
      let products = await response.json();
      
      // Lấy danh sách sản phẩm sale
      const saleProducts = await productService.getSaleProductsFromServer();
      
      // Merge thông tin promotion vào sản phẩm
      const productsWithPromotion = products.map((product: Product) => {
        const saleProduct = saleProducts.find(sp => sp._id === product._id);
        if (saleProduct) {
          return {
            ...product,
            promotion: saleProduct.promotion,
            saleId: saleProduct.saleId,
            salePrice: saleProduct.salePrice
          };
        }
        return product;
      });
      
      if (limit) {
        products = productsWithPromotion.slice(0, limit);
      } else {
        products = productsWithPromotion;
      }
      
      console.log(`✅ Loaded ${gender} products:`, products.length);
      return products;
    } catch (error) {
      console.log('❌ Server error, using mock data');
      return productService.getMockProductsByGender(gender, limit);
    }
  },

  // Lấy sản phẩm với phân trang từ server với thông tin promotion
  getProductsPagination: async (page: number = 1, count: number = 10, search?: string, category?: string, gender?: string): Promise<Product[]> => {
    try {
      // Sử dụng endpoint đơn giản hơn trước, rồi pagination sau
      let url = `${API_BASE_URL}/api/Product/category?id_category=all`;
      
      if (gender && gender !== 'all') {
        url += `&gender=${gender}`;
      }
      
      console.log('🔄 Calling pagination API:', url);
      const response = await fetch(url);
      const allProducts = await response.json();
      
      console.log('📦 Raw response:', allProducts.length, 'products');
      
      // Lấy danh sách sản phẩm sale
      const saleProducts = await productService.getSaleProductsFromServer();
      
      // Merge thông tin promotion vào sản phẩm
      const productsWithPromotion = allProducts.map((product: Product) => {
        const saleProduct = saleProducts.find(sp => sp._id === product._id);
        if (saleProduct) {
          return {
            ...product,
            promotion: saleProduct.promotion,
            saleId: saleProduct.saleId,
            salePrice: saleProduct.salePrice
          };
        }
        return product;
      });
      
      // Apply pagination manually
      const start = (page - 1) * count;
      const end = start + count;
      const products = productsWithPromotion.slice(start, end);
      
      console.log(`✅ Loaded paginated products: ${products.length} (page ${page}, ${start}-${end})`);
      console.log('📄 Products to display:', products.map((p: Product) => p.name_product));
      console.log('🔥 Products with promotion:', products.filter((p: Product) => p.promotion).map((p: Product) => ({ name: p.name_product, promotion: p.promotion })));
      return products;
    } catch (error) {
      console.log('❌ Server error, using mock data');
      return productService.getMockProducts();
    }
  },

  // Kiểm tra khuyến mãi cho một sản phẩm cụ thể (giữ lại để tương thích)
  checkProductSale: async (productId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/sale/list/${productId}`);
      const result = await response.json();
      
      if (result.msg === "Thanh Cong" && result.sale) {
        const sale = result.sale;
        
        // Kiểm tra xem khuyến mãi có đang active và trong thời gian hiệu lực không
        const currentDate = new Date();
        const startDate = new Date(sale.start);
        const endDate = new Date(sale.end);
        
        if (sale.status && currentDate >= startDate && currentDate <= endDate) {
          // Tính giá sau khuyến mãi
          const originalPrice = parseInt(sale.id_product.price_product);
          const salePrice = originalPrice - (originalPrice * sale.promotion / 100);
          
          return {
            promotion: sale.promotion,
            saleId: sale._id,
            salePrice: salePrice
          };
        }
      }
      
      return null;
    } catch (error) {
      console.log('❌ Error checking sale for product:', productId);
      return null;
    }
  },

  // Mock data - Sản phẩm sale
  getSaleProducts: async (): Promise<SaleProduct[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            _id: '1',
            id_category: 'cat1',
            name_product: 'Áo Thun Nam Basic',
            price_product: '299000',
            image: 'https://bizweb.dktcdn.net/100/438/408/products/ao-thun-nam-tay-ngan-basic-form-rong-mau-trang-local-brand-ao-thun-unisex-local-brand-dep-1.jpg?v=1702368013767',
            describe: 'Áo thun nam cơ bản, chất liệu cotton thoáng mát',
            gender: 'Male',
            inventory: { S: 10, M: 15, L: 8 },
            number: 50,
            promotion: 20,
            saleId: 'sale1',
            salePrice: 239200
          },
          {
            _id: '2',
            id_category: 'cat2',
            name_product: 'Váy Dạ Hội Nữ',
            price_product: '899000',
            image: 'https://bizweb.dktcdn.net/thumb/1024x1024/100/415/697/products/dam-du-tiec-cong-chua-cac-mau-5.jpg?v=1639642767257',
            describe: 'Váy dạ hội sang trọng cho buổi tiệc',
            gender: 'Female',
            inventory: { S: 5, M: 8, L: 3 },
            number: 25,
            promotion: 30,
            saleId: 'sale2',
            salePrice: 629300
          },
          {
            _id: '3',
            id_category: 'cat3',
            name_product: 'Hoodie Unisex Local Brand',
            price_product: '599000',
            image: 'https://bizweb.dktcdn.net/100/438/408/products/ao-hoodie-zip-local-brand-unisex-form-rong-mau-xam-local-brand-viet-nam-streetwear-2.jpg?v=1702368015267',
            describe: 'Hoodie phong cách streetwear',
            gender: 'Unisex',
            inventory: { S: 12, M: 20, L: 15 },
            number: 75,
            promotion: 25,
            saleId: 'sale3',
            salePrice: 449250
          },
          {
            _id: '4',
            id_category: 'cat1',
            name_product: 'Quần Jeans Nam Slim Fit',
            price_product: '799000',
            image: 'https://bizweb.dktcdn.net/100/415/697/products/quan-jean-nam-ong-rong-wash-nhe-form-baggy-4.jpg?v=1639642870257',
            describe: 'Quần jeans nam form slim fit hiện đại',
            gender: 'Male',
            inventory: { S: 8, M: 12, L: 10 },
            number: 40,
            promotion: 15,
            saleId: 'sale4',
            salePrice: 679150
          }
        ]);
      }, 500);
    });
  },

  // Mock data - Sản phẩm bán chạy
  getBestSellingProducts: async (limit: number = 8): Promise<Product[]> => {
    const products = await productService.getProductsByGender('all');
    return products
      .sort((a, b) => b.number - a.number)
      .slice(0, limit);
  },

  // Mock data - Danh mục
  getCategories: async (): Promise<Category[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { _id: 'cat1', category: 'Áo Nam' },
          { _id: 'cat2', category: 'Đầm Nữ' },
          { _id: 'cat3', category: 'Unisex' },
          { _id: 'cat4', category: 'Phụ Kiện' }
        ]);
      }, 200);
    });
  },

  // Utility functions
  formatPrice: (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseInt(price) : price;
    return new Intl.NumberFormat('vi-VN').format(numPrice) + ' VNĐ';
  },

  optimizeImageUrl: (url: string, width: number = 300): string => {
    // Giữ nguyên URL cho demo
    return url;
  },

  // Mock data functions
  getMockProducts: (): Product[] => {
    return [
      {
        _id: '5',
        id_category: 'cat1',
        name_product: 'Áo Sơ Mi Nam Công Sở',
        price_product: '450000',
        image: 'https://bizweb.dktcdn.net/100/415/697/products/ao-so-mi-nam-tay-dai-trang-1.jpg?v=1639642767257',
        describe: 'Áo sơ mi công sở lịch lãm',
        gender: 'Male',
        inventory: { S: 15, M: 20, L: 12 },
        number: 60
      },
      {
        _id: '6',
        id_category: 'cat1',
        name_product: 'Quần Kaki Nam',
        price_product: '399000',
        image: 'https://bizweb.dktcdn.net/100/415/697/products/quan-kaki-nam-form-rong-mau-be-2.jpg?v=1639642870257',
        describe: 'Quần kaki nam form đẹp',
        gender: 'Male',
        inventory: { S: 10, M: 18, L: 14 },
        number: 35
      },
      {
        _id: '9',
        id_category: 'cat2',
        name_product: 'Đầm Dự Tiệc Nữ',
        price_product: '699000',
        image: 'https://bizweb.dktcdn.net/100/415/697/products/dam-du-tiec-nu-mau-do-1.jpg?v=1639642767257',
        describe: 'Đầm dự tiệc sang trọng',
        gender: 'Female',
        inventory: { S: 8, M: 12, L: 6 },
        number: 22
      }
    ];
  },

  getMockProductsByGender: (gender: string, limit?: number): Product[] => {
    const allProducts = productService.getMockProducts();
    let filtered = allProducts;
    
    if (gender !== 'all') {
      filtered = allProducts.filter(p => p.gender === gender);
    }
    
    if (limit) {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  }
};

export default productService;