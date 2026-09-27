import type { Metadata } from 'next';
import { ReceiptsClientView } from './receipts-client-view';

export const metadata: Metadata = {
  title: 'Hóa đơn mua sắm & Tủ bếp | VeggieConnect',
  description:
    'Quét hóa đơn mua hàng để AI tự động trích xuất các sản phẩm và cập nhật vào tủ bếp gia đình.',
};

export default function ReceiptsPage() {
  return <ReceiptsClientView />;
}
