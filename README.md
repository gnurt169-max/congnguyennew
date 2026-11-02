# Công Nguyên - Industrial Bakery Equipment E-Commerce Platform

Hệ thống thương mại điện tử chuyên biệt cho ngành thiết bị làm bánh công nghiệp B2B & B2C, xây dựng trên nền tảng **Next.js App Router** và **NestJS / Express** với PostgreSQL và Prisma ORM.

---

## 1. Cấu trúc Monorepo

```
.
├── apps/
│   ├── frontend/            # Next.js 14+ (App Router, Tailwind CSS, TanStack Query)
│   │   ├── src/
│   │   │   ├── app/         # App Router pages (RSC default)
│   │   │   ├── components/  # UI & Business components
│   │   │   └── lib/         # Utilities & Typed API client
│   │   ├── package.json
│   │   └── tailwind.config.ts
│   │
│   └── backend/             # NestJS API (Controller - Service - Repository pattern)
│       ├── prisma/
│       │   ├── schema.prisma # PostgreSQL Data Model hoàn chỉnh
│       │   └── seed.ts       # Script gieo dữ liệu thực tế thiết bị làm bánh
│       ├── src/
│       │   ├── common/      # Global Exception Filter, Interceptors, Pipes
│       │   └── modules/     # Prisma, Products, RFQ, Orders
│       └── package.json
│
├── packages/
│   └── shared-types/        # Shared TypeScript Interfaces, Enums & DTOs
│       ├── src/enums.ts     # PowerType, RfqStatus, OrderStatus, MilestonePayments
│       └── src/api-response.ts # Uniform API response envelope
│
├── prisma/
│   └── schema.prisma        # Root Prisma pointer
├── package.json             # Root npm workspaces
└── README.md
```

---

## 2. Các điểm mấu chốt trong Prisma Schema (`prisma/schema.prisma`)

1. **Phân cấp Sản phẩm vs Biến thể (Product & ProductVariant)**:
   - Dòng máy (`Product`) lưu thông tin catalogue, tài liệu specsheet PDF, manual hướng dẫn.
   - Biến thể (`ProductVariant`) mang SKU riêng biệt (`SM-60A-380V`), loại điện áp (`PowerType`: 220V / 380V / Hybrid), công suất kW, trọng lượng và kích thước.
2. **Cơ chế Nút Đôi (Two-Track Checkout)**:
   - Thuộc tính `is_quote_only`: Khi bật `true`, máy sẽ mở luồng tư vấn kỹ thuật RFQ; khi `false` (phụ kiện/khay mâm), cho phép Instant Checkout.
3. **Hệ thống lọc thông số kỹ thuật (EAV Attributes & AttributeValues)**:
   - Quản lý linh hoạt bộ lọc thông số: Điện áp, dung tích cối, số lượng khay lò, năng suất bột.
4. **B2B Request for Quote (`QuotationRequest` & `QuotationItem`)**:
   - Thu thập thông tin xưởng: nguồn điện sẵn có tại chỗ (1 pha hay 3 pha), năng suất bánh yêu cầu/ngày, địa chỉ khảo sát thực địa.
   - Quy trình trạng thái chặt chẽ: `PENDING` -> `TECHNICAL_CONSULTING` -> `QUOTE_SENT` -> `NEGOTIATING` -> `CONVERTED_TO_ORDER`.
5. **Đơn hàng & Snapshot dữ liệu (`Order` & `OrderItem`)**:
   - Trường `specsSnapshot` và `warrantyTermsSnapshot` đóng băng toàn bộ thông số kỹ thuật và đơn giá tại thời điểm ký kết/đặt hàng, bảo đảm tính pháp lý và lịch sử kế toán.
6. **Thanh toán theo đợt (`OrderPayment` - Milestone Payments)**:
   - Đợt 1: Đặt cọc giữ máy / lệnh sản xuất (30% - 50%).
   - Đợt 2: Trước khi xuất xưởng / cập cảng.
   - Đợt 3: Sau khi giao máy, cân chỉnh và chạy thử nghiệm thu tại xưởng bánh.
