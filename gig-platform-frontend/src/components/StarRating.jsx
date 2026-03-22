import React from 'react';

const StarRating = ({ rating, max = 5, size = 'md', interactive = false, onRate }) => {
    const sizeClass = size === 'lg' ? '1.6rem' : size === 'sm' ? '0.85rem' : '1.1rem';

    return (
        <div className="stars" style={{ gap: '0.15rem' }}>
            {Array.from({ length: max }, (_, i) => {
                const filled = i < Math.round(rating);
                return (
                    <span
                        key={i}
                        style={{
                            fontSize: sizeClass,
                            color: filled ? '#f59e0b' : 'var(--border)',
                            cursor: interactive ? 'pointer' : 'default',
                            transition: 'transform 0.15s',
                        }}
                        onClick={() => interactive && onRate && onRate(i + 1)}
                        onMouseEnter={(e) => interactive && (e.target.style.transform = 'scale(1.3)')}
                        onMouseLeave={(e) => interactive && (e.target.style.transform = 'scale(1)')}
                    >
                        ★
                    </span>
                );
            })}
        </div>
    );
};

export default StarRating;
