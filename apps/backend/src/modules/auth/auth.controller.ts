import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RegisterCustomerDto, LoginCustomerDto } from './dto/customer-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * POST /api/v1/auth/register
   * Đăng ký tài khoản khách hàng mới
   */
  @Post('register')
  async register(@Body() dto: RegisterCustomerDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/v1/auth/login
   * Đăng nhập khách hàng bằng SĐT/Email + Mật khẩu
   */
  @Post('login')
  async login(@Body() dto: LoginCustomerDto) {
    return this.authService.login(dto);
  }

  /**
   * GET /api/v1/auth/me
   * Lấy thông tin tài khoản hiện tại từ JWT Bearer token
   */
  @Get('me')
  async getProfile(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Chưa cung cấp mã xác thực hợp lệ');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'cong_nguyen_industrial_jwt_secret_key_2026',
      });
      return this.authService.getProfile(payload.sub);
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn hoặc không hợp lệ');
    }
  }
}
