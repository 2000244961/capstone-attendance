import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AttendanceBarGraph({ present, absent }) {
  const data = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        label: 'Today',
        data: [present, absent],
        backgroundColor: ['#38a169', '#ff4757'],
        borderColor: ['#2f855a', '#c53030'],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { display: false } },
    },
  };

  return (
    <div style={{ width: '100%', maxWidth: 220, margin: '0 auto' }}>
      <Bar data={data} options={options} />
    </div>
  );
}
