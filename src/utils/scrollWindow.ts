/**
 * Calculate the visible window of items for a scrollable list.
 * Returns the start index for slicing the list.
 * The selected item is always kept within the visible window.
 */
export const getScrollWindow = (
  totalItems: number,
  selectedIndex: number,
  windowSize: number = 15
): { start: number; end: number } => {
  if (totalItems <= windowSize) {
    return { start: 0, end: totalItems };
  }

  // Keep selection centered in the window
  let start = Math.max(0, selectedIndex - Math.floor(windowSize / 2));
  let end = start + windowSize;

  // Clamp to list bounds
  if (end > totalItems) {
    end = totalItems;
    start = end - windowSize;
  }

  return { start, end };
};
