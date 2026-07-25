"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/app/ui/icons";

const navigation: Array<{
  href: string;
  label: string;
  icon: IconName;
  matches: (pathname: string) => boolean;
}> = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: "dashboard",
    matches: (pathname) => pathname === "/dashboard",
  },
  {
    href: "/patients",
    label: "Patients",
    icon: "patients",
    matches: (pathname) => pathname.startsWith("/patients"),
  },
  {
    href: "/labs",
    label: "Lab results",
    icon: "labs",
    matches: (pathname) => pathname.startsWith("/labs"),
  },
];

export function AppNavigation({
  variant,
}: {
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation">
      <ul
        className={
          variant === "desktop"
            ? "space-y-2"
            : "grid grid-cols-3 gap-1 px-2 pb-2"
        }
      >
        {navigation.map((item) => {
          const active = item.matches(pathname);

          return (
            <li key={item.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={
                  variant === "desktop"
                    ? `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-[#e2f6f7] text-[#087f8a]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-[#083b5c]"
                      }`
                    : `flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
                        active
                          ? "bg-white/12 text-white"
                          : "text-cyan-50/70 hover:bg-white/8 hover:text-white"
                      }`
                }
                href={item.href}
              >
                <Icon
                  className={variant === "desktop" ? "h-5 w-5" : "h-4 w-4"}
                  name={item.icon}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
