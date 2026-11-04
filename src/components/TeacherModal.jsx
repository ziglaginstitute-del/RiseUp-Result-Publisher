import React, { useState } from 'react'
import { UserCheck, X, Eye, EyeOff, Shield, BookOpen, Users, Lock } from 'lucide-react'

export default function TeacherModal({
  teacherToEdit = null,
  classes = [],
  subjects = [],
  onSave,
  onClose
}) {
  const [name, setName] = useState(teacherToEdit?.name || '')
  const [username, setUsername] = useState(teacherToEdit?.username || '')
  const [password, setPassword] = useState(teacherToEdit?.password || '')
  const [role, setRole] = useState(teacherToEdit?.role || 'class_teacher')
  const [assignedClassId, setAssignedClassId] = useState(
    teacherToEdit?.assignedClassId || classes[0]?.id || ''
  )
  const [assignedSubjectId, setAssignedSubjectId] = useState(
    teacherToEdit?.assignedSubjectId || subjects[0]?.id || ''
  )
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const cleanName = name.trim()
    const cleanUsername = username.trim().toLowerCase()
    const cleanPassword = password.trim()

    if (!cleanName) {
      setError('Please provide the staff member\'s full name.')
      return
    }
    if (!cleanUsername) {
      setError('Please provide a unique login username.')
      return
    }
    if (!cleanPassword) {
      setError('Please provide a login password.')
      return
    }

    onSave({
      id: teacherToEdit?.id || `teacher_${Date.now()}`,
      name: cleanName,
      username: cleanUsername,
      password: cleanPassword,
      role,
      assignedClassId: role === 'class_teacher' ? assignedClassId : null,
      assignedSubjectId: role === 'teacher' ? assignedSubjectId : null
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {teacherToEdit ? 'Edit Staff Account' : 'Add New Staff / Teacher'}
            </h3>
            <p className="text-xs text-slate-400">
              Configure credentials and system access permissions
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Staff Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mr. Emmanuel Adeyemi, Mrs. Folashade Adeleke"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Staff Role *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer text-center transition-all ${
                  role === 'class_teacher'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="class_teacher"
                  checked={role === 'class_teacher'}
                  onChange={() => setRole('class_teacher')}
                  className="hidden"
                />
                <Users className="w-5 h-5 mb-1 text-emerald-400" />
                <span className="text-xs font-bold">Class Teacher</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Collation & Reports</span>
              </label>

              <label
                className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer text-center transition-all ${
                  role === 'teacher'
                    ? 'bg-indigo-500/15 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={role === 'teacher'}
                  onChange={() => setRole('teacher')}
                  className="hidden"
                />
                <BookOpen className="w-5 h-5 mb-1 text-indigo-400" />
                <span className="text-xs font-bold">Subject Teacher</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Score Entry</span>
              </label>

              <label
                className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer text-center transition-all ${
                  role === 'admin'
                    ? 'bg-sky-500/15 border-sky-500 text-white shadow-md shadow-sky-500/10'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                  className="hidden"
                />
                <Shield className="w-5 h-5 mb-1 text-sky-400" />
                <span className="text-xs font-bold">Administrator</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Full System Access</span>
              </label>
            </div>
          </div>

          {/* Conditional Assignment */}
          {role === 'class_teacher' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Assigned Class
              </label>
              <select
                value={assignedClassId}
                onChange={(e) => setAssignedClassId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="">-- All Classes / Unassigned --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900">
                    {c.name} ({c.level || 'Senior'})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                The Class Teacher portal will automatically focus on this class by default
              </p>
            </div>
          )}

          {role === 'teacher' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Assigned Subject
              </label>
              <select
                value={assignedSubjectId}
                onChange={(e) => setAssignedSubjectId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="">-- All Subjects / Unassigned --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900">
                    {s.name} ({s.code || s.department})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                The Subject Teacher portal will automatically focus on this subject for score input
              </p>
            </div>
          )}

          {/* Login Credentials Section */}
          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Login Credentials</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Login Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. adeyemi, f_adeleke"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Share these exact credentials with the staff member to log in to RiseUp College Publisher.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/25 transition-all cursor-pointer"
            >
              {teacherToEdit ? 'Save Changes' : 'Create Staff Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
