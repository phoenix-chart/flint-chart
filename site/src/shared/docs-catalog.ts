export type DocSection = 'tutorials' | 'documentation';

export interface DocEntry {
  slug: string;
  title: string;
  description: string;
  /** Path relative to site/ — resolved by Vite raw import glob. */
  file: string;
}

export const TUTORIAL_DOCS: DocEntry[] = [
  {
    slug: 'quick-start',
    title: 'Quick start',
    description: 'Install flint-chart and render your first chart across backends.',
    file: '../../../README.md',
  },
  {
    slug: 'adding-a-chart-template',
    title: 'Adding a chart template',
    description: 'Step-by-step guide to authoring a new chart template.',
    file: '../../../docs/adding-a-chart-template.md',
  },
];

export const DOCUMENTATION_DOCS: DocEntry[] = [
  {
    slug: 'overview',
    title: 'Overview',
    description: 'Problem statement, architecture, and public API reference.',
    file: '../../../docs/README.md',
  },
  {
    slug: 'semantic-types',
    title: 'Semantic types',
    description: 'T0 / T1 / T2 type system and compilation context.',
    file: '../../../docs/design-semantics.md',
  },
  {
    slug: 'layout-model',
    title: 'Layout model',
    description: 'Spring and gas-pressure sizing models for axes and facets.',
    file: '../../../docs/design-stretch-model.md',
  },
  {
    slug: 'color-decisions',
    title: 'Color decisions',
    description: 'How semantic types drive color scheme recommendations.',
    file: '../../../docs/color-decisions-summary.md',
  },
  {
    slug: 'adding-a-semantic-type',
    title: 'Adding a semantic type',
    description: 'Extend the type registry with a new field semantic type.',
    file: '../../../docs/adding-a-semantic-type.md',
  },
  {
    slug: 'adding-a-backend',
    title: 'Adding a backend',
    description: 'Wire a new rendering backend into the compile pipeline.',
    file: '../../../docs/adding-a-backend.md',
  },
  {
    slug: 'development',
    title: 'Development',
    description: 'Local setup, repo layout, and contributor commands.',
    file: '../../../docs/DEVELOPMENT.md',
  },
];

export function getDocsForSection(section: DocSection): DocEntry[] {
  return section === 'tutorials' ? TUTORIAL_DOCS : DOCUMENTATION_DOCS;
}

export function getDocEntry(section: DocSection, slug: string): DocEntry | undefined {
  return getDocsForSection(section).find((d) => d.slug === slug);
}

export function sectionTitle(section: DocSection): string {
  return section === 'tutorials' ? 'Tutorials' : 'Documentation';
}
