import Link from "next/link";
import { logout } from "@/app/login/actions";
import { requireClinician } from "@/lib/auth/session";
import { PulseTrackLogo } from "@/app/ui/pulsetrack-logo";
import { Icon } from "@/app/ui/icons";
import { AppNavigation } from "./app-navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const clinician = await requireClinician();
  const initials = clinician.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-[#0b2f48]">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#073a5a] to-[#064667] shadow-lg shadow-slate-900/10">
        <div className="flex min-h-18 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:min-h-20 lg:px-8">
          <Link
            aria-label="PulseTrack dashboard"
            className="shrink-0"
            href="/dashboard"
          >
            <PulseTrackLogo compact inverse />
          </Link>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-[#d8f2f3] text-sm font-bold text-[#07536a]">
              {initials || "CL"}
            </div>
            <p className="hidden min-w-0 text-sm text-white sm:block">
              <span className="block truncate font-semibold">
                {clinician.name}
              </span>
              <span className="block max-w-48 truncate text-xs text-cyan-100/70">
                {clinician.email}
              </span>
            </p>
            <form action={logout}>
              <button
                aria-label="Sign out"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 px-3 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
                type="submit"
              >
                <Icon className="h-4 w-4" name="logout" />
                <span className="hidden md:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-white/10 lg:hidden">
          <AppNavigation variant="mobile" />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[112rem]">
        <aside className="hidden min-h-[calc(100dvh-5rem)] w-64 shrink-0 border-r border-[#dce7ec] bg-white px-5 lg:block">
          <div className="sticky top-20 flex h-[calc(100dvh-5rem)] flex-col py-7">
            <AppNavigation variant="desktop" />
            <div className="mt-auto flex items-center gap-3 rounded-xl border border-[#d2e5e9] bg-[#f5fbfb] px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#dff4f5] text-[#0b909b]">
                <Icon className="h-4 w-4" name="shield" />
              </div>
              <p className="text-xs font-semibold text-[#476579]">
                Secure clinical access
              </p>
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
