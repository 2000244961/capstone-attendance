// Fetch all parents
export async function fetchAllParents() {
  const res = await fetch('/api/user/list?type=parent');
  if (!res.ok) throw new Error('Failed to fetch parents');
  const data = await res.json();
  return data.users || [];
}
// Fetch all teachers
export async function fetchAllTeachers() {
  const res = await fetch('/api/user/list?type=teacher');
  if (!res.ok) throw new Error('Failed to fetch teachers');
  const data = await res.json();
  return data.users || [];
}
// Fetch user profile by id or username
export async function fetchUserProfile(idOrUsername) {
  const res = await fetch(`/api/user/${idOrUsername}`);
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return await res.json();
}
export async function registerUser(user) {
  const res = await fetch('/api/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  if (!res.ok) {
    let errorMsg = 'Failed to register user';
    try {
      const errJson = await res.json();
      errorMsg = errJson.error || errJson.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return await res.json();
}
export async function deleteUser(userId) {
  const res = await fetch(`/api/user/delete/${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    let errorMsg = 'Failed to delete user';
    try {
      const errJson = await res.json();
      errorMsg = errJson.error || errJson.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return await res.json();
}
