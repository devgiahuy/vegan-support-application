import React from 'react';
import { Product } from '../types/product.model';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, Calendar, PackageCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all flex flex-col h-full border">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            // Fallback image if broken
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <div className="absolute top-2 right-2">
          <Badge variant={product.status === 1 ? 'success' : 'secondary'}>
            {product.statusLabel}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span className="font-mono">{product.id}</span>
          <span className="bg-muted px-2 py-0.5 rounded font-medium">{product.category.name}</span>
        </div>
        <CardTitle className="text-base line-clamp-1">{product.name}</CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1">
        <div className="text-xl font-bold text-primary mb-2">{product.formattedPrice}</div>

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <PackageCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Tồn kho: <strong className="text-foreground">{product.stock}</strong> cái</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Ngày nhập: {formatDate(product.createdAt)}</span>
          </div>
        </div>

        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
