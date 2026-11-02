import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantDto } from './dto/create-variant.dto';
import { UpdateProductVariantDto } from './dto/update-variant.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * API GET /api/v1/products
   * Hỗ trợ phân trang, sắp xếp và lọc đa tiêu chí: danh mục, hãng, nguồn điện, cờ RFQ, khoảng giá, từ khóa tìm kiếm.
   */
  @Get()
  async getProducts(@Query() query: QueryProductsDto) {
    return this.productsService.getProducts(query);
  }

  /**
   * API GET /api/v1/products/recent?limit=8
   * Lấy danh sách sản phẩm mới thanh lý (availability: AVAILABLE, sắp xếp createdAt: -1)
   */
  @Get('recent')
  async getRecentProducts(@Query('limit') limit?: number) {
    const take = limit ? Math.min(Math.max(Number(limit), 1), 50) : 8;
    return this.productsService.getRecentProducts(take);
  }

  /**
   * API GET /api/v1/products/:slug
   * Lấy chi tiết thông số kỹ thuật, biến thể (điện áp, công suất, kích thước) và tài liệu spec sheet PDF đi kèm.
   */
  @Get(':slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.getProductBySlug(slug);
  }

  @Post()
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, dto);
  }

  /**
   * API PATCH /api/v1/products/:id/category
   * Cập nhật nhanh danh mục sản phẩm
   */
  @Patch(':id/category')
  async patchCategory(
    @Param('id') id: string,
    @Body('categoryId') categoryId: string,
  ) {
    return this.productsService.updateProductCategory(id, categoryId);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }

  // --- API QUẢN LÝ BIẾN THỂ (PRODUCT VARIANTS) ---

  @Post(':id/variants')
  async createVariant(
    @Param('id') productId: string,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.productsService.createVariant(productId, dto);
  }

  @Put('variants/:variantId')
  async updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(variantId, dto);
  }

  @Delete('variants/:variantId')
  async deleteVariant(@Param('variantId') variantId: string) {
    return this.productsService.deleteVariant(variantId);
  }
}
