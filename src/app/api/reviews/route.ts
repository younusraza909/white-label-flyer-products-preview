import { NextResponse } from 'next/server';
import dbConnect, { Review } from '@/lib/db-mongo';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, flyer_product_id, is_accepted, comments } = body;

    if (!flyer_product_id || id === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const result = await Review.findOneAndUpdate(
      { flyer_product_id },
      { 
        id,
        is_accepted, 
        comments,
        updated_at: new Date()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error saving review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
