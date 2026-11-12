# Tài liệu API – Tulo Coffee Backend (30 Endpoints)

- **Base URL:** `http://localhost:5000/api`
- **Authentication:** `Authorization: Bearer <token>`
- **Format thành công:**
  ```json
  { "success": true, "message": "...", "data": { ... } }
  ```
- **Format phân trang:**
  ```json
  {
    "success": true,
    "message": "...",
    "data": [ ... ],
    "pagination": { "page": 1, "limit": 10, "totalItems": 16, "totalPages": 2 }
  }
  ```
- **Format lỗi:**
  ```json
  {
    "success": false,
    "message": "Dữ liệu đầu vào không hợp lệ",
    "errors": [{ "field": "price", "message": "Giá bán phải là số nguyên từ 1.000 đến 10.000.000 VNĐ" }]
  }
  ```

---

## 1. System Health
| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| GET | `/api/health` | Public | Kiểm tra trạng thái server |

## 2. Auth (`/api/auth`)
| Method | Endpoint | Quyền | Body mẫu | Mã trả về |
|--------|----------|-------|----------|-----------|
| POST | `/api/auth/register` | Public | `{ "username", "email", "password", "fullName", "phone" }` | 201, 400, 409 |
| POST | `/api/auth/login` | Public (Rate limited) | `{ "usernameOrEmail", "password" }` | 200, 400, 401, 403 |
| POST | `/api/auth/logout` | Auth | Header `Bearer <token>` | 200, 401 |

## 3. Users (`/api/users`)
| Method | Endpoint | Quyền | Body / Query | Mã trả về |
|--------|----------|-------|--------------|-----------|
| GET | `/api/users/me` | Auth | – | 200, 401 |
| PUT | `/api/users/me` | Auth | `{ "fullName", "phone" }` | 200, 400, 401 |
| PUT | `/api/users/me/password` | Auth | `{ "currentPassword", "newPassword" }` | 200, 400, 401 |
| GET | `/api/users` | Admin | `?keyword=&role=&isActive=&page=&limit=` | 200, 401, 403 |
| PATCH | `/api/users/:id/status` | Admin | `{ "isActive": false }` | 200, 400, 401, 403, 404 |
| PATCH | `/api/users/:id/role` | Admin | `{ "role": "admin" \| "customer" }` | 200, 400, 401, 403, 404 |

## 4. Categories (`/api/categories`)
| Method | Endpoint | Quyền | Body | Mã trả về |
|--------|----------|-------|------|-----------|
| GET | `/api/categories` | Public | – | 200 |
| GET | `/api/categories/:id` | Public | – | 200, 404 |
| POST | `/api/categories` | Admin | `{ "name", "code", "description", "sortOrder" }` | 201, 400, 401, 403, 409 |
| PUT | `/api/categories/:id` | Admin | `{ "name", "code", "description", "sortOrder", "isActive" }` | 200, 400, 401, 403, 404, 409 |
| DELETE | `/api/categories/:id` | Admin | – (chặn nếu còn SP) | 200, 401, 403, 404, 409 |

## 5. Products (`/api/products`)
| Method | Endpoint | Quyền | Body / Query | Mã trả về |
|--------|----------|-------|--------------|-----------|
| GET | `/api/products` | Public | `?keyword=&category=&status=&minPrice=&maxPrice=&sort=newest\|name-asc\|price-asc\|price-desc&page=1&limit=10` | 200 |
| GET | `/api/products/:id` | Public | – | 200, 404 |
| POST | `/api/products` | Admin | `{ "code" (optional), "name", "categoryId", "price", "status", "image", "description" }` | 201, 400, 401, 403, 404, 409 |
| PUT | `/api/products/:id` | Admin | `{ "name", "categoryId", "price", "status", "image", "description" }` | 200, 400, 401, 403, 404 |
| DELETE | `/api/products/:id` | Admin | Xóa mềm (`IsDeleted = 1`) | 200, 401, 403, 404 |

## 6. Orders (`/api/orders`)
| Method | Endpoint | Quyền | Body / Query | Mã trả về |
|--------|----------|-------|--------------|-----------|
| POST | `/api/orders` | Auth | `{ "customerName", "customerPhone", "note", "items": [{ "productId", "quantity" }] }` | 201, 400, 401, 404 |
| GET | `/api/orders` | Admin | `?status=&from=&to=&keyword=&page=1&limit=10` | 200, 401, 403 |
| GET | `/api/orders/my-orders` | Auth | `?status=&page=1&limit=10` | 200, 401 |
| GET | `/api/orders/:id` | Auth (Admin hoặc Chủ đơn) | – | 200, 401, 403, 404 |
| PATCH | `/api/orders/:id/status` | Admin | `{ "status": "confirmed" \| "completed" \| "cancelled" }` | 200, 400, 401, 403, 404 |
| PATCH | `/api/orders/:id/cancel` | Auth (Chủ đơn / Admin) | – (chỉ hủy khi `pending`) | 200, 400, 401, 403, 404 |

## 7. Statistics (`/api/statistics`)
| Method | Endpoint | Quyền | Query | Mã trả về |
|--------|----------|-------|-------|-----------|
| GET | `/api/statistics/overview` | Admin | – | 200, 401, 403 |
| GET | `/api/statistics/revenue` | Admin | `?year=2026` | 200, 401, 403 |
| GET | `/api/statistics/orders-by-day` | Admin | `?month=11&year=2026` | 200, 401, 403 |
| GET | `/api/statistics/top-products` | Admin | `?limit=5` | 200, 401, 403 |
| GET | `/api/statistics/category-distribution` | Admin | – | 200, 401, 403 |

