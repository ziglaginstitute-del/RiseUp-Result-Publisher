import React, { useState } from 'react'
import { BookPlus, X } from 'lucide-react'

export default function SubjectModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [department, setDepartment] = useState('General')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      id: `s_${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase() || name.trim().slice(0, 3).toUpperCase(),
      department
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BookPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Add New Subject</h3>
            <p className="text-xs text-slate-400">Configure academic subject and assign attendance department</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Subject Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Further Mathematics, Visual Art"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Subject Code (Abbreviation)
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. FMT, VSA (auto if empty)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm uppercase focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Department Classification *
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="General">General (Attended by all departments)</option>
              <option value="Junior">Junior Subject (JSS 1 - 3 only)</option>
              <option value="Science">Science Only</option>
              <option value="Art">Art Only</option>
              <option value="Commercial">Commercial Only</option>
              <option value="Arts & Commercial">Arts & Commercial Both</option>
              <option value="Elective">Elective (Any Dept - Only displays on result if scored)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {department === 'Elective' && '⚡ Elective subjects only reflect on student result sheets if a score is entered for them.'}
              {department === 'Junior' && '⚡ Junior subjects only apply to Junior students (JSS 1 - 3).'}
              {department === 'Arts & Commercial' && '⚡ Shared by both Art and Commercial department students.'}
            </p>
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
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all"
            >
              Save Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
