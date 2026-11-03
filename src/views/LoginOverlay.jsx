import React, { useState } from 'react'
import { Lock, User, Search, ShieldAlert } from 'lucide-react'

export default function LoginOverlay({
  onLogin,
  onOpenResultChecker
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Please provide your username or Student ID and password/PIN.')
      return
    }

    setIsLoading(true)
    const result = onLogin({ username, password })
    setIsLoading(false)

    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please verify your details.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-sky-500/10 relative">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-sky-600/20 to-indigo-600/20 border border-sky-500/20 mb-3 shadow-inner">
            <img
              src="./RiseUp Logo.png"
              alt="RiseUp College Logo"
              className="w-14 h-14 object-contain"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">RiseUp College</h1>
          <p className="text-xs text-sky-400 font-medium mt-1">Academic Results Publisher & Grading System</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Username or Student ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="e.g. admin or RC/2026/001"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password or Access PIN
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/25 transition-all cursor-pointer mt-2"
          >
            {isLoading ? 'Signing In...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Quick Result Checker Action */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400 mb-2 font-medium">Are you a Student or Parent?</p>
          <button
            type="button"
            onClick={onOpenResultChecker}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Check Result with PIN (No Login Required)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
