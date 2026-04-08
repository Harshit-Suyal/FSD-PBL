import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getInitials = (name = '') =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="nav-logo">
                    <div className="nav-logo-icon">G</div>
                    GigConnect
                </Link>

                <div className="nav-links">
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Home
                    </NavLink>
                    {user?.role !== 'admin' && (
                        <NavLink to="/gigs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            Browse Gigs
                        </NavLink>
                    )}
                    {isAuthenticated && (
                        <NavLink to={user?.role === 'admin' ? '/admin' : '/dashboard'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            Dashboard
                        </NavLink>
                    )}
                </div>

                <div className="nav-actions">
                    {isAuthenticated ? (
                        <>
                            <div className="nav-user-chip" onClick={() => navigate('/profile')}>
                                <div className="nav-avatar">{getInitials(user?.name)}</div>
                                <span>{user?.name?.split(' ')[0]}</span>
                                <span className={`role-badge ${user?.role}`}>{user?.role}</span>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
