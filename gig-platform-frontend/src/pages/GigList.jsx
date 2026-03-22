import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGigs } from '../services/api';
import GigCard from '../components/GigCard';
import { CATEGORY_LIST, JOB_CATEGORIES } from '../constants/gigMeta';

const GigList = () => {
    const { isAuthenticated } = useAuth();
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [minBudget, setMinBudget] = useState('');
    const [maxBudget, setMaxBudget] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchGigs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { status: 'open' };
            if (debouncedSearch) params.search = debouncedSearch;
            if (category) params.category = category;
            if (subcategory) params.subcategory = subcategory;
            if (minBudget) params.minBudget = minBudget;
            if (maxBudget) params.maxBudget = maxBudget;
            const { data } = await getGigs(params);
            setGigs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, category, subcategory, minBudget, maxBudget]);

    useEffect(() => { fetchGigs(); }, [fetchGigs]);

    const clearFilters = () => {
        setSearch(''); setCategory(''); setSubcategory(''); setMinBudget(''); setMaxBudget('');
    };

    const subcategoryOptions = category ? JOB_CATEGORIES[category] || [] : [];

    return (
        <div className="container section animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="page-title">Browse Jobs</h1>
                        <p className="page-subtitle">
                            {gigs.length} open {gigs.length === 1 ? 'job' : 'jobs'} available
                            {!isAuthenticated && ' — Sign in to apply'}
                        </p>
                    </div>
                    {!isAuthenticated && (
                        <Link to="/register" className="btn btn-primary">
                            Join to Apply →
                        </Link>
                    )}
                </div>
            </div>

            {/* Search + Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search jobs by title or description..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        id="gig-search"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>✕</button>
                    )}
                </div>

                <div className="filters-bar">
                    <select
                        className="filter-select"
                        value={category}
                        onChange={e => {
                            setCategory(e.target.value);
                            setSubcategory('');
                        }}
                        id="filter-category"
                    >
                        <option value="">All Categories</option>
                        {CATEGORY_LIST.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <select
                        className="filter-select"
                        value={subcategory}
                        onChange={e => setSubcategory(e.target.value)}
                        id="filter-subcategory"
                        disabled={!category}
                    >
                        <option value="">All Subcategories</option>
                        {subcategoryOptions.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>

                    <input
                        type="number"
                        placeholder="Min Budget (₹)"
                        value={minBudget}
                        onChange={e => setMinBudget(e.target.value)}
                        style={{ width: 150 }}
                        id="filter-min-budget"
                    />
                    <input
                        type="number"
                        placeholder="Max Budget (₹)"
                        value={maxBudget}
                        onChange={e => setMaxBudget(e.target.value)}
                        style={{ width: 150 }}
                        id="filter-max-budget"
                    />

                    {(search || category || subcategory || minBudget || maxBudget) && (
                        <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Guest banner */}
            {!isAuthenticated && (
                <div className="alert info" style={{ marginBottom: '1.5rem' }}>
                    <span>🔒</span>
                    <span>You're browsing as a guest. Job descriptions are partially hidden.
                        <Link to="/login" style={{ color: 'var(--primary-light)', marginLeft: '0.4rem', fontWeight: 600 }}>
                            Sign in for full access →
                        </Link>
                    </span>
                </div>
            )}

            {/* Gig Grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
                    ))}
                </div>
            ) : gigs.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h3>No jobs found</h3>
                    <p>Try adjusting your filters or search terms.</p>
                    <button className="btn btn-ghost" onClick={clearFilters}>Clear all filters</button>
                </div>
            ) : (
                <div className="gig-grid">
                    {gigs.map(gig => (
                        <GigCard key={gig._id} gig={gig} isAuthenticated={isAuthenticated} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GigList;
