// src/app/api/bot/products/[slug]/route.ts
//
// Next.js 15 makes dynamic `params` a Promise — awaited below. If your
// project is still on Next.js 14 syntax elsewhere, drop the Promise/await
// here and take `{ params }: { params: { slug: string } }` instead.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { validateBotApiKey } from '@/lib/bot-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await validateBotApiKey(req);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  await connectDB();

  const p = await Product.findOne({ slug }).lean();
  if (!p) return NextResponse.json({ product: null }, { status: 404 });

  return NextResponse.json({ product: {
    name: p.name,
    slug: p.slug,
    price: p.salePrice || p.price,
    compareAtPrice: p.price,
    images: [p.image],
    sizes: p.sizes || [],
    category: p.collectionId,
    inStock: p.isActive,
    description: p.description
  } });
}
