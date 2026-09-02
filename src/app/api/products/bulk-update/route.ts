import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models';
import { requireAuth } from '@/lib/auth';
import { handleApiError, jsonOk, requireMongo } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const body = await request.json();
    const { ids, action, updates } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No product IDs provided' }, { status: 400 });
    }

    let modifiedCount = 0;

    if (action === 'delete') {
      const res = await Product.deleteMany({ _id: { $in: ids } });
      modifiedCount = res.deletedCount || 0;
    } else if (action === 'update' && updates) {
      const res = await Product.updateMany(
        { _id: { $in: ids } },
        { $set: updates }
      );
      modifiedCount = res.modifiedCount || 0;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    revalidatePath('/', 'layout');

    return jsonOk({ success: true, modifiedCount });
  } catch (error) {
    return handleApiError(error);
  }
}
