# Admin Dashboard Login Instructions

## 🔐 How to Access the Admin Dashboard

### Step 1: Open the Application
Navigate to your application's login page (usually `http://localhost:3000` if running locally).

### Step 2: Select User Type
On the login page, you'll see two buttons for user type selection:
- **👨‍🏫 Teacher** - Access the Teacher Dashboard
- **👨‍💼 Admin** - Access the Admin Dashboard

### Step 3: Use Admin Credentials
Click on the **👨‍💼 Admin** button, then use these credentials:

**Admin Login:**
- **Username:** `admin`
- **Password:** `admin123`

**Teacher Login (for reference):**
- **Username:** `teacher`
- **Password:** `password123`

### Step 4: Access Admin Features
Once logged in as admin, you'll have access to:

#### 🏫 Administrative Functions:
- **👥 User Management** - Add/Edit/Delete Teachers, Students, Parents
- **📋 School-wide Attendance Overview** - Complete attendance analytics
- **📚 Manage All Subjects and Sections** - System-wide subject management
- **⚙️ System Settings** - Configuration and preferences
- **📝 Logs and Audit Trail** - Complete system activity logging
- **📊 Reports Generator** - Generate various system reports
- **📢 Broadcast Announcements** - Send announcements to all users
- **🔧 System Diagnostics** - Monitor system health and performance
- **🚩 Flagged Records** - Review records requiring attention

### Step 5: Security Features
- **Role-based Access Control** - Only admins can access admin features
- **Session Management** - Automatic logout and session tracking
- **Audit Logging** - All admin actions are logged for security
- **Protected Routes** - Direct URL access is protected

### 🔄 Navigation Between Dashboards
- **Teacher Dashboard:** `http://localhost:3000/dashboard`
- **Admin Dashboard:** `http://localhost:3000/admin-dashboard`
- **Login Page:** `http://localhost:3000/`

### 🔒 Security Notes
- Sessions are stored in localStorage
- Logout clears all session data
- Failed login attempts are tracked
- All admin actions are audited and logged

### 🆘 Troubleshooting
If you can't access the admin dashboard:
1. Make sure you're using the correct credentials (`admin` / `admin123`)
2. Clear your browser's localStorage if needed
3. Check that you selected "Admin" user type before logging in
4. Ensure the admin dashboard route is properly configured

---
**Note:** These are demo credentials. In a production environment, you should implement proper authentication with secure password hashing and user management.
