import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    getGigById,
    applyForGig,
    getGigApplications,
    updateAppStatus,
    addReview,
    getGigReviews,
    deleteGig,
    updateGig,
    markGigPaymentDone,
    completeGig,
    getGigInvoice,
    getGigMessages,
    sendGigMessage,
} from '../services/api';
import Modal from '../components/Modal';
import StarRating from '../components/StarRating';
import { CATEGORY_ICONS, CATEGORY_LIST, JOB_CATEGORIES } from '../constants/gigMeta';

const GigDetail = () => {
    const { id } = useParams();
    const { user, isAuthenticated, token } = useAuth();
    const { success, error: toastError, info } = useToast();
    const navigate = useNavigate();

    const [gig, setGig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [applyModal, setApplyModal] = useState(false);
    const [reviewModal, setReviewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [proposal, setProposal] = useState('');
    const [proposedPrice, setProposedPrice] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [messages, setMessages] = useState([]);
    const [chatText, setChatText] = useState('');
    const [chatReceiver, setChatReceiver] = useState('');
    const [offerAmount, setOfferAmount] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatAllowed, setChatAllowed] = useState(false);

    const isOwner = user && gig && gig.client?._id === user._id;
    const isWorker = user?.role === 'worker';
    const isClient = user?.role === 'client';
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await getGigById(id);
                setGig(data);
                setEditForm({
                    title: data.title, description: data.description,
                    budget: data.budget, category: data.category,
                    subcategory: data.subcategory,
                    skills: data.skills?.join(', '), deadline: data.deadline?.split('T')[0] || '',
                    status: data.status, duration: data.duration || '',
                    location: data.location || '',
                    requiredWorkers: data.requiredWorkers || 1,
                });

                const canViewApplications =
                    !!user &&
                    (user.role === 'admin' || data.client?._id === user._id);

                if (isAuthenticated) {
                    try {
                        const [appRes, revRes] = await Promise.all([
                            canViewApplications ? getGigApplications(id).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                            getGigReviews(id),
                        ]);
                        setApplications(appRes.data);
                        setReviews(revRes.data);
                    } catch { }
                }
            } catch {
                toastError('Failed to load job details.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, isAuthenticated, user?._id, user?.role]);

    useEffect(() => {
        const loadMessages = async () => {
            if (!isAuthenticated || !gig || !user) return;

            if (user.role !== 'admin' && user.role !== 'client' && user.role !== 'worker') {
                setChatAllowed(false);
                return;
            }

            setChatLoading(true);
            try {
                const { data } = await getGigMessages(id);
                setMessages(data);
                setChatAllowed(true);
            } catch (err) {
                setMessages([]);
                if (err?.response?.status === 403) {
                    setChatAllowed(false);
                }
            } finally {
                setChatLoading(false);
            }
        };

        loadMessages();
    }, [id, gig, isAuthenticated, isOwner, isAdmin, user?._id]);

    const handleApply = async (e) => {
        e.preventDefault();
        if (!token) {
            toastError('Your session is missing. Please login again.');
            navigate('/login');
            return;
        }
        setSubmitting(true);
        try {
            await applyForGig(id, { proposal, proposedPrice: Number(proposedPrice) });
            success('Application submitted successfully! 🎉');
            setApplyModal(false);
            setProposal(''); setProposedPrice('');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to apply');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (app) => {
        try {
            let payload = { status: app.status };
            if (app.status === 'accepted') {
                const input = window.prompt('Set final agreed amount in ₹', String(app.proposedPrice || gig.budget || ''));
                if (input === null) return;
                payload = {
                    status: 'accepted',
                    finalAmount: Number(input),
                };
            }

            await updateAppStatus(app._id, payload);
            const [appRes, gigRes] = await Promise.all([getGigApplications(id), getGigById(id)]);
            setApplications(appRes.data);
            setGig(gigRes.data);
            if (app.status === 'accepted') success('Worker finalized with negotiated amount. Post is now inactive for new applicants. ✅');
            else info(`Application ${app.status}.`);
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleMarkPayment = async () => {
        try {
            const { data } = await markGigPaymentDone(id);
            setGig(data);
            success('Payment marked done. Job moved to In Progress. 💳');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to mark payment');
        }
    };

    const handleCompleteGig = async () => {
        try {
            const { data } = await completeGig(id);
            setGig(data);
            success('Job marked as completed. ✅');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to complete job');
        }
    };

    const handleDownloadInvoice = async () => {
        try {
            const { data } = await getGigInvoice(id);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${id}.json`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to generate invoice');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatReceiver) return;
        if (!chatText.trim() && !offerAmount) return;

        try {
            const payload = {
                receiverId: chatReceiver,
                message: chatText,
            };

            if (offerAmount) {
                payload.messageType = 'offer';
                payload.amountOffer = Number(offerAmount);
            }

            const { data } = await sendGigMessage(id, payload);
            setMessages(prev => [...prev, data]);
            setChatText('');
            setOfferAmount('');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to send message');
        }
    };

    const handleReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const revieweeId = isClient ? gig.worker?._id : gig.client?._id;
        try {
            await addReview(id, { rating: reviewRating, comment: reviewComment, revieweeId });
            success('Review submitted! Thank you. ⭐');
            setReviewModal(false);
            const { data } = await getGigReviews(id);
            setReviews(data);
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this job posting?')) return;
        try {
            await deleteGig(id);
            success('Job deleted.');
            navigate('/dashboard');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to delete job');
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...editForm,
                skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
                budget: Number(editForm.budget),
                requiredWorkers: Number(editForm.requiredWorkers),
            };
            const { data } = await updateGig(id, payload);
            setGig(data);
            setEditModal(false);
            success('Job updated! ✅');
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to update job');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="container section">
            <div className="loading-center"><div className="spinner" /></div>
        </div>
    );

    if (!gig) return (
        <div className="container section">
            <div className="empty-state">
                <div className="empty-state-icon">❌</div>
                <h3>Job not found</h3>
                <Link to="/gigs" className="btn btn-primary">Browse Jobs</Link>
            </div>
        </div>
    );

    const hasReviewed = reviews.some(r => r.reviewer?._id === user?._id);
    const canReview = isAuthenticated && gig.status === 'completed' && !hasReviewed &&
        (isClient ? !!gig.worker : gig.worker?._id === user?._id);

    return (
        <div className="container section animate-fade-in">
            <div style={{ marginBottom: '1.5rem' }}>
                <Link to="/gigs" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    ← Back to Jobs
                </Link>
            </div>

            <div className="gig-detail-grid">
                {/* ── Main Content ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Header Card */}
                    <div className="gig-detail-card">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                            <span className="gig-category-badge">
                                {CATEGORY_ICONS[gig.category] || '🔧'} {gig.category} • {gig.subcategory}
                            </span>
                            <span className={`gig-status-badge status-${gig.status}`}>{gig.status}</span>
                        </div>

                        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.3 }}>
                            {gig.title}
                        </h1>

                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                            {gig.description}
                        </p>

                        {gig.skills?.length > 0 && (
                            <div style={{ marginTop: '1.25rem' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Skills Required</p>
                                <div className="gig-skills">
                                    {gig.skills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Client Info */}
                    <div className="gig-detail-card">
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posted By</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="nav-avatar" style={{ width: 48, height: 48, fontSize: '1.1rem' }}>
                                {gig.client?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: '1rem' }}>{gig.client?.name}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{gig.client?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Applications (for gig owner / admin) */}
                    {(isOwner || isAdmin) && applications.length > 0 && (
                        <div className="gig-detail-card">
                            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Applications ({applications.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {applications.map(app => (
                                    <div key={app._id} style={{
                                        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
                                        padding: '1.25rem', border: '1px solid var(--border)',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="nav-avatar">{app.worker?.name?.[0]?.toUpperCase()}</div>
                                                <div>
                                                    <p style={{ fontWeight: 700 }}>{app.worker?.name}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.worker?.email}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '1.1rem' }}>
                                                    ₹{app.proposedPrice?.toLocaleString('en-IN')}
                                                </span>
                                                <span className={`app-status ${app.status}`}>{app.status}</span>
                                            </div>
                                        </div>

                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.75rem', lineHeight: 1.6 }}>
                                            {app.proposal}
                                        </p>

                                        <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                            <div>📞 {app.worker?.phone || 'Not provided'} • 📍 {app.worker?.location || 'Not provided'}</div>
                                            <div>🧑‍💼 {app.worker?.workType || 'Not provided'}</div>
                                            <div>📝 {app.worker?.bio || 'No bio added'}</div>
                                            {app.workerProfile?.missingProfileFields?.length > 0 && (
                                                <div style={{ color: 'var(--warning)' }}>
                                                    Missing profile fields: {app.workerProfile.missingProfileFields.join(', ')}
                                                </div>
                                            )}
                                        </div>

                                        {app.worker?.skills?.length > 0 && (
                                            <div className="gig-skills" style={{ marginTop: '0.6rem' }}>
                                                {app.worker.skills.slice(0, 6).map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
                                            </div>
                                        )}

                                        {app.status === 'pending' && ['open', 'pending', 'accepted'].includes(gig.status) && (
                                            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
                                                <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus({ ...app, status: 'accepted' })}>
                                                    ✓ Accept
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleUpdateStatus({ ...app, status: 'rejected' })}>
                                                    ✕ Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reviews Section */}
                    <div className="gig-detail-card">
                        <div className="section-header">
                            <h3 style={{ fontWeight: 700 }}>Reviews ({reviews.length})</h3>
                            {canReview && (
                                <button className="btn btn-primary btn-sm" onClick={() => setReviewModal(true)}>
                                    ✍ Write Review
                                </button>
                            )}
                        </div>
                        {reviews.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No reviews yet for this job.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {reviews.map(rev => (
                                    <div key={rev._id} className="review-card">
                                        <div className="review-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <div className="nav-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                                                    {rev.reviewer?.name?.[0]?.toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{rev.reviewer?.name}</span>
                                                <span className={`role-badge ${rev.reviewer?.role}`}>{rev.reviewer?.role}</span>
                                            </div>
                                            <StarRating rating={rev.rating} size="sm" />
                                        </div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{rev.comment}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                            {new Date(rev.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat Section */}
                    {isAuthenticated && chatAllowed && (
                        <div className="gig-detail-card">
                            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Job Chat (Bargaining)</h3>
                            <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.75rem', marginBottom: '0.75rem' }}>
                                {chatLoading ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading messages...</p>
                                ) : messages.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No messages yet.</p>
                                ) : (
                                    messages.map(msg => (
                                        <div key={msg._id} style={{ marginBottom: '0.6rem' }}>
                                            <strong>{msg.sender?.name}: </strong>
                                            <span>{msg.message}</span>
                                            {msg.amountOffer ? (
                                                <span style={{ marginLeft: '0.5rem', color: 'var(--secondary)', fontWeight: 700 }}>
                                                    (Offer: ₹{Number(msg.amountOffer).toLocaleString('en-IN')})
                                                </span>
                                            ) : null}
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleString()}</div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <select value={chatReceiver} onChange={e => setChatReceiver(e.target.value)} required>
                                    <option value="">Select receiver</option>
                                    {[
                                        gig.client,
                                        ...(gig.assignedWorkers || []),
                                        ...applications.map(a => a.worker).filter(Boolean),
                                    ]
                                        .filter(Boolean)
                                        .filter((u, idx, arr) => arr.findIndex(x => x._id === u._id) === idx)
                                        .filter(u => u._id !== user?._id)
                                        .map(u => (
                                            <option key={u._id} value={u._id}>{u.name}</option>
                                        ))}
                                </select>
                                <textarea value={chatText} onChange={e => setChatText(e.target.value)} rows={2} placeholder="Write a message" />
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="Optional bargaining offer amount (₹)"
                                    value={offerAmount}
                                    onChange={e => setOfferAmount(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>Send</button>
                            </form>
                        </div>
                    )}
                </div>

                {/* ── Sidebar ── */}
                <div className="gig-detail-sidebar">
                    <div className="sidebar-action-card">
                        <div style={{ marginBottom: '1.25rem' }}>
                            <span className="gig-budget" style={{ fontSize: '2rem' }}>₹{gig.budget?.toLocaleString('en-IN')}</span>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Project Budget</p>
                        </div>

                        {gig.deadline && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Deadline</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                    {new Date(gig.deadline).toLocaleDateString()}
                                </span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Duration</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{gig.duration || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Location</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{gig.location || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Workers</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{gig.assignedWorkers?.length || 0} / {gig.requiredWorkers || 1}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payment</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{gig.paymentStatus || 'unpaid'}</span>
                        </div>

                        {gig.worker && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assigned Worker</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{gig.worker?.name}</span>
                            </div>
                        )}

                        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {isWorker && gig.status === 'open' && !isOwner && (
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                    onClick={() => isAuthenticated ? setApplyModal(true) : navigate('/login')}
                                >
                                    🚀 Apply Now
                                </button>
                            )}

                            {!isAuthenticated && (
                                <Link to="/login" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                                    🔒 Sign In to Apply
                                </Link>
                            )}

                            {(isOwner || isAdmin) && (
                                <>
                                    {isOwner && gig.status === 'accepted' && gig.paymentStatus !== 'paid' && (
                                        <button className="btn btn-success" style={{ width: '100%' }} onClick={handleMarkPayment}>
                                            💳 Mark Payment Done
                                        </button>
                                    )}
                                    {isOwner && gig.status === 'in-progress' && (
                                        <button className="btn btn-success" style={{ width: '100%' }} onClick={handleCompleteGig}>
                                            ✅ Mark Completed
                                        </button>
                                    )}
                                    {gig.status === 'completed' && (
                                        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleDownloadInvoice}>
                                            🧾 Download Invoice (JSON)
                                        </button>
                                    )}
                                    <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setEditModal(true)}>
                                        ✏ Edit Job
                                    </button>
                                    <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleDelete}>
                                        🗑 Delete Job
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Posted time */}
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)', padding: '1rem',
                        fontSize: '0.8rem', color: 'var(--text-muted)',
                    }}>
                        <p>📅 Posted {new Date(gig.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        {gig.updatedAt !== gig.createdAt && (
                            <p style={{ marginTop: '0.4rem' }}>🔄 Updated {new Date(gig.updatedAt).toLocaleDateString()}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Apply Modal ── */}
            <Modal isOpen={applyModal} onClose={() => setApplyModal(false)} title="Submit Application">
                <form className="modal-form" onSubmit={handleApply}>
                    <div className="form-group">
                        <label>Cover Letter / Proposal *</label>
                        <textarea
                            placeholder="Describe your experience and why you're the best fit for this job..."
                            value={proposal}
                            onChange={e => setProposal(e.target.value)}
                            required
                            rows={5}
                        />
                    </div>
                    <div className="form-group">
                        <label>Your Price (₹) *</label>
                        <input
                            type="number"
                            placeholder={`Client's budget: ₹${gig.budget}`}
                            value={proposedPrice}
                            onChange={e => setProposedPrice(e.target.value)}
                            required
                            min={1}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => setApplyModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Review Modal ── */}
            <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Write a Review">
                <form className="modal-form" onSubmit={handleReview}>
                    <div className="form-group">
                        <label>Your Rating</label>
                        <StarRating rating={reviewRating} interactive onRate={setReviewRating} size="lg" />
                    </div>
                    <div className="form-group">
                        <label>Comment *</label>
                        <textarea
                            placeholder="Share your experience working on this project..."
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            required
                            rows={4}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => setReviewModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Edit Modal ── */}
            <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Job" size="lg">
                <form className="modal-form" onSubmit={handleEdit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label>Job Title</label>
                            <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} required />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label>Description</label>
                            <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} required rows={4} />
                        </div>
                        <div className="form-group">
                            <label>Budget (₹)</label>
                            <input type="number" value={editForm.budget} onChange={e => setEditForm(p => ({ ...p, budget: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={editForm.category}
                                onChange={e => setEditForm(p => ({ ...p, category: e.target.value, subcategory: JOB_CATEGORIES[e.target.value][0] }))}
                            >
                                {CATEGORY_LIST.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Subcategory</label>
                            <select value={editForm.subcategory} onChange={e => setEditForm(p => ({ ...p, subcategory: e.target.value }))}>
                                {(JOB_CATEGORIES[editForm.category] || []).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Deadline</label>
                            <input type="date" value={editForm.deadline} onChange={e => setEditForm(p => ({ ...p, deadline: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                                {['open', 'pending', 'accepted', 'in-progress', 'completed'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Duration</label>
                            <input value={editForm.duration} onChange={e => setEditForm(p => ({ ...p, duration: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Workers Required</label>
                            <input type="number" min={1} value={editForm.requiredWorkers} onChange={e => setEditForm(p => ({ ...p, requiredWorkers: e.target.value }))} required />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label>Skills (comma separated)</label>
                            <input value={editForm.skills} onChange={e => setEditForm(p => ({ ...p, skills: e.target.value }))} placeholder="React, Node.js, MongoDB..." />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => setEditModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GigDetail;
