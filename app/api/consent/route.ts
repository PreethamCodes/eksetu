import { NextRequest, NextResponse } from 'next/server';
import { getServiceRequest, updateRequestConsent } from '@/lib/requestStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, consent } = body;

    if (!requestId || typeof consent !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid input: requestId and boolean consent are required', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const existing = getServiceRequest(requestId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Service request not found or expired', code: 'REQUEST_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updated = updateRequestConsent(requestId, consent);
    if (!updated) {
      return NextResponse.json(
        { error: 'Could not update consent state', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        {
          requestId: updated.requestId,
          consent: updated.consent,
          status: updated.status,
          message: 'Consent was declined by citizen',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        requestId: updated.requestId,
        consent: updated.consent,
        status: updated.status,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process consent', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
