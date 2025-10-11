// Mark a message as read by ID
export async function markMessageAsRead(messageId) {
  const res = await fetch(`/api/message/${messageId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'read' })
  });
  if (!res.ok) throw new Error('Failed to mark message as read');
  return await res.json();
}
