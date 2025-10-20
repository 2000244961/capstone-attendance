
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../shared/UserContext';
import '../styles/DashboardTeacher.css';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../shared/useDashboard';
import { useNotifications } from '../shared/hooks/useNotifications';
import NotificationIcon from '../shared/components/NotificationIcon';
import InboxIcon from '../shared/components/InboxIcon';
import NotificationDropdown from '../shared/components/NotificationDropdown';
import AnnouncementForm from '../shared/components/AnnouncementForm';
import AnnouncementList from '../shared/components/AnnouncementList';
import { deleteMessage } from '../api/messageApi';
import { fetchAllParents, fetchAllTeachers } from '../api/userApi';
import { fetchStudents } from '../api/studentApi';
import { fetchTodayAttendanceSummary } from '../api/attendanceApi';


// Today's Attendance Summary component for dashboard overview
function TodayAttendanceSummary({ studentsInSections }) {
	const [summary, setSummary] = useState({ present: 0, absent: 0 });
	useEffect(() => {
		fetchTodayAttendanceSummary()
			.then((data) => {
				setSummary({
					present: data.present || 0,
					absent: data.absent || 0,
				});
			})
			.catch(() => setSummary({ present: 0, absent: 0 }));
	}, []);
	return (
		<div className="dashboard-card redesigned-card" style={{ background: '#e3fcec', border: '2px solid #38a169', marginTop: 24, display: 'flex', gap: 24, justifyContent: 'center' }}>
			<div style={{ textAlign: 'center', minWidth: 120 }}>
				<div style={{ fontSize: 32, color: '#38a169', marginBottom: 8 }}>✅</div>
				<div className="dashboard-card-title">Present Today</div>
				<div className="dashboard-card-value" style={{ color: '#38a169' }}>{summary.present}</div>
				<div className="dashboard-card-desc">Students present today</div>
			</div>
			<div style={{ textAlign: 'center', minWidth: 120 }}>
				<div style={{ fontSize: 32, color: '#ff4757', marginBottom: 8 }}>❌</div>
				<div className="dashboard-card-title">Absent Today</div>
				<div className="dashboard-card-value" style={{ color: '#ff4757' }}>{summary.absent}</div>
				<div className="dashboard-card-desc">Students absent today</div>
			</div>
		</div>
	);
}






// Helper to fetch user info by id
async function fetchUserName(userId) {
	try {
		const res = await fetch(`/api/user/${userId}`);
		if (!res.ok) return userId;
		const user = await res.json();
		return user.fullName || user.username || user.email || userId;
	} catch {
		return userId;
	}
}

function DashboardTeacher() {
	// Hamburger menu state
	const [sidebarOpen, setSidebarOpen] = useState(false);
	// Show/hide send message form
	const [showSendMessage, setShowSendMessage] = useState(false);
	// Inbox view: 'received' or 'sent'
	const [inboxView, setInboxView] = useState('received');
	// Get current user from React context
	const { user: currentUser } = useUser();

	// Inbox messages state (backend-driven, not localStorage)
	const [inboxMessages, setInboxMessages] = useState([]);

	// Track unread inbox messages for teacher (computed from inboxMessages)
	const unreadInboxCount = inboxMessages.filter(msg => msg.status !== 'read' && (!msg.sender || msg.sender.id !== currentUser._id)).length;

	// Removed unreadInboxCount state and useEffect. Now computed from inboxMessages.
		// ...existing code...
			// ...existing code...

		// ...existing code...
	// All state declarations first
	const [profileData, setProfileData] = useState(null);
	const [profileLoading, setProfileLoading] = useState(false);
	const [profileError, setProfileError] = useState(null);
	const [studentsInSections, setStudentsInSections] = useState(0);
	const [subjectsHandled, setSubjectsHandled] = useState(0);
	// Announcement logic
	const [announcementSending, setAnnouncementSending] = useState(false);
	const handleSendAnnouncement = ({ title, message }) => {
		setAnnouncementSending(true);
		// Get existing announcements from localStorage
		const existing = JSON.parse(localStorage.getItem('teacherAnnouncements') || '[]');
		const newAnnouncement = {
			id: Date.now(),
			title,
			message,
			sender: profileData?.fullName || currentUser?.fullName || 'Teacher',
			role: 'parents',
			timestamp: new Date().toISOString(),
		};
		localStorage.setItem('teacherAnnouncements', JSON.stringify([newAnnouncement, ...existing]));
		setAnnouncementSending(false);
	};
// Fetch and count unique subjects handled by teacher (use only subjects if available, else fallback)
useEffect(() => {
	if (!profileData) {
		setSubjectsHandled(0);
		return;
	}
	if (Array.isArray(profileData.subjects) && profileData.subjects.length > 0) {
		// Only count unique subject names from subjects array
		const uniqueSubjects = new Set(profileData.subjects.map(s => s.subjectName || s.name).filter(Boolean));
		setSubjectsHandled(uniqueSubjects.size);
		return;
	}
	// Fallback: try to get from assignedSections only if subjects is empty
	if (Array.isArray(profileData.assignedSections) && profileData.assignedSections.length > 0) {
		const allSubjects = profileData.assignedSections.map(s => s.subjectName || s.name).filter(Boolean);
		const uniqueSubjects = new Set(allSubjects);
		setSubjectsHandled(uniqueSubjects.size);
		return;
	}
	setSubjectsHandled(0);
}, [profileData]);
		// Fetch and count students in teacher's assigned sections
		useEffect(() => {
			async function fetchAndCountStudents() {
				if (!profileData || !Array.isArray(profileData.assignedSections) || profileData.assignedSections.length === 0) {
					setStudentsInSections(0);
					return;
				}
				try {
					const allStudents = await fetchStudents();
					// Normalize students array
					const studentsArr = Array.isArray(allStudents) ? allStudents : (allStudents.students || allStudents.list || []);
					// Get section names or IDs assigned to teacher
					const assignedSectionNames = profileData.assignedSections.map(s => s.sectionName || s.name || s._id || s);
					// Count students whose section matches any assigned section
					const count = studentsArr.filter(stu => assignedSectionNames.includes(stu.section || stu.sectionName || stu.assignedSection || stu.section_id)).length;
					setStudentsInSections(count);
				} catch {
					setStudentsInSections(0);
				}
			}
			fetchAndCountStudents();
		}, [profileData]);

		const [activeSection, setActiveSection] = useState('overview');
		// Fetch teacher profile on mount and when switching to overview
		useEffect(() => {
			if (activeSection === 'overview' || !profileData) {
				fetchProfile();
			}
			// eslint-disable-next-line
		}, [activeSection]);
		const [showProfile, setShowProfile] = useState(false);
		const [inboxLoading, setInboxLoading] = useState(false);
		const [inboxError, setInboxError] = useState(null);

			// Message form state (admin-style)
			const [teacherMessageRecipientType, setTeacherMessageRecipientType] = useState('group'); // 'group' or 'specific'
			const [teacherMessageRecipient, setTeacherMessageRecipient] = useState(''); // group value
			const [teacherMessageSpecificUsers, setTeacherMessageSpecificUsers] = useState([]); // array of user ids
			const [teacherMessageUserSearch, setTeacherMessageUserSearch] = useState("");
			const [showUserDropdown, setShowUserDropdown] = useState(false);
			const [parentList, setParentList] = useState([]);
			const [teacherList, setTeacherList] = useState([]);
			const [userList, setUserList] = useState([]); // merged teacher+parent
			const [messageContent, setMessageContent] = useState("");
			const [messageSending, setMessageSending] = useState(false);
			const [messageError, setMessageError] = useState("");
			const [messageSuccess, setMessageSuccess] = useState("");
		// Sender name mapping state
		const [senderNames, setSenderNames] = useState({});

			// Fetch all parents and teachers for dropdowns
			useEffect(() => {
				Promise.all([
					fetchAllParents().catch(() => []),
					fetchAllTeachers().catch(() => [])
				]).then(([parents, teachers]) => {
					setParentList(parents);
					setTeacherList(teachers);
					setUserList([...teachers, ...parents]);
				});
			}, []);

		// Remove old userSearch/filter logic (now handled by teacherMessageUserSearch and userList)

			// Handler for sending teacher message (admin-style)
			const handleSendTeacherMessage = async (e) => {
				e.preventDefault();
				setMessageError("");
				setMessageSuccess("");
				setMessageSending(true);
				try {
					if (
						(teacherMessageRecipientType === 'group' && !teacherMessageRecipient) ||
						(teacherMessageRecipientType === 'specific' && teacherMessageSpecificUsers.length === 0) ||
						!messageContent.trim()
					) {
						setMessageError("Please select recipient(s) and enter a message.");
						setMessageSending(false);
						return;
					}
					let sentMsg = null;
					if (teacherMessageRecipientType === 'group') {
						const { sendAdminMessageToMany } = await import("../api/messageApi");
						await sendAdminMessageToMany({
							senderId: currentUser._id,
							senderRole: "teacher",
							recipientGroup: teacherMessageRecipient,
							content: messageContent,
							subject: ""
						});
						setMessageSuccess("Message sent to group.");
						sentMsg = {
							_id: 'sent-' + Date.now(),
							sender: { id: currentUser._id, role: 'teacher' },
							recipient: { id: teacherMessageRecipient, role: teacherMessageRecipient },
							type: 'message',
							subject: '',
							content: messageContent,
							status: 'sent',
							createdAt: new Date().toISOString()
						};
					} else {
						// Send to specific users (multi)
						for (const userId of teacherMessageSpecificUsers) {
							const res = await fetch('/api/message/send', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									sender: { id: currentUser._id, role: 'teacher' },
									recipient: { id: userId, role: getUserRoleById(userId) },
									type: 'message',
									subject: '',
									content: messageContent
								})
							});
							if (!res.ok) throw new Error('Failed to send message');
						}
						setMessageSuccess("Message sent to selected users.");
						sentMsg = {
							_id: 'sent-' + Date.now(),
							sender: { id: currentUser._id, role: 'teacher' },
							recipient: { id: teacherMessageSpecificUsers.join(','), role: 'specific' },
							type: 'message',
							subject: '',
							content: messageContent,
							status: 'sent',
							createdAt: new Date().toISOString()
						};
					}
					if (sentMsg) {
						// Persist sent teacher message in localStorage
						try {
							const local = localStorage.getItem('teacherSentMessages');
							let arr = local ? JSON.parse(local) : [];
							arr = [sentMsg, ...arr];
							localStorage.setItem('teacherSentMessages', JSON.stringify(arr));
						} catch {}
						setInboxMessages(prev => [sentMsg, ...prev]);
					}
					setTeacherMessageRecipientType('group');
					setTeacherMessageRecipient('');
					setTeacherMessageSpecificUsers([]);
					setMessageContent('');
				} catch (err) {
					setMessageError(err.message || "Failed to send message");
				} finally {
					setMessageSending(false);
				}
			};

		// Helper to get user role by id from dropdowns
		function getUserRoleById(id) {
			if (parentList.some(p => p._id === id)) return 'parent';
			if (teacherList.some(t => t._id === id)) return 'teacher';
			return '';
		}
		// Fetch sender names when inboxMessages changes
		useEffect(() => {
			const missing = inboxMessages.filter(msg => msg.sender && msg.sender.id && !senderNames[msg.sender.id]);
			if (missing.length > 0) {
				Promise.all(missing.map(msg => fetchUserName(msg.sender.id))).then(names => {
					const updates = {};
					missing.forEach((msg, i) => { updates[msg.sender.id] = names[i]; });
					setSenderNames(prev => ({ ...prev, ...updates }));
				});
			}
		}, [inboxMessages]);
	// Delete message handler for inbox (localStorage or backend)
	const handleDeleteInboxMessage = async (id) => {
		if (!window.confirm('Are you sure you want to delete this message?')) return;
		// Helper to check for valid MongoDB ObjectId
		const isValidObjectId = id => typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id);
		if (!isValidObjectId(id)) {
			// LocalStorage message: remove from localStorage
			try {
				const local = localStorage.getItem('adminSentMessages');
				let arr = local ? JSON.parse(local) : [];
				arr = arr.filter(m => m._id !== id);
				localStorage.setItem('adminSentMessages', JSON.stringify(arr));
			} catch {}
			setInboxMessages(msgs => msgs.filter(m => m._id !== id));
		} else {
			// Backend message: delete via API
			try {
				const { deleteMessage } = await import('../api/messageApi');
				await deleteMessage(id);
				setInboxMessages(msgs => msgs.filter(m => m._id !== id));
			} catch (err) {
				alert('Failed to delete message: ' + err.message);
			}
		}
	};

	const teacherName = currentUser?.fullName || currentUser?.name || currentUser?.username || 'Teacher';
	const teacherPhoto = currentUser?.photo || '';
	const teacherBio = currentUser?.bio || '';

	// State for backend profile (keep only one set of declarations)

	// Fetch teacher profile from backend
	const fetchProfile = useCallback(async () => {
		setProfileLoading(true);
		setProfileError(null);
		try {
			// Try _id, id, then username
			let teacherId = currentUser?._id || currentUser?.id || currentUser?.username;
			// If still undefined, try currentUser._id or currentUser.id from backend
			if (!teacherId && typeof currentUser === 'object') {
				teacherId = currentUser._id || currentUser.id || currentUser.username;
			}
			if (!teacherId) throw new Error('No teacher ID found');
			const res = await fetch(`/api/user/${teacherId}`);
			if (!res.ok) throw new Error('Failed to fetch profile');
			const data = await res.json();
			setProfileData(data);
		} catch (err) {
			setProfileError(err.message);
		} finally {
			setProfileLoading(false);
		}
	}, [currentUser]);

	const navigate = useNavigate();
		const { data: dashboardData, loading, error, refresh } = useDashboardData(30000);
	// (Removed duplicate state declarations for activeSection, showProfile, inboxMessages, inboxLoading, inboxError)

						// Use real MongoDB ObjectId for demo teacher if username fallback is used
								let teacherId = currentUser?._id || currentUser?.id;
								if (!teacherId || typeof teacherId !== 'string' || teacherId.length < 20) {
									// fallback to latest teacher ObjectId from new excuse letters
									teacherId = '68ddaae1cec196f60b186e24';
								}

		// Fetch inbox from backend
		// Keep local sent messages (with _id starting with 'sent-') after refresh
		const fetchInboxMessages = async () => {
			setInboxLoading(true);
			setInboxError(null);
			try {
				const { fetchInbox } = await import('../api/messageApi');
				let data = await fetchInbox(teacherId, 'teacher');
				// Merge admin messages from localStorage
				let adminMessages = [];
				try {
					const local = localStorage.getItem('adminSentMessages');
					if (local) {
						const arr = JSON.parse(local);
						adminMessages = arr.filter(msg =>
							(msg.recipient && msg.recipient.id === teacherId) ||
							(msg.recipientGroup === 'teachers' || msg.recipientGroup === 'both')
						);
					}
				} catch {}
				// Merge teacher sent messages from localStorage
				let teacherSentMessages = [];
				try {
					const local = localStorage.getItem('teacherSentMessages');
					if (local) {
						teacherSentMessages = JSON.parse(local);
					}
				} catch {}
				// Avoid duplicates by _id
				const all = [...teacherSentMessages, ...adminMessages, ...data].filter((msg, idx, arr) =>
					arr.findIndex(m => m._id === msg._id) === idx
				);
				setInboxMessages(all);
			} catch (err) {
				setInboxError(err.message);
				setInboxMessages([]);
			} finally {
				setInboxLoading(false);
			}
		};

		// Mark message as read (localStorage or backend)
		const handleUpdateStatus = async (msgId, status) => {
			// Helper to check for valid MongoDB ObjectId
			const isValidObjectId = id => typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id);
			// Find message in inboxMessages
			const msg = inboxMessages.find(m => m._id === msgId);
			if (!msg) return;
			let approverName = arguments.length > 2 ? arguments[2] : undefined;
			if (!isValidObjectId(msgId)) {
				// LocalStorage message: update status locally
				try {
					const local = localStorage.getItem('adminSentMessages');
					let arr = local ? JSON.parse(local) : [];
					arr = arr.map(m => m._id === msgId ? { ...m, status, approverName: status === 'approved' ? approverName : m.approverName } : m);
					localStorage.setItem('adminSentMessages', JSON.stringify(arr));
				} catch {}
				// Update local state
				setInboxMessages(prev => prev.map(m => m._id === msgId ? { ...m, status, approverName: status === 'approved' ? approverName : m.approverName } : m));
			} else {
				// Backend message: update via API
				try {
					const { updateMessageStatus } = await import('../api/messageApi');
					await updateMessageStatus(msgId, status, approverName);
					// Update local state immediately for responsiveness
					setInboxMessages(prev => prev.map(m => m._id === msgId ? { ...m, status, approverName: status === 'approved' ? approverName : m.approverName } : m));
				} catch (err) {
					alert('Failed to update status: ' + err.message);
				}
			}
		};

		useEffect(() => {
			// Always fetch inbox messages on sign in and when switching to inbox
			if (currentUser && currentUser._id) {
				fetchInboxMessages();
			}
			// Also fetch when switching to inbox section
			if (activeSection === 'inbox') fetchInboxMessages();
			// eslint-disable-next-line
		}, [currentUser, activeSection]);
  
	// Notification system
	const notifications = useNotifications('teacher');

	// Navigation handlers
	const handleManageStudentClick = () => {
		navigate('/manage-student');
	};

	const handleManageAttendanceClick = () => {
		navigate('/manage-attendance');
	};


	const handleManageSubjectSectionClick = () => {
		navigate('/manage-subject-section');
	};

	const handleGoToFaceRecognition = () => {
		navigate('/facial-recognition');
	};

	// Logout handler
	const { setUser } = useUser();
	const handleLogout = () => {
	// Only log out when user clicks the logout button
	setUser(null); // Clear user context and localStorage
	navigate('/');
	};


		return (
			<div className="teacher-dashboard-container admin-dashboard-container">
				   {/* Hamburger button */}
				   <button
					   style={{
						   position: 'fixed',
						   top: 24,
						   left: 24,
						   zIndex: 10001,
						   background: '#010662',
						   color: '#fff',
						   border: 'none',
						   borderRadius: 8,
						   width: 48,
						   height: 48,
						   display: 'flex',
						   alignItems: 'center',
						   justifyContent: 'center',
						   boxShadow: '0 2px 8px rgba(1,6,98,0.10)',
						   cursor: 'pointer',
						   fontSize: 28
					   }}
					   onClick={() => setSidebarOpen(true)}
					   aria-label="Open sidebar"
				   >
					   <span style={{fontSize:32, lineHeight:0.8}}>☰</span>
				   </button>

				   {/* Sidebar drawer */}
				   <aside
					   className="admin-sidebar"
					   style={{
						   position: 'fixed',
						   top: 0,
						   left: sidebarOpen ? 0 : -260,
						   width: 260,
						   height: '100vh',
						   background: '#010662',
						   color: '#fff',
						   zIndex: 10000,
						   boxShadow: sidebarOpen ? '2px 0 16px rgba(1,6,98,0.10)' : 'none',
						   transition: 'left 0.3s',
						   paddingTop: 0
					   }}
				   >
					   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 0 18px' }}>
						   
						   <button
							   style={{ background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', marginLeft: 8 }}
							   onClick={() => setSidebarOpen(false)}
							   aria-label="Close sidebar"
						   >×</button>
					   </div>
					   <nav className="admin-nav" style={{ marginTop: 18 }}>
						   <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
							   <li className={activeSection === 'overview' ? 'active' : ''} onClick={() => { setActiveSection('overview'); setSidebarOpen(false); }} style={{ background: activeSection === 'overview' ? '#fff' : 'transparent', color: activeSection === 'overview' ? '#010662' : '#fff', fontWeight: activeSection === 'overview' ? 700 : 500, borderRadius: 8, margin: '8px 12px', padding: '12px 18px', cursor: 'pointer', transition: 'background 0.2s' }}>
								   🏠 Dashboard Overview
							   </li>
							   <li className={activeSection === 'inbox' ? 'active' : ''} onClick={() => { setActiveSection('inbox'); setSidebarOpen(false); }} style={{ background: activeSection === 'inbox' ? '#fff' : 'transparent', color: activeSection === 'inbox' ? '#010662' : '#fff', fontWeight: activeSection === 'inbox' ? 700 : 500, borderRadius: 8, margin: '8px 12px', padding: '12px 18px', cursor: 'pointer', transition: 'background 0.2s' }}>
								   📥 Inbox {unreadInboxCount > 0 && (
									   <span style={{ color: '#ff4757', fontWeight: 'bold', marginLeft: 6 }}>{unreadInboxCount}</span>
								   )}
							   </li>
							   <li className={activeSection === 'announcement' ? 'active' : ''} onClick={() => { setActiveSection('announcement'); setSidebarOpen(false); }} style={{ background: activeSection === 'announcement' ? '#fff' : 'transparent', color: activeSection === 'announcement' ? '#010662' : '#fff', fontWeight: activeSection === 'announcement' ? 700 : 500, borderRadius: 8, margin: '8px 12px', padding: '12px 18px', cursor: 'pointer', transition: 'background 0.2s' }}>
								   📢 Announcement
							   </li>
							   <li onClick={() => { handleManageAttendanceClick(); setSidebarOpen(false); }} style={{ background: 'transparent', color: '#fff', fontWeight: 500, borderRadius: 8, margin: '8px 12px', padding: '12px 18px', cursor: 'pointer', transition: 'background 0.2s' }}>
								   📝 Attendance
							   </li>
							   {/* Removed Subjects from sidebar */}
							   <li onClick={() => { handleGoToFaceRecognition(); setSidebarOpen(false); }} style={{ background: 'transparent', color: '#fff', fontWeight: 500, borderRadius: 8, margin: '8px 12px', padding: '12px 18px', cursor: 'pointer', transition: 'background 0.2s' }}>
								   🤳 Facial Recognition
							   </li>
						   </ul>
					   </nav>
				   </aside>

				   {/* Overlay when sidebar is open */}
				   {sidebarOpen && (
					   <div
						   style={{
							   position: 'fixed',
							   top: 0,
							   left: 0,
							   width: '100vw',
							   height: '100vh',
							   background: 'rgba(1,6,98,0.18)',
							   zIndex: 9999,
							   transition: 'background 0.2s'
						   }}
						   onClick={() => setSidebarOpen(false)}
					   />
				   )}
				<div className="admin-main-content" style={{ marginLeft: sidebarOpen ? 260 : 0, transition: 'margin-left 0.3s' }}>
					   <header className="admin-header" style={{ paddingRight: 36, background: 'linear-gradient(90deg, #010662 0%, #38b2ac 100%)', color: '#fff', borderBottom: '2px solid #010662', boxShadow: '0 2px 8px rgba(1,6,98,0.08)' }}>
						   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							   <h1 style={{ margin: '10px 0 10px 60px', color: '#fff', fontWeight: 700 }}>Teacher Dashboard</h1>
							   <div className="admin-user-info" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
								   <span className="icon">👤</span>
								   <span className="username" style={{ color: '#fff', fontWeight: 600 }}>{teacherName}</span>
								   <NotificationIcon 
									   unreadCount={notifications.unreadCount}
									   onClick={notifications.toggleNotifications}
									   color="#fff"
								   />
								   <InboxIcon onClick={() => setActiveSection('inbox')} unreadCount={unreadInboxCount} color="#fff" />
								   <button className="dashboard-btn" style={{ background: '#fff', color: '#010662', fontWeight: 700, border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer' }} onClick={() => { setShowProfile(true); fetchProfile(); }}>View Profile</button>
								   <button className="logout-button" style={{ background: '#ff4757', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer' }} onClick={handleLogout}>Logout</button>
							   </div>
						   </div>
					   </header>
					<NotificationDropdown
						notifications={notifications.notifications}
						isOpen={notifications.isOpen}
						onClose={notifications.closeNotifications}
						onMarkAsRead={notifications.markAsRead}
						onMarkAllAsRead={notifications.markAllAsRead}
						onDelete={notifications.deleteNotification}
					/>
					   <div className="admin-content" style={{ background: '#f4f6fa', minHeight: '100vh' }}>
						   {activeSection === 'overview' && (
							   <div className="dashboard-overview-section redesigned-overview">
								   <h2 style={{fontWeight:700, fontSize:28, color:'#010662', marginBottom:24, display:'flex',alignItems:'center',gap:10}}>
									   <span role="img" aria-label="dashboard">📊</span> Dashboard Overview
								   </h2>
								   <div className="dashboard-overview-cards redesigned-cards">
									   <div className="dashboard-card redesigned-card" style={{background:'#e3f2fd', border: '2px solid #010662'}}>
										   <div className="dashboard-card-icon" style={{fontSize:32, color:'#010662', marginBottom:8}}>📚</div>
										<div className="dashboard-card-title">Assigned Subjects</div>
										<div className="dashboard-card-value" style={{color:'#2196F3'}}>{subjectsHandled}</div>
										<div className="dashboard-card-desc">Subjects you handle</div>
									</div>
									   <div className="dashboard-card redesigned-card" style={{background:'#e6fffa', border: '2px solid #010662'}}>
										   <div className="dashboard-card-icon" style={{fontSize:32, color:'#010662', marginBottom:8}}>🏫</div>
										<div className="dashboard-card-title">Assigned Sections</div>
										<div className="dashboard-card-value" style={{color:'#38b2ac'}}>{
											(profileData && Array.isArray(profileData.assignedSections) && profileData.assignedSections.length > 0)
												? profileData.assignedSections.length
												: 0
										}</div>
										<div className="dashboard-card-desc">Sections assigned to you</div>
									</div>
									   <div className="dashboard-card redesigned-card" style={{background:'#fffbea', border: '2px solid #010662'}}>
										   <div className="dashboard-card-icon" style={{fontSize:32, color:'#010662', marginBottom:8}}>👥</div>
										<div className="dashboard-card-title">Total Students</div>
										<div className="dashboard-card-value" style={{color:'#f6ad55'}}>{studentsInSections}</div>
										<div className="dashboard-card-desc">Students you handle</div>
									</div>
									   {/* Removed 'Classes Today' card as requested */}
								</div>
																		{/* Today's Attendance Summary: Present and Absent (using backend summary) */}
																		<TodayAttendanceSummary studentsInSections={studentsInSections} />
							</div>
						)}
								{activeSection === 'inbox' && (
								<div className="inbox-section" style={{maxWidth: '900px', width: '100%', margin: '0 auto', padding: '32px 0'}}>
										<h2 style={{fontWeight: 700, fontSize: 28, color: '#2d3748', display:'flex',alignItems:'center',gap:8}}>
											<span role="img" aria-label="inbox">📥</span> Teacher Inbox
										</h2>
										{/* Toggle buttons for Received/Sent */}
										<div style={{display:'flex',gap:12,marginBottom:16}}>
											<button
												onClick={() => setInboxView('received')}
												style={{
													padding:'8px 18px',
													background: inboxView === 'received' ? '#3182ce' : '#e2e8f0',
													color: inboxView === 'received' ? '#fff' : '#222',
													border:'none',
													borderRadius:6,
													fontWeight:600,
													cursor:'pointer'
												}}
											>
												Received
											</button>
											<button
												onClick={() => setInboxView('sent')}
												style={{
													padding:'8px 18px',
													background: inboxView === 'sent' ? '#3182ce' : '#e2e8f0',
													color: inboxView === 'sent' ? '#fff' : '#222',
													border:'none',
													borderRadius:6,
													fontWeight:600,
													cursor:'pointer'
												}}
											>
												Sent
											</button>
											<div style={{flex:1}} />
											<button onClick={()=>setShowSendMessage(v=>!v)} style={{padding:'8px 18px',background:'#38a169',color:'#fff',border:'none',borderRadius:6,fontWeight:600,cursor:'pointer'}}>
												{showSendMessage ? 'Close' : '+ New Message'}
											</button>
										</div>
														{showSendMessage && (
															<div style={{background:'#fff',borderRadius:10,padding:'18px 24px',boxShadow:'0 2px 8px rgba(33,150,243,0.07)',marginBottom:24}}>
																<h3 style={{marginBottom:12}}>Send Message</h3>
																<form onSubmit={handleSendTeacherMessage} style={{display:'flex',flexDirection:'column',gap:12}}>
																	<div style={{display:'flex',gap:12,alignItems:'center'}}>
																		<label style={{fontWeight:500}}>To:</label>
																		<select value={teacherMessageRecipientType} onChange={e => { setTeacherMessageRecipientType(e.target.value); setTeacherMessageRecipient(''); setTeacherMessageSpecificUsers([]); }} style={{padding:'6px 12px',borderRadius:6}} required>
																			<option value="group">Group</option>
																			<option value="specific">Specific Users</option>
																		</select>
																		{teacherMessageRecipientType === 'group' && (
																			<select value={teacherMessageRecipient} onChange={e => setTeacherMessageRecipient(e.target.value)} style={{padding:'6px 12px',borderRadius:6}} required>
																				<option value="">Select group</option>
																				<option value="teachers">All Teachers</option>
																				<option value="parents">All Parents</option>
																				<option value="both">All Teachers & Parents</option>
																			</select>
																		)}
																		{teacherMessageRecipientType === 'specific' && (
																			<div style={{minWidth:220, position:'relative'}}>
																				<input
																					type="text"
																					placeholder="Search users..."
																					value={teacherMessageUserSearch}
																					onChange={e => {
																						setTeacherMessageUserSearch(e.target.value);
																						setShowUserDropdown(true);
																					}}
																					onFocus={() => setShowUserDropdown(true)}
																					style={{padding:'6px 10px',borderRadius:5,border:'1px solid #ccc',marginBottom:6,width:'100%'}}
																				/>
																				{showUserDropdown && (
																					<div style={{position:'absolute',zIndex:10,top:38,left:0,right:0,maxHeight:140,overflowY:'auto',border:'1px solid #eee',borderRadius:6,background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
																						{userList.filter(u => (u.type === 'teacher' || u.type === 'parent') &&
																							!teacherMessageSpecificUsers.includes(u._id) && (
																								!teacherMessageUserSearch.trim() ||
																								(u.fullName && u.fullName.toLowerCase().includes(teacherMessageUserSearch.trim().toLowerCase())) ||
																								(u.username && u.username.toLowerCase().includes(teacherMessageUserSearch.trim().toLowerCase())) ||
																								(u.email && u.email.toLowerCase().includes(teacherMessageUserSearch.trim().toLowerCase()))
																							)
																						).slice(0,10).map(u => (
																							<div
																								key={u._id}
																								style={{padding:'6px 10px',cursor:'pointer',fontSize:15}}
																								onMouseDown={e => {
																									e.preventDefault();
																									setTeacherMessageSpecificUsers(prev => [...prev, u._id]);
																									setTeacherMessageUserSearch("");
																									setShowUserDropdown(false);
																								}}
																							>
																								{u.fullName || u.username} <span style={{color:'#888',fontSize:13}}>({u.type})</span>
																							</div>
																						))}
																						{userList.filter(u => (u.type === 'teacher' || u.type === 'parent') &&
																							!teacherMessageSpecificUsers.includes(u._id) && (
																								!teacherMessageUserSearch.trim() ||
																								(u.fullName && u.fullName.toLowerCase().includes(teacherMessageUserSearch.trim().toLowerCase())) ||
																								(u.username && u.username.toLowerCase().includes(teacherMessageUserSearch.trim().toLowerCase())) ||
																								(u.email && u.email.toLowerCase().includes(teacherMessageUserSearch.trim().toLowerCase()))
																							)
																						).length === 0 && (
																							<div style={{color:'#aaa',fontSize:14,padding:'6px 10px'}}>No users found.</div>
																						)}
																					</div>
																				)}
																				<div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:6}}>
																					{teacherMessageSpecificUsers.map(id => {
																						const u = userList.find(u => u._id === id);
																						return u ? (
																							<span key={id} style={{background:'#e3f2fd',borderRadius:12,padding:'2px 10px',fontSize:13,display:'inline-flex',alignItems:'center',gap:4}}>
																								{u.fullName || u.username}
																								<button type="button" style={{marginLeft:2,background:'none',border:'none',color:'#ff4757',cursor:'pointer',fontWeight:'bold'}} onClick={() => setTeacherMessageSpecificUsers(prev => prev.filter(i => i !== id))}>×</button>
																							</span>
																						) : null;
																					})}
																				</div>
																			</div>
																		)}
																	</div>
																	<textarea
																		value={messageContent}
																		onChange={e => setMessageContent(e.target.value)}
																		placeholder="Type your message here..."
																		rows={3}
																		style={{padding:'8px 12px',borderRadius:6,border:'1px solid #ccc',resize:'vertical'}}
																		required
																	/>
																	<div style={{display:'flex',gap:12,alignItems:'center'}}>
																		<button type="submit" className="dashboard-btn primary" disabled={messageSending}>
																			{messageSending ? 'Sending...' : 'Send'}
																		</button>
																		{messageError && <span style={{color:'#e53e3e'}}>{messageError}</span>}
																		{messageSuccess && <span style={{color:'#38a169'}}>{messageSuccess}</span>}
																	</div>
																</form>
															</div>
														)}
										<button onClick={fetchInboxMessages} style={{margin:'16px 0',padding:'8px 18px',background:'#3182ce',color:'#fff',border:'none',borderRadius:6,fontWeight:600,cursor:'pointer'}}>Refresh Inbox</button>
										<div style={{background: '#f7fafc', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 24, marginTop: 24}}>
											{inboxLoading ? (
												<div style={{textAlign:'center',color:'#888'}}>Loading...</div>
											) : inboxError ? (
												<div style={{textAlign:'center',color:'#e53e3e'}}>Error: {inboxError}</div>
											) : inboxMessages.length === 0 ? (
												<div style={{textAlign:'center',color:'#888'}}>No messages in your inbox.</div>
											) : (
												<div style={{display:'flex',flexDirection:'column',gap:18}}>
													{inboxMessages
														.filter(msg => {
															const isSent = msg.sender?.id === currentUser._id;
															return inboxView === 'sent' ? isSent : !isSent;
														})
														.map(msg => {
															const isSent = msg.sender?.id === currentUser._id;
															const isExcuse = msg.type === 'excuse_letter';
															const senderName = isSent ? (profileData?.fullName || teacherName) : (msg.sender?.id ? (senderNames[msg.sender.id] || '...') : 'Unknown');
															return (
																<div key={msg._id} style={{
																	background:'#fff',
																	borderRadius:14,
																	padding:'20px 28px',
																	boxShadow:'0 2px 12px rgba(33,150,243,0.08)',
																	textAlign:'left',
																	marginBottom:8,
																	borderLeft: isSent ? '6px solid #3182ce' : '6px solid #38a169',
																	position:'relative',
																	opacity:msg._id && msg._id.toString().startsWith('sent-') ? 0.7 : 1
																}}>
																	<div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
																		<span style={{fontSize:22}}>{isExcuse ? '📄' : (isSent ? '📤' : '📥')}</span>
																		<span style={{fontWeight:700,color:'#2b6cb0',fontSize:18}}>
																			{isExcuse ? 'Excuse Letter' : 'Message'}
																		</span>
																		<span style={{
																			marginLeft:10,
																			background:isSent ? '#e3f2fd' : '#e6fffa',
																			color:isSent ? '#3182ce' : '#38a169',
																			borderRadius:8,
																			fontSize:13,
																			fontWeight:600,
																			padding:'2px 10px',
																			letterSpacing:0.5
																		}}>{isSent ? 'Sent' : 'Received'}</span>
																	</div>
																	<div style={{marginBottom:8,fontSize:15}}>
																		<span style={{color:'#888'}}>{isSent ? 'To: ' : 'From: '}</span>
																		<span style={{color:'#222',fontWeight:500}}>
																			{isSent
																				? (() => {
																					// Show name for group or specific
																					if (msg.recipient?.role === 'specific' && msg.recipient?.id) {
																						// Multiple user ids (comma separated)
																						const ids = msg.recipient.id.split(',');
																						const names = ids.map(id => {
																							const u = userList.find(u => u._id === id);
																							return u ? (u.fullName || u.username || u.email || id) : id;
																						});
																						return names.join(', ');
																					} else if (msg.recipient?.role === 'teachers') {
																						return 'All Teachers';
																					} else if (msg.recipient?.role === 'parents') {
																						return 'All Parents';
																					} else if (msg.recipient?.role === 'both') {
																						return 'All Teachers & Parents';
																					} else if (msg.recipient?.name) {
																						return msg.recipient.name;
																					} else if (msg.recipient?.id) {
																						// Try to resolve single user
																						const u = userList.find(u => u._id === msg.recipient.id);
																						return u ? (u.fullName || u.username || u.email || msg.recipient.id) : msg.recipient.id;
																					} else {
																						return 'Unknown';
																					}
																				})()
																				: senderName}
																		</span>
																	</div>
																	<div style={{fontSize:'1.08rem',color:'#333',marginBottom:10,whiteSpace:'pre-line'}}>{msg.content}
																		{isExcuse && msg.fileUrl && (
																			<div style={{marginTop:8}}>
																				<a href={msg.fileUrl} download style={{color:'#3182ce',fontWeight:600,textDecoration:'underline',fontSize:15}}>
																					📎 Download Excuse Letter Attachment
																				</a>
																			</div>
																		)}
																	</div>
																	<div style={{display:'flex',alignItems:'center',gap:18,marginTop:6}}>
																		<span style={{fontSize:13,color:'#888'}}>
																			{isSent ? 'Sent' : 'Received'}: {new Date(msg.createdAt).toLocaleString()}
																		</span>
																		{msg.status && (
																			<span style={{fontSize:13,color:'#888'}}>
																				Status: <b style={{color:'#2b6cb0'}}>{msg.status}</b>
																			</span>
																		)}
																		{/* Mark as Read button for received, unread messages */}
																		{!isSent && msg.status !== 'read' && (
																			<button onClick={() => handleUpdateStatus(msg._id, 'read')} style={{background:'#38a169',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:600,cursor:'pointer',fontSize:13}}>
																				Mark as Read
																			</button>
																		)}
																		{/* Approve button for excuse letter */}
																		{isExcuse && !isSent && msg.status !== 'approved' && (
																			<button onClick={() => handleUpdateStatus(msg._id, 'approved', profileData?.fullName || teacherName)} style={{background:'#3182ce',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontWeight:600,cursor:'pointer',fontSize:13}}>
																				Approve
																			</button>
																		)}
																	</div>
																	<button onClick={()=>handleDeleteInboxMessage(msg._id)} style={{position:'absolute',top:18,right:18,background:'#fff',color:'#e53e3e',border:'1px solid #e53e3e',borderRadius:6,padding:'4px 12px',fontWeight:600,cursor:'pointer',fontSize:13}}>Delete</button>
																</div>
															);
														})}
												</div>
											)}
										</div>
									</div>
								)}
						{activeSection === 'announcement' && (
							<div className="announcement-section" style={{maxWidth: 600, margin: '0 auto', padding: 32}}>
								<h2 style={{display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 28, color: '#2b6cb0'}}>
									<span role="img" aria-label="announcement">📢</span> Announcements
								</h2>
								<AnnouncementForm onSubmit={handleSendAnnouncement} loading={announcementSending} />
								<AnnouncementList />
							</div>
						)}
				</div>
					{showProfile && (
						<div className="modal-overlay">
							<div className="modal-content">
								<h2 style={{marginBottom:8}}>Teacher Profile</h2>
								<div style={{display:'flex',alignItems:'center',gap:24}}>
									<div>
										{/* Placeholder for photo, can be replaced with real photo field */}
										<div style={{width:100,height:100,borderRadius:'50%',background:'#e3f2fd',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,color:'#2196F3'}}>
											{profileData?.fullName ? profileData.fullName[0] : '👤'}
										</div>
									</div>
									<div>
										<div style={{fontSize:22,fontWeight:600}}>{profileData?.fullName || teacherName}</div>
										<div style={{marginTop:8,color:'#555'}}>Role: Teacher</div>
										<div style={{marginTop:8,color:'#555'}}>Email: {profileData?.email}</div>
										<div style={{marginTop:12}}><strong>Bio:</strong> {profileData?.bio || 'No bio set.'}</div>
										<div style={{marginTop:12}}><strong>Subjects:</strong> {
											(Array.isArray(profileData?.subjects) && profileData.subjects.length)
												? Array.from(new Set(profileData.subjects.map(s => s.subjectName || s.name).filter(Boolean))).join(', ')
												: (Array.isArray(profileData?.assignedSections) && profileData.assignedSections.length)
													? Array.from(new Set(profileData.assignedSections.map(s => s.subjectName || s.name).filter(Boolean))).join(', ')
													: 'None assigned.'
										}</div>
										<div style={{marginTop:12}}><strong>Sections:</strong> {
											Array.isArray(profileData?.assignedSections) && profileData.assignedSections.length
												? profileData.assignedSections.map(s => s.sectionName).join(', ')
												: 'None assigned.'
										}</div>
									</div>
								</div>
								<div style={{marginTop:24,textAlign:'right'}}>
									<button className="dashboard-btn" onClick={() => setShowProfile(false)}>Close</button>
								</div>
							</div>
							<style>{`
								.modal-overlay {
									position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 9999;
								}
								.modal-content {
									background: #fff; padding: 32px 24px; border-radius: 10px; box-shadow: 0 2px 16px rgba(0,0,0,0.15); min-width: 340px; max-width: 95vw;
								}
							`}</style>
						</div>
					)}
				</div>
			</div>
		);
	}
	
// Teacher Overview Component
function TeacherOverview({ dashboardData, onManageStudent, onManageAttendance, onManageSubjects, onFaceRecognition }) {
	const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0, late: 0 });
	useEffect(() => {
		fetchTodayAttendanceSummary().then(setAttendanceSummary).catch(() => setAttendanceSummary({ present: 0, absent: 0, late: 0 }));
	}, []);
	const [showProfile, setShowProfile] = useState(false);
	return (
		<div className="overview-section">
			<h2>📊 Teaching Overview</h2>
			{/* Stats Grid */}
			<div className="teacher-stats-grid">
				<div>
					<div className="teacher-stat-card">
						<h3>Classes Today</h3>
						<p className="stat-number">{dashboardData.todaysClasses}</p>
						<span>{dashboardData.todaysClasses} classes taught</span>
					</div>
					<div className="teacher-stat-card">
						<h3>Students Present</h3>
						<p className="stat-number">{dashboardData.studentsPresent}</p>
						<span>{dashboardData.attendancePercentage}% attendance</span>
					</div>
					<div className="teacher-stat-card">
						<h3>Total Subjects</h3>
						<p className="stat-number">{dashboardData.totalSubjects}</p>
						<span>Subjects managed</span>
					</div>
					<div className="teacher-stat-card">
						<h3>Total Students</h3>
						<p className="stat-number">{dashboardData.totalStudents}</p>
						<span>Students registered</span>
					</div>
				</div>
			</div>
			{/* Quick Actions */}
			<div className="quick-actions">
				<h3>⚡ Quick Actions</h3>
				<div className="action-buttons">
					<button className="action-btn primary" onClick={onFaceRecognition}>
						📷 Start Facial Recognition
					</button>
					<button className="action-btn secondary" onClick={onManageAttendance}>
						📝 Record Attendance
					</button>
					{/* Removed Manage Students quick action from Teacher overview */}
					<button className="action-btn quaternary" onClick={onManageSubjects}>
						📚 Manage Subjects
					</button>
				</div>
			</div>
			{/* Overall Attendance Summary */}
			<div className="overall-attendance-summary" style={{ display: 'flex', gap: '24px', margin: '32px 0' }}>
				<div style={{ background: '#e6fffa', borderRadius: 10, padding: '18px 32px', boxShadow: '0 2px 8px rgba(56,178,172,0.10)', textAlign: 'center', minWidth: 120 }}>
					<div style={{ fontSize: '2rem', color: '#38b2ac', fontWeight: 700 }}>{attendanceSummary.present}</div>
					<div style={{ color: '#38b2ac', fontWeight: 600 }}>Present</div>
				</div>
				<div style={{ background: '#fffbea', borderRadius: 10, padding: '18px 32px', boxShadow: '0 2px 8px rgba(246,173,85,0.10)', textAlign: 'center', minWidth: 120 }}>
					<div style={{ fontSize: '2rem', color: '#f6ad55', fontWeight: 700 }}>{attendanceSummary.late}</div>
					<div style={{ color: '#f6ad55', fontWeight: 600 }}>Late</div>
				</div>
				<div style={{ background: '#ffeaea', borderRadius: 10, padding: '18px 32px', boxShadow: '0 2px 8px rgba(255,71,87,0.10)', textAlign: 'center', minWidth: 120 }}>
					<div style={{ fontSize: '2rem', color: '#ff4757', fontWeight: 700 }}>{attendanceSummary.absent}</div>
					<div style={{ color: '#ff4757', fontWeight: 600 }}>Absent</div>
				</div>
			</div>
			{/* Today's Analytics */}
			<div className="analytics-section">
				<h3>📈 Today's Analytics</h3>
				<div className="analytics-grid">
					<div className="analytics-card">
						<h4>📚 Subject Coverage</h4>
						<p>
							{dashboardData.totalSubjects > 0 
								? `Managing ${dashboardData.totalSubjects} subject${dashboardData.totalSubjects !== 1 ? 's' : ''}`
								: 'No subjects configured yet'
							}
						</p>
					</div>
					<div className="analytics-card">
						<h4>👥 Student Engagement</h4>
						<p>
							{dashboardData.totalStudents > 0 
								? `${dashboardData.studentsPresent} out of ${dashboardData.totalStudents} students attended today`
								: 'No students registered yet'
							}
						</p>
					</div>
					<div className="analytics-card">
						<h4>🎯 Class Status</h4>
						<p>
							{dashboardData.todaysClasses > 0 
								? `${dashboardData.todaysClasses} class${dashboardData.todaysClasses !== 1 ? 'es' : ''} conducted today`
								: 'No classes conducted today'
							}
						</p>
					</div>
				</div>
			</div>
			{/* Recent Activity */}
			<div className="recent-activity">
				<h3>📋 Recent Activity</h3>
				<div className="activity-list">
					<div className="activity-item">
						<div className="activity-icon">📝</div>
						<div className="activity-content">
							<h4>Attendance Recorded</h4>
							<p>Mathematics class - Section A</p>
							<span className="activity-time">2 hours ago</span>
						</div>
					</div>
					<div className="activity-item">
						<div className="activity-icon">👥</div>
						<div className="activity-content">
							<h4>New Student Added</h4>
							<p>John Doe enrolled in Section B</p>
							<span className="activity-time">5 hours ago</span>
						</div>
					</div>
					<div className="activity-item">
						<div className="activity-icon">📚</div>
						<div className="activity-content">
							<h4>Subject Updated</h4>
							<p>Science curriculum updated</p>
							<span className="activity-time">1 day ago</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default DashboardTeacher;
