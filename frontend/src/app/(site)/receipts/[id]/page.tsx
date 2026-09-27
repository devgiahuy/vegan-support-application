import type { Metadata } from 'next';
import { ReceiptJobClientView } from './receipt-job-client-view';

interface ReceiptJobPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Kiểm duyệt hóa đơn mua sắm | VeggieConnect',
  description:
    'Đối chiếu và kiểm duyệt các mặt hàng bóc tách từ hóa đơn siêu thị trước khi nhập vào tủ bếp.',
};

export default async function ReceiptJobPage({ params }: ReceiptJobPageProps) {
  const { id } = await params;

  return <ReceiptJobClientView jobId={id} />;
}
