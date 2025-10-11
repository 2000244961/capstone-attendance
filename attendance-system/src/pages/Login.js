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

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (username === '' || password === '') {
			setErrorMessage('Please enter both username and password.');
			return;
		}
		try {
			const response = await fetch('/api/user/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			const data = await response.json();
			if (response.ok) {
				setErrorMessage('');
				   // Store the full backend user object (should include _id, username, type, etc)
				   localStorage.setItem('currentUser', JSON.stringify(data));
				if (data.type === 'admin') {
					navigate('/admin-dashboard');
				} else if (data.type === 'teacher') {
					navigate('/dashboard');
				} else {
					navigate('/parent-dashboard');
				}
			} else {
				setErrorMessage(data.message || 'Invalid username or password.');
			}
		} catch (err) {
			setErrorMessage('Login failed.');
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
								</div>
				</form>
			</div>
		</div>
	);
}

export default Login;
