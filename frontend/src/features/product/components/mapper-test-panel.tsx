'use client';

import React, { useState } from 'react';
import { productMapper } from '../mappers/product.mapper';
import { ProductDto } from '../types/product.dto';
import { Product } from '../types/product.model';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

const SAMPLE_PAYLOADS: { label: string; payload: ProductDto }[] = [
  {
    label: 'Payload 1: Dùng snake_case & số dạng chuỗi',
    payload: {
      product_id: 'PRD-999',
      item_title: 'Áo Polo Thể Thao Pro-Dry',
      selling_price: '299000',
      status_code: 1,
      category_name: 'Áo thể thao',
      image_url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
      inventory: 50,
      tags: 'sport,dryfit,polo',
      created_at: '2026-03-10T09:00:00Z',
    },
  },
  {
    label: 'Payload 2: Backend đổi sang camelCase & null tags',
    payload: {
      id: 'PRD-888',
      name: 'Áo Hoodie Casual Unisex',
      price: 450000,
      status: 'ACTIVE',
      category: { id: 'c2', name: 'Hoodie' },
      thumbnail: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
      stock_quantity: '15',
      tags: null, // Backend trả về null
      createdAt: '2026-03-09T14:30:00Z',
    },
  },
  {
    label: 'Payload 3: Payload bị thiếu hầu hết trường (Null safety check)',
    payload: {
      _id: 'PRD-777',
      title: 'Sản Phẩm Tối Giản Thiếu Key',
      // Không có price, status, image, category, tags
    },
  },
];

export function MapperTestPanel() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const currentDto = SAMPLE_PAYLOADS[selectedIdx].payload;

  // Chạy trực tiếp qua mapper
  const mappedModel: Product = productMapper.toModel(currentDto);

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="bg-muted/40 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              Live Interactive Mapper Test Playground
            </CardTitle>
            <CardDescription>
              Kiểm tra cách Mapper chuyển hóa các biến thể payload khác nhau từ Backend thành Domain Model an toàn, không sợ crash UI.
            </CardDescription>
          </div>
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> 100% Safe Fallbacks
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 pt-3">
          {SAMPLE_PAYLOADS.map((sample, idx) => (
            <Button
              key={idx}
              size="sm"
              variant={selectedIdx === idx ? 'default' : 'outline'}
              onClick={() => setSelectedIdx(idx)}
            >
              Kịch bản {idx + 1}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            1. Dữ liệu thô từ Backend (Raw DTO):
          </div>
          <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-auto max-h-[300px] border">
            {JSON.stringify(currentDto, null, 2)}
          </pre>
        </div>

        <div>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ArrowRight className="h-3.5 w-3.5" /> 2. Kết quả sau Mapper (Clean Domain Model):
          </div>
          <pre className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg text-xs font-mono overflow-auto max-h-[300px] text-emerald-900 dark:text-emerald-200">
            {JSON.stringify(mappedModel, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
