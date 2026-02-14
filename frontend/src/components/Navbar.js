'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ytback-aff991tmg-pravinkumars-projects-014325e2.vercel.app/api';
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://ytback-aff991tmg-pravinkumars-projects-014325e2.vercel.app';

export default function Navbar({ onToggleSidebar }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);
    const { user, logout } = useAuth();
    const router = useRouter();
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    // Fetch suggestions as user types
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (searchQuery.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(searchQuery.trim())}`);
                const data = await res.json();

                const results = [];

                // Add channel suggestions
                (data.channels || []).slice(0, 3).forEach(ch => {
                    results.push({
                        type: 'channel',
                        id: ch._id,
                        text: ch.name,
                        subtext: ch.handle,
                        avatar: ch.avatar,
                        link: `/channel/${ch._id}`
                    });
                });

                // Add video suggestions
                (data.videos || []).slice(0, 5).forEach(v => {
                    results.push({
                        type: 'video',
                        id: v._id,
                        text: v.title,
                        subtext: v.channel?.name || '',
                        avatar: v.thumbnailUrl,
                        link: `/watch/${v._id}`
                    });
                });

                setSuggestions(results);
                setShowSuggestions(results.length > 0);
                setActiveSuggestion(-1);
            } catch (err) {
                console.error('Search suggestion error', err);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(debounceRef.current);
    }, [searchQuery]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowSuggestions(false);
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestion(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        } else if (e.key === 'Enter' && activeSuggestion >= 0) {
            e.preventDefault();
            const selected = suggestions[activeSuggestion];
            setShowSuggestions(false);
            setSearchQuery(selected.text);
            router.push(selected.link);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery(suggestion.text);
        setShowSuggestions(false);
        router.push(suggestion.link);
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <button className="menu-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                    </svg>
                </button>
                <Link href="/" className="logo">
                    <div className="logo-icon">
                        <svg viewBox="0 0 24 24" width="28" height="28">
                            <path d="M10 8l6 4-6 4V8z" fill="white" />
                            <rect x="1" y="3" width="22" height="18" rx="4" stroke="#ff4444" strokeWidth="2" fill="none" />
                        </svg>
                    </div>
                    <span className="logo-text">OpfFarmy</span>
                </Link>
            </div>

            <div className="search-wrapper" ref={searchRef}>
                <form className="search-container" onSubmit={handleSearch}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search videos, channels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                    />
                    <button type="submit" className="search-btn" aria-label="Search">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="#aaa">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                    </button>
                </form>

                {/* Search Suggestions Dropdown */}
                {showSuggestions && (
                    <div className="suggestions-dropdown">
                        {suggestions.map((item, index) => (
                            <button
                                key={`${item.type}-${item.id}`}
                                className={`suggestion-item ${index === activeSuggestion ? 'active' : ''}`}
                                onClick={() => handleSuggestionClick(item)}
                                onMouseEnter={() => setActiveSuggestion(index)}
                            >
                                <div className="suggestion-icon">
                                    {item.type === 'channel' ? (
                                        <div className="suggestion-avatar">
                                            {item.avatar ? (
                                                <img src={`${API_BASE}${item.avatar}`} alt="" />
                                            ) : (
                                                <span>{item.text?.[0]?.toUpperCase()}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="#aaa">
                                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="suggestion-content">
                                    <span className="suggestion-text">{item.text}</span>
                                    {item.subtext && (
                                        <span className="suggestion-subtext">
                                            {item.type === 'channel' ? item.subtext : `• ${item.subtext}`}
                                        </span>
                                    )}
                                </div>
                                <span className="suggestion-type-badge">
                                    {item.type === 'channel' ? 'Channel' : 'Video'}
                                </span>
                            </button>
                        ))}
                        <button
                            className="suggestion-item suggestion-search-all"
                            onClick={() => { setShowSuggestions(false); router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`); }}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="#3ea6ff">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                            </svg>
                            <span style={{ color: '#3ea6ff', fontWeight: 500 }}>Search for &quot;{searchQuery}&quot;</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="navbar-right">
                {user ? (
                    <>
                        <Link href="/upload" className="upload-btn" title="Upload">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                            </svg>
                            <span className="upload-plus">+</span>
                        </Link>
                        <div className="user-menu-wrapper">
                            <button className="avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                                <div className="user-avatar">
                                    {user.avatar ? (
                                        <img src={`${API_BASE}${user.avatar}`} alt="" />
                                    ) : (
                                        <span>{user.username?.[0]?.toUpperCase()}</span>
                                    )}
                                </div>
                            </button>
                            {showUserMenu && (
                                <div className="user-dropdown">
                                    <div className="dropdown-header">
                                        <div className="user-avatar large">
                                            <span>{user.username?.[0]?.toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="dropdown-username">{user.username}</p>
                                            <p className="dropdown-email">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    {user.channel && (
                                        <Link href={`/channel/${user.channel._id || user.channel}`} className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#aaa"><path d="M4 20h14v2H4c-1.1 0-2-.9-2-2V6h2v14zM21.41 2.99L16.58 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V5.41l-.59-.42zM12 5.5c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" /></svg>
                                            Your Channel
                                        </Link>
                                    )}
                                    {!user.channel && (
                                        <Link href="/channel/create" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#aaa"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                            Create Channel
                                        </Link>
                                    )}
                                    <button className="dropdown-item" onClick={() => { logout(); setShowUserMenu(false); }}>
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="#aaa"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" /></svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <Link href="/login" className="signin-btn">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="#3ea6ff">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        <span>Sign In</span>
                    </Link>
                )}
            </div>
        </nav>
    );
}
