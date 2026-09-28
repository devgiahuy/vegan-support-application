import type { Metadata } from 'next';
import { ReceiptScanClientView } from './receipt-scan-client-view';

export const metadata: Metadata = {
  title: 'Quét hóa đơn mua thực phẩm | VeggieConnect',
  description:
    'Tải ảnh hóa đơn siêu thị để AI tự động bóc tách các dòng sản phẩm và cập nhật vào tủ bếp gia đình.',
};

export default function ReceiptScanPage() {
  return <ReceiptScanClientView />;
}
