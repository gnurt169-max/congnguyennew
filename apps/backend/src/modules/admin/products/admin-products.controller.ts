import {
  Controller,
  Patch,
  Put,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ProductsService } from '../../products/products.service';
import { UploadService, ProcessedImageResult } from '../../upload/upload.service';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { CreateProductDto } from '../../products/dto/create-product.dto';
import { UpdateProductDto } from '../../products/dto/update-product.dto';
import * as multer from 'multer';

@Controller('admin/products')
@UseGuards(AdminAuthGuard)
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * GET /api/v1/admin/products/:id
   * Lấy chi tiết sản phẩm phục vụ form chỉnh sửa của Admin
   */
  @Get(':id')
  async getProduct(@Param('id') id: string) {
    const product = await this.productsService.getProductById(id);
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID: "${id}"`);
    }
    return product;
  }

  /**
   * POST /api/v1/admin/products
   * Tạo mới sản phẩm thiết bị làm bánh
   */
  @Post()
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  /**
   * PUT /api/v1/admin/products/:id
   * Cập nhật toàn bộ thông tin sản phẩm (tên, giá, ảnh, video, thông số)
   */
  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, dto);
  }

  /**
   * PATCH /api/v1/admin/products/:id
   * Cập nhật một phần thông tin sản phẩm
   */
  @Patch(':id')
  async patchProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, dto);
  }

  /**
   * DELETE /api/v1/admin/products/:id
   * Xóa sản phẩm khỏi hệ thống
   */
  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }

  /**
   * PATCH /api/v1/admin/products/:id/category
   * Cập nhật danh mục của từng sản phẩm thiết bị làm bánh
   */
  @Patch(':id/category')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    return this.productsService.updateProductCategory(id, dto.categoryId);
  }

  /**
   * PUT /api/v1/admin/products/:id/category
   * Hỗ trợ cả method PUT theo yêu cầu kỹ thuật
   */
  @Put(':id/category')
  async putCategory(
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    return this.productsService.updateProductCategory(id, dto.categoryId);
  }

  /**
   * PATCH /api/v1/admin/products/:id/stock
   * Chỉnh sửa nhanh số lượng tồn kho (Real-time stock update)
   * Ràng buộc: nếu stock <= 0, status tự động chuyển 'out_of_stock'
   */
  @Patch(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body() body: { stock: number },
  ) {
    if (body.stock === undefined || isNaN(Number(body.stock))) {
      throw new BadRequestException('Số lượng tồn kho (stock) phải là số');
    }
    const num = Math.max(0, Math.floor(Number(body.stock)));
    return this.productsService.updateProduct(id, { stock: num });
  }

  /**
   * GET /api/v1/admin/products/:id/category
   * Xem danh mục hiện tại của sản phẩm
   */
  @Get(':id/category')
  async getCategory(@Param('id') id: string) {
    const product = await this.productsService.getProductById(id);
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID: "${id}"`);
    }
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
    };
  }

  /**
   * POST /api/v1/admin/products/upload
   * Xử lý tải ảnh sản phẩm: tự động nén, resize tối đa 1400px và chuyển đổi sang WebP
   * Hỗ trợ cả multipart/form-data (field 'file') và JSON Base64 (field 'data' hoặc 'imageBase64')
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
    }),
  )
  async uploadProductImage(
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: { data?: string; imageBase64?: string; filename?: string; mimeType?: string },
  ): Promise<ProcessedImageResult> {
    // 1. Trường hợp gửi Multipart FormData
    if (file) {
      return this.uploadService.processImage(file.buffer, file.originalname, file.mimetype);
    }

    // 2. Trường hợp gửi Base64 JSON
    const base64Data = body?.data || body?.imageBase64;
    if (base64Data) {
      return this.uploadService.processBase64(base64Data, body?.filename, body?.mimeType);
    }

    throw new BadRequestException('Vui lòng chọn file hình ảnh hoặc truyền dữ liệu base64 hợp lệ');
  }
}
