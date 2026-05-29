/**
 * Gallery sidebar categories — maps ECharts-style chart families to
 * TEST_GENERATORS keys (single source of truth for navigation).
 */
export interface ChartCategory {
  id: string;
  label: string;
  /** Short glyph for sidebar scan-ability (ECharts-style icon slot). */
  glyph: string;
  generators: string[];
}

export const CHART_CATEGORIES: ChartCategory[] = [
  {
    id: 'line',
    label: 'Line',
    glyph: '↗',
    generators: [
      'Line Chart',
      'Dotted Line Chart',
      'Bump Chart',
      'Gallery: Regional Survey: Line',
      'Gallery: Omni: Line',
      'Facet: Dense Line',
    ],
  },
  {
    id: 'bar',
    label: 'Bar',
    glyph: '▮',
    generators: [
      'Bar Chart',
      'Stacked Bar Chart',
      'Grouped Bar Chart',
      'Gallery: Regional Survey: Bar',
      'Gallery: Regional Survey: Stacked Bar',
      'Gallery: Regional Survey: Grouped Bar',
      'Gallery: Omni: Grouped Bar',
    ],
  },
  {
    id: 'scatter',
    label: 'Scatter',
    glyph: '·',
    generators: ['Scatter Plot', 'Regression', 'Gallery: Regional Survey: Scatter'],
  },
  {
    id: 'area',
    label: 'Area',
    glyph: '▲',
    generators: [
      'Area Chart',
      'Streamgraph',
      'Gallery: Regional Survey: Area',
      'Line/Area Stretch',
    ],
  },
  {
    id: 'distribution',
    label: 'Distribution',
    glyph: '▤',
    generators: [
      'Histogram',
      'Boxplot',
      'Density Plot',
      'Strip Plot',
      'Gallery: Regional Survey: Histogram',
    ],
  },
  {
    id: 'heatmap',
    label: 'Heatmap',
    glyph: '▦',
    generators: ['Heatmap', 'Gallery: Omni: Heatmap'],
  },
  {
    id: 'circular',
    label: 'Pie & Circular',
    glyph: '◔',
    generators: [
      'Pie Chart',
      'Rose Chart',
      'Radar Chart',
      'Pyramid Chart',
      'Gallery: Regional Survey: Pie',
      'Gallery: Regional Survey: Radar',
      'Gallery: Regional Survey: Rose',
    ],
  },
  {
    id: 'specialized',
    label: 'Specialized',
    glyph: '✦',
    generators: [
      'Lollipop Chart',
      'Waterfall Chart',
      'Candlestick Chart',
      'Ranged Dot Plot',
      'Custom Charts',
      'Gallery: Omni: Waterfall',
      'Gallery: Omni: Sunburst',
    ],
  },
  {
    id: 'facet',
    label: 'Facet',
    glyph: '⊞',
    generators: [
      'Facet: Columns',
      'Facet: Rows',
      'Facet: Cols+Rows',
      'Facet: Small',
      'Facet: Wrap',
      'Facet: Clip',
      'Facet: Overflowed Col',
      'Facet: Overflowed Col+Row',
      'Facet: Overflowed Row',
    ],
  },
  {
    id: 'dates',
    label: 'Dates & Time',
    glyph: '◷',
    generators: [
      'Dates: Year',
      'Dates: Month',
      'Dates: Year-Month',
      'Dates: Decade',
      'Dates: Date/DateTime',
      'Dates: Hours',
    ],
  },
  {
    id: 'semantics',
    label: 'Semantics & Layout',
    glyph: '◎',
    generators: [
      'Semantic Context',
      'Snap-to-Bound',
      'Discrete Axis Sizing',
      'Overflow',
      'Elasticity & Stretch',
      'Gas Pressure (§2)',
    ],
  },
];

/** Generators not covered by primary categories (backend-specific suites). */
export const BACKEND_GENERATORS: string[] = [
  'ECharts: Scatter',
  'ECharts: Line',
  'ECharts: Bar',
  'ECharts: Stacked Bar',
  'ECharts: Grouped Bar',
  'ECharts: Area',
  'ECharts: Pie',
  'ECharts: Heatmap',
  'ECharts: Histogram',
  'ECharts: Boxplot',
  'ECharts: Radar',
  'ECharts: Candlestick',
  'ECharts: Streamgraph',
  'ECharts: Facet Small',
  'ECharts: Facet Wrap',
  'ECharts: Facet Clip',
  'ECharts: Rose',
  'ECharts: Stress Tests',
  'ECharts: Gauge',
  'ECharts: Funnel',
  'ECharts: Treemap',
  'ECharts: Sunburst',
  'ECharts: Sankey',
  'ECharts: Unique Stress',
  'Chart.js: Scatter',
  'Chart.js: Line',
  'Chart.js: Bar',
  'Chart.js: Stacked Bar',
  'Chart.js: Grouped Bar',
  'Chart.js: Area',
  'Chart.js: Pie',
  'Chart.js: Histogram',
  'Chart.js: Radar',
  'Chart.js: Rose',
  'Chart.js: Stress Tests',
  'GoFish Basic',
];
