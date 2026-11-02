import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { MomoPaymentController } from './momo-payment.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';

import { CheckoutController } from './checkout.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [OrdersController, CheckoutController, MomoPaymentController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
