import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regType, setRegType] = useState('');
  const [regMessage, setRegMessage] = useState('');


    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMessage('');
      if (!username || !password) {
        setErrorMessage('Please fill in all fields');
        return;
      }
      try {
        const res = await fetch('/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('username', username);
          if (data.type === 'admin') {
            navigate('/admin-dashboard');
          } else if (data.type === 'teacher') {
            navigate('/dashboard');
          } else if (data.type === 'parent') {
            navigate('/parent-dashboard');
          }
        } else {
          setErrorMessage(data.message || 'Login failed.');
        }
      } catch (err) {
        setErrorMessage('Login failed.');
      }
    };

    return (
      <div className="login-container">
        <div className="login-wrapper">
          <div className="login-header">
            <img src={require('./logo.svg')} alt="SPCC Logo" style={{ width: 80, marginBottom: 12 }} />
            <h1>Attendance System</h1>
            <p>Sign in to access your dashboard</p>
          </div>
          {!showRegister ? (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">👤 Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">🔒 Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Remember me
                </label>
              </div>
              <button type="submit" className="login-btn">
                Sign In
              </button>
              {errorMessage && <div className="error-message">{errorMessage}</div>}
              <div className="login-links">
                <button type="button" className="link-button" disabled>
                  Forgot password?
                </button>
                <span>
                  Don't have an account?{' '}
                  <span
                    className="link-button register-link"
                    role="button"
                    tabIndex={0}
                    style={{ textDecoration: 'underline', color: '#1976d2', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                    onClick={() => setShowRegister(true)}
                    onKeyPress={e => { if (e.key === 'Enter') setShowRegister(true); }}
                  >
                    Register here
                  </span>
                </span>
              </div>
            </form>
          ) : (
            <form
              className="register-form"
              style={{ marginTop: '2rem' }}
              onSubmit={async (e) => {
                e.preventDefault();
                setRegMessage('');
                try {
                  const res = await fetch('/api/user/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      username: regUsername,
                      password: regPassword,
                      email: regEmail,
                      type: regType
                    })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setRegMessage(data.message);
                    setRegUsername('');
                    setRegPassword('');
                    setRegEmail('');
                    setRegType('');
                  } else {
                    setRegMessage(data.message || 'Registration failed.');
                  }
                } catch (err) {
                  setRegMessage('Registration failed.');
                }
              }}
            >
              <h2>Register</h2>
              <div className="form-group">
                <label htmlFor="reg-username">👤 Username</label>
                <input type="text" id="reg-username" className="register-input" placeholder="Choose a username" required value={regUsername} onChange={e => setRegUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="reg-password">🔒 Password</label>
                <input type="password" id="reg-password" className="register-input" placeholder="Choose a password" required value={regPassword} onChange={e => setRegPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="reg-email">📧 Email</label>
                <input type="email" id="reg-email" className="register-input" placeholder="Enter your email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="reg-type">🧑‍🏫 Register as</label>
                <select id="reg-type" className="register-input" required value={regType} onChange={e => setRegType(e.target.value)}>
                  <option value="">Select type</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              <div className="register-info">
                <p className="register-note">
                  {regType === 'admin'
                    ? 'After registering, you can log in immediately as admin.'
                    : 'After registering, your account will appear in the admin panel for approval.'}
                </p>
                {regMessage && <div className="error-message">{regMessage}</div>}
              </div>
              <button type="submit" className="login-btn register-btn">Register</button>
              <button type="button" className="link-button" style={{ marginTop: '1rem' }} onClick={() => setShowRegister(false)}>
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
}

export default Login;
