import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAdminStats, getAllUsers, getAllApplications, toggleStatus, adminDeleteGig, getAdminGigs } from '../services/api';

const Admin = () => {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [gigs, setGigs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [statsRes, usersRes, gigsRes, appsRes] = await Promise.all([
                    getAdminStats(),
                    getAllUsers(),
                    getAdminGigs(),
                    getAllApplications(),
                ]);
                setStats(statsRes.data);
                setUsers(usersRes.data);
                setGigs(gigsRes.data);
                setApplications(appsRes.data);
            } catch (err) {
                toastError('Failed to load admin data.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleToggleUser = async (userId, isActive) => {
        try {
            await toggleStatus(userId);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u));
            success(`User ${!isActive ? 'activated' : 'deactivated'}.`);
        } catch {
            toastError('Failed to update user status.');
        }
    };

    const handleDeleteGig = async (gigId) => {
        if (!window.confirm('Delete this gig?')) return;
        try {
            await adminDeleteGig(gigId);
            setGigs(prev => prev.filter(g => g._id !== gigId));
            success('Gig deleted.');
        } catch {
            toastError('Failed to delete gig.');
        }
    };

    const TABS = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'gigs', label: 'All Jobs', icon: '💼' },
        { id: 'applications', label: 'Applications', icon: '📨' },
    ];

    return (
        <div className="dashboard-layout" style={{ minHeight: 'calc(100vh - 72px)' }}>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-section">
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem', background: 'rgba(245,158,11,0.08)',
                        borderRadius: 'var(--radius-lg)', border: '1px solid rgba(245,158,11,0.2)',
                        marginBottom: '1.5rem',
                    }}>
                        <div className="nav-avatar" style={{ width: 40, height: 40, fontSize: '1rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.name}</p>
                            <span className="role-badge admin">Admin</span>
                        </div>
                    </div>

                    <div className="sidebar-label">Admin Panel</div>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="icon">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </aside>

            <main className="dashboard-main">
                {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                ) : (
                    <>
                        {/* ── Overview ── */}
                        {activeTab === 'overview' && stats && (
                            <div className="animate-fade-in">
                                <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Platform Overview</h2>
                                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                                    <div className="stat-card"><div className="stat-icon indigo">👥</div><div><div className="stat-value">{stats.totalUsers}</div><div className="stat-label">Total Users</div></div></div>
                                    <div className="stat-card"><div className="stat-icon green">💼</div><div><div className="stat-value">{stats.totalGigs}</div><div className="stat-label">Total Jobs</div></div></div>
                                    <div className="stat-card"><div className="stat-icon amber">📨</div><div><div className="stat-value">{stats.totalApplications}</div><div className="stat-label">Applications</div></div></div>
                                    <div className="stat-card"><div className="stat-icon blue">⭐</div><div><div className="stat-value">{stats.totalReviews}</div><div className="stat-label">Reviews</div></div></div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                    <div className="card">
                                        <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Users by Role</h3>
                                        {stats.usersByRole.map(item => (
                                            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
                                                <span className={`role-badge ${item._id}`} style={{ textTransform: 'capitalize' }}>{item._id}</span>
                                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.count}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="card">
                                        <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jobs by Status</h3>
                                        {stats.gigsByStatus.map(item => (
                                            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
                                                <span className={`gig-status-badge status-${item._id}`}>{item._id}</span>
                                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.count}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="card">
                                        <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applications by Status</h3>
                                        {stats.applicationsByStatus.map(item => (
                                            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
                                                <span className={`app-status ${item._id}`}>{item._id}</span>
                                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Users ── */}
                        {activeTab === 'users' && (
                            <div className="animate-fade-in">
                                <div className="section-header" style={{ marginBottom: '1.25rem' }}>
                                    <h2 className="section-title">All Users ({users.length})</h2>
                                </div>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Joined</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u._id}>
                                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                                                    <td>{u.email}</td>
                                                    <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                                                    <td>
                                                        <span style={{
                                                            padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)',
                                                            fontSize: '0.72rem', fontWeight: 600,
                                                            background: u.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                                            color: u.isActive ? '#34d399' : '#f87171',
                                                            border: `1px solid ${u.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                                        }}>
                                                            {u.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        {u._id !== user._id && (
                                                            <button
                                                                className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                                                                onClick={() => handleToggleUser(u._id, u.isActive)}
                                                            >
                                                                {u.isActive ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ── Gigs ── */}
                        {activeTab === 'gigs' && (
                            <div className="animate-fade-in">
                                <div className="section-header" style={{ marginBottom: '1.25rem' }}>
                                    <h2 className="section-title">All Jobs ({gigs.length})</h2>
                                </div>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Client</th>
                                                <th>Category</th>
                                                <th>Budget</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {gigs.map(gig => (
                                                <tr key={gig._id}>
                                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gig.title}</td>
                                                    <td>{gig.client?.name}</td>
                                                    <td>{gig.category} {gig.subcategory ? `• ${gig.subcategory}` : ''}</td>
                                                    <td style={{ color: 'var(--secondary)', fontWeight: 700 }}>₹{gig.budget?.toLocaleString('en-IN')}</td>
                                                    <td><span className={`gig-status-badge status-${gig.status}`}>{gig.status}</span></td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/gigs/${gig._id}`)}>View</button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteGig(gig._id)}>Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ── Applications ── */}
                        {activeTab === 'applications' && (
                            <div className="animate-fade-in">
                                <div className="section-header" style={{ marginBottom: '1.25rem' }}>
                                    <h2 className="section-title">All Applications ({applications.length})</h2>
                                </div>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Worker</th>
                                                <th>Job</th>
                                                <th>Client</th>
                                                <th>Proposed Price</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applications.map(app => (
                                                <tr key={app._id}>
                                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.worker?.name}</td>
                                                    <td>{app.gig?.title}</td>
                                                    <td>{app.client?.name}</td>
                                                    <td style={{ color: 'var(--secondary)', fontWeight: 700 }}>₹{app.proposedPrice?.toLocaleString('en-IN')}</td>
                                                    <td><span className={`app-status ${app.status}`}>{app.status}</span></td>
                                                    <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Admin;
