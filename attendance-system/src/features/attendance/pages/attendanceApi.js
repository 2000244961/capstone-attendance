// Basic attendance API for ManageAttendance

// Fetch attendance records with optional date and section filters
export async function fetchAttendance({ date, section } = {}) {
  let url = '/api/attendance';
  const params = [];
  if (date) params.push(`date=${encodeURIComponent(date)}`);
  if (section) params.push(`section=${encodeURIComponent(section)}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch attendance');
  return response.json();
}

export async function deleteAttendance(id) {
  const response = await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete attendance');
  return response.json();
}

export async function updateAttendance(id, data) {
  const response = await fetch(`/api/attendance/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update attendance');
  return response.json();
}

export async function addAttendance(record) {
  const response = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  if (!response.ok) throw new Error('Failed to add attendance');
  return response.json();
}