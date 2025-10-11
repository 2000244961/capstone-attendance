import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../../shared/useDashboard';
import { useNotifications } from '../../../shared/hooks/useNotifications';
import NotificationIcon from '../../../shared/components/NotificationIcon';
import NotificationDropdown from '../../../shared/components/NotificationDropdown';
import ManageSubjectSection from './features/students/pages/ManageSubjectSection';
import '../styles/DashboardAdmin.css';

function DashboardAdmin() {
	const navigate = useNavigate();
	const { data: dashboardData } = useDashboardData(30000);
	const [activeSection, setActiveSection] = useState('overview');
	// Notification system
	const notifications = useNotifications('admin');

	// Announcement form state
	const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
	const [announcementForm, setAnnouncementForm] = useState({
		title: '',
		content: '',
		priority: 'medium',
		targetAudience: 'all'
	});

	// User Management state (teachers only)
	const [users, setUsers] = useState(() => {
		// Load from localStorage or initialize with sample data
		const data = JSON.parse(localStorage.getItem('users'));
		if (data && data.teachers) return { teachers: data.teachers };
		const sample = {
			teachers: [
				{ id: 'T001', name: 'John Smith', email: 'john.smith@spcc.edu', subject: 'Mathematics', status: 'active' },
				{ id: 'T002', name: 'Maria Garcia', email: 'maria.garcia@spcc.edu', subject: 'Science', status: 'active' },
				{ id: 'T003', name: 'Robert Wilson', email: 'robert.wilson@spcc.edu', subject: 'English', status: 'inactive' },
			]
		};
		localStorage.setItem('users', JSON.stringify(sample));
		return sample;
	});
	// Add/Edit User Modal State
	const [showUserForm, setShowUserForm] = useState(false);
	const [userFormType, setUserFormType] = useState('add'); // 'add' or 'edit'
	const [userFormData, setUserFormData] = useState({});
	const [editUserId, setEditUserId] = useState(null);

	// Add/Edit/Delete User Handlers
	const handleAddUser = () => {
		setUserFormType('add');
		setUserFormData({});
		setEditUserId(null);
		setShowUserForm(true);
	};
	const handleEditUser = (user) => {
		setUserFormType('edit');
		setUserFormData(user);
		setEditUserId(user.id);
		setShowUserForm(true);
	};
	const handleDeleteUser = (id) => {
		if (!window.confirm('Are you sure you want to delete this user?')) return;
		const updated = { ...users };
		updated.teachers = users.teachers.filter(u => u.id !== id);
		setUsers(updated);
		localStorage.setItem('users', JSON.stringify(updated));
	};
	const handleUserFormChange = (e) => {
		const { name, value, options } = e.target;
		if (name === 'subject' || name === 'assignedSections') {
			// Multi-select for subjects/sections
			const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
			setUserFormData(prev => ({ ...prev, [name]: selected }));
		} else {
			setUserFormData(prev => ({ ...prev, [name]: value }));
		}
	};
	const handleUserFormSubmit = (e) => {
	// Debug: log raw subject field
	console.log('Raw subject field:', userFormData.subject);
		e.preventDefault();
		// Validate required fields
		if (!userFormData.name || !userFormData.email) {
			alert('Name and Email are required.');
			return;
		}
		// Prepare payload for backend registration
		const subjectsRaw = userFormData.subject;
		const subjectsCleaned = Array.isArray(subjectsRaw)
		  ? subjectsRaw.map(s => typeof s === 'string' ? s : (s.type || s.toString()))
		  : [subjectsRaw].filter(Boolean).map(s => typeof s === 'string' ? s : (s.type || s.toString()));

		const payload = {
			username: userFormData.email,
			password: 'changeme',
			email: userFormData.email,
			type: 'teacher',
			fullName: userFormData.name,
			assignedSections: Array.isArray(userFormData.assignedSections)
				? userFormData.assignedSections.map(section => ({ sectionName: section }))
				: [userFormData.assignedSections].filter(Boolean).map(section => ({ sectionName: section })),
			subjects: subjectsCleaned
		};
		import('./api/userApi').then(({ registerUser }) => {
			registerUser(payload)
				.then(res => {
					let updated = { ...users };
					if (userFormType === 'add') {
						let nextId = 'T' + String(Math.floor(Math.random() * 9000) + 1000);
						updated.teachers = [
							{ id: nextId, ...userFormData, status: 'active' },
							...users.teachers
						];
					} else if (userFormType === 'edit') {
						updated.teachers = users.teachers.map(u =>
							u.id === editUserId ? { ...u, ...userFormData } : u
						);
					}
					setUsers(updated);
					localStorage.setItem('users', JSON.stringify(updated));
					setShowUserForm(false);
					alert(res.message || 'Teacher registered and auto-approved!');
				})
				.catch(err => {
					alert('Registration failed: ' + err.message);
				});
		});
	};

	// Logout handler
	const handleLogout = () => {
		localStorage.removeItem('currentUser');
		const logEntry = {
			id: Date.now().toString(),
			action: 'Admin logout',
			timestamp: new Date().toISOString(),
			admin: 'Administrator',
			type: 'logout'
		};
		const logs = JSON.parse(localStorage.getItem('systemLogs')) || [];
		logs.unshift(logEntry);
		localStorage.setItem('systemLogs', JSON.stringify(logs.slice(0, 1000)));
		navigate('/');
	};

	// Function to create custom announcement
	const createAnnouncement = () => {
		if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
			alert('Please fill in both title and content!');
			return;
		}

		const announcement = {
			id: `ann-${Date.now()}`,
			title: announcementForm.title,
			content: announcementForm.content,
			priority: announcementForm.priority,
			targetAudience: announcementForm.targetAudience,
			createdAt: new Date().toISOString(),
			createdBy: 'admin',
			readBy: []
		};

		const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
		announcements.unshift(announcement);
		localStorage.setItem('announcements', JSON.stringify(announcements));

		// Add notification for admin
		notifications.addNotification({
			title: 'Announcement Created',
			message: `"${announcement.title}" has been published to ${announcement.targetAudience}`,
			priority: announcement.priority
		});

		// Reset form and close
		setAnnouncementForm({
			title: '',
			content: '',
			priority: 'medium',
			targetAudience: 'all'
		});
		setShowAnnouncementForm(false);

		alert(`Announcement "${announcement.title}" has been sent to ${announcement.targetAudience}!`);
	};

	// Sample function to create test announcement (keeping for backward compatibility)
	const createSampleAnnouncement = () => {
		setShowAnnouncementForm(true);
	};

	return (
		<div className="admin-dashboard-container">
			{/* Sidebar */}
			<aside className="admin-sidebar">
				<h2 className="admin-logo">SPCC Admin Portal</h2>
				<nav className="admin-nav">
					<ul>
						<li 
							className={activeSection === 'overview' ? 'active' : ''}
							onClick={() => setActiveSection('overview')}
						>
							📊 Dashboard Overview
						</li>
						<li 
							className={activeSection === 'users' ? 'active' : ''}
							onClick={() => setActiveSection('users')}
						>
							👥 User Management
						</li>
						<li 
							className={activeSection === 'subjectSection' ? 'active' : ''}
							onClick={() => setActiveSection('subjectSection')}
						>
							📚 Manage Subject/Section
						</li>
						<li 
							className={activeSection === 'announcements' ? 'active' : ''}
							onClick={() => setActiveSection('announcements')}
						>
							📢 Announcements
						</li>
						<li 
							className={activeSection === 'reports' ? 'active' : ''}
							onClick={() => setActiveSection('reports')}
						>
							📊 Reports
						</li>
						<li 
							className={activeSection === 'settings' ? 'active' : ''}
							onClick={() => setActiveSection('settings')}
						>
							⚙️ System Settings
						</li>
					</ul>
				</nav>
			</aside>

			{/* Main Content */}
			<main className="admin-main-content">
				<header className="admin-header">
					<h1>Admin Dashboard</h1>
					<div className="admin-top-bar">
						<input type="text" placeholder="Search admin functions..." />
						<div className="admin-user-info">
							<NotificationIcon 
								unreadCount={notifications.unreadCount}
								onClick={notifications.toggleNotifications}
								color="#2196F3"
							/>
							<span className="icon">👤</span>
							<span className="username">Administrator</span>
							<button onClick={handleLogout} className="logout-button">
								Logout
							</button>
						</div>
					</div>
				</header>

				{/* Notification Dropdown */}
				<NotificationDropdown
					notifications={notifications.notifications}
					isOpen={notifications.isOpen}
					onClose={notifications.closeNotifications}
					onMarkAsRead={notifications.markAsRead}
					onMarkAllAsRead={notifications.markAllAsRead}
					onDelete={notifications.deleteNotification}
				/>

				{/* Content */}
				<div className="admin-content">
					{activeSection === 'users' && (
						<div className="user-management-section">
							<h2>User Management</h2>
							<button onClick={handleAddUser}>Add Teacher</button>
							<table>
								<thead>
									<tr>
										<th>Name</th>
										<th>Email</th>
										<th>Subjects</th>
										<th>Sections</th>
										<th>Status</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{users.teachers.map((teacher) => (
										<tr key={teacher.id}>
											<td>{teacher.name}</td>
											<td>{teacher.email}</td>
											<td>{Array.isArray(teacher.subject) ? teacher.subject.join(', ') : teacher.subject}</td>
											<td>{Array.isArray(teacher.assignedSections) ? teacher.assignedSections.join(', ') : teacher.assignedSections}</td>
											<td>{teacher.status}</td>
											<td>
												<button onClick={() => handleEditUser(teacher)}>Edit</button>
												<button onClick={() => handleDeleteUser(teacher.id)}>Delete</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{showUserForm && (
								<div className="user-form-modal">
									<form onSubmit={handleUserFormSubmit}>
										<h3>{userFormType === 'add' ? 'Add Teacher' : 'Edit Teacher'}</h3>
										<input
											type="text"
											name="name"
											placeholder="Full Name"
											value={userFormData.name || ''}
											onChange={handleUserFormChange}
											required
										/>
										<input
											type="email"
											name="email"
											placeholder="Email"
											value={userFormData.email || ''}
											onChange={handleUserFormChange}
											required
										/>
										<input
											type="text"
											name="idNumber"
											placeholder="Employee ID"
											value={userFormData.idNumber || ''}
											onChange={handleUserFormChange}
											required
										/>
										<label>Subjects (select multiple)</label>
										<select
											name="subject"
											multiple
											value={userFormData.subject || []}
											onChange={handleUserFormChange}
											style={{ minHeight: 80 }}
										>
											<option value="Mathematics">Mathematics</option>
											<option value="Science">Science</option>
											<option value="English">English</option>
											<option value="Filipino">Filipino</option>
											<option value="History">History</option>
											<option value="ICT">ICT</option>
											<option value="MAPEH">MAPEH</option>
											<option value="TLE">TLE</option>
											{/* Add more subjects as needed */}
										</select>
										<label>Sections (select multiple)</label>
										<select
											name="assignedSections"
											multiple
											value={userFormData.assignedSections || []}
											onChange={handleUserFormChange}
											style={{ minHeight: 80 }}
										>
											<option value="A1">A1</option>
											<option value="B2">B2</option>
											<option value="C3">C3</option>
											<option value="D4">D4</option>
											{/* Add more sections as needed */}
										</select>
										<button type="submit">{userFormType === 'add' ? 'Add' : 'Update'}</button>
										<button type="button" onClick={() => setShowUserForm(false)}>Cancel</button>
									</form>
								</div>
							)}
						</div>
					)}
					{activeSection === 'subjectSection' && (
						<ManageSubjectSection />
					)}
					{/* ...existing code for other sections... */}
				</div>
			</main>
		</div>
	);
}

export default DashboardAdmin;
// ...existing code up to the first export default DashboardAdmin;
