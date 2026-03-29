import { redirect } from "next/navigation"

/** @deprecated Use `/login` */
export default function LegacyAdminLogin() {
  redirect("/login")
}
