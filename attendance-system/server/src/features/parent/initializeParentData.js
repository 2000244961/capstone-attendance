// Initialize sample parent data for the attendance system
export const initializeParentData = () => {
  // Sample parents data
  const sampleParents = [
    {
      id: 'PAR001',
      name: 'John Parent',
      email: 'parent',
      phone: '+1-555-0123',
      children: ['STU001', 'STU002'],
      address: '123 Main St, City, State 12345',
      emergencyContact: '+1-555-0124'
    }
  ];

  // Sample students data (children of parents)
  const sampleStudents = [
    {
      id: 'STU001',
      studentId: 'STU001',
      name: 'Alice Johnson',
      grade: '10',
      section: 'A',
      parentId: 'PAR001',
      subjects: ['Mathematics', 'Science', 'English', 'History'],
      enrollmentDate: '2024-09-01'
    },
    {
      id: 'STU002',
      studentId: 'STU002',
      name: 'Bob Johnson',
      grade: '8',
      section: 'B',
      parentId: 'PAR001',
      subjects: ['Mathematics', 'Science', 'English', 'Art'],
      enrollmentDate: '2024-09-01'
    }
  ];

  // Sample attendance records
  const sampleAttendanceRecords = [
    // Alice's attendance (STU001)
    {
      id: 'ATT001',
      studentId: 'STU001',
      date: new Date().toISOString(),
      status: 'present',
      subject: 'Mathematics',
      timeIn: '08:00',
      timeOut: '09:00'
    },
    {
      id: 'ATT002',
      studentId: 'STU001',
      date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      status: 'present',
      subject: 'Science',
      timeIn: '09:00',
      timeOut: '10:00'
    },
    {
      id: 'ATT003',
      studentId: 'STU001',
      date: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
      status: 'absent',
      subject: 'English',
      reason: 'Sick'
    },
    // Bob's attendance (STU002)
    {
      id: 'ATT004',
      studentId: 'STU002',
      date: new Date().toISOString(),
      status: 'present',
      subject: 'Mathematics',
      timeIn: '08:00',
      timeOut: '09:00'
    },
    {
      id: 'ATT005',
      studentId: 'STU002',
      date: new Date(Date.now() - 86400000).toISOString(),
      status: 'present',
      subject: 'Art',
      timeIn: '10:00',
      timeOut: '11:00'
    }
  ];

  // Sample subjects data
  const sampleSubjects = [
    {
      id: 'SUB001',
      name: 'Mathematics',
      section: 'A',
      teacher: 'Ms. Smith',
      schedule: 'Mon, Wed, Fri - 8:00 AM',
      room: 'Room 101'
    },
    {
      id: 'SUB002',
      name: 'Science',
      section: 'A',
      teacher: 'Mr. Johnson',
      schedule: 'Tue, Thu - 9:00 AM',
      room: 'Room 201'
    },
    {
      id: 'SUB003',
      name: 'English',
      section: 'A',
      teacher: 'Mrs. Davis',
      schedule: 'Mon, Wed, Fri - 2:00 PM',
      room: 'Room 102'
    },
    {
      id: 'SUB004',
      name: 'History',
      section: 'A',
      teacher: 'Mr. Wilson',
      schedule: 'Tue, Thu - 1:00 PM',
      room: 'Room 301'
    },
    {
      id: 'SUB005',
      name: 'Art',
      section: 'B',
      teacher: 'Ms. Brown',
      schedule: 'Mon, Wed - 10:00 AM',
      room: 'Room 401'
    }
  ];

  // Sample teacher feedback
  const sampleTeacherFeedback = [
    {
      id: 'FB001',
      studentId: 'STU001',
      subject: 'Mathematics',
      teacher: 'Ms. Smith',
      content: 'Alice shows excellent problem-solving skills and actively participates in class discussions.',
      date: new Date().toLocaleDateString(),
      type: 'positive'
    },
    {
      id: 'FB002',
      studentId: 'STU001',
      subject: 'Science',
      teacher: 'Mr. Johnson',
      content: 'Good performance in lab experiments. Encourage more independent research.',
      date: new Date(Date.now() - 86400000).toLocaleDateString(),
      type: 'neutral'
    },
    {
      id: 'FB003',
      studentId: 'STU002',
      subject: 'Art',
      teacher: 'Ms. Brown',
      content: 'Very creative and shows natural artistic talent. Keep up the great work!',
      date: new Date().toLocaleDateString(),
      type: 'positive'
    }
  ];

  // Sample parent-teacher messages
  const sampleMessages = [
    {
      id: 'MSG001',
      from: 'Parent',
      to: 'Teacher',
      studentId: 'STU001',
      subject: 'Regarding Alice Johnson',
      content: 'Hello, I wanted to check on Alice\'s progress in Mathematics.',
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      status: 'sent'
    },
    {
      id: 'MSG002',
      from: 'Teacher',
      to: 'Parent',
      studentId: 'STU001',
      subject: 'Re: Regarding Alice Johnson',
      content: 'Alice is doing very well in Mathematics. She consistently scores above 90% and actively participates.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'sent'
    }
  ];

  // Store data in localStorage
  if (!localStorage.getItem('parents')) {
    localStorage.setItem('parents', JSON.stringify(sampleParents));
  }

  if (!localStorage.getItem('students')) {
    localStorage.setItem('students', JSON.stringify(sampleStudents));
  }

  if (!localStorage.getItem('attendanceRecords')) {
    localStorage.setItem('attendanceRecords', JSON.stringify(sampleAttendanceRecords));
  }

  if (!localStorage.getItem('subjects')) {
    localStorage.setItem('subjects', JSON.stringify(sampleSubjects));
  }

  if (!localStorage.getItem('teacherFeedback')) {
    localStorage.setItem('teacherFeedback', JSON.stringify(sampleTeacherFeedback));
  }

  if (!localStorage.getItem('parentTeacherMessages')) {
    localStorage.setItem('parentTeacherMessages', JSON.stringify(sampleMessages));
  }

  console.log('Sample parent data initialized successfully');
};

// Initialize data when this module is imported
initializeParentData();
