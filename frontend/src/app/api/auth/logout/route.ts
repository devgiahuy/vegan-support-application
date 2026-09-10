import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/env';

/**
 * POST /api/auth/logout
 * Proxy logout + xóa cookie phía Next để middleware hết cho qua.
 */
export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';

  try {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify({}),
    }).catch(() => null);
  } catch {
    /* BE down vẫn cho logout phía client */
  }

  const res = NextResponse.json({ message: 'Đã đăng xuất' });
  res.cookies.delete('accessToken');
  res.cookies.delete('refreshToken');
  return res;
}
