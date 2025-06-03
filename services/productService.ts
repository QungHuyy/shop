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

const productService = {
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

  // Mock data - Sản phẩm nam
  getProductsByGender: async (gender: string, limit?: number): Promise<Product[]> => {
    const allProducts: Product[] = [
      // Sản phẩm Nam
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
        _id: '7',
        id_category: 'cat1',
        name_product: 'Áo Polo Nam',
        price_product: '329000',
        image: 'https://bizweb.dktcdn.net/100/415/697/products/ao-polo-nam-tay-ngan-mau-xanh-navy-1.jpg?v=1639642767257',
        describe: 'Áo polo nam thể thao',
        gender: 'Male',
        inventory: { S: 12, M: 16, L: 8 },
        number: 45
      },
      {
        _id: '8',
        id_category: 'cat1',
        name_product: 'Jacket Nam Bomber',
        price_product: '799000',
        image: 'https://bizweb.dktcdn.net/100/415/697/products/ao-jacket-bomber-nam-mau-xanh-den-1.jpg?v=1639642767257',
        describe: 'Áo jacket bomber phong cách',
        gender: 'Male',
        inventory: { S: 6, M: 10, L: 8 },
        number: 28
      },

      // Sản phẩm Nữ
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
      },
      {
        _id: '10',
        id_category: 'cat2',
        name_product: 'Áo Kiểu Nữ Công Sở',
        price_product: '399000',
        image: 'https://bizweb.dktcdn.net/100/415/697/products/ao-kieu-nu-cong-so-mau-trang-1.jpg?v=1639642767257',
        describe: 'Áo kiểu nữ thanh lịch',
        gender: 'Female',
        inventory: { S: 15, M: 18, L: 10 },
        number: 38
      },
      {
        _id: '11',
        id_category: 'cat2',
        name_product: 'Chân Váy Nữ A-Line',
        price_product: '299000',
        image: 'https://bizweb.dktcdn.net/100/415/697/products/chan-vay-nu-a-line-mau-den-1.jpg?v=1639642767257',
        describe: 'Chân váy A-line trẻ trung',
        gender: 'Female',
        inventory: { S: 12, M: 15, L: 8 },
        number: 42
      },
      {
        _id: '12',
        id_category: 'cat2',
        name_product: 'Blazer Nữ Công Sở',
        price_product: '899000',
        image: 'https://bizweb.dktcdn.net/100/415/697/products/blazer-nu-cong-so-mau-xam-1.jpg?v=1639642767257',
        describe: 'Blazer nữ chuyên nghiệp',
        gender: 'Female',
        inventory: { S: 6, M: 10, L: 8 },
        number: 18
      }
    ];

    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = allProducts;
        if (gender !== 'all') {
          filtered = allProducts.filter(p => p.gender === gender);
        }
        if (limit) {
          filtered = filtered.slice(0, limit);
        }
        resolve(filtered);
      }, 300);
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
  }
};

export default productService;