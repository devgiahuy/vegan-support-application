import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface PantryTabsProps {
  activeTab: 'all' | 'expiring';
  onTabChange: (tab: 'all' | 'expiring') => void;
  totalCount: number;
  expiringCount: number;
}

export function PantryTabs({ activeTab, onTabChange, totalCount, expiringCount }: PantryTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => onTabChange(val as 'all' | 'expiring')}
      className="w-full"
    >
      <TabsList className="grid w-full sm:w-[320px] grid-cols-2">
        <TabsTrigger value="all" className="gap-2 text-xs sm:text-sm">
          Tất cả tủ bếp
          <Badge variant="secondary" className="px-1.5 py-0 text-[11px] font-normal">
            {totalCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="expiring" className="gap-2 text-xs sm:text-sm">
          Sắp hết hạn
          {expiringCount > 0 ? (
            <Badge variant="destructive" className="px-1.5 py-0 text-[11px] font-normal">
              {expiringCount}
            </Badge>
          ) : (
            <Badge variant="outline" className="px-1.5 py-0 text-[11px] font-normal">
              0
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
