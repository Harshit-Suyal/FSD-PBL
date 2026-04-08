import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerUser } from '../services/api';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', gender: '', password: '', confirm: '', role: 'worker' });
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
        if (!/^\d{10,15}$/.test(String(form.phone || '').trim())) {
            return setError('Phone number must contain only digits (10 to 15).');
        }
        if (!['male', 'female'].includes(form.gender)) {
            return setError('Please select gender.');
        }
        setLoading(true);
        try {
            const { data } = await registerUser({
                name: form.name,
                email: form.email,
                phone: form.phone,
                gender: form.gender,
                password: form.password,
                role: form.role,
            });
            login(data);
            success(`Account created! Welcome, ${data.name} 🎉`);
            navigate(data.role === 'admin' ? '/admin' : '/dashboard');
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

                <h1 className="auth-title">Create your account</h1>

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
                        <label htmlFor="reg-phone">Phone number</label>
                        <input
                            id="reg-phone"
                            name="phone"
                            type="tel"
                            inputMode="numeric"
                            placeholder="Enter digits only"
                            value={form.phone}
                            onChange={e => setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-gender">Gender</label>
                        <select
                            id="reg-gender"
                            name="gender"
                            value={form.gender}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>I want to join as</label>
                        <select
                            id="reg-role"
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            required
                        >
                            <option value="worker">Worker</option>
                            <option value="client">Client</option>
                            <option value="admin">Admin</option>
                        </select>
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
