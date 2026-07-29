export const DEFAULT_PAGE_SIZE = 10;

export function parsePage(value: unknown) {
  const text = Array.isArray(value) ? value[0] : value;

  if (typeof text !== "string" || !/^[1-9]\d*$/.test(text)) {
    return 1;
  }

  const page = Number(text);
  return Number.isSafeInteger(page) ? Math.min(page, 100_000) : 1;
}

export function getTotalPages(totalItems: number, pageSize: number) {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("pageSize must be a positive integer.");
  }

  return Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize));
}

export function paginateItems<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const totalPages = getTotalPages(items.length, pageSize);
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (page - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    page,
    pageSize,
    totalItems: items.length,
    totalPages,
    firstItem: items.length === 0 ? 0 : startIndex + 1,
    lastItem: Math.min(startIndex + pageSize, items.length),
  };
}

export function getPaginationPages(currentPage: number, totalPages: number) {
  const candidates = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  return [...candidates]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second);
}
