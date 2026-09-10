import { describe, expect, it } from 'vitest';
import { productMapper } from '@/features/product/mappers/product.mapper';
import type { Product } from '@/features/product/types/product.model';
import { StatusEnum } from '@/common/enums';

describe('ProductMapper.toModel', () => {
  it('map đúng khi BE dùng alias product_id/item_title/selling_price/tags chuỗi', () => {
    const p = productMapper.toModel({
      product_id: 'PRD-001',
      item_title: 'Áo Sơ Mi',
      selling_price: '380000',
      status_code: 1,
      category: { category_id: 'cat-1', category_name: 'Áo sơ mi' },
      image_url: 'https://x/img.png',
      inventory: 45,
      tags: 'oxford, congso',
      created_at: '2026-03-01T08:30:00Z',
    });

    expect(p.id).toBe('PRD-001');
    expect(p.name).toBe('Áo Sơ Mi');
    expect(p.price).toBe(380000);
    expect(p.formattedPrice).toContain('380.000');
    expect(p.status).toBe(StatusEnum.ACTIVE);
    expect(p.category).toEqual({ id: 'cat-1', name: 'Áo sơ mi' });
    expect(p.stock).toBe(45);
    expect(p.tags).toEqual(['oxford', 'congso']);
    expect(p.createdAt).toBeInstanceOf(Date);
  });

  it('chịu được biến thể _id/product_name/cost/tags mảng mà không crash', () => {
    const p = productMapper.toModel({
      _id: 'PRD-002',
      product_name: 'Jeans',
      cost: 550000,
      status: 'ACTIVE',
      category_name: 'Quần jeans',
      thumbnail: 'https://x/j.png',
      stock_quantity: '28',
      tags: ['denim', 'casual'],
      createdAt: '2026-03-05T10:15:00Z',
    });

    expect(p.id).toBe('PRD-002');
    expect(p.price).toBe(550000);
    expect(p.stock).toBe(28);
    expect(p.tags).toEqual(['denim', 'casual']);
  });

  it('trả defaults an toàn khi dto null/thiếu trường', () => {
    const p = productMapper.toModel(null);

    expect(p.id).toBe('');
    expect(p.price).toBe(0);
    expect(p.status).toBe(StatusEnum.ACTIVE);
    expect(p.tags).toEqual([]);
    expect(p.createdAt).toBeNull();
  });
});

describe('ProductMapper.toCreateDto / toUpdateDto', () => {
  it('chuyển ngược đúng key BE yêu cầu', () => {
    const dto = productMapper.toCreateDto({
      name: 'Áo',
      price: 100000,
      category: { id: 'c1', name: 'Áo' },
      imageUrl: 'https://x/a.png',
      stock: 5,
    } as Partial<Product>);

    expect(dto).toMatchObject({
      product_name: 'Áo',
      selling_price: 100000,
      category_id: 'c1',
      image_url: 'https://x/a.png',
      stock_quantity: 5,
    });
  });

  it('toUpdateDto chỉ gửi field có giá trị', () => {
    expect(productMapper.toUpdateDto({ price: 200000 })).toEqual({ selling_price: 200000 });
    expect(productMapper.toUpdateDto({})).toEqual({});
  });
});

describe('ProductMapper.toPaginationModel', () => {
  it('trả rỗng an toàn khi null', () => {
    const r = productMapper.toPaginationModel(null);
    expect(r.items).toEqual([]);
    expect(r.metadata.totalItems).toBe(0);
  });
});
