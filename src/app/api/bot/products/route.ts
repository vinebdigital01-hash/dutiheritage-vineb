// src/app/api/bot/products/route.ts
//
// ⚠️ Adjust to match your project:
//   - connectDB: swap for your actual Mongoose connection helper
//   - Product fields assumed: name, slug, price, compareAtPrice, images[],
//     category, inStock, description — rename below if yours differ

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Collection } from '@/models/Collection';
import { validateBotApiKey } from '@/lib/bot-auth';

export async function GET(req: NextRequest) {
  try {
    await validateBotApiKey(req);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const page = Number(searchParams.get('page') || 1);
  const limit = Math.min(Number(searchParams.get('limit') || 8), 20);

  const query: Record<string, any> = { isActive: true };
  
  if (category) {
    const collectionDoc = await Collection.findOne({ slug: category });
    if (collectionDoc) {
      query.collectionId = collectionDoc._id.toString();
    } else {
      query.collectionId = category;
    }
  }

  if (search) query.name = { $regex: search, $options: 'i' };

  const [products, total] = await Promise.all([
    Product.find(query)
      .select('name slug price salePrice image sizes collectionId isActive description')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return NextResponse.json({
    products: products.map(p => ({
      name: p.name,
      slug: p.slug,
      price: p.salePrice || p.price,
      compareAtPrice: p.price,
      images: [p.image],
      sizes: p.sizes || [],
      category: p.collectionId,
      inStock: p.isActive,
      description: p.description
    })),
    total,
    page,
    limit
  });
}
