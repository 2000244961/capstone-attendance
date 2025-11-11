// subjectSectionApi.js
// API helper for subject/section management

export async function fetchSubjectSections() {
  const apiUrl = process.env.REACT_APP_API_URL || '';
  const res = await fetch(`${apiUrl}/api/subjectSection/list`);
  if (!res.ok) throw new Error('Failed to fetch subject/sections');
  return await res.json();
}
