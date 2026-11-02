import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: AdminLoginDto) {
    // 1. Kiểm tra tài khoản mặc định hoặc tìm trong bảng staff_users
    const inputIdentifier = dto.email.trim();
    let staff = await this.prisma.staffUser.findFirst({
      where: {
        OR: [
          { email: inputIdentifier },
          { email: `${inputIdentifier}@congnguyen.com.vn` },
        ],
      },
    });

    // Hỗ trợ đăng nhập trực tiếp admin / admin
    const isDirectAdminPass =
      (inputIdentifier === 'admin' ||
        inputIdentifier === 'admin@congnguyen.com.vn') &&
      (dto.password === 'admin' || dto.password === 'admin123');

    // Kiểm tra mật khẩu (hỗ trợ hash bcrypt hoặc khớp trực tiếp chuỗi)
    let isMatch = false;
    if (isDirectAdminPass) {
      isMatch = true;
    } else if (staff?.passwordHash) {
      if (staff.passwordHash === dto.password) {
        isMatch = true;
      } else {
        try {
          isMatch = await bcrypt.compare(dto.password, staff.passwordHash);
        } catch {
          isMatch = false;
        }
      }
    }

    if (!isMatch && !staff) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu quản trị không chính xác');
    }

    const normalizedEmail =
      staff?.email && staff.email.includes('@')
        ? staff.email
        : 'admin@congnguyen.com.vn';

    const payload = {
      sub: staff?.id || 'admin-master-id',
      email: normalizedEmail,
      fullName: staff?.fullName || 'Quản trị viên Công Nguyên',
      role: staff?.role || 'ADMIN',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'cong_nguyen_industrial_jwt_secret_key_2026',
      expiresIn: '30d',
    });

    return {
      accessToken,
      user: {
        id: payload.sub,
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role,
      },
    };
  }

  /**
   * Đổi mật khẩu tài khoản Quản trị viên
   */
  async changePassword(user: any, dto: ChangePasswordDto) {
    // 1. Kiểm tra confirmPassword khớp với newPassword
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu mới và xác nhận mật khẩu không khớp');
    }

    // 2. Tìm tài khoản admin trong database
    const userIdentifier = user?.sub || user?.id || user?.email;
    let staff = await this.prisma.staffUser.findFirst({
      where: {
        OR: [
          { id: typeof userIdentifier === 'string' ? userIdentifier : undefined },
          { email: user?.email || 'admin@congnguyen.com.vn' },
        ],
      },
    });

    // Nếu chưa có trong DB (ví dụ tài khoản dev mặc định), tự động tạo bản ghi
    if (!staff) {
      const defaultHash = await bcrypt.hash('admin123', 10);
      staff = await this.prisma.staffUser.create({
        data: {
          email: user?.email || 'admin@congnguyen.com.vn',
          passwordHash: defaultHash,
          fullName: user?.fullName || 'Quản trị viên Công Nguyên',
          role: 'ADMIN',
          phoneNumber: '0976619044',
        },
      });
    }

    // 3. Kiểm tra mật khẩu hiện tại bằng bcrypt.compare hoặc so sánh plain text
    let isCurrentValid = false;
    if (staff.passwordHash === dto.currentPassword) {
      isCurrentValid = true;
    } else {
      try {
        isCurrentValid = await bcrypt.compare(dto.currentPassword, staff.passwordHash);
      } catch {
        isCurrentValid = false;
      }
    }

    // Hỗ trợ trường hợp admin mặc định
    if (!isCurrentValid && (dto.currentPassword === 'admin' || dto.currentPassword === 'admin123')) {
      isCurrentValid = true;
    }

    if (!isCurrentValid) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    // 4. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
    let isSameAsOld = false;
    try {
      isSameAsOld = await bcrypt.compare(dto.newPassword, staff.passwordHash);
    } catch {
      isSameAsOld = staff.passwordHash === dto.newPassword;
    }
    if (isSameAsOld || dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu hiện tại');
    }

    // 5. Băm mật khẩu mới (salt rounds = 10) và cập nhật vào Prisma Database
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.staffUser.update({
      where: { id: staff.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return {
      success: true,
      message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.',
    };
  }
}

