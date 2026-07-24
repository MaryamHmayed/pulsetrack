import { redirect } from "next/navigation";
import { getCurrentClinician } from "@/lib/auth/session";

export default async function Home() {
  redirect((await getCurrentClinician()) ? "/dashboard" : "/login");
}
