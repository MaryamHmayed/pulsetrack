import Link from "next/link";
import { getPaginationPages } from "@/lib/pagination";

type PaginationNavProps = {
  basePath: string;
  currentPage: number;
  fragment?: string;
  label: string;
  pageParam?: string;
  query?: Record<string, string | undefined>;
  totalPages: number;
};

export function PaginationNav({
  basePath,
  currentPage,
  fragment,
  label,
  pageParam = "page",
  query = {},
  totalPages,
}: PaginationNavProps) {
  if (totalPages <= 1) {
    return null;
  }

  function getHref(page: number) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value) {
        params.set(key, value);
      }
    }

    if (page > 1) {
      params.set(pageParam, String(page));
    } else {
      params.delete(pageParam);
    }

    const search = params.toString();
    return `${basePath}${search ? `?${search}` : ""}${fragment ? `#${fragment}` : ""}`;
  }

  const pages = getPaginationPages(currentPage, totalPages);

  return (
    <nav
      aria-label={label}
      className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs font-medium text-slate-500">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          aria-disabled={currentPage === 1}
          className={`button-secondary min-h-9 px-3 py-1.5 text-sm ${
            currentPage === 1 ? "pointer-events-none opacity-50" : ""
          }`}
          href={getHref(Math.max(1, currentPage - 1))}
          tabIndex={currentPage === 1 ? -1 : undefined}
        >
          Previous
        </Link>
        {pages.map((page, index) => {
          const previousPage = pages[index - 1];

          return (
            <span className="contents" key={page}>
              {previousPage && page - previousPage > 1 ? (
                <span aria-hidden="true" className="px-1 text-slate-400">
                  …
                </span>
              ) : null}
              <Link
                aria-current={page === currentPage ? "page" : undefined}
                aria-label={`Page ${page}`}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition ${
                  page === currentPage
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50"
                }`}
                href={getHref(page)}
              >
                {page}
              </Link>
            </span>
          );
        })}
        <Link
          aria-disabled={currentPage === totalPages}
          className={`button-secondary min-h-9 px-3 py-1.5 text-sm ${
            currentPage === totalPages
              ? "pointer-events-none opacity-50"
              : ""
          }`}
          href={getHref(Math.min(totalPages, currentPage + 1))}
          tabIndex={currentPage === totalPages ? -1 : undefined}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}
