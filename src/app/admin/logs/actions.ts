"use server";
import { SystemLog } from "@/models";
import { connectDB } from "@/lib/mongodb";
import { revalidatePath } from "next/cache";

export async function markLogAsFixed(logId: string) {
  await connectDB();
  await SystemLog.findByIdAndUpdate(logId, { status: "fixed" });
  revalidatePath("/admin/logs");
}
