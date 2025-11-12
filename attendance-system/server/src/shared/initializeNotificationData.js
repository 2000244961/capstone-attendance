// Initialize sample announcements for testing notification system
const initializeSampleData = () => {
  // Check if announcements already exist
  const existingAnnouncements = localStorage.getItem('announcements');
  
  if (!existingAnnouncements) {
    const sampleAnnouncements = [
      {
        id: 'ann-1',
        title: 'New Academic Year Guidelines',
        content: 'Please review the updated guidelines for the new academic year. All students and parents are advised to follow the new protocols.',
        priority: 'high',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        createdBy: 'admin',
        readBy: [] // Track which roles have read this
      },
      {
        id: 'ann-2',
        title: 'Parent-Teacher Meeting Schedule',
        content: 'Parent-teacher meetings will be held next week. Please check your schedule and confirm attendance.',
        priority: 'medium',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        createdBy: 'admin',
        readBy: []
      },
      {
        id: 'ann-3',
        title: 'Holiday Announcement',
        content: 'School will be closed on Friday for the national holiday. Classes will resume on Monday.',
        priority: 'medium',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        createdBy: 'admin',
        readBy: []
      }
    ];
    
    localStorage.setItem('announcements', JSON.stringify(sampleAnnouncements));
  }

  // Initialize some system notifications
  const existingSystemNotifications = localStorage.getItem('systemNotifications');
  
  if (!existingSystemNotifications) {
    const systemNotifications = [
      {
        id: 'sys-1',
        title: 'System Maintenance',
        message: 'Scheduled maintenance completed successfully',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        priority: 'low',
        readBy: []
      },
      {
        id: 'sys-2',
        title: 'Database Backup',
        message: 'Daily database backup completed',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        priority: 'low',
        readBy: []
      }
    ];
    
    localStorage.setItem('systemNotifications', JSON.stringify(systemNotifications));
  }

  // Initialize role-specific notifications
  const roles = ['admin', 'teacher', 'parent'];
  
  roles.forEach(role => {
    const existingRoleNotifications = localStorage.getItem(`${role}Notifications`);
    
    if (!existingRoleNotifications) {
      const roleNotifications = [
        {
          id: `${role}-1`,
          title: `Welcome to ${role.charAt(0).toUpperCase() + role.slice(1)} Portal`,
          message: `You have successfully logged into the ${role} dashboard`,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          priority: 'medium',
          isRead: false
        }
      ];
      
      localStorage.setItem(`${role}Notifications`, JSON.stringify(roleNotifications));
    }
  });
};

// Auto-initialize when this file is imported
initializeSampleData();

export { initializeSampleData };
