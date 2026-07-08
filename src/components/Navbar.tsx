import React from 'react';
import { type User } from '../types';
import { Wind, MapPin, ClipboardList, LogOut, ShieldAlert, LogIn, UserPlus } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Navbar({ currentUser, currentTab, setTab, onLogout }: NavbarProps) {
  const links = [
    { id: 'overview', label: 'Overview', icon: Wind },
    { id: 'dashboard', label: 'Live Map', icon: MapPin },
    { id: 'report', label: 'Report Hotspot', icon: ShieldAlert },
    { id: 'ops', label: 'Ops Console', icon: ClipboardList, roleRequired: 'municipal' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:px-8">
        {/* Brand */}
        <button
          onClick={() => setTab('overview')}
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 focus:outline-none"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white shadow-sm">
            <Wind className="h-5 w-5" />
          </div>
          <span className="text-slate-800 font-bold tracking-tight">
            AeroWatch <span className="text-slate-400 font-normal ml-2 text-sm hidden sm:inline">| Hyperlocal Monitor</span>
          </span>
        </button>

        {/* Navlinks */}
        <ul className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            // If role is required and user does not have it, don't show the link
            if (link.roleRequired && (!currentUser || currentUser.role !== 'municipal')) {
              return null;
            }

            const Icon = link.icon;
            const isActive = currentTab === link.id;

            return (
              <li key={link.id}>
                <button
                  onClick={() => setTab(link.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-100/50'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </button>
              </li>
            );
          })}
        </ul>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* Connected Status badge */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Connected
              </div>

              {/* Profile Badge */}
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-bold text-slate-800">{currentUser.name}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
                  {currentUser.role}
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 font-bold text-xs">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              {/* Sign Out Button */}
              <button
                onClick={onLogout}
                title="Sign Out"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTab('auth-login')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => setTab('auth-register')}
                className="flex items-center gap-1.5 rounded bg-blue-600 px-3.5 py-1.5 text-sm font-bold text-white transition-all hover:bg-blue-700 shadow-md active:scale-95"
              >
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <div className="flex md:hidden gap-1">
            {links.map((link) => {
              if (link.roleRequired && (!currentUser || currentUser.role !== 'municipal')) {
                return null;
              }
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => setTab(link.id)}
                  title={link.label}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    currentTab === link.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
