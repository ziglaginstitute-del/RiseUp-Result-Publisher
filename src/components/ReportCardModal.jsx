import React, { useState } from 'react'
import { Printer, X, Edit3, Save, Upload } from 'lucide-react'
import { computeGrade, getSubjectPosition, isSubjectApplicableForStudent } from '../utils/gradeCalculator'

export default function ReportCardModal({
  student,
  allStudents = [],
  subjects = [],
  classes = [],
  grades = {},
  remarks = {},
  onSaveRemarks,
  onUpdateSettings,
  activeTerm = 't1',
  activeSession = '2025/2026',
  settings = {},
  onClose
}) {
  if (!student) return null

  const studentClass = classes.find(c => c.id === student.classId) || { name: 'Grade 10A' }
  const classStudents = allStudents.filter(s => s.classId === student.classId)
  const studentDept = student.department || 'General'

  // Retrieve current student appraisal data from state or smart defaults
  const stRemarks = remarks[student.id]?.[activeTerm] || {}

  const defaultTeacherComment = activeTerm === 't3'
    ? 'She is very calm and works hard to meet goals.'
    : 'Praise shows maturity when solving problems with classmates and uses good communication.'

  const defaultPrincipalComment = activeTerm === 't3'
    ? 'You have demonstrated excellence. Keep striving for even greater success as you journey through the last lap of the secondary school.'
    : 'This is a fantastic academic result. Work harder next term to improve your grade in Mathematics and Economics.'

  const defaultDecision = activeTerm === 't3' ? 'PROMOTED TO DIVISION SIX' : 'COMMENDED'
  const defaultTimesOpened = activeTerm === 't3' ? 94 : 124
  const defaultTimesPresent = activeTerm === 't3' ? 92 : 110
  const defaultTimesAbsent = activeTerm === 't3' ? 2 : 14
  const defaultNextTerm = activeTerm === 't3' ? '14th Sept, 2026' : '12th Jan., 2026'
  const defaultReportDate = activeTerm === 't3' ? '17th July, 2026' : '19th December, 2025'

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false)
  const [teacherComment, setTeacherComment] = useState(stRemarks.teacherComment ?? defaultTeacherComment)
  const [principalComment, setPrincipalComment] = useState(stRemarks.principalComment ?? defaultPrincipalComment)
  const [decision, setDecision] = useState(stRemarks.decision ?? defaultDecision)
  const [timesOpened, setTimesOpened] = useState(stRemarks.timesOpened ?? defaultTimesOpened)
  const [timesPresent, setTimesPresent] = useState(stRemarks.timesPresent ?? defaultTimesPresent)
  const [timesAbsent, setTimesAbsent] = useState(stRemarks.timesAbsent ?? defaultTimesAbsent)
  const [nextTermBegins, setNextTermBegins] = useState(stRemarks.nextTermBegins ?? defaultNextTerm)
  const [reportDate, setReportDate] = useState(stRemarks.reportDate ?? defaultReportDate)

  // Only subjects applicable to this student
  const studentSubjects = subjects.filter(sub =>
    isSubjectApplicableForStudent(sub, student.id, studentDept, grades)
  )

  const termNames = {
    t1: 'FIRST',
    t2: 'SECOND',
    t3: 'THIRD'
  }

  // Compile scores and positions
  let totalScoreSum = 0

  const subjectRows = studentSubjects.map((sub, idx) => {
    const studentGrade = grades[student.id]?.[activeTerm]?.[sub.id] || {}
    const ca = studentGrade.ca !== undefined && studentGrade.ca !== '' ? Number(studentGrade.ca) : null
    const exam = studentGrade.exam !== undefined && studentGrade.exam !== '' ? Number(studentGrade.exam) : null
    const total = studentGrade.total !== undefined && studentGrade.total !== '' ? Number(studentGrade.total) : null

    // Term 1 and Term 2 Totals
    const t1Tot = grades[student.id]?.['t1']?.[sub.id]?.total !== undefined && grades[student.id]?.['t1']?.[sub.id]?.total !== ''
      ? Number(grades[student.id]['t1'][sub.id].total)
      : null
    const t2Tot = grades[student.id]?.['t2']?.[sub.id]?.total !== undefined && grades[student.id]?.['t2']?.[sub.id]?.total !== ''
      ? Number(grades[student.id]['t2'][sub.id].total)
      : null

    // For Term 3: Session Average (T1 + T2 + T3) / count
    let sessionAvg = null
    if (activeTerm === 't3') {
      const termScores = [t1Tot, t2Tot, total].filter(x => x !== null)
      if (termScores.length > 0) {
        const sum = termScores.reduce((acc, curr) => acc + curr, 0)
        sessionAvg = Math.round(sum / termScores.length)
      }
    }

    const evaluatedScore = activeTerm === 't3' && sessionAvg !== null ? sessionAvg : total

    if (evaluatedScore !== null) {
      totalScoreSum += evaluatedScore
    }

    const { grade, remark } = computeGrade(evaluatedScore, settings.scale)

    const position = getSubjectPosition({
      studentId: student.id,
      subjectId: sub.id,
      classStudents,
      grades,
      activeTerm,
      subDept: sub.department
    })

    return {
      index: idx + 1,
      id: sub.id,
      name: sub.name,
      department: sub.department,
      ca: ca !== null ? ca : '',
      exam: exam !== null ? exam : '',
      total: total !== null ? total : '',
      t1Tot: t1Tot !== null ? t1Tot : '',
      t2Tot: t2Tot !== null ? t2Tot : '',
      sessionAvg: sessionAvg !== null ? sessionAvg : '',
      grade: evaluatedScore !== null ? grade : '',
      remark: evaluatedScore !== null ? remark : '',
      position: position !== '-' ? position : ''
    }
  })

  const totalMarksObtainable = subjectRows.length * 100
  const overallAvg = totalMarksObtainable > 0 ? ((totalScoreSum / totalMarksObtainable) * 100).toFixed(1) : '0.0'

  const handlePrint = () => {
    window.print()
  }

  const handleSaveAppraisal = (e) => {
    if (e) e.preventDefault()
    if (onSaveRemarks) {
      onSaveRemarks({
        studentId: student.id,
        termId: activeTerm,
        teacherComment,
        principalComment,
        decision,
        timesOpened,
        timesPresent,
        timesAbsent,
        nextTermBegins,
        reportDate
      })
    }
    setIsEditing(false)
  }

  // Quick Presets for Teacher & Principal
  const teacherPresets = [
    'Praise shows maturity when solving problems with classmates and uses good communication.',
    'She is very calm and works hard to meet goals.',
    'A dedicated and well-behaved student who demonstrates strong academic potential.',
    'Shows keen interest in studies and participates actively in class discussions.',
    'Has potential for better grades with consistent focus and regular homework completion.'
  ]

  const principalPresets = [
    'This is a fantastic academic result. Work harder next term to improve your grade in Mathematics and Economics.',
    'You have demonstrated excellence. Keep striving for even greater success as you journey through the last lap of the secondary school.',
    'A commendable performance. Keep maintaining this high standard of academic excellence.',
    'A good result with steady improvement. Devote more time to challenging subjects next term.',
    'Fair effort. Harder work and punctuality are required to achieve your full potential.'
  ]

  return (
    /* Pure White Background for the entire page preceding PDF save */
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center p-3 sm:p-6 overflow-y-auto">
      
      {/* Top action toolbar (hidden during printing) */}
      <div className="sticky top-0 z-50 w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 py-3 px-4 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-sm mb-4 no-print">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <span className="font-bold text-xs text-slate-800">RiseUp College Report Card Preview</span>
        </div>

        <div className="flex items-center gap-2">
          {onSaveRemarks && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 transition-all cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-600" />
              <span>{isEditing ? 'Close Editor' : 'Edit Remarks & Principal Comment'}</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl transition-all cursor-pointer"
            title="Close Preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-4xl my-auto space-y-4">
        
        {/* EDIT APPRAISAL DRAWER (no-print) */}
        {isEditing && (
          <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 text-xs text-slate-800 shadow-sm space-y-4 no-print">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-600" />
                Edit Comments & Attendance for {student.name} ({termNames[activeTerm]} Term)
              </span>
              <button
                onClick={handleSaveAppraisal}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teacher's Comment */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class Teacher&apos;s Comment:</label>
                <textarea
                  rows={3}
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-sky-500"
                />
                <div className="mt-1 flex flex-wrap gap-1">
                  {teacherPresets.slice(0, 3).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTeacherComment(p)}
                      className="text-[10px] bg-white hover:bg-slate-100 text-sky-700 p-1 rounded border border-slate-300 text-left truncate max-w-xs"
                    >
                      Preset: &quot;{p.slice(0, 40)}...&quot;
                    </button>
                  ))}
                </div>
              </div>

              {/* Principal's Comment */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-sky-700">Principal&apos;s Comment (Editable):</label>
                <textarea
                  rows={3}
                  value={principalComment}
                  onChange={(e) => setPrincipalComment(e.target.value)}
                  className="w-full p-2.5 bg-white border border-sky-400 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-sky-500"
                />
                <div className="mt-1 flex flex-wrap gap-1">
                  {principalPresets.slice(0, 3).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrincipalComment(p)}
                      className="text-[10px] bg-white hover:bg-slate-100 text-amber-700 p-1 rounded border border-slate-300 text-left truncate max-w-xs"
                    >
                      Preset: &quot;{p.slice(0, 40)}...&quot;
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Attendance, Decision & Dates */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-200 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Times Opened:</label>
                <input
                  type="number"
                  value={timesOpened}
                  onChange={(e) => setTimesOpened(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Times Present:</label>
                <input
                  type="number"
                  value={timesPresent}
                  onChange={(e) => setTimesPresent(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Times Absent:</label>
                <input
                  type="number"
                  value={timesAbsent}
                  onChange={(e) => setTimesAbsent(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Next Term Begins:</label>
                <input
                  type="text"
                  value={nextTermBegins}
                  onChange={(e) => setNextTermBegins(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Report Date:</label>
                <input
                  type="text"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold"
                />
              </div>
            </div>

            {activeTerm === 't3' && (
              <div className="pt-2">
                <label className="block text-amber-700 font-bold mb-1">3rd Term Promotion Decision:</label>
                <input
                  type="text"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder="e.g. PROMOTED TO DIVISION SIX"
                  className="w-full p-2 bg-white border border-amber-500 rounded-lg text-slate-900 font-bold"
                />
              </div>
            )}

            {/* Principal Signature Picture Upload in Drawer */}
            <div className="pt-3 border-t border-slate-200">
              <label className="block text-slate-700 font-bold mb-1">Principal&apos;s Signature Picture & Name:</label>
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-300 rounded-xl">
                <div className="flex items-center gap-3">
                  {settings.principalSignature ? (
                    <div className="p-1.5 bg-slate-50 border border-slate-300 rounded">
                      <img
                        src={settings.principalSignature}
                        alt="Signature Preview"
                        className="h-10 max-w-[130px] object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No signature picture uploaded</span>
                  )}
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-lg text-xs font-bold cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5 text-sky-600" />
                    <span>{settings.principalSignature ? 'Change Picture' : 'Upload Signature Picture'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && onUpdateSettings) {
                          const reader = new FileReader()
                          reader.onload = () => {
                            onUpdateSettings({ ...settings, principalSignature: reader.result })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                  {settings.principalSignature && onUpdateSettings && (
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, principalSignature: '' })}
                      className="text-xs text-red-500 hover:text-red-700 underline font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Name appearing under signature:</span>
                  <span className="text-xs font-bold text-slate-900">{settings.principalName || 'John Ogundijo'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE REPORT CARD (PURE WHITE BACKGROUND MATCHING REFERENCE PDF) */}
        <div className="printable-card-wrapper bg-white text-slate-900 rounded-sm p-6 sm:p-8 relative font-sans border border-slate-300 shadow-sm">
          
          {/* Header with Logo, School Name, and Address */}
          <div className="text-center relative pb-3 mb-3 border-b-2 border-slate-800 bg-white">
            <div className="absolute left-0 top-0">
              <img
                src="./RiseUp Logo.png"
                alt="RiseUp Logo"
                className="w-16 h-16 object-contain"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 font-serif">
              {settings.schoolName || 'RiseUp College'}
            </h1>
            <p className="text-xs text-slate-800 font-semibold mt-1">
              {settings.schoolAddress || '5, Oriade Close, Off Council Road, Water Bus Stop, Ipaja, Lagos.'}
            </p>
          </div>

          {/* Student Profile Info Grid (4-Row Formatted Table) */}
          <div className="border-2 border-amber-800/80 rounded-sm overflow-hidden mb-3 text-xs bg-white">
            <table className="w-full border-collapse bg-white">
              <tbody>
                {/* Row 1 */}
                <tr className="border-b border-amber-800/70">
                  <td className="w-1/4 p-1.5 font-bold text-slate-900 border-r border-amber-800/70 bg-white">
                    NAME OF STUDENT
                  </td>
                  <td className="w-1/4 p-1.5 font-extrabold text-slate-950 border-r border-amber-800/70 uppercase bg-white">
                    {student.name}
                  </td>
                  <td className="w-1/4 p-1.5 font-bold text-slate-900 border-r border-amber-800/70 bg-white">
                    SEX
                  </td>
                  <td className="w-1/4 p-1.5 font-extrabold text-slate-950 uppercase bg-white">
                    {student.gender === 'F' ? 'FEMALE' : 'MALE'}
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="border-b border-amber-800/70">
                  <td className="p-1.5 font-bold text-slate-900 border-r border-amber-800/70 bg-white">
                    NUMBER IN CLASS
                  </td>
                  <td className="p-1.5 font-bold text-slate-950 border-r border-amber-800/70 bg-white">
                    {classStudents.length || 24}
                  </td>
                  <td className="p-1.5 font-bold text-slate-900 border-r border-amber-800/70 bg-white">
                    NEXT TERM BEGINS
                  </td>
                  <td className="p-1.5 font-bold text-slate-950 bg-white">
                    {nextTermBegins}
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="border-b border-amber-800/70">
                  <td className="p-1.5 font-bold text-slate-900 border-r border-amber-800/70 bg-white">
                    DIVISION
                  </td>
                  <td className="p-1.5 font-bold text-slate-950 border-r border-amber-800/70 uppercase bg-white">
                    {studentClass.name || 'FIVE'}
                  </td>
                  <td className="p-1.5 font-bold text-slate-900 border-r border-amber-800/70 bg-white">
                    SESSION
                  </td>
                  <td className="p-1.5 font-bold text-slate-950 bg-white">
                    {activeSession}
                  </td>
                </tr>

                {/* Row 4 */}
                <tr>
                  <td className="p-1.5 font-bold text-slate-900 border-r border-amber-800/70 bg-white">
                    TERM
                  </td>
                  <td colSpan={3} className="p-1.5 font-extrabold text-slate-950 uppercase bg-white">
                    {termNames[activeTerm]}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Attendance and Grading Key Dual Section */}
          <div className="flex flex-col sm:flex-row items-stretch justify-between gap-3 mb-3 text-xs bg-white">
            {/* Left Box: Attendance Record */}
            <div className="w-full sm:w-[48%] border-2 border-amber-800/80 rounded-sm overflow-hidden bg-white">
              <table className="w-full border-collapse bg-white">
                <tbody>
                  <tr className="border-b border-amber-800/70">
                    <td className="p-1.5 font-bold text-slate-900 border-r border-amber-800/70 bg-white">
                      NO. OF TIMES SCHOOL OPENED
                    </td>
                    <td className="p-1.5 font-extrabold text-center text-slate-950 w-16 bg-white">
                      {timesOpened}
                    </td>
                  </tr>
                  <tr className="border-b border-amber-800/70">
                    <td className="p-1.5 font-bold text-slate-900 border-r border-amber-800/70 bg-white">
                      NO. OF TIMES PRESENT
                    </td>
                    <td className="p-1.5 font-extrabold text-center text-slate-950 w-16 bg-white">
                      {timesPresent}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-bold text-slate-900 border-r border-amber-800/70 bg-white">
                      NO. OF TIMES ABSENT
                    </td>
                    <td className="p-1.5 font-extrabold text-center text-slate-950 w-16 bg-white">
                      {timesAbsent}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Box: Key to Grades */}
            <div className="w-full sm:w-[50%] border-2 border-amber-800/80 rounded-sm p-2 text-[10px] leading-tight font-medium bg-white">
              <p className="font-bold underline mb-1 text-slate-900">Key to Grades:</p>
              <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-slate-800">
                <span>75-100 = A1;</span>
                <span>60-64 = C4;</span>
                <span>45-49 = D7</span>
                <span>70-74 = B2;</span>
                <span>55-59 = C5;</span>
                <span>40-44 = E8</span>
                <span>65-69 = B3;</span>
                <span>50-54 = C6;</span>
                <span>0-39 = F9</span>
              </div>
            </div>
          </div>

          {/* Subjects Assessment Matrix Table */}
          <div className="border-2 border-slate-900 rounded-sm overflow-hidden mb-3 bg-white">
            <table className="w-full text-xs text-left border-collapse bg-white">
              <thead>
                {activeTerm === 't3' ? (
                  /* Third Term (Session Average) Header */
                  <>
                    <tr className="bg-white text-slate-900 font-bold border-b border-slate-900 text-center text-[10px]">
                      <th rowSpan={2} className="p-1.5 w-6 border-r border-slate-900">#</th>
                      <th rowSpan={2} className="p-1.5 text-left border-r border-slate-900">SUBJECTS</th>
                      <th colSpan={3} className="p-1 border-r border-slate-900 uppercase font-extrabold">
                        CURRENT TERM
                      </th>
                      <th rowSpan={2} className="p-1.5 w-14 border-r border-slate-900">1st Term<br />Score<br />(100)</th>
                      <th rowSpan={2} className="p-1.5 w-14 border-r border-slate-900">2nd Term<br />Score<br />(100)</th>
                      <th rowSpan={2} className="p-1.5 w-16 border-r border-slate-900 font-black">Session<br />Average<br />(100)</th>
                      <th rowSpan={2} className="p-1.5 w-12 border-r border-slate-900">SUBJ<br />POSIT.</th>
                      <th rowSpan={2} className="p-1.5 w-12 border-r border-slate-900">GRADE</th>
                      <th rowSpan={2} className="p-1.5 w-20">REMARK</th>
                    </tr>
                    <tr className="bg-white text-slate-900 font-bold border-b border-slate-900 text-center text-[10px]">
                      <th className="p-1 w-10 border-r border-slate-900">C.A<br />(40)</th>
                      <th className="p-1 w-10 border-r border-slate-900">EXAM<br />(60)</th>
                      <th className="p-1 w-12 border-r border-slate-900 font-extrabold">TERM&apos;S<br />TOTAL<br />(100)</th>
                    </tr>
                  </>
                ) : (
                  /* First Term & Second Term Header */
                  <>
                    <tr className="bg-white text-slate-900 font-bold border-b border-slate-900 text-center text-[10px]">
                      <th rowSpan={2} className="p-1.5 w-6 border-r border-slate-900">#</th>
                      <th rowSpan={2} className="p-1.5 text-left border-r border-slate-900">SUBJECTS</th>
                      <th colSpan={3} className="p-1 border-r border-slate-900 uppercase font-extrabold">
                        CURRENT TERM
                      </th>
                      <th rowSpan={2} className="p-1.5 w-14 border-r border-slate-900">SUBJ<br />POSIT.</th>
                      <th rowSpan={2} className="p-1.5 w-14 border-r border-slate-900">GRADE</th>
                      <th rowSpan={2} className="p-1.5 w-24">REMARK</th>
                    </tr>
                    <tr className="bg-white text-slate-900 font-bold border-b border-slate-900 text-center text-[10px]">
                      <th className="p-1 w-12 border-r border-slate-900">C.A<br />(40)</th>
                      <th className="p-1 w-12 border-r border-slate-900">EXAM<br />(60)</th>
                      <th className="p-1 w-14 border-r border-slate-900 font-extrabold">TERM&apos;S<br />TOTAL<br />(100)</th>
                    </tr>
                  </>
                )}
              </thead>

              <tbody className="divide-y divide-slate-300 bg-white">
                {subjectRows.length === 0 ? (
                  <tr>
                    <td colSpan={activeTerm === 't3' ? 11 : 8} className="p-4 text-center text-slate-500 italic bg-white">
                      No subjects recorded for this student.
                    </td>
                  </tr>
                ) : (
                  subjectRows.map(row => (
                    <tr key={row.id} className="bg-white">
                      <td className="p-1.5 text-center font-medium border-r border-slate-300 text-slate-600 bg-white">{row.index}</td>
                      <td className="p-1.5 font-bold text-slate-900 border-r border-slate-300 bg-white">{row.name}</td>
                      <td className="p-1.5 text-center font-bold border-r border-slate-300 bg-white">{row.ca}</td>
                      <td className="p-1.5 text-center font-bold border-r border-slate-300 bg-white">{row.exam}</td>
                      <td className="p-1.5 text-center font-black border-r border-slate-300 bg-white">{row.total}</td>

                      {activeTerm === 't3' && (
                        <>
                          <td className="p-1.5 text-center font-bold border-r border-slate-300 bg-white">{row.t1Tot}</td>
                          <td className="p-1.5 text-center font-bold border-r border-slate-300 bg-white">{row.t2Tot}</td>
                          <td className="p-1.5 text-center font-black border-r border-slate-300 text-slate-950 bg-white">{row.sessionAvg}</td>
                        </>
                      )}

                      <td className="p-1.5 text-center font-bold border-r border-slate-300 bg-white">{row.position}</td>
                      <td className="p-1.5 text-center font-extrabold border-r border-slate-300 text-slate-950 bg-white">{row.grade}</td>
                      <td className="p-1.5 font-bold text-[10px] text-slate-800 uppercase bg-white">{row.remark}</td>
                    </tr>
                  ))
                )}

                {/* Bottom Summary Rows */}
                <tr className="border-t-2 border-slate-900 bg-white font-bold">
                  <td colSpan={2} className="p-1.5 text-left border-r border-slate-900 font-extrabold bg-white">
                    TOTAL MARKS OBTAINED
                  </td>
                  <td colSpan={activeTerm === 't3' ? 9 : 6} className="p-1.5 text-left font-black text-slate-950 bg-white">
                    {totalScoreSum}
                  </td>
                </tr>

                <tr className="border-t border-slate-300 bg-white font-bold">
                  <td colSpan={2} className="p-1.5 text-left border-r border-slate-900 font-extrabold bg-white">
                    TOTAL MARKS OBTAINABLE
                  </td>
                  <td colSpan={activeTerm === 't3' ? 9 : 6} className="p-1.5 text-left font-black text-slate-950 bg-white">
                    {totalMarksObtainable}
                  </td>
                </tr>

                <tr className="border-t border-slate-300 bg-white font-bold">
                  <td colSpan={2} className="p-1.5 text-left border-r border-slate-900 font-extrabold bg-white">
                    AVERAGE (%)
                  </td>
                  <td colSpan={activeTerm === 't3' ? 9 : 6} className="p-1.5 text-left font-black text-slate-950 text-sm bg-white">
                    {overallAvg}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Appraisal Comments Section (Teacher + Principal) */}
          <div className="border-2 border-amber-800/80 rounded-sm overflow-hidden mb-3 text-xs bg-white">
            {/* Teacher's Comment Box */}
            <div className="flex border-b border-amber-800/70 bg-white">
              <div className="w-1/4 p-2 font-bold text-slate-900 border-r border-amber-800/70 flex items-center justify-center text-center bg-white">
                TEACHER&apos;S COMMENT
              </div>
              <div className="w-3/4 p-2 font-medium text-slate-950 flex items-center bg-white">
                {teacherComment}
              </div>
            </div>

            {/* Principal's Comment Box - Styled with Elegant Blue Cursive */}
            <div className="flex bg-white">
              <div className="w-1/4 p-2 font-bold text-slate-900 border-r border-amber-800/70 flex items-center justify-center text-center bg-white">
                PRINCIPAL&apos;S COMMENT
              </div>
              <div
                className="w-3/4 p-2 font-semibold text-sky-700 flex items-center italic text-sm bg-white"
                style={{ fontFamily: "'Caveat', 'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive" }}
              >
                {principalComment}
              </div>
            </div>
          </div>

          {/* 3rd Term Promotion Decision Banner */}
          {activeTerm === 't3' && (
            <div className="text-center font-black text-sm text-slate-900 my-2 tracking-wide uppercase bg-white">
              DECISION: {decision}
            </div>
          )}

          {/* Footer: Principal Signature, Stamp & Date */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs bg-white">
            {/* Contact details */}
            <div className="text-[10px] text-slate-600 font-medium">
              <span>{settings.schoolWebsite || 'www.riseupcollege.org'}, {settings.schoolEmail || 'school@riseupcollege.org'}</span>
              <span className="block mt-0.5">{settings.schoolPhone || '08156202927, 08113792266'}</span>
            </div>

            {/* Principal Signature */}
            <div className="text-center flex flex-col items-center min-w-[130px]">
              {settings.principalSignature ? (
                <img
                  src={settings.principalSignature}
                  alt="Principal's Signature"
                  className="h-10 sm:h-12 max-w-[140px] object-contain mb-0.5"
                />
              ) : (
                <div
                  className="text-base text-slate-800 font-bold italic h-8 flex items-center justify-center"
                  style={{ fontFamily: "'Caveat', 'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive" }}
                >
                  {settings.principalName || 'John Ogundijo'}
                </div>
              )}
              <div className="w-28 border-b border-slate-800 mb-0.5"></div>
              <span className="text-[10px] text-slate-900 font-bold">
                {settings.principalName || 'John Ogundijo'}
              </span>
              <span className="text-[8px] text-slate-500 font-medium uppercase tracking-wider">
                Principal
              </span>
            </div>

            {/* Date Box */}
            <div className="border border-slate-400 p-1.5 px-3 rounded text-center text-xs font-bold text-slate-900 bg-white">
              {reportDate}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}