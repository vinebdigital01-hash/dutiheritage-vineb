import { redirect } from "next/navigation";

export default function CodSettingsRedirect() {
  redirect("/admin/settings?tab=cod");
}
