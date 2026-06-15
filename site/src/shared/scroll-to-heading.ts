/** Scroll a heading into view inside a nested overflow container (doc main pane). */
export function scrollToHeading(
  id: string,
  scrollContainer?: HTMLElement | null,
  offset = 16,
): boolean {
  const target = document.getElementById(id);
  if (!target) return false;

  if (scrollContainer) {
    const containerTop = scrollContainer.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    scrollContainer.scrollBy({
      top: targetTop - containerTop - offset,
      behavior: 'smooth',
    });
    return true;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

export const DOC_SCROLL_TO_KEY = 'flint-doc-scroll-to';

/** Pick the heading whose section is currently at the top of the scroll container. */
export function resolveActiveHeadingId(
  headingIds: string[],
  scrollContainer: HTMLElement,
  offset = 48,
): string | null {
  if (headingIds.length === 0) return null;

  const containerTop = scrollContainer.getBoundingClientRect().top;
  let active = headingIds[0];

  for (const id of headingIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= containerTop + offset) {
      active = id;
    }
  }

  return active;
}
