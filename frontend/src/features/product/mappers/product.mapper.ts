import {
  BaseBidirectionalMapper,
  pickField,
  safeArray,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import { ProductDto, CreateProductReqDto } from '../types/product.dto';
import { Product, ProductCategory } from '../types/product.model';
import { StatusEnum } from '@/common/enums';
import { formatCurrency } from '@/lib/utils';

export class ProductMapper extends BaseBidirectionalMapper<
  ProductDto,
  Product,
  CreateProductReqDto,
  Partial<CreateProductReqDto>
> {
  /**
   * Chuyển đổi DTO Backend sang Frontend Domain Model.
   * Xử lý triệt để các trường hợp Backend đổi tên key, thiếu trường, hoặc sai kiểu dữ liệu.
   */
  toModel(dto: ProductDto | null | undefined): Product {
    // 1. Quét tìm ID
    const id = safeString(pickField(dto, ['id', 'product_id', '_id'], ''));

    // 2. Quét tìm Tên sản phẩm
    const name = safeString(
      pickField(dto, ['name', 'product_name', 'item_title', 'title'], 'Sản phẩm không có tên')
    );

    // 3. Quét tìm Giá (hỗ trợ ép chuỗi '250000' -> 250000)
    const price = safeNumber(pickField(dto, ['price', 'selling_price', 'unit_price', 'cost'], 0));

    // 4. Quét trạng thái
    const status = safeEnum(
      pickField(dto, ['status', 'status_code', 'is_active'], StatusEnum.ACTIVE),
      StatusEnum,
      StatusEnum.ACTIVE
    );

    const statusLabels: Record<StatusEnum, string> = {
      [StatusEnum.ACTIVE]: 'Đang kinh doanh',
      [StatusEnum.INACTIVE]: 'Ngừng bán',
      [StatusEnum.PENDING]: 'Chờ duyệt',
      [StatusEnum.ARCHIVED]: 'Đã lưu trữ',
    };

    // 5. Quét danh mục (hỗ trợ cả nested object 'category.name' lẫn phẳng 'category_name')
    const categoryId = safeString(
      pickField(dto, ['category.id', 'category.category_id', 'category_id'], '')
    );
    const categoryName = safeString(
      pickField(dto, ['category.name', 'category.category_name', 'category_name'], 'Khác')
    );

    const category: ProductCategory = {
      id: categoryId,
      name: categoryName,
    };

    // 6. Quét hình ảnh
    const imageUrl = safeString(
      pickField(dto, ['imageUrl', 'image_url', 'image', 'thumbnail'], '/placeholder-product.png')
    );

    // 7. Quét tồn kho
    const stock = safeNumber(pickField(dto, ['stock', 'stock_quantity', 'inventory'], 0));

    // 8. Quét tags (xử lý cả mảng lẫn chuỗi 'tag1, tag2')
    let tags: string[] = [];
    const rawTags = pickField<string[] | string | null>(dto, ['tags'], null);
    if (Array.isArray(rawTags)) {
      tags = safeArray(rawTags, (t) => safeString(t));
    } else if (typeof rawTags === 'string') {
      tags = rawTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    // 9. Quét ngày tạo
    const createdAt = safeDate(pickField(dto, ['createdAt', 'created_at'], null));

    return {
      id,
      name,
      price,
      formattedPrice: formatCurrency(price),
      status,
      statusLabel: statusLabels[status] || 'Không xác định',
      category,
      imageUrl,
      stock,
      tags,
      createdAt,
    };
  }

  /**
   * Chuyển ngược từ Frontend Domain Model sang Payload mà Backend yêu cầu khi Tạo mới
   */
  toCreateDto(domain: Partial<Product>): CreateProductReqDto {
    return {
      product_name: safeString(domain.name),
      selling_price: safeNumber(domain.price),
      category_id: domain.category?.id,
      image_url: domain.imageUrl,
      stock_quantity: domain.stock,
    };
  }

  /**
   * Chuyển ngược khi Update
   */
  toUpdateDto(domain: Partial<Product>): Partial<CreateProductReqDto> {
    const dto: Partial<CreateProductReqDto> = {};
    if (domain.name !== undefined) dto.product_name = domain.name;
    if (domain.price !== undefined) dto.selling_price = domain.price;
    if (domain.category?.id !== undefined) dto.category_id = domain.category.id;
    if (domain.imageUrl !== undefined) dto.image_url = domain.imageUrl;
    if (domain.stock !== undefined) dto.stock_quantity = domain.stock;
    return dto;
  }
}

export const productMapper = new ProductMapper();
