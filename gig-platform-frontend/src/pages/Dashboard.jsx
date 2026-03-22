import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getMyGigs, createGig, deleteGig, getMyApplications } from '../services/api';
import Modal from '../components/Modal';
import { CATEGORY_LIST, JOB_CATEGORIES, WORK_TYPES } from '../constants/gigMeta';

const Dashboard = () => {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState(user?.role === 'client' ? 'jobs' : 'applications');
    const [myGigs, setMyGigs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModal, setCreateModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [gigForm, setGigForm] = useState({
        title: '', description: '', budget: '', category: CATEGORY_LIST[0], subcategory: JOB_CATEGORIES[CATEGORY_LIST[0]][0],
        skills: '', deadline: '', duration: '', location: '', requiredWorkers: 1,
    });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                if (user?.role === 'client') {
                    const { data } = await getMyGigs();
                    setMyGigs(data);
                } else if (user?.role === 'worker') {
                    const [gigsRes, appsRes] = await Promise.all([getMyGigs(), getMyApplications()]);
                    setMyGigs(gigsRes.data);
                    setMyApplications(appsRes.data);
                }
            } catch (err) {
                toastError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        if (user) load();
    }, [user]);

    const handleCreateGig = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...gigForm,
                budget: Number(gigForm.budget),
                requiredWorkers: Number(gigForm.requiredWorkers),
                skills: gigForm.skills.split(',').map(s => s.trim()).filter(Boolean),
            };
            const { data } = await createGig(payload);
            setMyGigs(prev => [data, ...prev]);
            success('Job posted successfully! 🚀');
            setCreateModal(false);
            setGigForm({
                title: '', description: '', budget: '', category: CATEGORY_LIST[0], subcategory: JOB_CATEGORIES[CATEGORY_LIST[0]][0],
                skills: '', deadline: '', duration: '', location: '', requiredWorkers: 1,
            });
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to create job');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteGig = async (gigId) => {
        if (!window.confirm('Delete this job posting?')) return;
        try {
            await deleteGig(gigId);
            setMyGigs(prev => prev.filter(g => g._id !== gigId));
            success('Job deleted.');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to delete');
        }
    };

    const getInitials = (name = '') =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const statusCounts = {
        open: myGigs.filter(g => g.status === 'open').length,
        inProgress: myGigs.filter(g => g.status === 'in-progress').length,
        completed: myGigs.filter(g => g.status === 'completed').length,
    };

    const appCounts = {
        pending: myApplications.filter(a => a.status === 'pending').length,
        accepted: myApplications.filter(a => a.status === 'accepted').length,
        rejected: myApplications.filter(a => a.status === 'rejected').length,
    };

    const clientActiveGigs = myGigs.filter(g => ['open', 'pending'].includes(g.status));
    const clientHistoryGigs = myGigs.filter(g => !['open', 'pending'].includes(g.status));

    const workerActiveGigs = myGigs.filter(g => ['accepted', 'in-progress'].includes(g.status));
    const workerHistoryGigs = myGigs.filter(g => g.status === 'completed');
    const workerHistoryApplications = myApplications.filter(a => ['accepted', 'rejected'].includes(a.status));

    const SIDEBAR_TABS = user?.role === 'client'
        ? [
            { id: 'jobs', label: 'My Jobs', icon: '📋' },
            { id: 'history', label: 'History', icon: '🕘' },
            { id: 'profile', label: 'Profile', icon: '👤' },
        ]
        : [
            { id: 'applications', label: 'My Applications', icon: '📨' },
            { id: 'active', label: 'Active Jobs', icon: '⚡' },
            { id: 'history', label: 'History', icon: '🕘' },
            { id: 'profile', label: 'Profile', icon: '👤' },
        ];

    return (
        <div className="dashboard-layout" style={{ minHeight: 'calc(100vh - 72px)' }}>
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                {/* User Pill */}
                <div className="sidebar-section">
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem', background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
                        marginBottom: '1.5rem',
                    }}>
                        <div className="nav-avatar" style={{ width: 40, height: 40, fontSize: '1rem' }}>
                            {getInitials(user?.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.name}
                            </p>
                            <span className={`role-badge ${user?.role}`} style={{ marginTop: '0.1rem', display: 'inline-block' }}>{user?.role}</span>
                        </div>
                    </div>

                    <div className="sidebar-label">Navigation</div>
                    {SIDEBAR_TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="icon">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                    <Link to="/gigs" className="sidebar-link">
                        <span className="icon">🔍</span>
                        Browse Jobs
                    </Link>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="dashboard-main">
                {/* Stats Row */}
                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                    {user?.role === 'client' ? (
                        <>
                            <div className="stat-card">
                                <div className="stat-icon indigo">📋</div>
                                <div><div className="stat-value">{myGigs.length}</div><div className="stat-label">Total Jobs</div></div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon green">✅</div>
                                <div><div className="stat-value">{statusCounts.open}</div><div className="stat-label">Open</div></div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon amber">⚡</div>
                                <div><div className="stat-value">{statusCounts.inProgress}</div><div className="stat-label">In Progress</div></div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon blue">🏆</div>
                                <div><div className="stat-value">{statusCounts.completed}</div><div className="stat-label">Completed</div></div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="stat-card">
                                <div className="stat-icon indigo">📨</div>
                                <div><div className="stat-value">{myApplications.length}</div><div className="stat-label">Applied</div></div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon amber">⏳</div>
                                <div><div className="stat-value">{appCounts.pending}</div><div className="stat-label">Pending</div></div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon green">✅</div>
                                <div><div className="stat-value">{appCounts.accepted}</div><div className="stat-label">Accepted</div></div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon blue">⚡</div>
                                <div><div className="stat-value">{myGigs.length}</div><div className="stat-label">Active Jobs</div></div>
                            </div>
                        </>
                    )}
                </div>

                {/* ─────── Client: Jobs Tab ─────── */}
                {activeTab === 'jobs' && user?.role === 'client' && (
                    <div>
                        <div className="section-header">
                            <h2 className="section-title">My Job Postings</h2>
                            <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
                                + Post New Job
                            </button>
                        </div>

                        {loading ? (
                            <div className="loading-center"><div className="spinner" /></div>
                        ) : clientActiveGigs.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <h3>No active jobs right now</h3>
                                <p>Post a new job or check History for finalized jobs.</p>
                                <button className="btn btn-primary" onClick={() => setCreateModal(true)}>Post Your First Job</button>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Job Title</th>
                                            <th>Category</th>
                                            <th>Budget</th>
                                            <th>Status</th>
                                            <th>Posted</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientActiveGigs.map(gig => (
                                            <tr key={gig._id}>
                                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{gig.title}</td>
                                                <td>{gig.category} {gig.subcategory ? `• ${gig.subcategory}` : ''}</td>
                                                <td style={{ color: 'var(--secondary)', fontWeight: 700 }}>₹{gig.budget?.toLocaleString('en-IN')}</td>
                                                <td><span className={`gig-status-badge status-${gig.status}`}>{gig.status}</span></td>
                                                <td>{new Date(gig.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/gigs/${gig._id}`)}>View</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteGig(gig._id)}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ─────── Worker: Applications Tab ─────── */}
                {activeTab === 'applications' && user?.role === 'worker' && (
                    <div>
                        <div className="section-header">
                            <h2 className="section-title">My Applications</h2>
                            <Link to="/gigs" className="btn btn-ghost">Browse More Jobs</Link>
                        </div>

                        {loading ? (
                            <div className="loading-center"><div className="spinner" /></div>
                        ) : myApplications.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <h3>No applications yet</h3>
                                <p>Browse available jobs and apply to start earning.</p>
                                <Link to="/gigs" className="btn btn-primary">Browse Jobs</Link>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Job Title</th>
                                            <th>Category</th>
                                            <th>Your Price</th>
                                            <th>Status</th>
                                            <th>Applied</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myApplications.map(app => (
                                            <tr key={app._id}>
                                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.gig?.title}</td>
                                                <td>{app.gig?.category} {app.gig?.subcategory ? `• ${app.gig?.subcategory}` : ''}</td>
                                                <td style={{ color: 'var(--secondary)', fontWeight: 700 }}>₹{app.proposedPrice?.toLocaleString('en-IN')}</td>
                                                <td><span className={`app-status ${app.status}`}>{app.status}</span></td>
                                                <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/gigs/${app.gig?._id}`)}>
                                                        View Job
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ─────── Worker: Active Jobs Tab ─────── */}
                {activeTab === 'active' && user?.role === 'worker' && (
                    <div>
                        <div className="section-header">
                            <h2 className="section-title">Active Jobs</h2>
                        </div>
                        {loading ? (
                            <div className="loading-center"><div className="spinner" /></div>
                        ) : workerActiveGigs.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">⚡</div>
                                <h3>No active jobs yet</h3>
                                <p>Once a client accepts your application, the job will appear here.</p>
                                <Link to="/gigs" className="btn btn-primary">Browse Jobs</Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {workerActiveGigs.map(gig => (
                                    <div key={gig._id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{gig.title}</h3>
                                                <span className={`gig-status-badge status-${gig.status}`}>{gig.status}</span>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                Client: {gig.client?.name} · ₹{gig.budget?.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/gigs/${gig._id}`)}>
                                            View Details
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─────── History Tab ─────── */}
                {activeTab === 'history' && user?.role === 'client' && (
                    <div>
                        <div className="section-header">
                            <h2 className="section-title">Job History</h2>
                        </div>

                        {loading ? (
                            <div className="loading-center"><div className="spinner" /></div>
                        ) : clientHistoryGigs.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🕘</div>
                                <h3>No history yet</h3>
                                <p>Finalized jobs will appear here after worker selection.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Job Title</th>
                                            <th>Final Amount</th>
                                            <th>Status</th>
                                            <th>Updated</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientHistoryGigs.map(gig => (
                                            <tr key={gig._id}>
                                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{gig.title}</td>
                                                <td style={{ color: 'var(--secondary)', fontWeight: 700 }}>₹{gig.budget?.toLocaleString('en-IN')}</td>
                                                <td><span className={`gig-status-badge status-${gig.status}`}>{gig.status}</span></td>
                                                <td>{new Date(gig.updatedAt || gig.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/gigs/${gig._id}`)}>View</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && user?.role === 'worker' && (
                    <div>
                        <div className="section-header">
                            <h2 className="section-title">Work History</h2>
                        </div>

                        {loading ? (
                            <div className="loading-center"><div className="spinner" /></div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                <div className="card">
                                    <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Completed Jobs ({workerHistoryGigs.length})</h3>
                                    {workerHistoryGigs.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No completed jobs yet.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {workerHistoryGigs.map(gig => (
                                                <div key={gig._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 600 }}>{gig.title}</p>
                                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>₹{gig.budget?.toLocaleString('en-IN')}</p>
                                                    </div>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/gigs/${gig._id}`)}>View</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="card">
                                    <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Application Outcomes ({workerHistoryApplications.length})</h3>
                                    {workerHistoryApplications.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No finalized applications yet.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {workerHistoryApplications.map(app => (
                                                <div key={app._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 600 }}>{app.gig?.title}</p>
                                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                            ₹{app.proposedPrice?.toLocaleString('en-IN')} • {app.status}
                                                        </p>
                                                    </div>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/gigs/${app.gig?._id}`)}>View</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─────── Profile Tab ─────── */}
                {activeTab === 'profile' && (
                    <ProfileSection user={user} />
                )}
            </main>

            {/* ── Create Job Modal ── */}
            <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Post a New Job" size="lg">
                <form className="modal-form" onSubmit={handleCreateGig}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label>Job Title *</label>
                            <input
                                placeholder="e.g. Build a React E-commerce Website"
                                value={gigForm.title}
                                onChange={e => setGigForm(p => ({ ...p, title: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label>Description *</label>
                            <textarea
                                placeholder="Describe the work in detail — what you need, requirements, deliverables..."
                                value={gigForm.description}
                                onChange={e => setGigForm(p => ({ ...p, description: e.target.value }))}
                                required
                                rows={4}
                            />
                        </div>
                        <div className="form-group">
                            <label>Budget (₹) *</label>
                            <input
                                type="number"
                                placeholder="e.g. 5000"
                                value={gigForm.budget}
                                onChange={e => setGigForm(p => ({ ...p, budget: e.target.value }))}
                                required
                                min={1}
                            />
                        </div>
                        <div className="form-group">
                            <label>Category *</label>
                            <select
                                value={gigForm.category}
                                onChange={e => setGigForm(p => ({
                                    ...p,
                                    category: e.target.value,
                                    subcategory: JOB_CATEGORIES[e.target.value][0],
                                }))}
                            >
                                {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Subcategory *</label>
                            <select value={gigForm.subcategory} onChange={e => setGigForm(p => ({ ...p, subcategory: e.target.value }))}>
                                {(JOB_CATEGORIES[gigForm.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Deadline</label>
                            <input
                                type="date"
                                value={gigForm.deadline}
                                onChange={e => setGigForm(p => ({ ...p, deadline: e.target.value }))}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="form-group">
                            <label>Required Skills (comma separated)</label>
                            <input
                                placeholder="React, Node.js, CSS..."
                                value={gigForm.skills}
                                onChange={e => setGigForm(p => ({ ...p, skills: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Duration *</label>
                            <input
                                placeholder="e.g. 2 days, 1 week"
                                value={gigForm.duration}
                                onChange={e => setGigForm(p => ({ ...p, duration: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Location (required for local jobs)</label>
                            <input
                                placeholder="City / Area"
                                value={gigForm.location}
                                onChange={e => setGigForm(p => ({ ...p, location: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Workers Required *</label>
                            <input
                                type="number"
                                min={1}
                                value={gigForm.requiredWorkers}
                                onChange={e => setGigForm(p => ({ ...p, requiredWorkers: e.target.value }))}
                                required
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => setCreateModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Posting...' : '🚀 Post Job'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// ── Inline Profile Section ──
const ProfileSection = ({ user }) => {
    const { updateUser } = useAuth();
    const { success, error: toastError } = useToast();
    const [form, setForm] = useState({
        name: user?.name || '',
        bio: user?.bio || '',
        location: user?.location || '',
        phone: user?.phone || '',
        workType: user?.workType || 'Freelancer',
        skills: user?.skills?.join(', ') || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { updateProfile } = await import('../services/api');
            const payload = {
                name: form.name,
                bio: form.bio,
                location: form.location,
                phone: form.phone,
                workType: form.workType,
                skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
            };
            const { data } = await updateProfile(payload);
            updateUser(data);
            success('Profile updated! ✅');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>My Profile</h2>
            <div className="profile-header">
                <div className="profile-avatar">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                    <h2 className="profile-name">{user?.name}</h2>
                    <div className="profile-meta">
                        <span className={`role-badge ${user?.role}`}>{user?.role}</span>
                        {user?.location && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {user.location}</span>}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{user?.email}</p>
                </div>
            </div>

            <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Edit Profile</h3>
                <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} onSubmit={handleSave}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Bio</label>
                        <textarea rows={3} placeholder="Tell others about yourself..." value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Location</label>
                        <input placeholder="City, Country" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input placeholder="Phone number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                    {user?.role === 'worker' && (
                        <>
                            <div className="form-group">
                                <label>Work Type</label>
                                <select value={form.workType} onChange={e => setForm(p => ({ ...p, workType: e.target.value }))}>
                                    {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Skills (comma separated)</label>
                                <input placeholder="React, Design, Python..." value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} />
                            </div>
                        </>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                        {saving ? 'Saving...' : '💾 Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Dashboard;
