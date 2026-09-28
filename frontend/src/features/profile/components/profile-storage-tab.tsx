'use client';

import * as React from 'react';
import { StorageQuotaWidget } from '@/features/storage/components/storage-quota-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, Video, UserCircle, HelpCircle, Sparkles } from 'lucide-react';

export function ProfileStorageTab() {
  return (
    <div className="space-y-6">
      {/* Widget tổng quan hạn ngạch */}
      <StorageQuotaWidget variant="full" />

      {/* Thông tin chi tiết các loại tài nguyên */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border bg-card/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <UserCircle className="h-5 w-5" />
              <CardTitle className="text-base">Ảnh đại diện</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Ảnh cá nhân hiển thị trên hồ sơ và bình luận
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5">
            <p>
              • Dung lượng tối đa: <strong>10 MB</strong> / tệp
            </p>
            <p>• Định dạng: JPEG, PNG, WebP, AVIF</p>
            <p>• Tự động tối ưu hoá kích thước khi hiển thị</p>
          </CardContent>
        </Card>

        <Card className="border bg-card/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ImageIcon className="h-5 w-5" />
              <CardTitle className="text-base">Ảnh bài viết & công thức</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Ảnh minh họa món ăn và câu chuyện chia sẻ
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5">
            <p>
              • Dung lượng tối đa: <strong>10 MB</strong> / ảnh
            </p>
            <p>• Định dạng: JPEG, PNG, WebP, AVIF</p>
            <p>• Khuyến khích ảnh tỉ lệ 16:9 hoặc 4:3</p>
          </CardContent>
        </Card>

        <Card className="border bg-card/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Video className="h-5 w-5" />
              <CardTitle className="text-base">Video nấu ăn</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Video ngắn hướng dẫn thực hiện món chay
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1.5">
            <p>
              • Dung lượng tối đa: <strong>250 MB</strong> / video
            </p>
            <p>• Định dạng: MP4, WebM, QuickTime MOV</p>
            <p>• Thời lượng lý tưởng: từ 30 giây đến 3 phút</p>
          </CardContent>
        </Card>
      </div>

      {/* Mẹo tối ưu hóa bộ nhớ */}
      <Card className="border bg-muted/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm font-semibold">
              Mẹo tiết kiệm dung lượng lưu trữ
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Dọn dẹp bài viết cũ:</strong> Khi bạn xóa một bài viết hoặc công thức nấu ăn,
              các ảnh/video liên kết sẽ có thể được xóa an toàn khỏi hệ thống để giải phóng dung
              lượng.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Ưu tiên ảnh định dạng WebP:</strong> Định dạng WebP có dung lượng nhẹ hơn
              30-50% so với JPEG/PNG thông thường với chất lượng tương đương.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Chính sách hạn mức:</strong> Mỗi thành viên được cấp mặc định{' '}
              <strong>1.00 GB</strong> dung lượng lưu trữ đám mây tốc độ cao hoàn toàn miễn phí.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
