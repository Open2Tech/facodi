/** Page numbers around the current page, with gaps (`null`) collapsed to an ellipsis. */
export function pageWindow(page: number, pages: number): (number | null)[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter(value => value >= 1 && value <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((value, index) => (index > 0 && value - sorted[index - 1] > 1 ? [null, value] : [value]));
}
