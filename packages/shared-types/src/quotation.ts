import { PowerType, RfqStatus } from './index.js';

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
