import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

import { json, urlencoded } from 'express';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Cấu hình giới hạn payload 20MB chống lỗi 413 Payload Too Large khi upload ảnh
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ limit: '20mb', extended: true }));

  // Cấu hình phục vụ file tĩnh ảnh từ thư mục public/uploads của Next.js
  let projectRoot = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (
      fs.existsSync(path.join(projectRoot, 'apps', 'frontend', 'public')) &&
      fs.existsSync(path.join(projectRoot, 'package.json'))
    ) {
      break;
    }
    const parent = path.dirname(projectRoot);
    if (parent === projectRoot) break;
    projectRoot = parent;
  }

  const primaryUploadDir = path.join(projectRoot, 'apps', 'frontend', 'public', 'uploads');
  const requiredUploadDirs = [
    primaryUploadDir,
    path.join(primaryUploadDir, 'products'),
    path.join(primaryUploadDir, 'branding'),
    path.join(primaryUploadDir, 'payment'),
  ];

  for (const dir of requiredUploadDirs) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
      } catch (err: any) {
        logger.warn(`Không thể tạo thư mục ${dir}: ${err.message}`);
      }
    }
  }

  const staticMiddleware = express.static(primaryUploadDir, {
    maxAge: '30d',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=2592000, no-transform');
    },
  });
  app.use('/uploads', staticMiddleware);
  app.use('/api/v1/uploads', staticMiddleware);

  // Prefix toàn bộ API
  app.setGlobalPrefix('api/v1');

  // Middleware bảo mật ngăn chặn toàn bộ bot tìm kiếm thu thập dữ liệu API & Phân hệ quản trị
  app.use((req: any, res: any, next: () => void) => {
    if (req.url && (req.url.includes('/admin') || req.url.startsWith('/api/admin'))) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    }
    next();
  });

  // Cấu hình CORS Whitelist chấp nhận domain mới congnguyen.com.vn và dev local
  const defaultOrigins = [
    'https://congnguyen.com.vn',
    'https://www.congnguyen.com.vn',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const envOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    process.env.APP_URL,
    ...(process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
      : []),
  ].filter(Boolean) as string[];

  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
  });

  // Global Validation Pipe bắt buộc whitelist và chặn dữ liệu thừa
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Interceptor chuẩn hóa dữ liệu trả về
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Global Exception Filter xử lý lỗi tập trung
  app.useGlobalFilters(new AllExceptionsFilter());

  // Kích hoạt shutdown hooks để giải phóng tài nguyên và cổng 4000 sạch sẽ khi dừng/restart
  app.enableShutdownHooks();

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Industrial Bakery Equipment API is running on: http://localhost:${port}/api/v1`);
}

bootstrap();
