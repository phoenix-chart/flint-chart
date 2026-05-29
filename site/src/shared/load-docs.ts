import type { DocEntry, DocSection } from './docs-catalog';
import { DOCUMENTATION_DOCS, TUTORIAL_DOCS, getDocEntry } from './docs-catalog';

/** Eager raw imports of markdown files from the repo root and docs/. */
const RAW_MODULES = import.meta.glob<string>(['../../../README.md', '../../../docs/*.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

const ALL_ENTRIES = [...TUTORIAL_DOCS, ...DOCUMENTATION_DOCS];

export function getDocMarkdown(entry: DocEntry): string | null {
  return RAW_MODULES[entry.file] ?? null;
}

export function getDocMarkdownBySlug(section: DocSection, slug: string): string | null {
  const entry = getDocEntry(section, slug);
  if (!entry) return null;
  return getDocMarkdown(entry);
}

/** Map in-doc `.md` links to on-site routes. */
const TUTORIAL_SLUGS = new Set(TUTORIAL_DOCS.map((d) => d.slug));

export function resolveMarkdownHref(href: string): string | null {
  if (!href || href.startsWith('http://') || href.startsWith('https://')) return null;

  const [pathPart, hash = ''] = href.split('#');
  const filename = pathPart.split('/').pop() ?? pathPart;
  if (!filename.endsWith('.md')) return null;

  for (const entry of ALL_ENTRIES) {
    if (entry.file.endsWith(filename) || entry.file === pathPart) {
      const section: DocSection = TUTORIAL_SLUGS.has(entry.slug) ? 'tutorials' : 'documentation';
      return `/${section}/${entry.slug}${hash ? `#${hash}` : ''}`;
    }
  }
  return null;
}
