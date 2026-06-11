/**
 * Gallery sidebar categories — two-level navigation (chart family → chart type)
 * mapped to TEST_GENERATORS keys.
 */
export interface ChartEntry {
  id: string;
  label: string;
  generator: string;
}

export interface ChartCategory {
  id: string;
  label: string;
  /** Short glyph for sidebar scan-ability. */
  glyph: string;
  charts: ChartEntry[];
}

export const CHART_CATEGORIES: ChartCategory[] = [
  {
    id: 'line',
    label: 'Line',
    glyph: '↗',
    charts: [
      { id: 'line-chart', label: 'Line Chart', generator: 'Line Chart' },
      { id: 'bump-chart', label: 'Bump Chart', generator: 'Bump Chart' },
    ],
  },
  {
    id: 'bar',
    label: 'Bar',
    glyph: '▮',
    charts: [
      { id: 'bar-chart', label: 'Bar Chart', generator: 'Bar Chart' },
      { id: 'stacked-bar-chart', label: 'Stacked Bar Chart', generator: 'Stacked Bar Chart' },
      { id: 'grouped-bar-chart', label: 'Grouped Bar Chart', generator: 'Grouped Bar Chart' },
      { id: 'pyramid-chart', label: 'Pyramid Chart', generator: 'Pyramid Chart' },
    ],
  },
  {
    id: 'scatter',
    label: 'Scatter',
    glyph: '·',
    charts: [
      { id: 'scatter-plot', label: 'Scatter Plot', generator: 'Scatter Plot' },
      { id: 'regression', label: 'Regression', generator: 'Regression' },
    ],
  },
  {
    id: 'area',
    label: 'Area',
    glyph: '▲',
    charts: [
      { id: 'area-chart', label: 'Area Chart', generator: 'Area Chart' },
      { id: 'streamgraph', label: 'Streamgraph', generator: 'Streamgraph' },
      { id: 'density-plot', label: 'Density Plot', generator: 'Density Plot' },
    ],
  },
  {
    id: 'circular',
    label: 'Pie & Circular',
    glyph: '◔',
    charts: [
      { id: 'pie-chart', label: 'Pie Chart', generator: 'Pie Chart' },
      { id: 'rose-chart', label: 'Rose Chart', generator: 'Rose Chart' },
      { id: 'radar-chart', label: 'Radar Chart', generator: 'Radar Chart' },
      { id: 'sunburst', label: 'Sunburst', generator: 'ECharts: Sunburst' },
    ],
  },
  {
    id: 'heatmap',
    label: 'Heatmap',
    glyph: '▦',
    charts: [{ id: 'heatmap', label: 'Heatmap', generator: 'Heatmap' }],
  },
  {
    id: 'specialized',
    label: 'Specialized',
    glyph: '✦',
    charts: [
      { id: 'strip-plot', label: 'Strip Plot', generator: 'Strip Plot' },
      { id: 'lollipop-chart', label: 'Lollipop Chart', generator: 'Lollipop Chart' },
      { id: 'waterfall-chart', label: 'Waterfall Chart', generator: 'Waterfall Chart' },
      { id: 'candlestick-chart', label: 'Candlestick Chart', generator: 'Candlestick Chart' },
      { id: 'gauge', label: 'Gauge', generator: 'ECharts: Gauge' },
      { id: 'funnel', label: 'Funnel', generator: 'ECharts: Funnel' },
      { id: 'treemap', label: 'Treemap', generator: 'ECharts: Treemap' },
      { id: 'sankey', label: 'Sankey', generator: 'ECharts: Sankey' },
    ],
  },
  {
    id: 'facet',
    label: 'Facet',
    glyph: '⊞',
    charts: [
      { id: 'facet-columns', label: 'Columns', generator: 'Facet: Columns' },
      { id: 'facet-rows', label: 'Rows', generator: 'Facet: Rows' },
      { id: 'facet-cols-rows', label: 'Cols+Rows', generator: 'Facet: Cols+Rows' },
      { id: 'facet-small', label: 'Small Multiples', generator: 'Facet: Small' },
      { id: 'facet-wrap', label: 'Wrap', generator: 'Facet: Wrap' },
      { id: 'facet-clip', label: 'Clip', generator: 'Facet: Clip' },
      { id: 'facet-overflowed-col', label: 'Overflowed Col', generator: 'Facet: Overflowed Col' },
      { id: 'facet-overflowed-col-row', label: 'Overflowed Col+Row', generator: 'Facet: Overflowed Col+Row' },
      { id: 'facet-overflowed-row', label: 'Overflowed Row', generator: 'Facet: Overflowed Row' },
      { id: 'facet-dense-line', label: 'Dense Line', generator: 'Facet: Dense Line' },
    ],
  },
];

export const DEFAULT_CHART_ID = CHART_CATEGORIES[0]!.charts[0]!.id;

export function findChartEntry(
  chartId: string,
): { category: ChartCategory; chart: ChartEntry } | undefined {
  for (const category of CHART_CATEGORIES) {
    const chart = category.charts.find((c) => c.id === chartId);
    if (chart) return { category, chart };
  }
  return undefined;
}

export function isValidChartId(chartId: string): boolean {
  return findChartEntry(chartId) !== undefined;
}

export function getCategoryFirstChartId(categoryId: string): string | undefined {
  return CHART_CATEGORIES.find((c) => c.id === categoryId)?.charts[0]?.id;
}

/** Flat list of every chart entry in sidebar order. */
export function getAllChartEntries(): Array<{ category: ChartCategory; chart: ChartEntry }> {
  return CHART_CATEGORIES.flatMap((category) =>
    category.charts.map((chart) => ({ category, chart })),
  );
}
