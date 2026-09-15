// src/app/api/bot/coupons/route.ts
//
// ⚠️ Adjust to match your project:
//   - connectDB: swap for your actual Mongoose connection helper (any name/path)
//   - Product: assumes fields { slug, price } — rename if yours differ
//
// Called by the bot's negotiation engine once a discount is agreed.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Coupon } from '@/models/Coupon';
import { Product } from '@/models/Product';
import { validateBotApiKey } from '@/lib/bot-auth';

function randomCode(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function generateUniqueCode(prefix: string, attempts = 5): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const code = randomCode(prefix);
    const exists = await Coupon.exists({ code });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique coupon code');
}

export async function POST(req: NextRequest) {
  try {
    await validateBotApiKey(req);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productSlug, phone, discountPercent, expiresInMinutes = 60 } = await req.json();

  if (!productSlug || !phone || !discountPercent) {
    return NextResponse.json({ error: 'productSlug, phone and discountPercent are required' }, { status: 400 });
  }

  await connectDB();

  const product = await Product.findOne({ slug: productSlug });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const code = await generateUniqueCode('DUTI');
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const coupon = await Coupon.create({ 
    code, 
    discountType: "PERCENT", 
    discountValue: discountPercent, 
    scope: "SPECIFIC_PRODUCTS", 
    targetIds: [product.id.toString()],
    usageLimit: 1,
    active: true,
    expiresAt 
  });

  const checkoutUrl = `${process.env.STOREFRONT_URL || 'https://dutiheritage.com'}/checkout?product=${productSlug}&coupon=${code}`;

  return NextResponse.json({
    coupon: {
      code: coupon.code,
      discountPercent: coupon.discountValue,
      expiresAt: coupon.expiresAt,
      checkoutUrl,
    },
  });
}
