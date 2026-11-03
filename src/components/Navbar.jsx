import React from 'react'
import { Calendar, Cloud, HardDrive, CheckCircle2, Bookmark } from 'lucide-react'

export default function Navbar({
  title,
  subtitle,
  activeSession,
  sessions = [],
  onChangeSession,
  activeTerm = 't1',
  onChangeTerm,
  isCloudConnected
}) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">{title}</h2>
        <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Backend Cloud Sync Status Pill */}
        <div
          title={
            isCloudConnected
              ? 'Connected to Supabase PostgreSQL cloud database'
              : 'Running in offline local mode (saved to local device storage)'
          }
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            isCloudConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
        >
          {isCloudConnected ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Supabase Cloud</span>
            </>
          ) : (
            <>
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Local</span>
            </>
          )}
        </div>

        {/* Academic Session Selector */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span className="text-xs text-slate-400 font-medium">Session:</span>
          <select
            value={activeSession}
            onChange={(e) => onChangeSession && onChangeSession(e.target.value)}
            className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
          >
            {sessions.map(s => (
              <option key={s} value={s} className="bg-slate-900 text-white">
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Active Term Selector Dropdown (Toggle between 1st, 2nd, 3rd term) */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-sky-500/30 px-3 py-1.5 rounded-xl">
          <Bookmark className="w-4 h-4 text-sky-400" />
          <span className="text-xs text-sky-400 font-medium">Term:</span>
          <select
            value={activeTerm}
            onChange={(e) => onChangeTerm && onChangeTerm(e.target.value)}
            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="t1" className="bg-slate-900 text-white">
              First Term (T1)
            </option>
            <option value="t2" className="bg-slate-900 text-white">
              Second Term (T2)
            </option>
            <option value="t3" className="bg-slate-900 text-amber-300 font-bold">
              Third Term (T3 - Annual Cumulative)
            </option>
          </select>
        </div>
      </div>
    </header>
  )
}
