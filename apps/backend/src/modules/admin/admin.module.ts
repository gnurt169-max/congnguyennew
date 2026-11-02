import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthGuard } from './auth/admin-auth.guard';
import { AdminQuotationsController } from './quotations/admin-quotations.controller';
import { AdminOrdersController } from './orders/admin-orders.controller';
import { AdminPaymentSettingsController } from './settings/admin-payment-settings.controller';
import { PaymentSettingsService } from './settings/payment-settings.service';
import { PublicPaymentConfigController } from '../orders/public-payment-config.controller';
import { AdminContactSettingsController } from './settings/admin-contact-settings.controller';
import { PublicContactSettingsController } from './settings/public-contact-settings.controller';
import { ContactSettingsService } from './settings/contact-settings.service';
import { AdminSiteContentSettingsController } from './settings/admin-site-content-settings.controller';
import { PublicSiteContentSettingsController } from './settings/public-site-content-settings.controller';
import { SiteContentSettingsService } from './settings/site-content-settings.service';
import { AdminHomepageSettingController } from './settings/admin-homepage-setting.controller';
import { PublicHomepageSettingController } from './settings/public-homepage-setting.controller';
import { HomepageSettingService } from './settings/homepage-setting.service';
import { AdminBrandSettingsController } from './settings/admin-brand-settings.controller';
import { PublicBrandSettingsController } from './settings/public-brand-settings.controller';
import { AdminMenuLabelsController } from './settings/admin-menu-labels.controller';
import { PublicMenuLabelsController } from './settings/public-menu-labels.controller';
import { GeneralSettingsService } from './settings/general-settings.service';
import { AdminVisibilitySettingsController } from './settings/admin-visibility-settings.controller';
import { PublicVisibilitySettingsController } from './settings/public-visibility-settings.controller';
import { VisibilitySettingService } from './settings/visibility-setting.service';
import { AdminNavigationSettingsController } from './settings/admin-navigation-settings.controller';
import { PublicNavigationSettingsController } from './settings/public-navigation-settings.controller';
import { NavigationSettingService } from './settings/navigation-setting.service';

import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { UploadModule } from '../upload/upload.module';
import { AdminProductsController } from './products/admin-products.controller';

@Module({
  imports: [
    ProductsModule,
    CategoriesModule,
    UploadModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'cong_nguyen_industrial_jwt_secret_key_2026',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminProductsController,
    AdminQuotationsController,
    AdminOrdersController,
    AdminPaymentSettingsController,
    PublicPaymentConfigController,
    AdminContactSettingsController,
    PublicContactSettingsController,
    AdminSiteContentSettingsController,
    PublicSiteContentSettingsController,
    AdminHomepageSettingController,
    PublicHomepageSettingController,
    AdminBrandSettingsController,
    PublicBrandSettingsController,
    AdminMenuLabelsController,
    PublicMenuLabelsController,
    AdminVisibilitySettingsController,
    PublicVisibilitySettingsController,
    AdminNavigationSettingsController,
    PublicNavigationSettingsController,
  ],
  providers: [
    AdminAuthService,
    AdminAuthGuard,
    PaymentSettingsService,
    ContactSettingsService,
    SiteContentSettingsService,
    HomepageSettingService,
    GeneralSettingsService,
    VisibilitySettingService,
    NavigationSettingService,
  ],
  exports: [
    AdminAuthService,
    AdminAuthGuard,
    PaymentSettingsService,
    ContactSettingsService,
    SiteContentSettingsService,
    HomepageSettingService,
    GeneralSettingsService,
    VisibilitySettingService,
    NavigationSettingService,
  ],
})
export class AdminModule {}
