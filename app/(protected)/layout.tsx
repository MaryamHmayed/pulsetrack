import Link from "next/link";
import { logout } from "@/app/login/actions";
import { requireClinician } from "@/lib/auth/session";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/patients", label: "Patients" },
] as const;

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const clinician = await requireClinician();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="group">
            <p className="font-bold text-teal-700 group-hover:text-teal-800">
              PulseTrack
            </p>
            <p className="text-xs text-slate-500">Clinical workspace</p>
          </Link>
          <nav aria-label="Main navigation" className="order-3 w-full sm:order-2 sm:w-auto">
            <ul className="flex gap-1">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="order-2 flex items-center gap-3 sm:order-3">
            <p className="hidden text-right text-sm sm:block">
              <span className="block font-medium text-slate-800">
                {clinician.name}
              </span>
              <span className="block text-xs text-slate-500">
                {clinician.email}
              </span>
            </p>
            <form action={logout}>
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
