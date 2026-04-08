import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGigs } from '../services/api';
import GigCard from '../components/GigCard';

const FEATURES = [
    { icon: '🔒', title: 'Secure Authentication', desc: 'JWT-powered auth with role-based access control for every interaction.' },
    { icon: '⚡', title: 'Instant Matching', desc: 'Clients post gigs and workers apply in minutes with structured proposals.' },
    { icon: '⭐', title: 'Verified Reviews', desc: 'Mutual ratings after job completion build trust for everyone on the platform.' },
    { icon: '🛡️', title: 'Role-Based Control', desc: 'Separate dashboards for Workers, Clients, and Admins — always in context.' },
];

const Home = () => {
    const { isAuthenticated } = useAuth();
    const [featuredGigs, setFeaturedGigs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getGigs({ status: 'open' })
            .then(res => setFeaturedGigs(res.data.slice(0, 6)))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="animate-fade-in">
            <section className="hero">
                <div className="hero-bg" />
                <div className="hero-grid-bg" />
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-tag">
                          The Modern Gig Economy Platform
                        </div>
                        <h1 className="hero-title">
                            Connect. Collaborate.
                            <br />
                            <span className="gradient-text">Get Work Done.</span>
                        </h1>
                        <p className="hero-subtitle">
                            GigConnect bridges skilled Workers with Clients who need results.
                        </p>
                        <div className="hero-actions">
                            <Link to="/gigs" className="btn btn-primary btn-lg">
                                Browse Jobs
                            </Link>
                            {!isAuthenticated && (
                                <Link to="/register" className="btn btn-secondary btn-lg">
                                    Get Started
                                </Link>
                            )}
                            {isAuthenticated && (
                                <Link to="/dashboard" className="btn btn-secondary btn-lg">
                                    Go to Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>
            <section className="section" style={{ background: 'var(--bg-surface)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                            You will see in this application
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto' }}>
                            An application built for the modern gig economy with industry-standard security and seamless workflows.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                        {FEATURES.map((f, i) => (
                            <div key={i} className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.icon}</div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.6rem' }}>{f.title}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Featured Gigs ── */}
            <section className="section">
                <div className="container">
                    <div className="section-header" style={{ marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Featured Jobs</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                                {!isAuthenticated && 'Sign in to apply and view complete details'}
                                {isAuthenticated && 'Click any job to view details and apply'}
                            </p>
                        </div>
                        <Link to="/gigs" className="btn btn-ghost">View All →</Link>
                    </div>

                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
                            ))}
                        </div>
                    ) : featuredGigs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <h3>No jobs available yet</h3>
                            <p>Be the first to post a job and find talented workers.</p>
                            {isAuthenticated && <Link to="/dashboard" className="btn btn-primary">Post a Job</Link>}
                        </div>
                    ) : (
                        <div className="gig-grid">
                            {featuredGigs.map(gig => (
                                <GigCard key={gig._id} gig={gig} isAuthenticated={isAuthenticated} />
                            ))}
                        </div>
                    )}

                    {!isAuthenticated && featuredGigs.length > 0 && (
                        <div style={{
                            marginTop: '3rem', textAlign: 'center', padding: '3rem 2rem',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.05))',
                            borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)'
                        }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                                Ready to get started?
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Create a free account to apply for jobs, post gigs, and connect with talent.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <Link to="/register" className="btn btn-primary btn-lg">Create Free Account</Link>
                                <Link to="/login" className="btn btn-ghost btn-lg">Sign In</Link>
                            </div>
                        </div>
                    )}
                </div>
            </section>
            <section className="section" style={{ background: 'var(--bg-surface)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>How it works</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
                        {[
                            { step: '01', title: 'Create Account', desc: 'Sign up as a Worker looking for gigs, or a Client wanting to hire talent.', icon: '👤' },
                            { step: '02', title: 'Browse or Post', desc: 'Clients post jobs with a budget. Workers browse & find matching opportunities.', icon: '🔍' },
                            { step: '03', title: 'Apply & Negotiate', desc: 'Workers submit proposals with a price. Clients review and accept the best fit.', icon: '📝' },
                            { step: '04', title: 'Complete & Review', desc: 'Finish the job and leave mutual reviews to build your reputation.', icon: '⭐' },
                            { step: '05', title: 'Success', desc: 'Celebrate your achievements and build your professional network.', icon: '🏆' },
                        ].map((item) => (
                            <div key={item.step} style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: 'var(--radius-lg)',
                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.1))',
                                    border: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.8rem', margin: '0 auto 1rem'
                                }}>{item.icon}</div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-light)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>STEP {item.step}</div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{item.title}</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer style={{
                background: 'var(--bg-surface)',
                borderTop: '1px solid var(--border)',
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    ⚡ GigConnect
                </div>
                PBL project for Full stack development
            </footer>
        </div>
    );
};

export default Home;
