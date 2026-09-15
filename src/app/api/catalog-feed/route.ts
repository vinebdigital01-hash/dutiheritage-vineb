// src/app/api/catalog-feed/route.ts
//
// NOT under /api/bot — this needs to be fetchable by Meta's own catalog
// crawler, so it does not use the x-bot-api-key gate. Point Meta Commerce
// Manager's feed URL at this endpoint (+ ?token=... if you set one) to
// auto-sync products for native WhatsApp product cards. Optional — only
// needed for Phase 3 / native catalog cards; the bot works without it,
// falling back to image + button cards automatically.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (process.env.CATALOG_FEED_TOKEN && searchParams.get('token') !== process.env.CATALOG_FEED_TOKEN) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  await connectDB();
  const products = await Product.find({}).lean();

  const escape = (s = '') => `"${String(s).replace(/"/g, '""')}"`;
  const header = 'id,title,description,availability,condition,price,link,image_link,brand';

  const rows = products.map((p: any) => {
    const price = `${Number(p.salePrice || p.price).toFixed(2)} INR`;
    const availability = p.isActive === false ? 'out of stock' : 'in stock';
    return [
      escape(p.slug),
      escape(p.name),
      escape((p.description || '').slice(0, 5000)),
      availability,
      'new',
      price,
      `${process.env.STOREFRONT_URL || 'https://dutiheritage.com'}/product/${p.slug}`,
      p.image || p.images?.[0] || '',
      escape('Dutiheritage'),
    ].join(',');
  });

  return new NextResponse([header, ...rows].join('\n'), { headers: { 'Content-Type': 'text/csv' } });
}
