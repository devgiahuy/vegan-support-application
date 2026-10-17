import type { PrismaClient } from '@prisma/client';

// Demonstration catalog data, outside domain logic; orders snapshot these benefits.
export const billingProducts = [
  {
    id: 'chat-100',
    name: 'Thêm 100 lượt chat',
    description: 'Dùng sau lượt miễn phí mỗi ngày.',
    priceVnd: 29000,
    chatCredits: 100,
    fridgeCredits: 0,
    receiptCredits: 0,
    pantrySlots: 0,
  },
  {
    id: 'fridge-10',
    name: 'Thêm 10 lượt quét tủ lạnh',
    description: 'Mỗi lượt là một job nhiều ảnh, theo giới hạn được hiển thị.',
    priceVnd: 19000,
    chatCredits: 0,
    fridgeCredits: 10,
    receiptCredits: 0,
    pantrySlots: 0,
  },
  {
    id: 'receipt-10',
    name: 'Thêm 10 lượt phân tích hóa đơn',
    description: 'Xác nhận kết quả trước khi thêm vào tủ đồ ăn.',
    priceVnd: 19000,
    chatCredits: 0,
    fridgeCredits: 0,
    receiptCredits: 10,
    pantrySlots: 0,
  },
  {
    id: 'pantry-50',
    name: 'Thêm 50 ô tủ đồ ăn',
    description: 'Tăng sức chứa đồng thời; xóa hoặc gộp item sẽ giải phóng ô.',
    priceVnd: 19000,
    chatCredits: 0,
    fridgeCredits: 0,
    receiptCredits: 0,
    pantrySlots: 50,
  },
  {
    id: 'combo',
    name: 'Gói tiện ích',
    description: '100 lượt chat, 10 lượt mỗi loại phân tích và 50 ô tủ đồ ăn.',
    priceVnd: 69000,
    chatCredits: 100,
    fridgeCredits: 10,
    receiptCredits: 10,
    pantrySlots: 50,
  },
] as const;

export async function seedBillingProducts(prisma: PrismaClient): Promise<void> {
  for (const product of billingProducts) {
    await prisma.billingProduct.upsert({
      where: { id: product.id },
      create: { ...product, version: 1, active: true },
      update: {},
    });
  }
}
