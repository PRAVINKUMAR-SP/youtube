'use client';
import { useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './globals.css';

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <html lang="en">
      <head>
        <meta name="description" content="OpfFarmy - Watch, Upload & Share Videos" />
        <title>OpfFarmy</title>
      </head>
      <body>
        <AuthProvider>
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <Sidebar isOpen={sidebarOpen} />
          <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
