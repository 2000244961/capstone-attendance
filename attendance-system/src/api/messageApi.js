// Send a message from admin to all teachers, all parents, or both
export async function sendAdminMessageToMany({ senderId, senderRole, recipientGroup, recipientIds, content, subject }) {
  let users = [];
  if (Array.isArray(recipientIds) && recipientIds.length > 0) {
    // Send to specific users
    // Fetch user info for each id (to get role/type)
    const userResults = await Promise.all(recipientIds.map(async id => {
      const res = await fetch(`/api/user/${id}`);
      if (!res.ok) return null;
      return await res.json();
    }));
    users = userResults.filter(Boolean);
  } else {
    // Fetch all teachers/parents as needed
    if (recipientGroup === 'teachers' || recipientGroup === 'both') {
      const res = await fetch('/api/user/list?type=teacher');
      if (!res.ok) throw new Error('Failed to fetch teachers');
      const { users: teachers } = await res.json();
      users = users.concat(teachers);
    }
    if (recipientGroup === 'parents' || recipientGroup === 'both') {
      const res = await fetch('/api/user/list?type=parent');
      if (!res.ok) throw new Error('Failed to fetch parents');
      const { users: parents } = await res.json();
      users = users.concat(parents);
    }
  }
  // Send message to each user
  const results = await Promise.all(users.map(async user => {
    const body = {
      sender: { id: senderId, role: senderRole },
      recipient: { id: user._id, role: user.type },
      type: 'message',
      subject: subject || '',
      content
    };
    const res = await fetch('/api/message/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) return { error: true, user, message: await res.text() };
    return { error: false, user };
  }));
  return results;
}
// Delete a message by ID
export async function deleteMessage(messageId) {
  const res = await fetch(`/api/message/${messageId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete message');
  return await res.json();
}
// Update message status (approve/decline)
export async function updateMessageStatus(messageId, status) {
  const res = await fetch(`/api/message/${messageId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update message status');
  return await res.json();
}
// api/messageApi.js
// API helpers for inbox and excuse letter features

export async function fetchInbox(userId, role = 'teacher') {
  const res = await fetch(`/api/message/inbox/${userId}?role=${role}`);
  if (!res.ok) throw new Error('Failed to fetch inbox');
  return await res.json();
}

export async function fetchSentMessages(userId) {
  const res = await fetch(`/api/message/sent/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch sent messages');
  return await res.json();
}

// Accepts either (formData, isFormData=true) or (dataObject, isFormData=false/undefined)
export async function sendExcuseLetter(data, isFormData = false) {
  let options = { method: 'POST' };
  if (isFormData) {
    options.body = data;
    // Do not set Content-Type header for FormData; browser will set it with boundary
  } else {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify({
      sender: { id: data.senderId, role: data.senderRole },
      recipient: { id: data.recipientId, role: data.recipientRole },
      type: 'excuse_letter',
      subject: data.subject || '',
      content: data.reason,
      excuseDate: data.excuseDate
    });
  }
  const res = await fetch('/api/message/send', options);
  if (!res.ok) throw new Error('Failed to send excuse letter');
  return await res.json();
}
