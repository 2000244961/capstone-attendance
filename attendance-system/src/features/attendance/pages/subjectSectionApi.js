// subjectSectionApi.js
// API helper for subject/section management

export async function fetchSubjectSections() {
  const res = await fetch('/api/subjectSection/list');
  if (!res.ok) throw new Error('Failed to fetch subject/sections');
  return await res.json();
}
