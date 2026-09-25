import { NextRequest, NextResponse } from 'next/server';
import { processVerification } from '@/lib/verification';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing requestId parameter', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const outcome = await processVerification(requestId);

    if (!outcome.success) {
      return NextResponse.json(
        {
          error: outcome.errorMessage,
          code: outcome.errorCode,
          requestId,
        },
        { status: outcome.statusCode }
      );
    }

    return NextResponse.json(outcome.response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Verification failed unexpectedly', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
