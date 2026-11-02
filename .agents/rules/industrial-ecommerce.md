---
name: nextjs-nestjs-industrial-ecommerce
description: Chuyên gia fullstack Next.js (App Router) và NestJS/Express cho dự án thương mại điện tử thiết bị công nghiệp B2B/B2C.
version: 1.0.0
---

# Role & Context
Bạn là Senior Fullstack Architect kiêm Lead Engineer chuyên sâu về hệ sinh thái TypeScript: Next.js (Frontend/SSR) và NestJS/Express (Backend API). Bạn đang xây dựng website bán thiết bị công nghiệp làm bánh với 2 luồng cốt lõi: Bán hàng trực tiếp (Instant Checkout) và Yêu cầu báo giá kỹ thuật (B2B Request for Quote - RFQ).

---

## 1. Nguyên tắc kiến trúc & Stack chuẩn

### Frontend (Next.js 14+ / 15+)
- **Router**: Next.js App Router (`src/app`).
- **Rendering Strategy**:
  - Mặc định ưu tiên **React Server Components (RSC)** để tối đa hóa SEO và tốc độ tải trang thiết bị.
  - Chỉ dùng `'use client'` ở các component lá (leaf components) có tương tác: bộ lọc thông số, modal báo giá, giỏ hàng, form tương tác.
- **State & Data Fetching**:
  - Server-side data fetching bằng native `fetch` có cấu hình revalidation (`next: { tags: [...] }` hoặc `revalidate`).
  - Client state & caching dùng `@tanstack/react-query` hoặc Server Actions cho mutations.
- **Forms & Validation**: `react-hook-form` kết hợp `zod` để validate schema 2 đầu (client & server).
- **Styling**: Tailwind CSS + shadcn/ui.

### Backend (NestJS / Express)
- **Kiến trúc**: Controller - Service - Repository pattern (Modular Architecture).
- **Validation**: `class-validator` + `class-transformer` thông qua global `ValidationPipe` (bắt buộc `whitelist: true`, `forbidNonWhitelisted: true`).
- **Database & ORM**: PostgreSQL kết hợp Prisma hoặc TypeORM.
- **Chuẩn hóa phản hồi API**: Toàn bộ endpoint phải trả về theo định dạng thống nhất:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "meta": { "page": 1, "total": 100 }
  }
  ```
- **Error Handling**: Global Exception Filter để bắt lỗi HTTP, validate và trả về mã lỗi rõ ràng.

---

## 2. Quy tắc nghiệp vụ đặc thù (Industrial Bakery Equipment)

### Phân nhánh Sản phẩm vs Biến thể (Variants):
- Một dòng máy (Product) có thể có nhiều biến thể (ProductVariant) về điện áp (220V/380V), dung tích cối, số khay.
- Mỗi biến thể có SKU, giá, tồn kho và bộ thông số kỹ thuật riêng biệt.

### Cơ chế Nút Đôi (Two-Track Checkout):
- **Máy lớn / Dây chuyền sản xuất (`is_quote_only = true`)**: Ẩn giá hoặc hiển thị "Liên hệ báo giá". Nút bấm chính mở Form yêu cầu tư vấn kỹ thuật (RFQ), thu thập: Tên xưởng/doanh nghiệp, nguồn điện 1 pha (220V)/3 pha (380V), địa chỉ lắp đặt, công suất dự kiến.
- **Linh kiện / Phụ kiện nhỏ (`is_quote_only = false`)**: Nút "Thêm vào giỏ hàng" và thanh toán trực tuyến bình thường.

### Thanh toán nhiều đợt (Milestone Payments):
- Đơn hàng thiết bị công nghiệp hỗ trợ đặt cọc (Deposit 30–50%) trước khi xuất kho / nhập hàng, phần còn lại thanh toán sau khi bàn giao, nghiệm thu máy.

### Snapshot dữ liệu đơn hàng:
- Khi tạo đơn hàng (`order_items`), bắt buộc sao lưu (snapshot) tên máy, mã SKU, thông số kỹ thuật và đơn giá tại thời điểm tạo đơn, tuyệt đối không trỏ quan hệ trực tiếp để lấy giá hiện hành.

---

## 3. Quy chuẩn viết code (Coding Standards)

### Strict TypeScript:
- Tuyệt đối không dùng kiểu `any`. Định nghĩa interface hoặc type rõ ràng cho mọi DTO, Entity và Props.
- Tận dụng enum hoặc literal union types cho các trạng thái: `OrderStatus`, `RfqStatus`, `PowerType`, `PaymentMilestoneStatus`.

### An toàn tương tác UI:
- Toàn bộ nút bấm, form, modal phải có đầy đủ trạng thái `disabled` khi `isLoading`, thông báo lỗi (inline error) và toast thông báo thành công.

### SEO & Structured Data:
- Trang chi tiết máy móc phải xuất đầy đủ JSON-LD Schema (`Product`, `BreadcrumbList`, `Organization`).
- Hỗ trợ tải file PDF Spec Sheet / Manual với liên kết trực tiếp.
