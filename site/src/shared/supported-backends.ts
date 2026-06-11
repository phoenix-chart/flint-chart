import {
  cjsGetTemplateDef,
  ecGetTemplateDef,
  vlGetTemplateDef,
} from 'flint-chart';

export type PreviewBackend = 'vegalite' | 'echarts' | 'chartjs';

export const ALL_BACKENDS: PreviewBackend[] = ['vegalite', 'echarts', 'chartjs'];

export const BACKEND_LABELS: Record<PreviewBackend, string> = {
  vegalite: 'Vega-Lite',
  echarts: 'ECharts',
  chartjs: 'Chart.js',
};

/** Backends that have a registered template for the given chart type. */
export function getSupportedBackends(chartType: string): PreviewBackend[] {
  return ALL_BACKENDS.filter((backend) => {
    if (backend === 'vegalite') return !!vlGetTemplateDef(chartType);
    if (backend === 'echarts') return !!ecGetTemplateDef(chartType);
    return !!cjsGetTemplateDef(chartType);
  });
}
