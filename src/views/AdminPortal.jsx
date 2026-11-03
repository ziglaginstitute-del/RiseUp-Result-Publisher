import React, { useState } from 'react'
import {
  Users,
  BookOpen,
  GraduationCap,
  Award,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  CheckCircle,
  Save,
  ShieldAlert,
  Upload
} from 'lucide-react'
import { getDeptBadgeColor } from '../utils/gradeCalculator'
import { exportStudentsToCSV } from '../utils/csvExporter'

export default function AdminPortal({
  classes = [],
  subjects = [],
  students = [],
  grades = {},
  activeTerm = 't1',
  onChangeTerm,
  activeSession = '2025/2026',
  onChangeSession,
  sessions = [],
  settings = {},
  onUpdateSettings,
  onDeleteClass,
  onDeleteSubject,
  onDeleteStudent,
  onOpenClassModal,
  onOpenSubjectModal,
  onOpenStudentModal,
  onOpenCSVImportModal,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState('students') // 'students', 'classes', 'subjects', 'grading', 'school'
  const [studentSearch, setStudentSearch] = useState('')
  const [studentClassFilter, setStudentClassFilter] = useState('')
  const [studentDeptFilter, setStudentDeptFilter] = useState('')

  // Settings form states
  const [currentTerm, setCurrentTerm] = useState(activeTerm)
  const [currentSession, setCurrentSession] = useState(activeSession)
  const [caWeight, setCaWeight] = useState(settings.caWeight || 40)
  const [examWeight, setExamWeight] = useState(settings.examWeight || 60)
  const [schoolName, setSchoolName] = useState(settings.schoolName || 'RiseUp College')
  const [schoolMotto, setSchoolMotto] = useState(settings.schoolMotto || 'Excellence, Knowledge & Integrity')
  const [schoolAddress, setSchoolAddress] = useState(settings.schoolAddress || '5, Oriade Close, Off Council Road, Water Bus Stop, Ipaja, Lagos.')
  const [principalName, setPrincipalName] = useState(settings.principalName || 'John Ogundijo')
  const [principalSignature, setPrincipalSignature] = useState(settings.principalSignature || '')
  const [schoolEmail, setSchoolEmail] = useState(settings.schoolEmail || 'school@riseupcollege.org')
  const [schoolPhone, setSchoolPhone] = useState(settings.schoolPhone || '08156202927, 08113792266')
  const [schoolWebsite, setSchoolWebsite] = useState(settings.schoolWebsite || 'www.riseupcollege.org')

  // Sync state if props change
  React.useEffect(() => {
    setCurrentTerm(activeTerm)
  }, [activeTerm])

  React.useEffect(() => {
    setCurrentSession(activeSession)
  }, [activeSession])

  // Filter students
  const filteredStudents = students.filter(st => {
    const matchesSearch =
      st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (st.reg_no && st.reg_no.toLowerCase().includes(studentSearch.toLowerCase()))
    const matchesClass = !studentClassFilter || st.classId === studentClassFilter
    const matchesDept = !studentDeptFilter || st.department === studentDeptFilter
    return matchesSearch && matchesClass && matchesDept
  })

  // Count total grades recorded in active term
  let totalGradesRecorded = 0
  Object.values(grades).forEach(terms => {
    const termObj = terms[activeTerm]
    if (termObj) {
      Object.values(termObj).forEach(sub => {
        if (sub.total !== undefined && sub.total !== '' && sub.total !== null) {
          totalGradesRecorded++
        }
      })
    }
  })

  const handleSaveSettings = (e) => {
    e.preventDefault()
    onUpdateSettings({
      ...settings,
      caWeight: Number(caWeight),
      examWeight: Number(examWeight),
      schoolName: schoolName.trim(),
      schoolMotto: schoolMotto.trim(),
      schoolAddress: schoolAddress.trim(),
      principalName: principalName.trim(),
      principalSignature,
      schoolEmail: schoolEmail.trim(),
      schoolPhone: schoolPhone.trim(),
      schoolWebsite: schoolWebsite.trim()
    })
    if (onChangeTerm && currentTerm !== activeTerm) {
      onChangeTerm(currentTerm)
    }
    if (onChangeSession && currentSession !== activeSession) {
      onChangeSession(currentSession)
    }
    onShowToast({ type: 'success', message: 'School settings & active term updated successfully!' })
  }

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{students.length}</p>
          <p className="text-xs text-slate-500 mt-1">Enrolled across all arms</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classes Configured</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{classes.length}</p>
          <p className="text-xs text-slate-500 mt-1">Junior & Senior divisions</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Subjects</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{subjects.length}</p>
          <p className="text-xs text-slate-500 mt-1">Across 7 departments</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grades Entered</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{totalGradesRecorded}</p>
          <p className="text-xs text-emerald-400 font-medium mt-1">Term {activeTerm.slice(1)} records saved</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'students', label: 'Student Register', icon: Users, count: students.length },
          { id: 'classes', label: 'Classes', icon: GraduationCap, count: classes.length },
          { id: 'subjects', label: 'Subjects', icon: BookOpen, count: subjects.length },
          { id: 'grading', label: 'Grading Scale & Weights', icon: Award },
          { id: 'school', label: 'School Information', icon: CheckCircle }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* TAB 1: STUDENTS REGISTER */}
      {activeTab === 'students' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[220px] flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search student or Reg No..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <select
                value={studentClassFilter}
                onChange={(e) => setStudentClassFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              >
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={studentDeptFilter}
                onChange={(e) => setStudentDeptFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              >
                <option value="">All Departments</option>
                <option value="Science">Science</option>
                <option value="Art">Art</option>
                <option value="Commercial">Commercial</option>
                <option value="Junior">Junior</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportStudentsToCSV(students, classes)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={onOpenCSVImportModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Bulk CSV Import</span>
              </button>

              <button
                onClick={onOpenStudentModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto border border-slate-700/60 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700">
                <tr>
                  <th className="p-3">Reg No</th>
                  <th className="p-3">Full Student Name</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Result PIN</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                      No matching students found in register.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(st => {
                    const cls = classes.find(c => c.id === st.classId)
                    return (
                      <tr key={st.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-sky-400 font-medium">{st.reg_no || st.id}</td>
                        <td className="p-3 font-semibold text-white">{st.name}</td>
                        <td className="p-3">{cls?.name || st.classId}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getDeptBadgeColor(st.department)}`}>
                            {st.department || 'General'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-emerald-400">{st.access_pin || '1234'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete student "${st.name}" from register?`)) {
                                onDeleteStudent(st.id)
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CLASSES */}
      {activeTab === 'classes' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Configured Classes</h3>
              <p className="text-xs text-slate-400">Class arms for enrolling students and compiling grades</p>
            </div>
            <button
              onClick={onOpenClassModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map(cls => {
              const count = students.filter(s => s.classId === cls.id).length
              return (
                <div key={cls.id} className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-base text-white">{cls.name}</h4>
                      <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                        {cls.level || 'Senior'} Level
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete class "${cls.name}"? All associated students will be detached.`)) {
                          onDeleteClass(cls.id)
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Enrolled Students</span>
                    <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full">{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Configured Subjects & Departments</h3>
              <p className="text-xs text-slate-400">Classified across the 7 attendance rules</p>
            </div>
            <button
              onClick={onOpenSubjectModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-700/60 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700">
                <tr>
                  <th className="p-3">Subject Name</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Department Classification</th>
                  <th className="p-3">Attendance Rule</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {subjects.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{sub.name}</td>
                    <td className="p-3 font-mono text-indigo-400">{sub.code || sub.name.slice(0, 3).toUpperCase()}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getDeptBadgeColor(sub.department)}`}>
                        {sub.department || 'General'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {sub.department === 'General' && 'Compulsory for all students'}
                      {sub.department === 'Junior' && 'Junior students only (JSS 1 - 3)'}
                      {sub.department === 'Science' && 'Science students only'}
                      {sub.department === 'Art' && 'Art students only'}
                      {sub.department === 'Commercial' && 'Commercial students only'}
                      {sub.department === 'Arts & Commercial' && 'Attended by both Art & Commercial'}
                      {sub.department === 'Elective' && 'Elective to any dept (only reflects if score is recorded)'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete subject "${sub.name}"?`)) {
                            onDeleteSubject(sub.id)
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GRADING SCALE & WEIGHTS */}
      {activeTab === 'grading' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Active Academic Term Selector */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-white">Active Academic Term & Session</h4>
                <p className="text-xs text-slate-400">Controls which term scores and report cards are currently active</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Select Active Term *
                  </label>
                  <select
                    value={currentTerm}
                    onChange={(e) => {
                      setCurrentTerm(e.target.value)
                      if (onChangeTerm) onChangeTerm(e.target.value)
                    }}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-sky-500/50 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="t1">First Term (T1)</option>
                    <option value="t2">Second Term (T2)</option>
                    <option value="t3">Third Term (T3 - Annual Cumulative)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Select Academic Session *
                  </label>
                  <select
                    value={currentSession}
                    onChange={(e) => {
                      setCurrentSession(e.target.value)
                      if (onChangeSession) onChangeSession(e.target.value)
                    }}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {sessions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {currentTerm === 't3' && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  ⚡ <strong>Third Term Mode Active:</strong> Student report sheets and collation tables will display 1st Term (100), 2nd Term (100), and 3rd Term (40 CA + 60 Exam = 100), computing the overall Annual Cumulative Average across the session.
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-white mb-1">Continuous Assessment & Exam Weights</h3>
              <p className="text-xs text-slate-400">Total must sum to 100%</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  CA Weight (Max Marks)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={caWeight}
                  onChange={(e) => setCaWeight(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Exam Weight (Max Marks)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={examWeight}
                  onChange={(e) => setExamWeight(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-bold"
                />
              </div>
            </div>

            {/* WAEC 9-Point Scale Table */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Official WAEC/NECO 9-Point Grading Scale</h4>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                {(settings.scale || []).map(sc => (
                  <div key={sc.grade} className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-center">
                    <p className="font-extrabold text-base text-sky-400">{sc.grade}</p>
                    <p className="text-xs text-slate-300 font-medium">{sc.min} - {sc.max}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1">{sc.remark}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/25 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Grading Configuration</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: SCHOOL INFORMATION */}
      {activeTab === 'school' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6">
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
            <div>
              <h3 className="text-base font-bold text-white mb-1">School Identity & Official Header</h3>
              <p className="text-xs text-slate-400">These details appear at the top of all printed student report cards</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                School Official Name
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                School Motto
              </label>
              <input
                type="text"
                value={schoolMotto}
                onChange={(e) => setSchoolMotto(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Physical Campus Address
              </label>
              <input
                type="text"
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Principal&apos;s Full Name & Titles
              </label>
              <input
                type="text"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>

            {/* Principal's Signature Upload Box */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Principal&apos;s Signature Image
              </label>
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center gap-4">
                  {principalSignature ? (
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-300">
                      <img
                        src={principalSignature}
                        alt="Principal Signature Preview"
                        className="h-12 max-w-[160px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-12 px-4 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-xs text-slate-500 italic bg-slate-800/40">
                      No signature image uploaded (using cursive text by default)
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-sky-600/20">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{principalSignature ? 'Change Signature Picture' : 'Upload Signature Picture'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = () => setPrincipalSignature(reader.result)
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </label>

                    {principalSignature && (
                      <button
                        type="button"
                        onClick={() => setPrincipalSignature('')}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold rounded-xl transition-all"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Upload a photo or scanned copy of the principal&apos;s signature. A transparent background PNG or high-contrast image on white paper is recommended.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Official Email
                </label>
                <input
                  type="email"
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Phone Numbers
                </label>
                <input
                  type="text"
                  value={schoolPhone}
                  onChange={(e) => setSchoolPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Official Website
                </label>
                <input
                  type="text"
                  value={schoolWebsite}
                  onChange={(e) => setSchoolWebsite(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/25 transition-all mt-4"
            >
              <Save className="w-4 h-4" />
              <span>Save School Details</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
