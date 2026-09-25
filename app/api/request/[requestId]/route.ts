import { NextRequest, NextResponse } from 'next/server';
import { getServiceRequest } from '@/lib/requestStore';

export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params;
    const req = getServiceRequest(requestId);

    if (!req) {
      return NextResponse.json(
        { error: 'Service request not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(req, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve request', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
