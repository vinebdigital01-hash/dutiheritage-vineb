// src/app/api/bot/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Collection } from '@/models/Collection';
import { validateBotApiKey } from '@/lib/bot-auth';

export async function GET(req: NextRequest) {
  try {
    await validateBotApiKey(req);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const collections = await Collection.find({ isActive: true })
    .sort({ productCount: -1 })
    .lean();

  return NextResponse.json({
    categories: collections.map((c) => ({ name: c.name, slug: c.slug, productCount: c.productCount })),
  });
}
