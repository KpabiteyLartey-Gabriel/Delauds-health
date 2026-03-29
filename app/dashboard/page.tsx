import { redirect } from "next/navigation"

/** @deprecated Use `/admin` */
export default function LegacyDashboard() {
  redirect("/admin")
}
