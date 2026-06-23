import type { DocEntry, DocSection } from './docs-catalog';
import { getDocsForSection, getDocEntry } from './docs-catalog';

/** Eager raw imports of markdown files from the repo root and docs/. */
const RAW_MODULES = import.meta.glob<string>(
  ['../../../README.md', '../../../docs/*.md', '../../../docs/tutorials/*.md'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
);
// Tutorials: getting-started, data-story, agent-workflows, exploring-data, chart-sizing.

/** Doc figures under docs/figs/ — resolved to bundled asset URLs. Images only;
 * non-image assets (e.g. the paper PDF) are linked externally, not bundled. */
const FIGURE_MODULES = import.meta.glob<string>(
  ['../../../docs/figs/**/*.{png,jpg,jpeg,gif,svg,webp,avif}'],
  {
    query: '?url',
    import: 'default',
    eager: true,
  },
);

/** Chart icons under site/src/assets/chart-icons/ — used by the reference docs. */
const ICON_MODULES = import.meta.glob<string>(['../assets/chart-icons/*.svg'], {
  query: '?url',
  import: 'default',
  eager: true,
});

const ALL_ENTRIES = getDocsForSection('documentation');

export function getDocMarkdown(entry: DocEntry): string | null {
  return RAW_MODULES[entry.file] ?? null;
}

export function getDocMarkdownBySlug(section: DocSection, slug: string): string | null {
  const entry = getDocEntry(section, slug);
  if (!entry) return null;
  return getDocMarkdown(entry);
}

/** Resolve relative image paths in docs markdown (e.g. figs/overview.png). */
export function resolveMarkdownImageSrc(src: string): string | null {
  const normalized = src.replace(/^\.\//, '');
  for (const [path, url] of Object.entries(FIGURE_MODULES)) {
    if (path.endsWith(`/${normalized}`) || path.endsWith(normalized)) {
      return url;
    }
  }
  for (const [path, url] of Object.entries(ICON_MODULES)) {
    if (path.endsWith(`/${normalized}`) || path.endsWith(normalized)) {
      return url;
    }
  }
  return null;
}

/** Map in-doc `.md` links to on-site routes. */
export function resolveMarkdownHref(href: string): string | null {
  if (!href || href.startsWith('http://') || href.startsWith('https://')) return null;

  const [pathPart, hash = ''] = href.split('#');
  const filename = pathPart.split('/').pop() ?? pathPart;
  if (!filename.endsWith('.md')) return null;

  for (const entry of ALL_ENTRIES) {
    if (entry.file.endsWith(filename) || entry.file === pathPart) {
      return `/documentation/${entry.slug}${hash ? `#${hash}` : ''}`;
    }
  }
  return null;
}
