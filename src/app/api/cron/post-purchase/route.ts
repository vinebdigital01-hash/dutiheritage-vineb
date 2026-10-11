import { requireCronSecret } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { runPostPurchase } from "../jobs/post-purchase";

async function run(request: Request) {
  requireCronSecret(request);
  const result = await runPostPurchase();
  return jsonOk(result);
}

export async function GET(request: Request) {
  try {
    return await run(request);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    return await run(request);
  } catch (error) {
    return handleApiError(error);
  }
}
