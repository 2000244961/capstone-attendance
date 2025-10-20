
import React, { useState } from 'react';
import { useUser } from '../shared/UserContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
	console.log('[DEBUG] Login component loaded');
	const navigate = useNavigate();
	const { setUser } = useUser();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [rememberMe, setRememberMe] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	let renderError = null;
	try {
			const handleSubmit = async (e) => {
				e.preventDefault();
				try {
					const res = await fetch('/api/user/login', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ username, password })
					});
					const data = await res.json();
					setErrorMessage('[DEBUG] Login response: ' + JSON.stringify(data));
					if (res.ok && data.user) {
						setErrorMessage('[DEBUG] Login user: ' + JSON.stringify(data.user));
						// Always set role for all user types
						let role = data.user.role || data.user.type;
						const userObj = { ...data.user, role, rememberMe: role === 'admin' ? true : rememberMe };
						setUser(userObj);
						localStorage.setItem('currentUser', JSON.stringify(userObj));
						if (role === 'admin') {
							setErrorMessage('Login successful as admin! Redirecting...');
							navigate('/admin-dashboard');
						} else if (role === 'teacher') {
							setErrorMessage('Login successful as teacher! Redirecting...');
							navigate('/dashboard');
						} else if (role === 'parent') {
							setErrorMessage('Login successful as parent! Redirecting...');
							navigate('/parent-dashboard');
						} else {
							setErrorMessage('Unknown user role: ' + role);
						}
					} else {
						setErrorMessage('[ERROR] ' + (data.message || 'Login failed.'));
					}
				} catch (err) {
					setErrorMessage('[EXCEPTION] Login failed: ' + err.message);
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
						</div>
					</form>
				</div>
			</div>
		);
	} catch (err) {
		renderError = err;
	}
	return <div style={{ color: 'red' }}>[FATAL ERROR] {renderError && renderError.message}</div>;
}

export default Login;
