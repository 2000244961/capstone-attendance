// subjectSectionApi.js
// API helper for subject/section management

export async function fetchSubjectSections() {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/subjectSection/list`);
  if (!res.ok) throw new Error('Failed to fetch subject/sections');
  return await res.json();
}

export async function addSubjectSection(data) {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/subjectSection/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add subject/section');
  return await res.json();
}

export async function updateSubjectSection(id, data) {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/subjectSection/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update subject/section');
  return await res.json();
}

export async function deleteSubjectSection(id) {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/subjectSection/delete/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete subject/section');
  return await res.json();
}
