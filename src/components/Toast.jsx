import React from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  if (!toast) return null

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />
  }

  const borderColors = {
    success: 'border-emerald-500/30 bg-slate-900/95 text-emerald-100',
    error: 'border-red-500/30 bg-slate-900/95 text-red-100',
    info: 'border-sky-500/30 bg-slate-900/95 text-sky-100'
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce-once">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl ${borderColors[toast.type || 'info']}`}>
        {icons[toast.type || 'info']}
        <p className="text-sm font-medium">{toast.message}</p>
        <button
          onClick={onClose}
          className="ml-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
