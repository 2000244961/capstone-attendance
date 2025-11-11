import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Authentication credentials
  const credentials = {
    teacher: {
      username: 'teacher',
      password: 'teacher123',
      role: 'teacher',
      dashboard: '/dashboard'
    },
    admin: {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      dashboard: '/admin-dashboard'
    },
    parent: {
      username: 'parent',
      password: 'parent123',
      role: 'parent',
      dashboard: '/parent-dashboard'
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (username === '' || password === '') {
      setErrorMessage('Please enter both username and password.');
      return;
    }
    
    // Find matching credentials based on username and password
    const validCredentials = Object.values(credentials).find(cred => 
      cred.username === username && cred.password === password
    );
    
    if (validCredentials) {
      setErrorMessage('');  // Clear error message
      
      // Store user info in localStorage for the session
      localStorage.setItem('currentUser', JSON.stringify({
        username: username,
        role: validCredentials.role,
        loginTime: new Date().toISOString()
      }));
      
      // Log the login action
      const loginLog = {
        id: Date.now().toString(),
        action: `${validCredentials.role} login: ${username}`,
        timestamp: new Date().toISOString(),
        admin: username,
        type: 'login'
      };
      
      const logs = JSON.parse(localStorage.getItem('systemLogs')) || [];
      logs.unshift(loginLog);
      localStorage.setItem('systemLogs', JSON.stringify(logs.slice(0, 1000)));
      
      // Redirect to appropriate dashboard
      navigate(validCredentials.dashboard);
    } else {
      setErrorMessage('Invalid username or password.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <center>
          <img
            src="/spcclogo.png"
            alt="SPCC Logo"
            className="logo-img"
          />
        </center>
        <h1>System Plus Computer College</h1>
        <h2 className="accent">Attendance System</h2>
      </div>

      <div className="login-right">
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Welcome Back</h2>
          
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>

          <button type="submit" className="login-button">
            Sign In
          </button>

          {/* Show error message */}
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <div className="login-links">
            <button type="button" className="link-button" onClick={() => alert('Feature coming soon!')}>
              Forgot password?
            </button>
            <p>
              Don't have an account? <button type="button" className="link-button" onClick={() => alert('Feature coming soon!')}>
                Register here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
