// ==========================================
// 1. DOMAIN ENUMS AS CONST OBJECTS (Node 26 Type-Stripping Compatible)
// ==========================================

export const PowerType = {
  SINGLE_PHASE_220V: 'SINGLE_PHASE_220V',
  THREE_PHASE_380V: 'THREE_PHASE_380V',
  HYBRID_220_380V: 'HYBRID_220_380V',
  UNPOWERED_MANUAL: 'UNPOWERED_MANUAL',
} as const;
export type PowerType = (typeof PowerType)[keyof typeof PowerType];

export const RfqStatus = {
  PENDING: 'PENDING',
  CONTACTED: 'CONTACTED',
  TECHNICAL_CONSULTING: 'TECHNICAL_CONSULTING',
  QUOTE_SENT: 'QUOTE_SENT',
  NEGOTIATING: 'NEGOTIATING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CONVERTED_TO_ORDER: 'CONVERTED_TO_ORDER',
} as const;
export type RfqStatus = (typeof RfqStatus)[keyof typeof RfqStatus];

export const OrderType = {
  INSTANT_SALE: 'INSTANT_SALE',
  PROJECT_CONTRACT: 'PROJECT_CONTRACT',
  RFQ_CONVERSION: 'RFQ_CONVERSION',
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const OrderStatus = {
  DRAFT: 'DRAFT',
  PENDING_DEPOSIT: 'PENDING_DEPOSIT',
  PROCESSING_MANUFACTURE: 'PROCESSING_MANUFACTURE',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  DELIVERED_TESTING: 'DELIVERED_TESTING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMilestoneType = {
  DEPOSIT_STAGE_1: 'DEPOSIT_STAGE_1',           // Đợt 1: Cọc sản xuất/đặt máy 30-50%
  PRE_DELIVERY_STAGE_2: 'PRE_DELIVERY_STAGE_2', // Đợt 2: Trước khi bốc hàng xuất kho
  HANDOVER_FINAL_STAGE_3: 'HANDOVER_FINAL_STAGE_3', // Đợt 3: Nghiệm thu bàn giao & vận hành thử
} as const;
export type PaymentMilestoneType = (typeof PaymentMilestoneType)[keyof typeof PaymentMilestoneType];

// Alias PaymentPhase để tương thích cả 2 tên gọi
export const PaymentPhase = PaymentMilestoneType;
export type PaymentPhase = PaymentMilestoneType;

export const PaymentStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  BANK_TRANSFER_DOMESTIC: 'BANK_TRANSFER_DOMESTIC',
  CORPORATE_LETTER_OF_CREDIT: 'CORPORATE_LETTER_OF_CREDIT',
  CASH: 'CASH',
  ONLINE_VNPAY: 'ONLINE_VNPAY',
  ONLINE_MOMO: 'ONLINE_MOMO',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const StaffRole = {
  ADMIN: 'ADMIN',
  SALES_REP: 'SALES_REP',
  TECHNICIAN: 'TECHNICIAN',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF',
} as const;
export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

// --- ĐẶC THÙ MÁY THANH LÝ & TÂN TRANG ---
export const ProductCondition = {
  LIKE_NEW_99: 'LIKE_NEW_99',
  EXCELLENT_90_95: 'EXCELLENT_90_95',
  REFURBISHED_FULL: 'REFURBISHED_FULL',
  FAIR_80: 'FAIR_80',
} as const;
export type ProductCondition = (typeof ProductCondition)[keyof typeof ProductCondition];

export const ProductAvailability = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  SOLD: 'SOLD',
} as const;
export type ProductAvailability = (typeof ProductAvailability)[keyof typeof ProductAvailability];

export const LiquidationStatus = {
  PENDING: 'PENDING',
  APPRAISING: 'APPRAISING',
  CONTACTED: 'CONTACTED',
  INSPECTED: 'INSPECTED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const;
export type LiquidationStatus = (typeof LiquidationStatus)[keyof typeof LiquidationStatus];

// ==========================================
// 2. API RESPONSE ENVELOPE
// ==========================================

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiErrorDetail | null;
  meta?: ApiMeta;
}

// ==========================================
// 3. QUOTATION & RFQ PAYLOADS
// ==========================================

export interface CreateQuotationItemPayload {
  productId?: string;
  variantId?: string;
  quantity?: number;
  targetUnitPrice?: number;
  specialRequirements?: string;
}

export interface CreateQuotationPayload {
  contactName: string;
  companyName?: string;
  phone: string;
  email?: string;
  installationAddress: string;
  province?: string;
  district?: string;
  powerSupplyType: PowerType;
  dailyCapacityRequirement?: string;
  customerNotes?: string;
  items: CreateQuotationItemPayload[];
}

export interface QuotationSummaryResponse {
  code: string;
  customerName: string;
  companyName?: string | null;
  status: RfqStatus;
  workshopAddress: string;
  targetPowerSupply: PowerType;
  estimatedTotal?: number | string | null;
  itemCount: number;
  createdAt: string | Date;
}
