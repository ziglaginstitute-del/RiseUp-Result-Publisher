import React from 'react'
import { GraduationCap, Award, Printer, CheckCircle, FileText } from 'lucide-react'
import { computeGrade, isSubjectApplicableForStudent, getDeptBadgeColor } from '../utils/gradeCalculator'

export default function StudentPortal({
  currentUser,
  students = [],
  subjects = [],
  classes = [],
  grades = {},
  activeTerm = 't1',
  activeSession = '2025/2026',
  settings = {},
  onOpenReportCard
}) {
  const student = students.find(s => s.id === currentUser?.studentId) || students[0]

  if (!student) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400">
        <GraduationCap className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Student Profile Not Linked</h3>
        <p className="text-xs text-slate-400 mt-1">Please contact your school administrator to link your student record.</p>
      </div>
    )
  }

  const studentClass = classes.find(c => c.id === student.classId) || { name: 'Grade 10A' }
  const studentDept = student.department || 'General'

  // Filter applicable subjects
  const studentSubs = subjects.filter(sub =>
    isSubjectApplicableForStudent(sub, student.id, studentDept, grades)
  )

  let totalScoreSum = 0
  let gradedCount = 0

  const rows = studentSubs.map((sub, i) => {
    const studentGrade = grades[student.id]?.[activeTerm]?.[sub.id] || {}
    const ca = studentGrade.ca !== undefined && studentGrade.ca !== '' ? Number(studentGrade.ca) : null
    const exam = studentGrade.exam !== undefined && studentGrade.exam !== '' ? Number(studentGrade.exam) : null
    const total = studentGrade.total !== undefined && studentGrade.total !== '' ? Number(studentGrade.total) : null

    if (total !== null) {
      totalScoreSum += total
      gradedCount++
    }

    const { grade, remark } = computeGrade(total, settings.scale)

    return {
      index: i + 1,
      id: sub.id,
      name: sub.name,
      dept: sub.department,
      ca: ca !== null ? ca : '-',
      exam: exam !== null ? exam : '-',
      total: total !== null ? total : '-',
      grade: total !== null ? grade : '-',
      remark: total !== null ? remark : '-'
    }
  })

  const overallAvg = gradedCount > 0 ? (totalScoreSum / gradedCount).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      {/* Student Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-sky-900/60 to-indigo-950/60 border border-sky-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getDeptBadgeColor(studentDept)}`}>
                {studentDept} Department
              </span>
              <span className="text-xs text-sky-400 font-medium">Session: {activeSession}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome, {student.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Class: <span className="font-bold text-white">{studentClass.name}</span> | Reg No:{' '}
              <span className="font-mono text-sky-300 font-semibold">{student.reg_no || student.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenReportCard(student)}
              className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report Card</span>
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-sky-500/20">
          <div>
            <span className="text-[11px] text-sky-300 font-medium uppercase">Overall Term Average</span>
            <p className="text-2xl font-black text-white mt-0.5">{overallAvg}%</p>
          </div>
          <div>
            <span className="text-[11px] text-sky-300 font-medium uppercase">Subjects Graded</span>
            <p className="text-2xl font-black text-white mt-0.5">
              {gradedCount} of {studentSubs.length}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-sky-300 font-medium uppercase">Active Term</span>
            <p className="text-2xl font-black text-white mt-0.5 uppercase">{activeTerm}</p>
          </div>
          <div>
            <span className="text-[11px] text-sky-300 font-medium uppercase">Result Status</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">
              {Number(overallAvg) >= 50 ? 'PASSED' : 'ON TRIAL'}
            </p>
          </div>
        </div>
      </div>

      {/* Terminal Score Sheet Table */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Subject Scores & Continuous Assessment</h3>
          <span className="text-xs text-slate-400 font-medium">Term {activeTerm.slice(1)} Performance</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3">Subject Name</th>
                <th className="p-3">Department</th>
                <th className="p-3 text-center w-24">CA ({settings.caWeight || 40})</th>
                <th className="p-3 text-center w-24">Exam ({settings.examWeight || 60})</th>
                <th className="p-3 text-center w-24">Total (100)</th>
                <th className="p-3 text-center w-20">Grade</th>
                <th className="p-3">Appraisal Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/50">
                  <td className="p-3 text-center font-mono text-slate-500">{r.index}</td>
                  <td className="p-3 font-semibold text-white">{r.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDeptBadgeColor(r.dept)}`}>
                      {r.dept}
                    </span>
                  </td>
                  <td className="p-3 text-center font-medium">{r.ca}</td>
                  <td className="p-3 text-center font-medium">{r.exam}</td>
                  <td className="p-3 text-center font-bold text-white">{r.total}</td>
                  <td className="p-3 text-center">
                    {r.grade !== '-' ? (
                      <span className="px-2 py-0.5 rounded text-xs font-black bg-slate-900 border border-slate-700 text-sky-400">
                        {r.grade}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400 font-medium">{r.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
