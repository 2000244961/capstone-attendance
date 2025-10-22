// Fetch attendance summary grouped by section for a given date (or today if not specified)
export async function fetchAttendanceBySection(date) {
  let url = '/api/attendance/sections';
  if (date) {
    url += `?date=${encodeURIComponent(date)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch attendance by section');
  return await res.json();
}
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
