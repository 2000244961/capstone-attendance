// Basic attendance API for ManageAttendance
export async function fetchAttendance() {
  const response = await fetch('/api/attendance');
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
