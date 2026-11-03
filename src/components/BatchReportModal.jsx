import React from 'react'
import { Printer, X } from 'lucide-react'
import { computeGrade, getSubjectPosition, isSubjectApplicableForStudent } from '../utils/gradeCalculator'

export default function BatchReportModal({
  selectedClass,
  students = [],
  targetStudents = null,
  subjects = [],
  grades = {},
  remarks = {},
  activeTerm = 't1',
  activeSession = '2025/2026',
  settings = {},
  onClose
}) {
  const classStudents = targetStudents && targetStudents.length > 0
    ? targetStudents
    : students.filter(s => s.classId === selectedClass?.id)

  const termNames = {
    t1: 'FIRST',
    t2: 'SECOND',
    t3: 'THIRD'
  }

  const defaultNextTerm = activeTerm === 't3' ? '14th Sept, 2026' : '12th Jan., 2026'
  const defaultReportDate = activeTerm === 't3' ? '17th July, 2026' : '19th December, 2025'

  const handlePrint = () => {
    window.print()
  }

  return (
    /* Pure White Background for the entire batch print preview */
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center p-3 sm:p-6 overflow-y-auto">
      
      {/* Floating Toolbar on White Background */}
      <div className="sticky top-0 z-50 w-full max-w-4xl flex items-center justify-between py-3 px-4 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-sm mb-4 no-print">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <span className="font-bold text-xs text-slate-800">
            Batch Report Cards Preview ({classStudents.length} Students • {selectedClass?.name})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print All ({classStudents.length} Reports)</span>
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

      <div className="w-full max-w-4xl space-y-8 my-auto">
        {classStudents.map((student, sIdx) => {
          const studentDept = student.department || 'General'
          const studentSubs = subjects.filter(sub =>
            isSubjectApplicableForStudent(sub, student.id, studentDept, grades)
          )

          // Student remarks or defaults
          const stRemarks = remarks[student.id]?.[activeTerm] || {}
          const teacherComment = stRemarks.teacherComment || (
            activeTerm === 't3'
              ? 'She is very calm and works hard to meet goals.'
              : 'Praise shows maturity when solving problems with classmates and uses good communication.'
          )
          const principalComment = stRemarks.principalComment || (
            activeTerm === 't3'
              ? 'You have demonstrated excellence. Keep striving for even greater success as you journey through the last lap of the secondary school.'
              : 'This is a fantastic academic result. Work harder next term to improve your grade in Mathematics and Economics.'
          )
          const decision = stRemarks.decision || (activeTerm === 't3' ? 'PROMOTED TO DIVISION SIX' : 'COMMENDED')
          const timesOpened = stRemarks.timesOpened ?? (activeTerm === 't3' ? 94 : 124)
          const timesPresent = stRemarks.timesPresent ?? (activeTerm === 't3' ? 92 : 110)
          const timesAbsent = stRemarks.timesAbsent ?? (activeTerm === 't3' ? 2 : 14)
          const nextTermBegins = stRemarks.nextTermBegins || defaultNextTerm
          const reportDate = stRemarks.reportDate || defaultReportDate

          let totalScoreSum = 0

          const rows = studentSubs.map((sub, idx) => {
            const gradeObj = grades[student.id]?.[activeTerm]?.[sub.id] || {}
            const ca = gradeObj.ca !== undefined && gradeObj.ca !== '' ? Number(gradeObj.ca) : null
            const exam = gradeObj.exam !== undefined && gradeObj.exam !== '' ? Number(gradeObj.exam) : null
            const total = gradeObj.total !== undefined && gradeObj.total !== '' ? Number(gradeObj.total) : null

            // Term 1 and Term 2 Totals
            const t1Tot = grades[student.id]?.['t1']?.[sub.id]?.total !== undefined && grades[student.id]?.['t1']?.[sub.id]?.total !== ''
              ? Number(grades[student.id]['t1'][sub.id].total)
              : null
            const t2Tot = grades[student.id]?.['t2']?.[sub.id]?.total !== undefined && grades[student.id]?.['t2']?.[sub.id]?.total !== ''
              ? Number(grades[student.id]['t2'][sub.id].total)
              : null

            let sessionAvg = null
            if (activeTerm === 't3') {
              const termScores = [t1Tot, t2Tot, total].filter(x => x !== null)
              if (termScores.length > 0) {
                const sum = termScores.reduce((a, b) => a + b, 0)
                sessionAvg = Math.round(sum / termScores.length)
              }
            }

            const evaluatedScore = activeTerm === 't3' && sessionAvg !== null ? sessionAvg : total

            if (evaluatedScore !== null) {
              totalScoreSum += evaluatedScore
            }

            const { grade, remark } = computeGrade(evaluatedScore, settings.scale)

            const pos = getSubjectPosition({
              studentId: student.id,
              subjectId: sub.id,
              classStudents,
              grades,
              activeTerm,
              subDept: sub.department
            })

            return {
              idx: idx + 1,
              name: sub.name,
              dept: sub.department,
              ca: ca !== null ? ca : '',
              exam: exam !== null ? exam : '',
              total: total !== null ? total : '',
              t1Tot: t1Tot !== null ? t1Tot : '',
              t2Tot: t2Tot !== null ? t2Tot : '',
              sessionAvg: sessionAvg !== null ? sessionAvg : '',
              grade: evaluatedScore !== null ? grade : '',
              remark: evaluatedScore !== null ? remark : '',
              pos: pos !== '-' ? pos : ''
            }
          })

          const totalMarksObtainable = rows.length * 100
          const overallAvg = totalMarksObtainable > 0 ? ((totalScoreSum / totalMarksObtainable) * 100).toFixed(1) : '0.0'

          return (
            <div
              key={student.id}
              className="printable-card-wrapper bg-white text-slate-900 rounded-sm p-6 sm:p-8 relative font-sans border border-slate-300 shadow-sm"
              style={{ pageBreakAfter: sIdx < classStudents.length - 1 ? 'always' : 'auto' }}
            >
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
                        {selectedClass?.name || 'FIVE'}
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

              {/* Table */}
              <div className="border-2 border-slate-900 rounded-sm overflow-hidden mb-3 bg-white">
                <table className="w-full text-xs text-left border-collapse bg-white">
                  <thead>
                    {activeTerm === 't3' ? (
                      <>
                        <tr className="bg-white text-slate-900 font-bold border-b border-slate-900 text-center text-[10px]">
                          <th rowSpan={2} className="p-1.5 w-6 border-r border-slate-900">#</th>
                          <th rowSpan={2} className="p-1.5 text-left border-r border-slate-900">SUBJECTS</th>
                          <th colSpan={3} className="p-1 border-r border-slate-900 uppercase font-extrabold">CURRENT TERM</th>
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
                      <>
                        <tr className="bg-white text-slate-900 font-bold border-b border-slate-900 text-center text-[10px]">
                          <th rowSpan={2} className="p-1.5 w-6 border-r border-slate-900">#</th>
                          <th rowSpan={2} className="p-1.5 text-left border-r border-slate-900">SUBJECTS</th>
                          <th colSpan={3} className="p-1 border-r border-slate-900 uppercase font-extrabold">CURRENT TERM</th>
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
                    {rows.map(r => (
                      <tr key={r.idx} className="bg-white">
                        <td className="p-1.5 text-center font-medium border-r border-slate-300 text-slate-600 bg-white">{r.idx}</td>
                        <td className="p-1.5 font-bold text-slate-900 border-r border-slate-300 bg-white">{r.name}</td>
                        <td className="p-1.5 text-center font-bold border-r border-slate-300 bg-white">{r.ca}</td>
                        <td className="p-1.5 text-center font-bold border-r border-slate-300 bg-white">{r.exam}</td>
                        <td className="p-1.5 text-center font-black border-r border-slate-300 bg-white">{r.total}</td>

                        {activeTerm === 't3' && (
                          <>
                            <td className="p-1.5 text-center font-bold border-r border-slate-300 bg-white">{r.t1Tot}</td>
                            <td className="p-1.5 text-center font-bold border-r border-slate-300 bg-white">{r.t2Tot}</td>
                            <td className="p-1.5 text-center font-black border-r border-slate-300 text-slate-950 bg-white">{r.sessionAvg}</td>
                          </>
                        )}

                        <td className="p-1.5 text-center font-bold border-r border-slate-300 bg-white">{r.pos}</td>
                        <td className="p-1.5 text-center font-extrabold border-r border-slate-300 text-slate-950 bg-white">{r.grade}</td>
                        <td className="p-1.5 font-bold text-[10px] text-slate-800 uppercase bg-white">{r.remark}</td>
                      </tr>
                    ))}

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

              {/* Appraisal Comments Section */}
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

                {/* Principal's Comment Box */}
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

              {/* 3rd Term Promotion Decision */}
              {activeTerm === 't3' && (
                <div className="text-center font-black text-sm text-slate-900 my-2 tracking-wide uppercase bg-white">
                  DECISION: {decision}
                </div>
              )}

              {/* Footer: Principal Signature, Stamp & Date */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs bg-white">
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

                <div className="border border-slate-400 p-1.5 px-3 rounded text-center text-xs font-bold text-slate-900 bg-white">
                  {reportDate}
                </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}