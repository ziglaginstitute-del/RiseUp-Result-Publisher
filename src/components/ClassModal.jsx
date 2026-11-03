import React, { useState } from 'react'
import { FolderPlus, X } from 'lucide-react'

export default function ClassModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [level, setLevel] = useState('Senior')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      id: `c_${Date.now()}`,
      name: name.trim(),
      level
    })
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
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Create New Class</h3>
            <p className="text-xs text-slate-400">Add a class arm to organize students and results</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Class Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Grade 10B, JSS 2A, SSS 3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              School Tier / Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="Senior">Senior Secondary (SSS / Grade 10 - 12)</option>
              <option value="Junior">Junior Secondary (JSS 1 - 3)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-600/25 transition-all"
            >
              Create Class
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
