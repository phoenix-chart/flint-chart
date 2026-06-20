export type DocSection = 'documentation';

export interface DocEntry {
  slug: string;
  title: string;
  description: string;
  /** Path relative to site/ — resolved by Vite raw import glob. */
  file: string;
}

export interface DocGroup {
  id: string;
  label: string;
  docs: DocEntry[];
}

export const DOCUMENTATION_GROUPS: DocGroup[] = [
  {
    id: 'quick-start',
    label: 'Quick start',
    docs: [
      {
        slug: 'getting-started',
        title: 'Getting started',
        description:
          'Build your first chart — data, semantic types, encodings, aggregation, and backends.',
        file: '../../../docs/tutorials/getting-started.md',
      },
      {
        slug: 'exploring-data',
        title: 'Exploring data',
        description:
          'Swap fields, change chart types, and compare Vega-Lite, ECharts, and Chart.js.',
        file: '../../../docs/tutorials/exploring-data.md',
      },
      {
        slug: 'chart-sizing',
        title: 'Chart sizing demo',
        description:
          'See how canvasSize, stretch, and data density affect chart dimensions.',
        file: '../../../docs/tutorials/chart-sizing.md',
      },
    ],
  },
  {
    id: 'introduction',
    label: 'Introduction',
    docs: [
      {
        slug: 'overview',
        title: 'Overview',
        description: 'Problem, dataSpec + chartSpec, compiler output, and doc map.',
        file: '../../../docs/overview.md',
      },
      {
        slug: 'architecture',
        title: 'Architecture',
        description: 'Three-stage pipeline, design principles, and repo layout.',
        file: '../../../docs/architecture.md',
      },
      {
        slug: 'semantic-types',
        title: 'Semantic Type',
        description: 'Type hierarchy, annotations, compilation pipeline, and resolution rules.',
        file: '../../../docs/design-semantics.md',
      },
      {
        slug: 'layout-model',
        title: 'Auto Layout Algorithm',
        description: 'Spring, gas-pressure, radial, and area sizing models.',
        file: '../../../docs/design-stretch-model.md',
      },
      {
        slug: 'api-reference',
        title: 'API reference',
        description: 'ChartAssemblyInput, assemblers, encodings, options, and exports.',
        file: '../../../docs/api-reference.md',
      },
      // {
      //   slug: 'color-decisions',
      //   title: 'Color decisions',
      //   description: 'Scheme families, ColorDecision, and per-backend palette selection.',
      //   file: '../../../docs/color-decisions.md',
      // },
    ],
  },
  {
    id: 'reference',
    label: 'Chart reference',
    docs: [
      {
        slug: 'reference-vegalite',
        title: 'Vega-Lite charts',
        description: 'Every Vega-Lite chart type, its channels, and configurable parameters.',
        file: '../../../docs/reference-vegalite.md',
      },
      {
        slug: 'reference-echarts',
        title: 'ECharts charts',
        description: 'Every ECharts chart type, its channels, and configurable parameters.',
        file: '../../../docs/reference-echarts.md',
      },
      {
        slug: 'reference-chartjs',
        title: 'Chart.js charts',
        description: 'Every Chart.js chart type, its channels, and configurable parameters.',
        file: '../../../docs/reference-chartjs.md',
      },
    ],
  },
  {
    id: 'extending',
    label: 'Development',
    docs: [
      {
        slug: 'development',
        title: 'Development guide',
        description: 'Monorepo setup, daily commands, and test strategy.',
        file: '../../../docs/DEVELOPMENT.md',
      },
      {
        slug: 'adding-a-semantic-type',
        title: 'Extending semantic types',
        description: 'Register in type-registry.ts, sync constants, and verify in the gallery.',
        file: '../../../docs/adding-a-semantic-type.md',
      },
      {
        slug: 'adding-a-backend',
        title: 'Extending backends',
        description: 'Assembler skeleton, core pipeline contract, packaging, and gallery wiring.',
        file: '../../../docs/adding-a-backend.md',
      },
      {
        slug: 'adding-a-chart-template',
        title: 'Extending chart templates',
        description: 'ChartTemplateDef, instantiate hook, registry, and test generators.',
        file: '../../../docs/adding-a-chart-template.md',
      },
    ],
  },
];

export function getDocGroups(_section: DocSection): DocGroup[] {
  return DOCUMENTATION_GROUPS;
}

export function getDocsForSection(section: DocSection): DocEntry[] {
  return getDocGroups(section).flatMap((g) => g.docs);
}

export function getDocEntry(section: DocSection, slug: string): DocEntry | undefined {
  return getDocsForSection(section).find((d) => d.slug === slug);
}
