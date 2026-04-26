import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import {
    getMyGigs,
    createGig,
    deleteGig,
    getMyApplications,
    getMyProfile,
    getWorkerUpdates,
    getGigInvoice,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '../services/api';
import Modal from '../components/Modal';
import { CATEGORY_LIST, JOB_CATEGORIES, WORK_TYPES, CATEGORY_SKILLS, SUBCATEGORY_SKILLS } from '../constants/gigMeta';

const getInitialGigForm = () => ({
    title: '',
    description: '',
    budget: '',
    category: CATEGORY_LIST[0],
    subcategory: JOB_CATEGORIES[CATEGORY_LIST[0]][0],
    skills: [],
    deadline: '',
    durationValue: '',
    durationUnit: 'days',
    location: '',
    requiredWorkers: '',
});

const BASIC_WORKER_SKILLS = [
    'Communication',
    'Time Management',
    'Customer Service',
    'Problem Solving',
    'Teamwork',
    'Reliability',
    'Attention to Detail',
    'Task Planning',
];

const SIMPLE_WORK_OPTIONS = [
    'Data Entry',
    'Delivery',
    'Packing',
    'House Cleaning',
    'Electrician',
    'Plumbing',
    'Painting',
    'Driving',
    'Cooking',
    'Tutoring',
    'Graphic Design',
    'Content Writing',
    'Social Media',
    'Web Development',
];

const WORK_TYPE_SKILL_PRESETS = {
    Freelancer: ['React', 'Node.js', 'SEO', 'Content Writing', 'Graphic Design', 'Data Entry'],
    'Shop Owner': ['Inventory Management', 'Billing', 'Sales', 'Vendor Coordination', 'Customer Handling', 'Bookkeeping'],
    Temporary: ['Delivery', 'Packing', 'Field Support', 'Housekeeping', 'Data Entry', 'Helper Work'],
};

const PROFILE_SKILL_OPTIONS = Array.from(
    new Set([
        ...SIMPLE_WORK_OPTIONS,
        ...BASIC_WORKER_SKILLS,
    ])
).sort((a, b) => a.localeCompare(b));

const validateGigForm = (form) => {
    const errors = {};

    if (!form.title.trim()) errors.title = 'Job title is required.';
    if (!form.description.trim()) errors.description = 'Description is required.';

    const budget = Number(form.budget);
    if (!form.budget || Number.isNaN(budget) || budget <= 0) {
        errors.budget = 'Enter a positive budget amount.';
    }

    if (!form.category) errors.category = 'Category is required.';
    if (!form.subcategory) errors.subcategory = 'Subcategory is required.';

    if (!form.skills.length) {
        errors.skills = 'Select at least one required skill.';
    }

    const durationValue = Number(form.durationValue);
    if (!form.durationValue || Number.isNaN(durationValue) || durationValue <= 0) {
        errors.durationValue = 'Enter a positive number only.';
    }

    if (!form.location.trim()) {
        errors.location = 'Location is required.';
    }

    const workers = Number(form.requiredWorkers);
    if (!form.requiredWorkers || Number.isNaN(workers) || workers <= 0) {
        errors.requiredWorkers = 'Workers required must be a positive number.';
    }

    if (form.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(form.deadline);
        if (deadlineDate <= today) {
            errors.deadline = 'Deadline must be in the future.';
        }
    }

    return errors;
};

const Dashboard = () => {
    const { user, updateUser } = useAuth();
    const { notifications, setNotifications } = useSocket();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin', { replace: true });
        }
    }, [user?.role, navigate]);

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

    const [activeTab, setActiveTab] = useState(user?.role === 'client' ? 'jobs' : 'applications');
    const [myGigs, setMyGigs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [workerUpdates, setWorkerUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModal, setCreateModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [gigForm, setGigForm] = useState(getInitialGigForm());
    const [gigErrors, setGigErrors] = useState({});
    const unreadNotificationCount = notifications.filter((notification) => !notification.isRead).length;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data: profile } = await getMyProfile();
                const activeRole = profile?.role || user?.role;

                if (activeRole === 'admin') {
                    navigate('/admin', { replace: true });
                    return;
                }

                if (profile) {
                    updateUser(profile);
                }

                if (activeRole === 'client') {
                    const { data } = await getMyGigs();
                    setMyGigs(data);
                } else if (activeRole === 'worker') {
                    const [gigsRes, appsRes, updatesRes] = await Promise.all([getMyGigs(), getMyApplications(), getWorkerUpdates()]);
                    setMyGigs(gigsRes.data);
                    setMyApplications(appsRes.data);
                    setWorkerUpdates(updatesRes.data || []);
                }
            } catch (err) {
                toastError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        if (user) load();
    }, [user?._id]);

    const handleCreateGig = async (e) => {
        e.preventDefault();

        const errors = validateGigForm(gigForm);
        setGigErrors(errors);
        if (Object.keys(errors).length) {
            toastError('Please fix the form errors before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            const durationValue = Number(gigForm.durationValue);
            const payload = {
                ...gigForm,
                budget: Number(gigForm.budget),
                requiredWorkers: Number(gigForm.requiredWorkers),
                skills: gigForm.skills,
                duration: `${durationValue} ${gigForm.durationUnit}`,
            };
            delete payload.durationValue;
            delete payload.durationUnit;

            const { data } = await createGig(payload);
            setMyGigs(prev => [data, ...prev]);
            success('Job posted successfully! 🚀');
            setCreateModal(false);
            setGigForm(getInitialGigForm());
            setGigErrors({});
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.message === 'Only clients can create gigs') {
                toastError('Your current account role is not client on server. Please re-login and use a client account.');
            } else {
                toastError(err.response?.data?.message || 'Failed to create job');
            }
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

    const handleDownloadInvoice = async (gigId) => {
        try {
            const { data } = await getGigInvoice(gigId);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${gigId}.json`;
            a.click();
            window.URL.revokeObjectURL(url);
            success('Invoice downloaded.');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to download invoice');
        }
    };

    const handleMarkNotificationRead = async (notificationId) => {
        try {
            const { data } = await markNotificationAsRead(notificationId);
            setNotifications((prev) => prev.map((notification) => (notification._id === notificationId ? data : notification)));
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to update notification');
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
            success('All notifications marked as read.');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to update notifications');
        }
    };

    const getInitials = (name = '') =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const inputErrorStyle = (field) => (gigErrors[field] ? { borderColor: 'var(--danger)' } : undefined);
    const skillOptions = SUBCATEGORY_SKILLS[gigForm.subcategory] || CATEGORY_SKILLS[gigForm.category] || [];

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
    const clientHistoryGigs = [...myGigs].sort(
        (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );

    const workerActiveGigs = myGigs
        .filter(g => ['accepted', 'in-progress'].includes(g.status))
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    const workerHistoryGigs = myGigs
        .filter(g => g.status === 'completed')
        .sort((a, b) => new Date(b.workEndedAt || b.updatedAt || b.createdAt) - new Date(a.workEndedAt || a.updatedAt || a.createdAt));
    const workerHistoryApplications = myApplications.filter(a => ['accepted', 'rejected'].includes(a.status));
    const workerTotalHours = workerHistoryGigs.reduce((sum, gig) => sum + Number(gig.totalWorkHours || 0), 0);
    const workerRecentJob = workerHistoryGigs[0] || null;

    const SIDEBAR_TABS = user?.role === 'client'
        ? [
            { id: 'jobs', label: 'My Jobs', icon: '📋' },
            { id: 'notifications', label: 'Notifications', icon: '🔔' },
            { id: 'history', label: 'History', icon: '🕘' },
            { id: 'profile', label: 'Profile', icon: '👤' },
        ]
        : [
            { id: 'applications', label: 'My Applications', icon: '📨' },
            { id: 'active', label: 'Active Jobs', icon: '⚡' },
            { id: 'messages', label: 'Messages', icon: '💬' },
            { id: 'notifications', label: 'Notifications', icon: '🔔' },
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
                    {user?.role !== 'client' && (
                        <Link to="/gigs" className="sidebar-link">
                            <span className="icon">🔍</span>
                            Browse Jobs
                        </Link>
                    )}
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
                                <p>Your posted jobs will appear here once you create them.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Job Title</th>
                                            <th>Budget</th>
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
                                                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/gigs/${gig._id}`)}>View / Update</button>
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

                {activeTab === 'messages' && user?.role === 'worker' && (
                    <div>
                        <div className="section-header">
                            <h2 className="section-title">Worker Messages</h2>
                        </div>

                        {loading ? (
                            <div className="loading-center"><div className="spinner" /></div>
                        ) : workerUpdates.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">💬</div>
                                <h3>No messages yet</h3>
                                <p>Client chat, accepted/rejected, payment, and invoice updates will appear here.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                {workerUpdates.map((item, idx) => (
                                    <div key={`${item.type}-${item.gigId || idx}-${item.createdAt || idx}`} className="card" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <div>
                                                <p style={{ fontWeight: 700 }}>{item.gigTitle || 'Job Update'}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{item.message}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {item.gigId && (
                                                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/gigs/${item.gigId}`)}>
                                                        View Job
                                                    </button>
                                                )}
                                                {item.type === 'invoice' && item.gigId && (
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadInvoice(item.gigId)}>
                                                        Download Invoice
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div>
                        <div className="section-header">
                            <h2 className="section-title">Notifications{unreadNotificationCount > 0 ? ` (${unreadNotificationCount} unread)` : ''}</h2>
                            <button className="btn btn-ghost btn-sm" onClick={handleMarkAllNotificationsRead}>
                                Mark all as read
                            </button>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🔔</div>
                                <h3>No notifications yet</h3>
                                <p>Selected workers, rejected applicants, payment updates, and live system alerts will appear here.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                {notifications.map((notification) => (
                                    <div key={notification._id} className="card" style={{ padding: '1rem', borderLeft: notification.isRead ? '4px solid var(--border)' : '4px solid var(--secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <div>
                                                <p style={{ fontWeight: 700 }}>{notification.title}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', whiteSpace: 'pre-wrap' }}>{notification.message}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                                {notification.relatedGig?._id && (
                                                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/gigs/${notification.relatedGig._id}`)}>
                                                        View Job
                                                    </button>
                                                )}
                                                {!notification.isRead && (
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleMarkNotificationRead(notification._id)}>
                                                        Mark read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─────── Profile Tab ─────── */}
                {activeTab === 'profile' && (
                    <ProfileSection
                        user={user}
                        workerStats={{
                            completedJobs: workerHistoryGigs.length,
                            totalHours: Number(workerTotalHours.toFixed(2)),
                            acceptedApplications: myApplications.filter(a => a.status === 'accepted').length,
                            recentJob: workerRecentJob,
                        }}
                    />
                )}
            </main>

            {/* ── Create Job Modal ── */}
            <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Post a New Job" size="lg">
                <form className="modal-form" onSubmit={handleCreateGig}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label>Job Title *</label>
                            <input
                                placeholder="Enter a clear job title"
                                value={gigForm.title}
                                onChange={e => {
                                    const value = e.target.value;
                                    setGigForm(p => ({ ...p, title: value }));
                                    setGigErrors(prev => ({ ...prev, title: undefined }));
                                }}
                                style={inputErrorStyle('title')}
                                required
                            />
                            <small style={{ color: 'var(--text-muted)' }}>
                                You can post any type of gig here, from tech and design to home services, delivery, and education.
                            </small>
                            {gigErrors.title && <small style={{ color: 'var(--danger)' }}>{gigErrors.title}</small>}
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label>Description *</label>
                            <textarea
                                placeholder="Describe the work in detail — what you need, requirements, deliverables..."
                                value={gigForm.description}
                                onChange={e => {
                                    const value = e.target.value;
                                    setGigForm(p => ({ ...p, description: value }));
                                    setGigErrors(prev => ({ ...prev, description: undefined }));
                                }}
                                style={inputErrorStyle('description')}
                                required
                                rows={4}
                            />
                            {gigErrors.description && <small style={{ color: 'var(--danger)' }}>{gigErrors.description}</small>}
                        </div>
                        <div className="form-group">
                            <label>Budget (₹) *</label>
                            <input
                                type="number"
                                placeholder="e.g. 5000"
                                value={gigForm.budget}
                                onChange={e => {
                                    const value = e.target.value;
                                    setGigForm(p => ({ ...p, budget: value }));
                                    setGigErrors(prev => ({ ...prev, budget: undefined }));
                                }}
                                required
                                min={1}
                                style={inputErrorStyle('budget')}
                            />
                            {gigErrors.budget && <small style={{ color: 'var(--danger)' }}>{gigErrors.budget}</small>}
                        </div>
                        <div className="form-group">
                            <label>Category *</label>
                            <select
                                value={gigForm.category}
                                onChange={e => {
                                    const nextCategory = e.target.value;
                                    setGigForm(p => ({
                                        ...p,
                                        category: nextCategory,
                                        subcategory: JOB_CATEGORIES[nextCategory][0],
                                        skills: [],
                                    }));
                                    setGigErrors(prev => ({ ...prev, category: undefined, subcategory: undefined, skills: undefined }));
                                }}
                                style={inputErrorStyle('category')}
                            >
                                {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {gigErrors.category && <small style={{ color: 'var(--danger)' }}>{gigErrors.category}</small>}
                        </div>
                        <div className="form-group">
                            <label>Subcategory *</label>
                            <select
                                value={gigForm.subcategory}
                                onChange={e => {
                                    const value = e.target.value;
                                    setGigForm(p => ({ ...p, subcategory: value, skills: [] }));
                                    setGigErrors(prev => ({ ...prev, subcategory: undefined, skills: undefined }));
                                }}
                                style={inputErrorStyle('subcategory')}
                            >
                                {(JOB_CATEGORIES[gigForm.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {gigErrors.subcategory && <small style={{ color: 'var(--danger)' }}>{gigErrors.subcategory}</small>}
                        </div>
                        <div className="form-group">
                            <label>Deadline</label>
                            <input
                                type="date"
                                value={gigForm.deadline}
                                onChange={e => {
                                    const value = e.target.value;
                                    setGigForm(p => ({ ...p, deadline: value }));
                                    setGigErrors(prev => ({ ...prev, deadline: undefined }));
                                }}
                                min={new Date().toISOString().split('T')[0]}
                                style={inputErrorStyle('deadline')}
                            />
                            {gigErrors.deadline && <small style={{ color: 'var(--danger)' }}>{gigErrors.deadline}</small>}
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label>Required Skills *</label>
                            <div
                                style={{
                                    ...inputErrorStyle('skills'),
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: gigErrors.skills ? 'var(--danger)' : 'var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-input)',
                                    padding: '0.7rem',
                                }}
                            >
                                {skillOptions.length === 0 ? (
                                    <small style={{ color: 'var(--text-muted)' }}>No skills configured for this subcategory.</small>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                                        {skillOptions.map(skill => {
                                            const checked = gigForm.skills.includes(skill);
                                            return (
                                                <label key={skill} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            setGigForm(prev => ({
                                                                ...prev,
                                                                skills: e.target.checked
                                                                    ? [...prev.skills, skill]
                                                                    : prev.skills.filter((item) => item !== skill),
                                                            }));
                                                            setGigErrors(prev => ({ ...prev, skills: undefined }));
                                                        }}
                                                    />
                                                    <span style={{ fontSize: '0.9rem' }}>{skill}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <small style={{ color: 'var(--text-muted)' }}>
                                Select one or more skills relevant to the selected subcategory.
                            </small>
                            {gigErrors.skills && <small style={{ color: 'var(--danger)' }}>{gigErrors.skills}</small>}
                        </div>
                        <div className="form-group">
                            <label>Duration *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="Enter duration"
                                    value={gigForm.durationValue}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setGigForm(p => ({ ...p, durationValue: value }));
                                        setGigErrors(prev => ({ ...prev, durationValue: undefined }));
                                    }}
                                    style={inputErrorStyle('durationValue')}
                                    required
                                />
                                <select
                                    value={gigForm.durationUnit}
                                    onChange={e => setGigForm(p => ({ ...p, durationUnit: e.target.value }))}
                                >
                                    <option value="days">Days</option>
                                    <option value="weeks">Weeks</option>
                                </select>
                            </div>
                            {gigErrors.durationValue && <small style={{ color: 'var(--danger)' }}>{gigErrors.durationValue}</small>}
                        </div>
                        <div className="form-group">
                            <label>Location *</label>
                            <input
                                placeholder="City / Area"
                                value={gigForm.location}
                                onChange={e => {
                                    const value = e.target.value;
                                    setGigForm(p => ({ ...p, location: value }));
                                    setGigErrors(prev => ({ ...prev, location: undefined }));
                                }}
                                style={inputErrorStyle('location')}
                                required
                            />
                            {gigErrors.location && <small style={{ color: 'var(--danger)' }}>{gigErrors.location}</small>}
                        </div>
                        <div className="form-group">
                            <label>Workers Required *</label>
                            <input
                                type="number"
                                min={1}
                                value={gigForm.requiredWorkers}
                                placeholder="Enter number of workers"
                                onChange={e => {
                                    const value = e.target.value;
                                    setGigForm(p => ({ ...p, requiredWorkers: value }));
                                    setGigErrors(prev => ({ ...prev, requiredWorkers: undefined }));
                                }}
                                style={inputErrorStyle('requiredWorkers')}
                                required
                            />
                            {gigErrors.requiredWorkers && <small style={{ color: 'var(--danger)' }}>{gigErrors.requiredWorkers}</small>}
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
const ProfileSection = ({ user, workerStats }) => {
    const { updateUser } = useAuth();
    const { success, error: toastError } = useToast();
    const [form, setForm] = useState({
        name: user?.name || '',
        bio: user?.bio || '',
        location: user?.location || '',
        phone: user?.phone || '',
        gender: user?.gender || '',
        workType: user?.workType || 'Freelancer',
        skills: user?.skills || [],
    });
    const [skillInput, setSkillInput] = useState('');
    const [saving, setSaving] = useState(false);
    const suggestedSkills = WORK_TYPE_SKILL_PRESETS[form.workType] || BASIC_WORKER_SKILLS;

    const addSkill = (value) => {
        const cleaned = String(value || '').trim();
        if (!cleaned) return;
        setForm((prev) => {
            if (prev.skills.some((skill) => skill.toLowerCase() === cleaned.toLowerCase())) return prev;
            return { ...prev, skills: [...prev.skills, cleaned] };
        });
        setSkillInput('');
    };

    const removeSkill = (value) => {
        setForm((prev) => ({
            ...prev,
            skills: prev.skills.filter((skill) => skill !== value),
        }));
    };

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
                gender: form.gender,
                workType: form.workType,
                skills: form.skills,
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

            {user?.role === 'worker' && workerStats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem', marginBottom: '1.2rem' }}>
                    <div className="card" style={{ padding: '0.9rem' }}>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Completed Jobs</p>
                        <p style={{ fontWeight: 800, fontSize: '1.35rem', marginTop: '0.25rem' }}>{workerStats.completedJobs}</p>
                    </div>
                    <div className="card" style={{ padding: '0.9rem' }}>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Work Hours</p>
                        <p style={{ fontWeight: 800, fontSize: '1.35rem', marginTop: '0.25rem' }}>{workerStats.totalHours} hrs</p>
                    </div>
                    <div className="card" style={{ padding: '0.9rem' }}>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Accepted Applications</p>
                        <p style={{ fontWeight: 800, fontSize: '1.35rem', marginTop: '0.25rem' }}>{workerStats.acceptedApplications}</p>
                    </div>
                </div>
            )}

            {user?.role === 'worker' && workerStats?.recentJob && (
                <div className="card" style={{ marginBottom: '1.2rem' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '0.6rem' }}>Recent Work</h3>
                    <p style={{ fontWeight: 600 }}>{workerStats.recentJob.title}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        ₹{workerStats.recentJob.budget?.toLocaleString('en-IN')} • {workerStats.recentJob.totalWorkHours || 0} hrs
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Completed on {new Date(workerStats.recentJob.workEndedAt || workerStats.recentJob.updatedAt || workerStats.recentJob.createdAt).toLocaleDateString()}
                    </p>
                </div>
            )}

            <div className="profile-header">
                <div className="profile-avatar">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                    <h2 className="profile-name">{user?.name}</h2>
                    <div className="profile-meta">
                        <span className={`role-badge ${user?.role}`}>{user?.role}</span>
                        {user?.gender && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>👤 {user.gender === 'male' ? 'Male' : 'Female'}</span>}
                        {user?.phone && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📞 {user.phone}</span>}
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
                        <input placeholder="Phone number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))} />
                    </div>
                    <div className="form-group">
                        <label>Gender</label>
                        <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
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
                                <label>Skills</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.5rem' }}>
                                    {form.skills.length ? form.skills.map((skill) => (
                                        <span key={skill} className="skill-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                            {skill}
                                            <button
                                                type="button"
                                                onClick={() => removeSkill(skill)}
                                                style={{ border: 0, background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
                                                aria-label={`Remove ${skill}`}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    )) : <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No skills added yet.</span>}
                                </div>
                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                    <input
                                        list="worker-skill-options"
                                        placeholder="Type any work (e.g., Electrician) and click Add"
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addSkill(skillInput);
                                            }
                                        }}
                                    />
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => addSkill(skillInput)}>
                                        Add
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                                    You can type any custom work and press Enter to add it directly.
                                </p>
                                <datalist id="worker-skill-options">
                                    {PROFILE_SKILL_OPTIONS.map((skill) => <option key={skill} value={skill} />)}
                                </datalist>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.55rem' }}>
                                    Basic skills for {form.workType}:
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                                    {suggestedSkills.map((skill) => (
                                        <button
                                            key={skill}
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => addSkill(skill)}
                                            style={{ padding: '0.25rem 0.55rem' }}
                                        >
                                            + {skill}
                                        </button>
                                    ))}
                                </div>
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
