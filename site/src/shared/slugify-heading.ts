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

export type DocOutlineMode = 'tutorial' | 'documentation';

const SKIP_HEADINGS = new Set(['table of contents']);

function cleanHeadingText(raw: string): string {
  return raw
    .trim()
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`/g, '');
}

/** `# §1 …` top-level chapter headings used in documentation. */
function isChapterHeading(text: string): boolean {
  return /^§\d+\b/.test(text.trim());
}

function parseMarkdownLines(markdown: string): string[] {
  const lines: string[] = [];
  let inFence = false;

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) lines.push(line);
  }

  return lines;
}

/** Tutorial: `##` / `###` steps and subsections. */
function extractTutorialHeadings(lines: string[]): DocHeading[] {
  const headings: DocHeading[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    if (level !== 2 && level !== 3) continue;

    const text = cleanHeadingText(match[2]);
    if (SKIP_HEADINGS.has(text.toLowerCase())) continue;

    headings.push({
      level: level as 2 | 3,
      text,
      id: slugifyHeading(text),
    });
  }

  return headings;
}

/** Documentation: `# §N …` chapter titles; fallback to `##` when no § chapters exist. */
function extractDocumentationHeadings(lines: string[]): DocHeading[] {
  const chapters: DocHeading[] = [];

  for (const line of lines) {
    const match = line.match(/^#\s+(.+)$/);
    if (!match) continue;

    const text = cleanHeadingText(match[1]);
    if (!isChapterHeading(text)) continue;

    chapters.push({
      level: 2,
      text,
      id: slugifyHeading(text),
    });
  }

  if (chapters.length > 0) return chapters;

  const sections: DocHeading[] = [];
  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (!match) continue;

    const text = cleanHeadingText(match[1]);
    if (SKIP_HEADINGS.has(text.toLowerCase())) continue;

    sections.push({
      level: 2,
      text,
      id: slugifyHeading(text),
    });
  }

  return sections;
}

export function extractHeadingsFromMarkdown(
  markdown: string,
  mode: DocOutlineMode = 'tutorial',
): DocHeading[] {
  const lines = parseMarkdownLines(markdown);
  return mode === 'documentation'
    ? extractDocumentationHeadings(lines)
    : extractTutorialHeadings(lines);
}
