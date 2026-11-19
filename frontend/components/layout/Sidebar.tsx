'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileText,
  BedDouble,
  LogOut,
  User,
  Users,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: ('STUDENT' | 'ADMIN')[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
    roles: ['STUDENT', 'ADMIN'],
  },
  {
    href: '/hostels',
    label: 'Hostels & Rooms',
    icon: <Building2 size={18} />,
    roles: ['STUDENT', 'ADMIN'],
  },
  {
    href: '/my-request',
    label: 'My Application',
    icon: <FileText size={18} />,
    roles: ['STUDENT'],
  },
  {
    href: '/my-room',
    label: 'My Room',
    icon: <BedDouble size={18} />,
    roles: ['STUDENT'],
  },
  {
    href: '/admin/requests',
    label: 'Manage Requests',
    icon: <FileText size={18} />,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/allocations',
    label: 'Allocations',
    icon: <BedDouble size={18} />,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/hostels',
    label: 'Manage Hostels',
    icon: <Building2 size={18} />,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/students',
    label: 'Students',
    icon: <Users size={18} />,
    roles: ['ADMIN'],
  },
  {
    href: '/profile',
    label: 'My Profile',
    icon: <User size={18} />,
    roles: ['STUDENT', 'ADMIN'],
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  const NavContent = () => (
    <>
      {}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-bg-primary flex items-center justify-center">
            <Home size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white">HostelIQ</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Room Allocation</p>
          </div>
        </div>
      </div>

      {}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 p-3 rounded-12 bg-white/[0.03]" style={{ borderRadius: '12px' }}>
          <div className="w-9 h-9 rounded-full gradient-bg-secondary flex items-center justify-center shrink-0">
            <User size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
            <p className="text-xs text-white/40 truncate">{user.email}</p>
          </div>
          <span
            className={`badge shrink-0 ${user.role === 'ADMIN' ? 'badge-active' : 'badge-ac'}`}
            style={{ fontSize: '9px' }}
          >
            {user.role}
          </span>
        </div>
      </div>

      {}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`sidebar-nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {}
      <div className="px-3 pb-6">
        <button
          onClick={logout}
          className="sidebar-nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-400/[0.08]"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 rounded-xl glass-card flex items-center justify-center"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {}
      <aside className={`sidebar flex flex-col ${mobileOpen ? 'open' : ''}`}>
        <NavContent />
      </aside>
    </>
  );
}
