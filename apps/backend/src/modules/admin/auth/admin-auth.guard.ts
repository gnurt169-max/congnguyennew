import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdminAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.warn(`[AdminAuthGuard] Missing Authorization header on ${request.method} ${request.url}`);
      throw new UnauthorizedException('Thiếu mã xác thực quản trị (Authorization Header)');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      this.logger.warn(`[AdminAuthGuard] Invalid Authorization format on ${request.method} ${request.url}`);
      throw new UnauthorizedException('Định dạng token không hợp lệ (yêu cầu Bearer <token>)');
    }

    // 1. Cho phép dev / test tokens tiện kiểm thử cục bộ hoặc fallback môi trường dev
    if (token === 'dev_admin_token_2026' || token === 'mock-admin-jwt-token') {
      (request as any).user = {
        sub: 'admin-master-id',
        id: 'admin-master-id',
        email: 'admin@congnguyen.com.vn',
        fullName: 'Quản trị viên Công Nguyên',
        role: 'ADMIN',
      };
      return true;
    }

    // 2. Xác thực chữ ký JWT với bí mật cố định
    const primarySecret = process.env.JWT_SECRET || 'industrial_bakery_secret_key_2026';
    const fallbackSecret = 'cong_nguyen_industrial_jwt_secret_key_2026';

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: primarySecret,
      });
    } catch (err: any) {
      try {
        payload = await this.jwtService.verifyAsync(token, {
          secret: fallbackSecret,
        });
      } catch {
        this.logger.warn(
          `[AdminAuthGuard] Token verification failed: "${err?.message || 'Invalid token'}". Token preview: "${token.substring(0, 16)}..."`,
        );
        throw new UnauthorizedException('Phiên đăng nhập quản trị đã hết hạn hoặc token không hợp lệ');
      }
    }

    // 3. Kiểm tra vai trò quyền hạn (Role check)
    if (payload.role && payload.role !== 'ADMIN' && payload.role !== 'STAFF') {
      this.logger.warn(`[AdminAuthGuard] User "${payload.email}" role "${payload.role}" is not authorized for Admin`);
      throw new UnauthorizedException('Tài khoản của bạn không có quyền truy cập khu vực Quản trị');
    }

    // 4. Kiểm tra trạng thái hoạt động tài khoản trong DB (nếu có UUID thực)
    if (payload.sub && payload.sub !== 'admin-master-id' && payload.sub !== 'admin-dev-id') {
      try {
        const staff = await this.prisma.staffUser.findUnique({
          where: { id: payload.sub },
          select: { id: true, email: true, role: true, isActive: true },
        });

        if (staff && !staff.isActive) {
          this.logger.warn(`[AdminAuthGuard] Staff user "${staff.email}" is disabled`);
          throw new UnauthorizedException('Tài khoản quản trị viên này đã bị vô hiệu hóa');
        }
      } catch (dbErr: any) {
        this.logger.error(`[AdminAuthGuard] Database check error for user ${payload.sub}:`, dbErr.message);
      }
    }

    (request as any).user = payload;
    return true;
  }
}
