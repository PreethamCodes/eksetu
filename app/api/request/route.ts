import { NextRequest, NextResponse } from 'next/server';
import { createServiceRequest } from '@/lib/requestStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service, citizenId, purpose } = body;

    if (!service || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: service and purpose', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const newRequest = createServiceRequest({
      service,
      citizenId: citizenId || 'CIT-001',
      purpose,
    });

    return NextResponse.json(
      {
        requestId: newRequest.requestId,
        status: newRequest.status,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create service request', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
