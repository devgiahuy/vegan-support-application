'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Target, Award, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { MealProgramListItem } from '../types/meal-program.model';

interface ProgramCardProps {
  program: MealProgramListItem;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ program }) => {
  const getBadgeVariant = (variant: string) => {
    switch (variant) {
      case 'warning':
        return 'secondary';
      case 'success':
        return 'default';
      case 'secondary':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div className="relative w-full h-44 bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/20">
        {program.coverImageUrl ? (
          <Image
            src={program.coverImageUrl}
            alt={program.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full p-4 text-center">
            <Award className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mb-2 opacity-80" />
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              Lộ trình {program.horizonWeeks} tuần
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge variant={getBadgeVariant(program.statusBadgeVariant)} className="shadow-sm">
            {program.statusLabel}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <h3 className="text-lg font-semibold line-clamp-1 text-foreground" title={program.title}>
          {program.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {program.goal || 'Lộ trình dinh dưỡng được thiết kế riêng cho mục tiêu sức khỏe của bạn.'}
        </p>
      </CardHeader>

      <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-end space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" />
            {program.formattedDateRange || `${program.horizonWeeks} tuần`}
          </span>
          <span className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-muted-foreground/80" />
            Tuần {program.currentWeekNumber}/{program.totalWeeks || program.horizonWeeks}
          </span>
        </div>

        {program.status !== 'DRAFT' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span>Độ tuân thủ</span>
              <span>{program.overallComplianceRate}%</span>
            </div>
            <Progress value={program.overallComplianceRate} className="h-1.5" />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Link
          href={`/meal-programs/${program.id}`}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
        >
          <span>Xem chi tiết lộ trình</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardFooter>
    </Card>
  );
};
