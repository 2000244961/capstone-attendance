import { fetchSentMessages as originalFetchSentMessages } from './messageApi';

export async function fetchSentMessagesWithRole(userId, role) {
  // This function will call the backend with the role query param
  const res = await fetch(`/api/message/sent/${userId}?role=${role}`);
  if (!res.ok) throw new Error('Failed to fetch sent messages');
  return await res.json();
}
