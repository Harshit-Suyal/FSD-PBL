import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerUser } from '../services/api';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'worker' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const { success } = useToast();
    const navigate = useNavigate();

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) {
            return setError('Passwords do not match.');
        }
        if (form.password.length < 6) {
            return setError('Password must be at least 6 characters.');
        }
        setLoading(true);
        try {
            const { data } = await registerUser({ name: form.name, email: form.email, password: form.password, role: form.role });
            login(data);
            success(`Account created! Welcome, ${data.name} 🎉`);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
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

                <h1 className="auth-title">Create your account</h1>
                <p className="auth-subtitle">Join thousands of workers and clients on GigConnect</p>

                {error && (
                    <div className="alert error" style={{ marginBottom: '1rem' }}>
                        <span>✕</span> {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="reg-name">Full Name</label>
                        <input
                            id="reg-name"
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email">Email address</label>
                        <input
                            id="reg-email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>I want to join as</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {['worker', 'client'].map(r => (
                                <label
                                    key={r}
                                    htmlFor={`role-${r}`}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        gap: '0.4rem', padding: '1rem',
                                        border: `2px solid ${form.role === r ? 'var(--primary)' : 'var(--border)'}`,
                                        borderRadius: 'var(--radius-lg)',
                                        background: form.role === r ? 'rgba(99,102,241,0.08)' : 'var(--bg-elevated)',
                                        cursor: 'pointer', transition: 'var(--transition)',
                                        fontSize: '0.85rem', fontWeight: 600,
                                        color: form.role === r ? 'var(--primary-light)' : 'var(--text-secondary)',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    <input
                                        id={`role-${r}`}
                                        type="radio"
                                        name="role"
                                        value={r}
                                        checked={form.role === r}
                                        onChange={handleChange}
                                        style={{ display: 'none' }}
                                    />
                                    <span style={{ fontSize: '1.8rem' }}>{r === 'worker' ? '👷' : '🏢'}</span>
                                    {r}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            name="password"
                            type="password"
                            placeholder="Min 6 characters"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-confirm">Confirm Password</label>
                        <input
                            id="reg-confirm"
                            name="confirm"
                            type="password"
                            placeholder="Repeat your password"
                            value={form.confirm}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <><span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> Creating account...</>
                        ) : 'Create Account →'}
                    </button>
                </form>

                <div className="auth-switch">
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
