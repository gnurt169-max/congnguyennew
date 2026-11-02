import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@industrial-bakery/shared-types';

export class UpdateOrderDeliveryDto {
  @IsEnum(OrderStatus, {
    message: 'Trạng thái đơn hàng không hợp lệ (DRAFT, PENDING_DEPOSIT, PROCESSING_MANUFACTURE, READY_FOR_DELIVERY, DELIVERED_TESTING, COMPLETED, CANCELLED)',
  })
  status: OrderStatus;

  @IsString({ message: 'Ghi chú kỹ thuật bàn giao / vận hành thử' })
  @IsOptional()
  notes?: string;
}
