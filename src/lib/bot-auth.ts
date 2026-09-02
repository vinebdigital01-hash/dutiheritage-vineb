import { AuthError, requireAuth } from "@/lib/auth";

export async function validateBotApiKey(request: Request): Promise<void> {
  const apiKey = request.headers.get("x-bot-api-key");
  
  if (!process.env.BOT_API_KEY) {
    throw new AuthError("BOT_API_KEY is not configured on the server", 500);
  }

  if (apiKey === process.env.BOT_API_KEY) {
    return; // Valid bot key
  }

  // Fallback to Firebase admin check for admin panel
  try {
    await requireAuth(request, { admin: true });
  } catch (err) {
    throw new AuthError("Invalid bot API key and no valid admin session", 401);
  }
}
