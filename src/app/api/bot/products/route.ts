import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { handleApiError, jsonOk } from "@/lib/api";
import { validateBotApiKey } from "@/lib/bot-auth";

export async function GET(request: Request) {
  try {
    await await validateBotApiKey(request);
    
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const collection = searchParams.get("collection");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    await connectDB();

    let query: any = { isActive: true };

    if (slug) {
      const product = await Product.findOne({ slug, isActive: true });
      return jsonOk(product ? [product] : []);
    } else if (collection) {
      query.collectionId = collection;
    } else if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(query).limit(limit);
    return jsonOk(products);
  } catch (error) {
    return handleApiError(error);
  }
}
