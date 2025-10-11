// Fetch today's attendance summary for the whole school (all teachers)
export async function fetchTodayAttendanceSummaryAll() {
  const res = await fetch('/api/attendance/today?all=true');
  if (!res.ok) throw new Error('Failed to fetch today\'s attendance summary (all)');
  return await res.json();
}
// Fetch today's attendance summary from the backend
export async function fetchTodayAttendanceSummary() {
  const res = await fetch('/api/attendance/today');
  if (!res.ok) throw new Error('Failed to fetch today\'s attendance summary');
  return await res.json();
}
