import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    getAdminStats,
    getAdminGigs,
    getAllUsers,
    getAllApplications,
    toggleStatus,
    deleteUserByAdmin,
    getAdminReviews,
    adminDeleteReview,
    getAdminReports,
    resolveAdminReport,
    getAdminPayments,
} from '../services/api';

const Admin = () => {
    const { user } = useAuth();
    const { success, error: toastError, info } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [gigs, setGigs] = useState([]);
    const [users, setUsers] = useState([]);
    const [applications, setApplications] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reports, setReports] = useState([]);
    const [paymentSummary, setPaymentSummary] = useState({ totalPayments: 0, totalVolume: 0, payments: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            const [statsRes, gigsRes, usersRes, appsRes, reviewsRes, reportsRes, paymentsRes] = await Promise.all([
                getAdminStats(),
                getAdminGigs(),
                getAllUsers(),
                getAllApplications(),
                getAdminReviews(),
                getAdminReports(),
                getAdminPayments(),
            ]);
            setStats(statsRes.data);
            setGigs(gigsRes.data || []);
            setUsers(usersRes.data);
            setApplications(appsRes.data);
            setReviews(reviewsRes.data);
            setReports(reportsRes.data);
            setPaymentSummary(paymentsRes.data);
        } catch (err) {
            toastError('Failed to load admin data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdminData();
    }, []);

    const handleToggleUser = async (userId, isActive) => {
        try {
            await toggleStatus(userId);
            setUsers(prev => prev.map(u => (u._id === userId ? { ...u, isActive: !u.isActive } : u)));
            success(`User ${isActive ? 'deactivated' : 'activated'}.`);
        } catch {
            toastError('Failed to update user status.');
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Delete ${userName}? This will remove related records.`)) return;
        try {
            await deleteUserByAdmin(userId);
            setUsers(prev => prev.filter(u => u._id !== userId));
            setApplications(prev => prev.filter(a => a.worker?._id !== userId && a.client?._id !== userId));
            setReports(prev => prev.filter(r => r.reporter?._id !== userId && r.targetUser?._id !== userId));
            success('User deleted successfully.');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to delete user.');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Delete this review?')) return;
        try {
            await adminDeleteReview(reviewId);
            setReviews(prev => prev.filter(r => r._id !== reviewId));
            setReports(prev => prev.filter(r => r.targetReview?._id !== reviewId));
            success('Review deleted.');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to delete review.');
        }
    };

    const resolveActionOptions = {
        gig: ['remove_gig', 'dismissed'],
        user: ['block_user', 'dismissed'],
        review: ['remove_review', 'dismissed'],
    };

    const handleResolveReport = async (report) => {
        const options = resolveActionOptions[report.targetType] || ['dismissed'];
        const actionTaken = window.prompt(`Choose action: ${options.join(', ')}`, options[0]);
        if (!actionTaken || !options.includes(actionTaken)) {
            info('Report action cancelled.');
            return;
        }

        const adminNote = window.prompt('Add admin note (optional):', '') || '';

        try {
            const { data } = await resolveAdminReport(report._id, { actionTaken, adminNote });
            setReports(prev => prev.map(r => (r._id === report._id ? data : r)));
            if (actionTaken === 'remove_gig' && report.targetGig?._id) {
                setGigs(prev => prev.filter(g => g._id !== report.targetGig._id));
            }
            if (actionTaken === 'remove_review' && report.targetReview?._id) {
                setReviews(prev => prev.filter(r => r._id !== report.targetReview._id));
            }
            if (actionTaken === 'block_user' && report.targetUser?._id) {
                setUsers(prev => prev.map(u => (u._id === report.targetUser._id ? { ...u, isActive: false } : u)));
            }
            success('Report handled successfully.');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to resolve report.');
        }
    };

    const openReports = useMemo(() => reports.filter(r => r.status === 'open'), [reports]);
    const activeGigs = useMemo(
        () => gigs.filter(gig => ['open', 'pending', 'in-progress'].includes(gig.status)),
        [gigs]
    );

    const TABS = [
        { id: 'overview', label: 'Overview', icon: 'OV' },
        { id: 'profile', label: 'Admin Profile', icon: 'PR' },
        { id: 'users', label: 'Users', icon: 'US' },
        { id: 'applications', label: 'Applications', icon: 'AP' },
        { id: 'reviews', label: 'Reviews', icon: 'RV' },
        { id: 'reports', label: 'Reports', icon: 'RP' },
        { id: 'payments', label: 'Payments', icon: 'PM' },
    ];

    return (
        <div className="dashboard-layout" style={{ minHeight: 'calc(100vh - 72px)' }}>
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
                        {activeTab === 'overview' && stats && (
                            <div className="animate-fade-in">
                                <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Platform Overview</h2>
                                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                                    <div className="stat-card"><div className="stat-icon indigo">U</div><div><div className="stat-value">{stats.totalUsers}</div><div className="stat-label">Users</div></div></div>
                                    <div className="stat-card"><div className="stat-icon green">G</div><div><div className="stat-value">{stats.totalGigs}</div><div className="stat-label">Gigs</div></div></div>
                                    <div className="stat-card"><div className="stat-icon amber">A</div><div><div className="stat-value">{stats.totalApplications}</div><div className="stat-label">Applications</div></div></div>
                                    <div className="stat-card"><div className="stat-icon blue">R</div><div><div className="stat-value">{stats.totalReviews}</div><div className="stat-label">Reviews</div></div></div>
                                    <div className="stat-card"><div className="stat-icon blue">RP</div><div><div className="stat-value">{stats.totalReports || 0}</div><div className="stat-label">Reports</div></div></div>
                                    <div className="stat-card"><div className="stat-icon green">P</div><div><div className="stat-value">{stats.totalPayments || 0}</div><div className="stat-label">Payments</div></div></div>
                                    <div className="stat-card"><div className="stat-icon amber">AJ</div><div><div className="stat-value">{activeGigs.length}</div><div className="stat-label">Active Jobs</div></div></div>
                                </div>

                                <div className="card">
                                    <div className="section-header" style={{ marginBottom: '1rem' }}>
                                        <h3 className="section-title">Active Jobs</h3>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{activeGigs.length} running</span>
                                    </div>
                                    {activeGigs.length === 0 ? (
                                        <p style={{ color: 'var(--text-secondary)' }}>No active jobs currently.</p>
                                    ) : (
                                        <div className="table-container">
                                            <table>
                                                <thead>
                                                    <tr><th>Title</th><th>Client</th><th>Budget</th><th>Status</th><th>Created</th><th>View</th></tr>
                                                </thead>
                                                <tbody>
                                                    {activeGigs.slice(0, 10).map(gig => (
                                                        <tr key={gig._id}>
                                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{gig.title}</td>
                                                            <td>{gig.client?.name || 'Unknown'}</td>
                                                            <td>INR {Number(gig.budget || 0).toLocaleString('en-IN')}</td>
                                                            <td><span className={`gig-status-badge status-${gig.status}`}>{gig.status}</span></td>
                                                            <td>{new Date(gig.createdAt).toLocaleDateString()}</td>
                                                            <td>
                                                                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/gigs/${gig._id}`)}>Open</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="animate-fade-in card">
                                <h2 className="section-title" style={{ marginBottom: '1rem' }}>Admin Profile</h2>
                                <div style={{ display: 'grid', gap: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <div><strong>Name:</strong> {user?.name}</div>
                                    <div><strong>Email:</strong> {user?.email}</div>
                                    <div><strong>Role:</strong> <span className="role-badge admin">{user?.role}</span></div>
                                    <div><strong>Open reports:</strong> {openReports.length}</div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="animate-fade-in">
                                <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>User Management ({users.length})</h2>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u._id}>
                                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                                                    <td>{u.email}</td>
                                                    <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                                                    <td>{u.isActive ? 'Active' : 'Inactive'}</td>
                                                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                            {u._id !== user._id && (
                                                                <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggleUser(u._id, u.isActive)}>
                                                                    {u.isActive ? 'Block' : 'Unblock'}
                                                                </button>
                                                            )}
                                                            {u._id !== user._id && (
                                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u._id, u.name)}>
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'applications' && (
                            <div className="animate-fade-in">
                                <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Application Monitoring ({applications.length})</h2>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>Worker</th><th>Gig</th><th>Client</th><th>Price</th><th>Status</th><th>Date</th></tr>
                                        </thead>
                                        <tbody>
                                            {applications.map(app => (
                                                <tr key={app._id}>
                                                    <td>{app.worker?.name}</td>
                                                    <td>{app.gig?.title}</td>
                                                    <td>{app.client?.name}</td>
                                                    <td>INR {app.proposedPrice?.toLocaleString('en-IN')}</td>
                                                    <td><span className={`app-status ${app.status}`}>{app.status}</span></td>
                                                    <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="animate-fade-in">
                                <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Review Moderation ({reviews.length})</h2>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>Gig</th><th>Reviewer</th><th>Reviewee</th><th>Rating</th><th>Comment</th><th>Action</th></tr>
                                        </thead>
                                        <tbody>
                                            {reviews.map(review => (
                                                <tr key={review._id}>
                                                    <td>{review.gig?.title}</td>
                                                    <td>{review.reviewer?.name}</td>
                                                    <td>{review.reviewee?.name}</td>
                                                    <td>{review.rating}/5</td>
                                                    <td style={{ maxWidth: 260 }}>{review.comment}</td>
                                                    <td>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteReview(review._id)}>
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="animate-fade-in">
                                <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Reports & Complaints ({reports.length})</h2>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>Reporter</th><th>Type</th><th>Reason</th><th>Status</th><th>Target</th><th>Action</th></tr>
                                        </thead>
                                        <tbody>
                                            {reports.map(report => (
                                                <tr key={report._id}>
                                                    <td>{report.reporter?.name || 'Unknown'}</td>
                                                    <td style={{ textTransform: 'capitalize' }}>{report.targetType}</td>
                                                    <td>{report.reason}</td>
                                                    <td>{report.status}</td>
                                                    <td>
                                                        {report.targetGig?.title || report.targetUser?.name || (report.targetReview ? 'Review' : 'N/A')}
                                                    </td>
                                                    <td>
                                                        {report.status === 'open' ? (
                                                            <button className="btn btn-primary btn-sm" onClick={() => handleResolveReport(report)}>
                                                                Resolve
                                                            </button>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)' }}>{report.actionTaken}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="animate-fade-in">
                                <h2 className="section-title" style={{ marginBottom: '0.9rem' }}>Payment Monitoring</h2>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                                    <div className="card" style={{ minWidth: 220 }}>
                                        <div className="stat-label">Total Payments</div>
                                        <div className="stat-value">{paymentSummary.totalPayments || 0}</div>
                                    </div>
                                    <div className="card" style={{ minWidth: 220 }}>
                                        <div className="stat-label">Total Volume</div>
                                        <div className="stat-value">INR {Number(paymentSummary.totalVolume || 0).toLocaleString('en-IN')}</div>
                                    </div>
                                </div>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>Gig</th><th>Client</th><th>Worker</th><th>Amount</th><th>Paid At</th></tr>
                                        </thead>
                                        <tbody>
                                            {(paymentSummary.payments || []).map(payment => (
                                                <tr key={payment._id}>
                                                    <td>{payment.gig?.title}</td>
                                                    <td>{payment.client?.name}</td>
                                                    <td>{payment.worker?.name}</td>
                                                    <td>INR {payment.amount?.toLocaleString('en-IN')}</td>
                                                    <td>{new Date(payment.paidAt).toLocaleDateString()}</td>
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
