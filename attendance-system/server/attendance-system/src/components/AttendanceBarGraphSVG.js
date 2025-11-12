import React from 'react';

export default function AttendanceBarGraphSVG({ present, absent }) {
  const max = Math.max(present, absent, 1);
  const barHeight = 80;
  return (
    <svg width="100%" height={barHeight + 40} viewBox={`0 0 220 ${barHeight + 40}`} style={{ display: 'block', margin: '0 auto' }}>
      {/* Present Bar */}
      <rect x="30" y={barHeight - (present / max) * barHeight + 20} width="60" height={(present / max) * barHeight} fill="#38b2ac" rx="8" />
      <text x="60" y={barHeight + 35} textAnchor="middle" fontSize="15" fill="#010662">Present</text>
      <text x="60" y={barHeight - (present / max) * barHeight + 12} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#222">{present}</text>
      {/* Absent Bar */}
      <rect x="130" y={barHeight - (absent / max) * barHeight + 20} width="60" height={(absent / max) * barHeight} fill="#ff4757" rx="8" />
      <text x="160" y={barHeight + 35} textAnchor="middle" fontSize="15" fill="#010662">Absent</text>
      <text x="160" y={barHeight - (absent / max) * barHeight + 12} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#222">{absent}</text>
    </svg>
  );
}
