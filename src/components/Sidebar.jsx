import React from 'react'
import {
  Settings,
  BookOpen,
  Users,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ShieldCheck,
  Search
} from 'lucide-react'

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  activePortal,
  onSwitchPortal,
  currentUser,
  onLogout,
  onOpenResultChecker
}) {
  const role = currentUser?.role || 'admin'

  const navItems = [
    {
      id: 'admin',
      label: 'Admin Settings',
      icon: Settings,
      allowedRoles: ['admin']
    },
    {
      id: 'subject',
      label: 'Subject Teacher',
      icon: BookOpen,
      allowedRoles: ['admin', 'teacher']
    },
    {
      id: 'class',
      label: 'Class Teacher',
      icon: Users,
      allowedRoles: ['admin', 'class_teacher']
    },
    {
      id: 'student',
      label: 'Student Portal',
      icon: GraduationCap,
      allowedRoles: ['admin', 'student']
    }
  ]

  const visibleNav = navItems.filter(item => item.allowedRoles.includes(role))

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20 p-3' : 'w-72 p-5'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="./RiseUp Logo.png"
            alt="RiseUp College Logo"
            className="w-10 h-10 rounded-xl object-contain bg-slate-800 p-1 shadow-md shadow-sky-500/10 shrink-0"
            onError={(e) => {
              // Fallback if logo fails
              e.target.style.display = 'none'
            }}
          />
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="font-extrabold text-base tracking-tight text-white truncate">
                RiseUp College
              </h1>
              <p className="text-xs text-sky-400 font-medium truncate">Results Publisher</p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {visibleNav.map(item => {
          const Icon = item.icon
          const isActive = activePortal === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSwitchPortal(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}

        {/* Quick Result Checker Button */}
        <div className="pt-4 border-t border-slate-800/80 my-3">
          <button
            onClick={onOpenResultChecker}
            title={isCollapsed ? 'Student PIN Result Checker' : undefined}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <Search className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Result Checker</span>}
          </button>
        </div>
      </nav>

      {/* User Profile Footer */}
      {currentUser && (
        <div className="pt-4 border-t border-slate-800 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-inner">
              {(currentUser.name || currentUser.username || 'U').substring(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{currentUser.name || currentUser.username}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-sky-400" />
                  {currentUser.roleLabel || currentUser.role}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`mt-3 w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      )}
    </aside>
  )
}
