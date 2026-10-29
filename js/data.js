/**
 * ==========================================================================
 * TULO COFFEE - TẦNG DỮ LIỆU & TIỆN ÍCH LƯU TRỮ (DATA LAYER)
 * Quản lý LocalStorage, Dữ liệu mẫu (14 món) & Tiện ích xử lý chuỗi / tiền tệ
 * ==========================================================================
 */

// Các khóa lưu trữ trong LocalStorage
const STORAGE_KEYS = {
  MENU: 'tulo_coffee_menu_v1',
  CART: 'tulo_coffee_cart_v1',
  THEME: 'tulo_coffee_theme_v1'
};

// Dữ liệu mẫu ban đầu (14 món thuộc 4 danh mục: Cà phê, Trà, Sinh tố, Bánh)
const INITIAL_PRODUCTS = [
  {
    id: "CF001",
    name: "Cà Phê Phin Sữa Đá",
    category: "Cà phê",
    price: 29000,
    status: "available",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
    description: "Cà phê Robusta Đắk Lắk pha phin truyền thống hòa quyện cùng sữa đặc béo ngậy chuẩn gu Sài Gòn.",
    createdAt: 1700000000001
  },
  {
    id: "CF002",
    name: "Bạc Xỉu Sài Gòn",
    category: "Cà phê",
    price: 32000,
    status: "available",
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80",
    description: "Sự kết hợp tinh tế giữa ba tầng: sữa tươi, sữa đặc ngọt dịu và lớp cà phê thơm lừng phía trên.",
    createdAt: 1700000000002
  },
  {
    id: "CF003",
    name: "Cà Phê Muối Cố Đô",
    category: "Cà phê",
    price: 35000,
    status: "available",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    description: "Vị đắng đượm của cà phê phin kết hợp lớp kem muối béo mặn độc đáo, đánh thức mọi giác quan.",
    createdAt: 1700000000003
  },
  {
    id: "CF004",
    name: "Espresso Macchiato",
    category: "Cà phê",
    price: 39000,
    status: "available",
    image: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80",
    description: "Chiết xuất hạt Arabica Cầu Đất nguyên chất phủ một chấm bọt sữa nóng mịn màng chuẩn phong cách Ý.",
    createdAt: 1700000000004
  },
  {
    id: "TR001",
    name: "Trà Đào Cam Sả",
    category: "Trà",
    price: 39000,
    status: "available",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80",
    description: "Trà thanh dịu thơm ngát hương sả tươi kết hợp cùng những lát đào giòn ngọt và vị cam thanh mát.",
    createdAt: 1700000000005
  },
  {
    id: "TR002",
    name: "Trà Sen Vàng Kem Cheese",
    category: "Trà",
    price: 45000,
    status: "available",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    description: "Nước cốt trà ô long ướp hạt sen bùi béo, điểm xuyết củ năng giòn rụm và lớp váng sữa phô mai mặn mà.",
    createdAt: 1700000000006
  },
  {
    id: "TR003",
    name: "Trà Sữa Oolong Nướng",
    category: "Trà",
    price: 42000,
    status: "available",
    image: "https://images.unsplash.com/photo-1558857563-b37cf533d31b?auto=format&fit=crop&w=600&q=80",
    description: "Vị trà oolong đậm đà được sao nướng kỹ lưỡng quyện cùng sữa tươi thanh trùng, đậm vị trà ít ngọt.",
    createdAt: 1700000000007
  },
  {
    id: "TR004",
    name: "Trà Hoa Cúc Mật Ong Rừng",
    category: "Trà",
    price: 35000,
    status: "out_of_stock",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80",
    description: "Thức uống an thần dưỡng tâm với hoa cúc nguyên bông thơm dịu hòa cùng mật ong hoa nhãn nguyên chất.",
    createdAt: 1700000000008
  },
  {
    id: "ST001",
    name: "Sinh Tố Bơ Sáp Dừa Non",
    category: "Sinh tố",
    price: 45000,
    status: "available",
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80",
    description: "Bơ sáp Đắk Lắk dẻo quánh xay cùng nước cốt dừa béo thơm và cơm dừa non sợi giòn dai.",
    createdAt: 1700000000009
  },
  {
    id: "ST002",
    name: "Sinh Tố Xoài Chanh Leo",
    category: "Sinh tố",
    price: 42000,
    status: "available",
    image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=600&q=80",
    description: "Vị chua thanh mát bùng nổ của chanh dây kết hợp cùng vị ngọt lịm mọng nước của xoài cát Hòa Lộc.",
    createdAt: 1700000000010
  },
  {
    id: "ST003",
    name: "Sinh Tố Dâu Yến Mạch Sữa Chua",
    category: "Sinh tố",
    price: 48000,
    status: "available",
    image: "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=600&q=80",
    description: "Dâu tây Đà Lạt tươi mọng xay cùng sữa chua không đường và yến mạch hữu cơ, giàu vitamin & chất xơ.",
    createdAt: 1700000000011
  },
  {
    id: "BA001",
    name: "Bánh Tiramisu Ý",
    category: "Bánh",
    price: 45000,
    status: "available",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80",
    description: "Bánh bông lan nhúng cà phê espresso đậm đà xen kẽ từng lớp kem phô mai Mascarpone rắc bột cacao thơm nức.",
    createdAt: 1700000000012
  },
  {
    id: "BA002",
    name: "Bánh Croissant Bơ Pháp",
    category: "Bánh",
    price: 32000,
    status: "available",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
    description: "Bánh sừng bò ngàn lớp nướng vàng rộm giòn tan bên ngoài, xốp mềm thơm mùi bơ động vật cao cấp bên trong.",
    createdAt: 1700000000013
  },
  {
    id: "BA003",
    name: "Bánh Phô Mai Cháy Basque",
    category: "Bánh",
    price: 49000,
    status: "out_of_stock",
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
    description: "Lớp vỏ cháy caramel quyến rũ bao bọc phần nhân phô mai kem mịn màng, mềm tan ngay đầu lưỡi.",
    createdAt: 1700000000014
  }
];

/**
 * 1. Khởi tạo và lấy danh sách sản phẩm từ LocalStorage
 * Nếu chưa từng có dữ liệu, lưu dữ liệu mẫu ban đầu vào LocalStorage
 * @returns {Array} Mảng các sản phẩm
 */
function getMenuData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_PRODUCTS));
      return [...INITIAL_PRODUCTS];
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_PRODUCTS));
      return [...INITIAL_PRODUCTS];
    }
    return data;
  } catch (error) {
    console.error("Lỗi khi đọc dữ liệu từ LocalStorage:", error);
    return [...INITIAL_PRODUCTS];
  }
}

/**
 * 2. Lưu danh sách sản phẩm mới vào LocalStorage
 * @param {Array} menuList Mảng danh sách cần lưu
 */
function saveMenuData(menuList) {
  try {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuList));
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu vào LocalStorage:", error);
    return false;
  }
}

/**
 * 3. Khôi phục lại dữ liệu mẫu 14 món ban đầu
 */
function resetMenuToDefault() {
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_PRODUCTS));
  return [...INITIAL_PRODUCTS];
}

/**
 * 4. Tự động sinh mã món dựa trên danh mục
 * Ví dụ: 'Cà phê' -> 'CF005', 'Trà' -> 'TR005', 'Sinh tố' -> 'ST004', 'Bánh' -> 'BA004'
 * @param {string} category Tên danh mục
 * @param {Array} currentList Danh sách món hiện tại
 * @returns {string} Mã món tự sinh
 */
function generateProductCode(category, currentList) {
  const prefixMap = {
    "Cà phê": "CF",
    "Trà": "TR",
    "Sinh tố": "ST",
    "Bánh": "BA"
  };
  const prefix = prefixMap[category] || "TU";

  // Lấy tất cả các số thứ tự hiện tại của tiền tố này
  const list = (currentList && Array.isArray(currentList)) ? currentList : getMenuData();
  const regex = new RegExp(`^${prefix}(\\d+)$`);
  let maxNumber = 0;

  list.forEach(item => {
    if (item.id && typeof item.id === 'string') {
      const match = item.id.toUpperCase().match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  });

  const nextNum = maxNumber + 1;
  return `${prefix}${nextNum.toString().padStart(3, '0')}`;
}

/**
 * 5. Định dạng tiền tệ VND (Ví dụ: 35000 -> 35.000 ₫)
 * @param {number} amount Số tiền
 * @returns {string} Chuỗi tiền tệ đã định dạng
 */
function formatCurrency(amount) {
  if (isNaN(amount) || amount === null) return "0 ₫";
  return Number(amount).toLocaleString('vi-VN') + " ₫";
}

/**
 * 6. Loại bỏ dấu tiếng Việt để tìm kiếm không phân biệt hoa thường và dấu
 * Ví dụ: "Cà phê Sữa" -> "ca phe sua"
 * @param {string} str Chuỗi gốc
 * @returns {string} Chuỗi không dấu viết thường
 */
function removeVietnameseTones(str) {
  if (!str) return "";
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * 7. Lấy giỏ hàng từ LocalStorage
 * @returns {Array} Mảng các item giỏ hàng: [{ product, quantity }]
 */
function getCartData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * 8. Lưu giỏ hàng vào LocalStorage
 * @param {Array} cart Mảng giỏ hàng
 */
function saveCartData(cart) {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  } catch (e) {
    console.error("Lỗi lưu giỏ hàng:", e);
  }
}
