import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function csrfProtect(req: NextRequest, res: NextResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  return res;
}
