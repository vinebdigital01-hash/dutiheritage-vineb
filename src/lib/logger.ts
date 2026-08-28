import { connectDB } from "./mongodb";
import { SystemLog } from "@/models";

type LogInput = {
  level?: "info" | "warning" | "error";
  source: string;
  message: string;
  details?: any;
  path?: string;
  ip?: string;
};

export async function logSystemEvent(input: LogInput) {
  try {
    // Only log in production or if explicitly testing
    // if (process.env.NODE_ENV !== "production") return;
    
    await connectDB();
    await SystemLog.create({
      level: input.level || "error",
      source: input.source,
      message: input.message,
      details: input.details,
      path: input.path,
      ip: input.ip,
    });
  } catch (err) {
    // Silently fail if logger fails so we don't crash the app
    console.error("Logger failed:", err);
  }
}
