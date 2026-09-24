'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useDeleteMediaAssetMutation } from '../queries/storage.queries';
import type { MediaAsset } from '../types/storage.model';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';

interface StorageDeleteAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: MediaAsset | null;
  onSuccess?: () => void;
}

export function StorageDeleteAssetDialog({
  open,
  onOpenChange,
  asset,
  onSuccess,
}: StorageDeleteAssetDialogProps) {
  const deleteMutation = useDeleteMediaAssetMutation();

  const handleDelete = async () => {
    if (!asset) return;

    const idempotencyKey = crypto.randomUUID();

    try {
      await deleteMutation.mutateAsync({
        assetId: asset.id,
        idempotencyKey,
      });

      toast.success('Đã xóa tệp tin thành công và giải phóng dung lượng.');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const code = getApiErrorCode(error);

      if (code === 'MEDIA_ASSET_IN_USE') {
        toast.error('Không thể xóa tệp tin này', {
          description:
            'Tệp đang được sử dụng trong bài viết hoặc công thức nấu ăn của bạn. Vui lòng gỡ tệp khỏi nội dung trước khi xóa.',
        });
        return;
      }

      if (code === 'MEDIA_ASSET_NOT_FOUND') {
        toast.error('Tệp không tồn tại', {
          description: 'Tệp tin này không tồn tại hoặc đã được xóa trước đó.',
        });
        onOpenChange(false);
        return;
      }

      toast.error('Xóa tệp thất bại', {
        description: getApiErrorMessage(error, 'Đã xảy ra lỗi khi kết nối máy chủ.'),
      });
    }
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="gap-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 sm:mx-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Xác nhận xóa tệp lưu trữ?
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-1 text-left text-sm text-muted-foreground leading-relaxed">
            <span>
              Hành động này sẽ xóa hoàn toàn tệp khỏi máy chủ lưu trữ đám mây và{' '}
              <strong>không thể khôi phục</strong>. Dung lượng đã sử dụng của tài khoản sẽ được giải
              phóng tương ứng.
            </span>

            <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3 text-xs text-foreground mt-2">
              <div className="rounded-lg bg-background p-2 shadow-xs">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">{asset.publicId || asset.secureUrl}</p>
                <p className="text-muted-foreground mt-0.5">
                  Loại: {asset.resourceType} · Dung lượng: <strong>{asset.sizeFormatted}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              Lưu ý: Nếu tệp này đang được đính kèm vào bất kỳ bài viết hoặc công thức nào, hệ thống
              sẽ từ chối xóa để bảo vệ tính toàn vẹn nội dung.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
            className="rounded-full"
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleteMutation.isPending}
            className="rounded-full gap-1.5"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Xác nhận xóa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
