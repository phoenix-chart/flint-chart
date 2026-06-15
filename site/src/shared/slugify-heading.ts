/** Match GitHub-style heading anchors used by MarkdownView. */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface DocHeading {
  level: 2 | 3;
  text: string;
  id: string;
}

/** Extract `##` / `###` headings from markdown (skips fenced code blocks). */
export function extractHeadingsFromMarkdown(markdown: string): DocHeading[] {
  const headings: DocHeading[] = [];
  let inFence = false;

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    if (level !== 2 && level !== 3) continue;

    const text = match[2]
      .trim()
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`/g, '');

    if (text.toLowerCase() === 'table of contents') continue;

    headings.push({
      level: level as 2 | 3,
      text,
      id: slugifyHeading(text),
    });
  }

  return headings;
}
