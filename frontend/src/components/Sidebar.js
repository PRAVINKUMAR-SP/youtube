'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar({ isOpen }) {
    const pathname = usePathname();
    const { user } = useAuth();

    const mainLinks = [
        { href: '/', label: 'Home', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg> },
        { href: '/trending', label: 'Trending', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.53 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 5.86 13.95 4c-2.73 1.65-4.06 4.43-3.68 7.33.02.13.03.26.03.4 0 .67-.37 1.26-.93 1.57-.14.08-.28.15-.43.19-.07.02-.15.02-.22.05C7.28 12.4 6.98 10.96 7.5 9.5c-1.2 1.22-1.73 2.98-1.5 4.67.05.38.14.75.26 1.09.3.8.83 1.53 1.5 2.09.28.23.59.42.91.57.63.28 1.31.45 2 .52.78.08 1.56.02 2.31-.16.28-.07.55-.17.81-.3.63-.29 1.19-.71 1.65-1.21.84-.93 1.37-2.11 1.49-3.35.05-.46.02-.93-.09-1.39-.2-.78-.57-1.46-1.05-2.05z" /></svg> },
        { href: '/subscriptions', label: 'Subscriptions', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 18v-6l5 3-5 3zm7-15H7v2h10V3zm3 4H4v2h16V7zm2 4H2v10h20V11zm-2 8H4v-6h16v6z" /></svg> },
    ];

    const libraryLinks = [
        { href: '/library', label: 'Library', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" /></svg> },
        { href: '/liked', label: 'Liked Videos', icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" /></svg> },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
            <div className="sidebar-content">
                <div className="sidebar-section">
                    {mainLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`sidebar-item ${pathname === link.href ? 'active' : ''}`}
                        >
                            {link.icon}
                            <span className="sidebar-label">{link.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="sidebar-divider"></div>

                <div className="sidebar-section">
                    {libraryLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`sidebar-item ${pathname === link.href ? 'active' : ''}`}
                        >
                            {link.icon}
                            <span className="sidebar-label">{link.label}</span>
                        </Link>
                    ))}
                </div>

                {user?.channel && (
                    <>
                        <div className="sidebar-divider"></div>
                        <div className="sidebar-section">
                            <Link
                                href={`/channel/${user.channel?.id || user.channel?._id || user.channel}`}
                                className="sidebar-item"
                            >
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                <span className="sidebar-label">Your Channel</span>
                            </Link>
                            <Link href="/upload" className="sidebar-item">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" /></svg>
                                <span className="sidebar-label">Upload</span>
                            </Link>
                        </div>
                    </>
                )}

                <div className="sidebar-divider"></div>
                <div className="sidebar-footer">
                    <p>© 2026 OpfFarmy</p>
                    <p>Built with ❤️</p>
                </div>
            </div>
        </aside>
    );
}
