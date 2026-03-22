import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_ICONS } from '../constants/gigMeta';

const GigCard = ({ gig, isAuthenticated }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (isAuthenticated) {
            navigate(`/gigs/${gig._id}`);
        } else {
            navigate('/login');
        }
    };

    const truncate = (str, n) => str?.length > n ? str.slice(0, n) + '...' : str;

    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days}d ago`;
        return `${Math.floor(days / 30)}mo ago`;
    };

    return (
        <div className="gig-card animate-fade-in" onClick={handleClick}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span className="gig-category-badge">
                    {CATEGORY_ICONS[gig.category] || '🔧'} {gig.category}
                </span>
                <span className={`gig-status-badge status-${gig.status}`}>{gig.status}</span>
            </div>

            <div>
                <h3 className="gig-title">{gig.title}</h3>
                <p className={`gig-description ${!isAuthenticated ? 'blurred' : ''}`}>
                    {isAuthenticated ? gig.description : truncate(gig.description, 60)}
                </p>
                {!isAuthenticated && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--primary-light)', marginTop: '0.4rem', fontWeight: 600 }}>
                        🔒 Login to view full details
                    </p>
                )}
            </div>

            {gig.skills?.length > 0 && (
                <div className="gig-skills">
                    {gig.skills.slice(0, 4).map((skill, i) => (
                        <span key={i} className="skill-tag">{skill}</span>
                    ))}
                    {gig.skills.length > 4 && (
                        <span className="skill-tag">+{gig.skills.length - 4}</span>
                    )}
                </div>
            )}

            <div className="gig-meta">
                <span className="gig-budget">₹{gig.budget?.toLocaleString('en-IN')}</span>
                {gig.deadline && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        📅 {new Date(gig.deadline).toLocaleDateString()}
                    </span>
                )}
            </div>

            <div className="gig-footer">
                <span className="gig-client-name">
                    👤 {gig.client?.name || 'Client'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {timeAgo(gig.createdAt)}
                </span>
            </div>
        </div>
    );
};

export default GigCard;
