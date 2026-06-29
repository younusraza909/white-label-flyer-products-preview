import { NextResponse } from 'next/server';
import { query } from '@/lib/db-postgres';
import dbConnect, { Review } from '@/lib/db-mongo';

export async function GET() {
  try {
    // 1. Fetch products from Postgres
    const postgresResult = await query(
      `SELECT id, flyer_product_id, image_url, product_white_label_image, name 
       FROM flyer_products 
       WHERE region = 'DE'
       ORDER BY id ASC`
    );
    const products = postgresResult.rows;

    // 2. Fetch reviews from Mongo
    await dbConnect();
    const reviews = await Review.find({});

    // 3. Merge reviews into products
    const reviewsMap = new Map(reviews.map((r) => [r.flyer_product_id, r]));

    const mergedProducts = products
      .map((product) => {
        const review = reviewsMap.get(product.flyer_product_id);
        return {
          ...product,
          is_accepted: review ? review.is_accepted : null,
          comments: review ? review.comments : '',
          reviewed_at: review ? review.updated_at : null,
        };
      })
      .filter(
        (product) =>
          product.image_url?.trim() &&
          product.product_white_label_image?.trim(),
      );

    return NextResponse.json(mergedProducts);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
