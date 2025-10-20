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
					setUser(data.user);
					if (data.user.role === 'admin') {
						setErrorMessage('Login successful as admin! Redirecting...');
						navigate('/admin-dashboard');
					} else if (data.user.role === 'teacher') {
						setErrorMessage('Login successful as teacher! Redirecting...');
						navigate('/dashboard');
					} else if (data.user.role === 'parent') {
						setErrorMessage('Login successful as parent! Redirecting...');
						navigate('/parent-dashboard');
					} else {
						setErrorMessage('Unknown user role: ' + data.user.role);
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
				<div style={{ color: 'blue', fontWeight: 'bold' }}>[DEBUG] Login component loaded</div>
				<form onSubmit={handleSubmit}>
					<input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
					<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
					<button type="submit">Login</button>
					{errorMessage && <div className="error-message">{errorMessage}</div>}
				</form>
			</div>
		);
	} catch (err) {
		renderError = err;
	}
	return <div style={{ color: 'red' }}>[FATAL ERROR] {renderError && renderError.message}</div>;
}

export default Login;
