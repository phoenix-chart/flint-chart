export interface Example {
  name: string;
  input: any;
}

export const EXAMPLES: Example[] = [
  {
    name: 'Scatter — weight × mpg, color = origin',
    input: {
      data: {
        values: [
          { weight: 1.6, mpg: 32, origin: 'JP' },
          { weight: 2.1, mpg: 27, origin: 'US' },
          { weight: 1.9, mpg: 29, origin: 'EU' },
          { weight: 2.3, mpg: 24, origin: 'US' },
          { weight: 1.4, mpg: 35, origin: 'JP' },
          { weight: 1.8, mpg: 30, origin: 'EU' },
        ],
      },
      semantic_types: { weight: 'Quantity', mpg: 'Quantity', origin: 'Country' },
      chart_spec: {
        chartType: 'Scatter Plot',
        encodings: {
          x: { field: 'weight' },
          y: { field: 'mpg' },
          color: { field: 'origin' },
        },
        canvasSize: { width: 480, height: 320 },
      },
    },
  },
  {
    name: 'Bar — revenue by quarter',
    input: {
      data: {
        values: [
          { quarter: 'Q1', revenue: 1200 },
          { quarter: 'Q2', revenue: 1450 },
          { quarter: 'Q3', revenue: 980 },
          { quarter: 'Q4', revenue: 1800 },
        ],
      },
      semantic_types: { quarter: 'Quarter', revenue: 'Price' },
      chart_spec: {
        chartType: 'Bar Chart',
        encodings: { x: { field: 'quarter' }, y: { field: 'revenue' } },
        canvasSize: { width: 480, height: 320 },
      },
    },
  },
  {
    name: 'Line — temperature over time',
    input: {
      data: {
        values: [
          { day: '2025-01-01', temp: 12 },
          { day: '2025-01-02', temp: 14 },
          { day: '2025-01-03', temp: 11 },
          { day: '2025-01-04', temp: 15 },
          { day: '2025-01-05', temp: 17 },
          { day: '2025-01-06', temp: 13 },
          { day: '2025-01-07', temp: 10 },
        ],
      },
      semantic_types: { day: 'Date', temp: 'Temperature' },
      chart_spec: {
        chartType: 'Line Chart',
        encodings: { x: { field: 'day' }, y: { field: 'temp' } },
        canvasSize: { width: 520, height: 280 },
      },
    },
  },
];
