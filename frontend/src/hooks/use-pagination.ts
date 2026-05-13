import { useMemo, useState } from "react";

export function usePagination<T>(items: T[], itemsPerPage = 9) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Reset to page 1 if items change and current page is out of bounds
  const safePage = currentPage > totalPages ? 1 : currentPage;

  const paginatedItems = useMemo(
    () => items.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage),
    [items, safePage, itemsPerPage]
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const resetPage = () => setCurrentPage(1);

  return {
    currentPage: safePage,
    totalPages,
    paginatedItems,
    goToPage,
    resetPage,
    totalItems: items.length,
  };
}
