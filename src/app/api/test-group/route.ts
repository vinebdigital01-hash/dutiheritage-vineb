import { connectDB } from '@/lib/mongodb'; import { CustomerGroup } from '@/models'; import { resolveGroupMembers } from '@/lib/analytics'; import { jsonOk } from '@/lib/api'; export async function GET() {
  await connectDB();
  const groups = await CustomerGroup.find({}).lean();
  return jsonOk({ groups });
}
