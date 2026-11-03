import React, { useState } from 'react'
import { UserPlus, X, RefreshCw } from 'lucide-react'

export default function StudentModal({
  classes = [],
  initialClassId = '',
  onSave,
  onClose
}) {
  const [name, setName] = useState('')
  const [regNo, setRegNo] = useState('')
  const [classId, setClassId] = useState(initialClassId || classes[0]?.id || 'c1')

  const initialClassObj = classes.find(c => c.id === (initialClassId || classes[0]?.id))
  const isJuniorClass = initialClassObj && (initialClassObj.level === 'Junior' || initialClassObj.name.toLowerCase().includes('jss'))

  const [department, setDepartment] = useState(isJuniorClass ? 'Junior' : 'Science')
  const [gender, setGender] = useState('M')
  const [accessPin, setAccessPin] = useState(String(Math.floor(1000 + Math.random() * 9000)))

  const handleClassChange = (newClassId) => {
    setClassId(newClassId)
    const cls = classes.find(c => c.id === newClassId)
    if (cls && (cls.level === 'Junior' || cls.name.toLowerCase().includes('jss'))) {
      setDepartment('Junior')
    } else if (department === 'Junior') {
      setDepartment('Science')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const studentId = `st_${Date.now()}`
    const generatedReg = regNo.trim() || `RC/${new Date().getFullYear()}/${String(Math.floor(100 + Math.random() * 900))}`

    onSave({
      id: studentId,
      reg_no: generatedReg,
      name: name.trim(),
      classId,
      department,
      gender,
      access_pin: accessPin.trim() || '1234'
    })
  }

  const generateNewPin = () => {
    setAccessPin(String(Math.floor(1000 + Math.random() * 9000)))
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
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Enroll New Student</h3>
            <p className="text-xs text-slate-400">Register a student and assign their department and class arm</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Full Student Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Samuel Chukwudi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Registration Number
              </label>
              <input
                type="text"
                placeholder="e.g. RC/2026/012 (auto if empty)"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Class Arm *
              </label>
              <select
                value={classId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Department Classification *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="Science">Science</option>
                <option value="Art">Art</option>
                <option value="Commercial">Commercial</option>
                <option value="Junior">Junior Student (JSS 1 - 3)</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                4-Digit Result Access PIN
              </label>
              <button
                type="button"
                onClick={generateNewPin}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Generate Random</span>
              </button>
            </div>
            <input
              type="text"
              maxLength={6}
              value={accessPin}
              onChange={(e) => setAccessPin(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-sky-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1">Students and parents will use this PIN along with their Reg Number to view results.</p>
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
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-lg shadow-sky-600/25 transition-all"
            >
              Enroll Student
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
