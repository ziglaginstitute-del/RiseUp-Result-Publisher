import React, { useState } from 'react'
import {
  FileText,
  Printer,
  UserPlus,
  Maximize2,
  Minimize2,
  Download,
  Users,
  Filter,
  MessageSquare,
  CheckCircle,
  X,
  Save,
  Sparkles
} from 'lucide-react'
import {
  isSubjectApplicable,
  isSubjectApplicableForStudent,
  calculateClassCollation,
  getDeptBadgeColor
} from '../utils/gradeCalculator'
import { exportCollationSheetToCSV } from '../utils/csvExporter'

export default function ClassTeacherPortal({
  classes = [],
  subjects = [],
  students = [],
  grades = {},
  remarks = {},
  onSaveRemarks,
  activeTerm = 't1',
  activeSession = '2025/2026',
  settings = {},
  onOpenStudentModal,
  onOpenReportCard,
  onOpenBatchPrint
}) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '')
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('') // '', 'Science', 'Art', 'Commercial', 'Junior', 'General'
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Remark & Principal Comment Modal state
  const [remarkStudent, setRemarkStudent] = useState(null)
  const [teacherCommentInput, setTeacherCommentInput] = useState('')
  const [principalCommentInput, setPrincipalCommentInput] = useState('')
  const [decisionInput, setDecisionInput] = useState('')
  const [timesOpenedInput, setTimesOpenedInput] = useState(124)
  const [timesPresentInput, setTimesPresentInput] = useState(110)
  const [timesAbsentInput, setTimesAbsentInput] = useState(14)
  const [nextTermBeginsInput, setNextTermBeginsInput] = useState('')
  const [reportDateInput, setReportDateInput] = useState('')

  const selectedClass = classes.find(c => c.id === selectedClassId)

  // Students belonging to this class
  const allClassStudents = students.filter(s => s.classId === selectedClassId)

  // Department counts in this class
  const deptCounts = {
    Science: allClassStudents.filter(s => s.department === 'Science').length,
    Art: allClassStudents.filter(s => s.department === 'Art').length,
    Commercial: allClassStudents.filter(s => s.department === 'Commercial').length,
    Junior: allClassStudents.filter(s => s.department === 'Junior').length,
    General: allClassStudents.filter(s => s.department === 'General' || !s.department).length
  }

  // Filter students by selected department
  const filteredStudents = selectedDeptFilter
    ? allClassStudents.filter(s => (s.department || 'General') === selectedDeptFilter)
    : allClassStudents

  // Filter subjects displayed in columns
  let collationSubjects = subjects
  if (selectedDeptFilter) {
    collationSubjects = subjects.filter(sub => isSubjectApplicable(sub.department, selectedDeptFilter))
  }

  // Calculate dynamic averages and rankings
  const collationList = calculateClassCollation({
    classStudents: filteredStudents,
    subjects: collationSubjects,
    grades,
    activeTerm
  })

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleExportCSV = () => {
    const deptSuffix = selectedDeptFilter ? `_${selectedDeptFilter}` : ''
    exportCollationSheetToCSV({
      className: `${selectedClass?.name || 'Class'}${deptSuffix}`,
      collationList,
      subjects: collationSubjects,
      activeTerm
    })
  }

  const handleOpenRemarkModal = (student, avg, pos) => {
    const existing = remarks[student.id]?.[activeTerm] || {}
    setRemarkStudent({
      ...student,
      avg,
      pos
    })
    setTeacherCommentInput(
      existing.teacherComment ?? (
        activeTerm === 't3'
          ? 'She is very calm and works hard to meet goals.'
          : 'Praise shows maturity when solving problems with classmates and uses good communication.'
      )
    )
    setPrincipalCommentInput(
      existing.principalComment ?? (
        activeTerm === 't3'
          ? 'You have demonstrated excellence. Keep striving for even greater success as you journey through the last lap of the secondary school.'
          : 'This is a fantastic academic result. Work harder next term to improve your grade in Mathematics and Economics.'
      )
    )
    setDecisionInput(existing.decision ?? (activeTerm === 't3' ? 'PROMOTED TO DIVISION SIX' : 'COMMENDED'))
    setTimesOpenedInput(existing.timesOpened ?? (activeTerm === 't3' ? 94 : 124))
    setTimesPresentInput(existing.timesPresent ?? (activeTerm === 't3' ? 92 : 110))
    setTimesAbsentInput(existing.timesAbsent ?? (activeTerm === 't3' ? 2 : 14))
    setNextTermBeginsInput(existing.nextTermBegins ?? (activeTerm === 't3' ? '14th Sept, 2026' : '12th Jan., 2026'))
    setReportDateInput(existing.reportDate ?? (activeTerm === 't3' ? '17th July, 2026' : '19th December, 2025'))
  }

  const handleSaveRemark = (e) => {
    e.preventDefault()
    if (!remarkStudent) return
    if (onSaveRemarks) {
      onSaveRemarks({
        studentId: remarkStudent.id,
        termId: activeTerm,
        teacherComment: teacherCommentInput.trim(),
        principalComment: principalCommentInput.trim(),
        decision: decisionInput.trim(),
        timesOpened: Number(timesOpenedInput),
        timesPresent: Number(timesPresentInput),
        timesAbsent: Number(timesAbsentInput),
        nextTermBegins: nextTermBeginsInput.trim(),
        reportDate: reportDateInput.trim()
      })
    }
    setRemarkStudent(null)
  }

  const termNames = {
    t1: 'First Term',
    t2: 'Second Term',
    t3: 'Third Term (Annual Cumulative)'
  }

  const teacherPresets = [
    'Praise shows maturity when solving problems with classmates and uses good communication.',
    'She is very calm and works hard to meet goals.',
    'An exceptionally brilliant performance. Keep up the high standard!',
    'A commendable effort with good consistency. Keep striving for excellence.',
    'Good performance, but needs to devote more time to mathematical sciences.',
    'Capable of much better grades with increased dedication and regularity.'
  ]

  const principalPresets = [
    'This is a fantastic academic result. Work harder next term to improve your grade in Mathematics and Economics.',
    'You have demonstrated excellence. Keep striving for even greater success as you journey through the last lap of the secondary school.',
    'A commendable performance. Keep maintaining this high standard of academic excellence.',
    'A good result with steady improvement. Devote more time to challenging subjects next term.',
    'Fair effort. Harder work and punctuality are required to achieve your full potential.'
  ]

  // Count commented students
  const commentedCount = filteredStudents.filter(
    st => remarks[st.id]?.[activeTerm]?.teacherComment
  ).length

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-6 overflow-auto' : ''}`}>
      {/* Filters and Batch Actions Header */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Class and Department Selectors ONLY */}
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* Select Class */}
            <div className="min-w-[180px]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Select Your Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Department */}
            <div className="min-w-[200px]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Filter Department
              </label>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
              >
                <option value="">All Departments ({allClassStudents.length})</option>
                <option value="Science">Science Only ({deptCounts.Science})</option>
                <option value="Art">Art Only ({deptCounts.Art})</option>
                <option value="Commercial">Commercial Only ({deptCounts.Commercial})</option>
                <option value="Junior">Junior Class ({deptCounts.Junior})</option>
                <option value="General">General ({deptCounts.General})</option>
              </select>
            </div>

            {/* Remark Progress Pill */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-3 py-2 rounded-xl text-xs">
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400">Teacher & Principal Remarks:</span>
              <span className="font-bold text-white">
                {commentedCount} / {filteredStudents.length}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Master Sheet Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => onOpenStudentModal(selectedClassId)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student</span>
            </button>

            <button
              onClick={() => onOpenBatchPrint(selectedClass, filteredStudents)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {selectedDeptFilter
                  ? `Print ${selectedDeptFilter} Reports (${filteredStudents.length})`
                  : `Print All Reports (${allClassStudents.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Department Distribution Pills */}
        <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Department breakdown:</span>
          {deptCounts.Science > 0 && (
            <button
              onClick={() => setSelectedDeptFilter('Science')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                selectedDeptFilter === 'Science' ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              Science: {deptCounts.Science}
            </button>
          )}
          {deptCounts.Art > 0 && (
            <button
              onClick={() => setSelectedDeptFilter('Art')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                selectedDeptFilter === 'Art' ? 'bg-amber-500/30 text-amber-300 border-amber-400' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              Art: {deptCounts.Art}
            </button>
          )}
          {deptCounts.Commercial > 0 && (
            <button
              onClick={() => setSelectedDeptFilter('Commercial')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                selectedDeptFilter === 'Commercial' ? 'bg-purple-500/30 text-purple-300 border-purple-400' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              }`}
            >
              Commercial: {deptCounts.Commercial}
            </button>
          )}
          {deptCounts.Junior > 0 && (
            <button
              onClick={() => setSelectedDeptFilter('Junior')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                selectedDeptFilter === 'Junior' ? 'bg-sky-500/30 text-sky-300 border-sky-400' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
              }`}
            >
              Junior: {deptCounts.Junior}
            </button>
          )}
          {selectedDeptFilter && (
            <button
              onClick={() => setSelectedDeptFilter('')}
              className="text-xs text-slate-400 hover:text-white underline ml-2 cursor-pointer"
            >
              Reset to All
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Master Collation Sheet Table */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[620px] relative">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-900 sticky top-0 z-20 text-slate-300 font-bold border-b border-slate-700">
              <tr>
                {/* Sticky frozen columns */}
                <th className="p-3 sticky-col-name text-left w-44 min-w-[170px] bg-slate-900">
                  Student Name
                </th>
                <th className="p-3 sticky-col-dept text-center w-24 min-w-[90px] bg-slate-900">
                  Dept
                </th>

                {/* Vertical Rotated Subject Headers */}
                {collationSubjects.map(sub => (
                  <th
                    key={sub.id}
                    className="vertical-header text-slate-300 border-l border-slate-800/80"
                    title={`${sub.name} (${sub.department || 'General'})`}
                  >
                    <span>{sub.name}</span>
                    <span className="text-[10px] text-sky-400 block font-normal">
                      ({sub.department || 'Gen'})
                    </span>
                  </th>
                ))}

                {/* Summaries */}
                <th className="p-3 text-center w-24 border-l border-slate-700 bg-slate-900">
                  Avg %
                </th>
                <th className="p-3 text-center w-20 border-l border-slate-700 bg-slate-900">
                  Position
                </th>
                <th className="p-3 text-center w-48 border-l border-slate-700 bg-slate-900">
                  Teacher & Principal Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 text-slate-300">
              {collationList.length === 0 ? (
                <tr>
                  <td colSpan={collationSubjects.length + 5} className="p-8 text-center text-slate-500 italic">
                    No students configured matching the selected department filter.
                  </td>
                </tr>
              ) : (
                collationList.map(item => {
                  const studentDept = item.student.department || 'General'
                  const hasRemark = Boolean(remarks[item.student.id]?.[activeTerm]?.teacherComment)

                  return (
                    <tr key={item.student.id} className="hover:bg-slate-800/60 transition-colors">
                      {/* Frozen Student Name */}
                      <td className="p-3 sticky-col-name font-bold text-white">
                        <div className="truncate w-40">{item.student.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.student.reg_no || item.student.id}</div>
                      </td>

                      {/* Frozen Department */}
                      <td className="p-3 sticky-col-dept text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDeptBadgeColor(studentDept)}`}>
                          {studentDept}
                        </span>
                      </td>

                      {/* Subject Scores Matrix */}
                      {collationSubjects.map(sub => {
                        const isApplicable = isSubjectApplicableForStudent(
                          sub,
                          item.student.id,
                          studentDept,
                          grades
                        )

                        if (!isApplicable) {
                          return (
                            <td
                              key={sub.id}
                              className="p-2 text-center text-slate-600 text-[11px] italic border-l border-slate-800/60"
                            >
                              N/A
                            </td>
                          )
                        }

                        // Determine score
                        if (activeTerm === 't3') {
                          let sum = 0, count = 0
                          ;['t1', 't2', 't3'].forEach(t => {
                            const tot = grades[item.student.id]?.[t]?.[sub.id]?.total
                            if (tot !== undefined && tot !== '' && tot !== null) {
                              sum += Number(tot)
                              count++
                            }
                          })
                          const term3Tot = grades[item.student.id]?.['t3']?.[sub.id]?.total ?? '-'
                          const cumAvg = count > 0 ? (sum / count).toFixed(1) : '-'
                          return (
                            <td key={sub.id} className="p-2 text-center border-l border-slate-800/60 font-semibold text-white">
                              <span className="text-xs">{term3Tot}</span>
                              <span className="text-[10px] text-amber-400 block font-normal">({cumAvg})</span>
                            </td>
                          )
                        } else {
                          const gradeObj = grades[item.student.id]?.[activeTerm]?.[sub.id] || {}
                          const tot = gradeObj.total !== undefined && gradeObj.total !== '' ? gradeObj.total : '-'
                          const gr = gradeObj.grade || ''

                          return (
                            <td key={sub.id} className="p-2 text-center border-l border-slate-800/60 font-semibold text-white">
                              {tot !== '-' ? (
                                <div>
                                  <span className="text-xs">{tot}</span>
                                  {gr && <span className="text-[10px] text-sky-400 font-bold block">{gr}</span>}
                                </div>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                          )
                        }
                      })}

                      {/* Average */}
                      <td className="p-3 text-center font-black text-sky-400 border-l border-slate-700 text-sm">
                        {item.average > 0 ? `${item.average}%` : '-'}
                      </td>

                      {/* Rank Position */}
                      <td className="p-3 text-center border-l border-slate-700">
                        {item.position !== '-' ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            {item.position}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Teacher Actions: Remark & View Report */}
                      <td className="p-2 text-center border-l border-slate-700">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenRemarkModal(item.student, item.average, item.position)}
                            className={`flex items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              hasRemark
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                            title="Write or edit teacher remark, principal comment, and attendance"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{hasRemark ? 'Appraised ✓' : 'Appraise'}</span>
                          </button>

                          <button
                            onClick={() => onOpenReportCard(item.student)}
                            className="flex items-center gap-1 py-1 px-2 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-400 hover:text-sky-300 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                            title="Generate official report card"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Report</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Teacher & Principal Appraisal Modal */}
      {remarkStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-sky-400" />
                  <span>Teacher & Principal Appraisal</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {remarkStudent.name} ({remarkStudent.reg_no || remarkStudent.id}) • {termNames[activeTerm]}
                </p>
              </div>
              <button
                onClick={() => setRemarkStudent(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Quick Stats Context */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs mb-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Department</span>
                <span className="font-bold text-white">{remarkStudent.department || 'General'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Average Score</span>
                <span className="font-bold text-sky-400">{remarkStudent.avg || 0}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Class Rank</span>
                <span className="font-bold text-emerald-400">{remarkStudent.pos || '-'}</span>
              </div>
            </div>

            <form onSubmit={handleSaveRemark} className="space-y-4">
              {/* Teacher's Comment */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Teacher&apos;s Comment *
                  </label>
                  <span className="text-[10px] text-slate-400">Printed on official report sheet</span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={teacherCommentInput}
                  onChange={(e) => setTeacherCommentInput(e.target.value)}
                  placeholder="Enter teacher's comment..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                />

                {/* Teacher presets */}
                <div className="mt-1 flex flex-wrap gap-1">
                  {teacherPresets.slice(0, 2).map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setTeacherCommentInput(preset)}
                      className="text-left p-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 rounded text-slate-300 text-[10px] truncate max-w-xs"
                    >
                      Preset: &quot;{preset.slice(0, 35)}...&quot;
                    </button>
                  ))}
                </div>
              </div>

              {/* Principal's Comment */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Principal&apos;s Comment (Editable) *
                  </label>
                  <span className="text-[10px] text-sky-400 font-semibold">Rendered in blue script</span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={principalCommentInput}
                  onChange={(e) => setPrincipalCommentInput(e.target.value)}
                  placeholder="Enter principal's comment..."
                  className="w-full p-2.5 bg-slate-800 border border-sky-500/50 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                />

                {/* Principal presets */}
                <div className="mt-1 flex flex-wrap gap-1">
                  {principalPresets.slice(0, 2).map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setPrincipalCommentInput(preset)}
                      className="text-left p-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 rounded text-amber-300 text-[10px] truncate max-w-xs"
                    >
                      Preset: &quot;{preset.slice(0, 35)}...&quot;
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendance Breakdown (Opened, Present, Absent) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Attendance Record
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Times Opened:</span>
                    <input
                      type="number"
                      value={timesOpenedInput}
                      onChange={(e) => setTimesOpenedInput(e.target.value)}
                      className="w-full p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Times Present:</span>
                    <input
                      type="number"
                      value={timesPresentInput}
                      onChange={(e) => setTimesPresentInput(e.target.value)}
                      className="w-full p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Times Absent:</span>
                    <input
                      type="number"
                      value={timesAbsentInput}
                      onChange={(e) => setTimesAbsentInput(e.target.value)}
                      className="w-full p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Next Term Begins & Report Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Next Term Begins:
                  </label>
                  <input
                    type="text"
                    value={nextTermBeginsInput}
                    onChange={(e) => setNextTermBeginsInput(e.target.value)}
                    placeholder="e.g. 12th Jan., 2026"
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Report Issue Date:
                  </label>
                  <input
                    type="text"
                    value={reportDateInput}
                    onChange={(e) => setReportDateInput(e.target.value)}
                    placeholder="e.g. 19th December, 2025"
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              {/* 3rd Term Promotion Decision */}
              {activeTerm === 't3' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                    Promotion Decision (3rd Term):
                  </label>
                  <input
                    type="text"
                    value={decisionInput}
                    onChange={(e) => setDecisionInput(e.target.value)}
                    placeholder="e.g. PROMOTED TO DIVISION SIX"
                    className="w-full px-3 py-2 bg-slate-800 border border-amber-500/50 rounded-xl text-white text-xs font-bold"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRemarkStudent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Appraisal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}