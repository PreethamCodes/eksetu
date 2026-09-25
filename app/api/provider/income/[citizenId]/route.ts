import { NextRequest, NextResponse } from 'next/server';
import mockCitizens from '@/data/citizens.json';
import { CitizenData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { citizenId: string } }
) {
  try {
    const { citizenId } = params;

    const citizen = (mockCitizens as CitizenData[]).find(
      (c) => c.citizenId.toLowerCase() === citizenId.toLowerCase()
    );

    if (!citizen) {
      return NextResponse.json(
        {
          error: `Record for citizen ID '${citizenId}' not found in government data provider registry`,
          code: 'CITIZEN_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(citizen, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Data provider service error', code: 'PROVIDER_ERROR' },
      { status: 500 }
    );
  }
}
