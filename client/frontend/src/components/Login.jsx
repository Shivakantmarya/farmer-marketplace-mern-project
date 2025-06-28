
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

function Login({ setToken }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Clear error when the user changes input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', form);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      console.error('Login Error:', err.response || err.message);

      if (err.response && err.response.status === 401) {
        setError('Invalid username or password.');
      } else if (err.response && err.response.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="auth-input"
              id="username"
            />
            <label htmlFor="username" className="auth-label">Username</label>
          </div>
          <div className="input-group">
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="auth-input"
              id="password"
            />
            <label htmlFor="password" className="auth-label">Password</label>
          </div>
          <button type="submit" className="auth-button">Login</button>
        </form>
        <p className="auth-switch">
          Don’t have an account? <a href="/signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
