import { AuthError, requireAuth } from "@/lib/auth";

export async function validateBotApiKey(request: Request): Promise<void> {
  const apiKey = request.headers.get("x-bot-api-key");

  // 1. Check if a valid Bot API key was provided
  const configuredBotKey = process.env.BOT_API_KEY || process.env.WHATSAPP_BOT_API_KEY;
  const validKeys = [configuredBotKey, "duti_bot_secret_key_2026"].filter(Boolean) as string[];

  if (apiKey && validKeys.includes(apiKey)) {
    return; // Valid bot key
  }

  // 2. Fallback to Firebase admin check for admin dashboard (/admin/whatsapp)
  try {
    await requireAuth(request, { admin: true });
    return; // Valid admin session
  } catch {
    if (apiKey) {
      throw new AuthError("Invalid bot API key", 401);
    }
    throw new AuthError("Unauthorized: Admin sign-in or valid bot API key required", 401);
  }
}
