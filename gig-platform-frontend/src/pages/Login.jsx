import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { loginUser } from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const { success } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await loginUser({ email, password });
            login(data);
            success(`Welcome back, ${data.name}! 👋`);
            navigate(data.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg" />
            <div className="auth-card animate-slide-up">
                <div className="auth-logo">
                    <div className="nav-logo-icon">⚡</div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>GigConnect</span>
                </div>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to your account to continue</p>

                {error && (
                    <div className="alert error" style={{ marginBottom: '1rem' }}>
                        <span>✕</span> {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <><span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> Signing in...</>
                        ) : 'Sign In →'}
                    </button>
                </form>

                <div className="auth-switch">
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                        Create one free
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
