'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function formatNaira(n: number): string {
  return '\u20A6' + n.toLocaleString('en-NG');
}

export default function SalesBarChart({
  labels,
  data,
  color = '#f59e0b',
}: {
  labels: string[];
  data: number[];
  color?: string;
}) {
  const hasData = data.some((v) => v > 0);

  if (!hasData) {
    return <div className="admin-chart-empty">No sales recorded for this period.</div>;
  }

  return (
    <div className="admin-chart-wrap">
      <Bar
        data={{
          labels,
          datasets: [{ label: 'Sales', data, backgroundColor: color, borderRadius: 4, maxBarThickness: 36 }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => formatNaira(ctx.parsed.y ?? 0) } },
          },
          scales: {
            y: { beginAtZero: true, ticks: { callback: (v) => formatNaira(Number(v)) } },
          },
        }}
      />
    </div>
  );
}