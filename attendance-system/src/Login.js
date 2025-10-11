import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [rememberMe, setRememberMe] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const res = await fetch('/api/user/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			const data = await res.json();
			if (res.ok) {
				localStorage.setItem('currentUser', JSON.stringify(data));
				if (data.type === 'admin') navigate('/admin-dashboard');
				else if (data.type === 'teacher') navigate('/dashboard');
				else if (data.type === 'parent') navigate('/parent-dashboard');
			} else {
				setErrorMessage(data.message || 'Login failed.');
			}
		} catch (err) {
			setErrorMessage('Login failed.');
		}
	};
	return (
		<div className="login-page">
			<form onSubmit={handleSubmit}>
				<input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
				<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
				<button type="submit">Login</button>
				{errorMessage && <div className="error-message">{errorMessage}</div>}
			</form>
		</div>
	);
}

export default Login;
