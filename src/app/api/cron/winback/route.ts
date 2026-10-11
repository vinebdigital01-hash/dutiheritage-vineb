import { requireCronSecret } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { runWinback } from "../jobs/winback";

async function run(request: Request) {
  requireCronSecret(request);
  const result = await runWinback();
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
