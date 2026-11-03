import React, { useState } from 'react'
import { Search, KeyRound, UserCheck, X, AlertCircle } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function StudentResultCheckModal({
  students = [],
  onViewReportCard,
  onClose
}) {
  const [studentIdentifier, setStudentIdentifier] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleCheck = (e) => {
    e.preventDefault()
    setError('')

    const cleanId = studentIdentifier.trim().toLowerCase()
    const cleanPin = pin.trim()

    if (!cleanId || !cleanPin) {
      setError('Please enter both your Student/Reg ID and PIN.')
      return
    }

    const matched = students.find(s => {
      const matchId = s.id.toLowerCase() === cleanId
      const matchReg = s.reg_no && s.reg_no.toLowerCase() === cleanId
      return matchId || matchReg
    })

    if (!matched) {
      setError('Student record not found. Please verify your Registration Number or Student ID.')
      return
    }

    const correctPin = matched.access_pin || '1234'
    if (cleanPin !== correctPin) {
      setError('Incorrect PIN. Please re-enter the 4-digit PIN printed on your student docket.')
      return
    }

    // Success! Trigger confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      })
    } catch {
      // Confetti fallback
    }

    onViewReportCard(matched)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Student Result Checker</h3>
            <p className="text-xs text-slate-400">Enter your student credentials to view and print your term report</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Student ID or Reg Number
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="e.g. RC/2026/001 or st1"
                value={studentIdentifier}
                onChange={(e) => setStudentIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              4-Digit Access PIN
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                maxLength={8}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm tracking-widest focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer mt-2"
          >
            Check Result & View Report Sheet
          </button>
        </form>
      </div>
    </div>
  )
}
