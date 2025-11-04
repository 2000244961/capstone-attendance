// Dummy studentApi for build
// Real studentApi for backend connection
export async function fetchStudents() {
	const res = await fetch('/api/students/list');
	if (!res.ok) throw new Error('Failed to fetch students');
	return await res.json();
}

export async function addStudent(student) {
	const res = await fetch('/api/students/add', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(student)
	});
	if (!res.ok) throw new Error('Failed to add student');
	return await res.json();
}

export async function updateStudent(student) {
	const res = await fetch(`/api/students/update/${student._id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(student)
	});
	if (!res.ok) throw new Error('Failed to update student');
	return await res.json();
}

export async function deleteStudent(id) {
	const res = await fetch(`/api/students/delete/${id}`, {
		method: 'DELETE'
	});
	if (!res.ok) throw new Error('Failed to delete student');
	return await res.json();
}
