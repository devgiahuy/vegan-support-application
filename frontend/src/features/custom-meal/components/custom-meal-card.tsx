'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, Eye, Flame, ImageIcon, Trash2, Users, Utensils } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CustomMealListItem } from '../types/custom-meal.model';

interface CustomMealCardProps {
  meal: CustomMealListItem;
  onDeleteClick?: (meal: CustomMealListItem) => void;
}

export const CustomMealCard: React.FC<CustomMealCardProps> = ({ meal, onDeleteClick }) => {
  const calories =
    meal.calculatedCalories !== null
      ? Math.round(meal.calculatedCalories)
      : meal.userCalories !== null
        ? Math.round(meal.userCalories)
        : null;

  return (
    <Card className="group overflow-hidden border transition-all duration-200 hover:shadow-md hover:border-primary/40 flex flex-col justify-between bg-card">
      <div>
        {/* Ảnh bìa */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
          {meal.coverPhotoUrl ? (
            <Image
              src={meal.coverPhotoUrl}
              alt={meal.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted/40">
              <Utensils className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}

          {/* Badges trên ảnh */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <Badge
              variant="secondary"
              className="bg-black/60 text-white backdrop-blur-sm text-[10px] px-2 py-0.5 gap-1"
            >
              <Users className="w-3 h-3" />
              {meal.servings} phần
            </Badge>
            {meal.photoCount > 1 && (
              <Badge
                variant="secondary"
                className="bg-black/60 text-white backdrop-blur-sm text-[10px] px-2 py-0.5 gap-1"
              >
                <ImageIcon className="w-3 h-3" />
                {meal.photoCount}
              </Badge>
            )}
          </div>

          {/* Nhãn loại món cá nhân */}
          <div className="absolute top-2 right-2">
            <Badge className="bg-primary/90 text-primary-foreground text-[10px] shadow-sm">
              Món cá nhân
            </Badge>
          </div>
        </div>

        {/* Nội dung card */}
        <CardContent className="p-4 space-y-2.5">
          <Link
            href={`/custom-meals/${meal.id}`}
            className="block group-hover:text-primary transition-colors"
          >
            <h3 className="font-semibold text-base line-clamp-1 text-foreground">{meal.name}</h3>
          </Link>

          {meal.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {meal.notes}
            </p>
          )}

          {/* Thông số dinh dưỡng & nguyên liệu */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
              <Flame className="w-3.5 h-3.5" />
              <span>{calories !== null ? `${calories} kcal` : 'Chưa có calo'}</span>
            </div>

            <span className="text-muted-foreground text-[11px]">
              {meal.ingredientCount} nguyên liệu
            </span>
          </div>

          {/* Danh sách Tags */}
          {meal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {meal.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
              {meal.tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{meal.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </div>

      {/* Footer các nút thao tác */}
      <CardFooter className="p-3 pt-0 flex justify-between items-center border-t border-border/40 gap-1 bg-muted/10">
        <Link href={`/custom-meals/${meal.id}`} className="flex-1">
          <Button variant="ghost" size="sm" className="w-full text-xs h-8 gap-1">
            <Eye className="w-3.5 h-3.5" />
            Xem
          </Button>
        </Link>

        <Link href={`/custom-meals/${meal.id}/edit`}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Chỉnh sửa"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
        </Link>

        {onDeleteClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteClick(meal)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            title="Xóa món ăn"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
