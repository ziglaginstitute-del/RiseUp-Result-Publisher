import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Save,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Users,
  Smartphone,
  Table
} from 'lucide-react'
import { isSubjectApplicable, computeGrade, getDeptBadgeColor } from '../utils/gradeCalculator'
import { downloadSubjectScoreSheetCSV, parseSubjectScoreSheetCSV } from '../utils/csvExporter'

export default function SubjectTeacherPortal({
  classes = [],
  subjects = [],
  students = [],
  grades = {},
  activeTerm = 't1',
  activeSession = '2025/2026',
  settings = {},
  onSaveGrades,
  onOpenSubjectModal,
  onShowToast
}) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '')
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '')
  const [showAllClassStudents, setShowAllClassStudents] = useState(false)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'card'

  // Local draft scores matrix: { [studentId]: { ca: '', exam: '', total: '', grade: '', remark: '' } }
  const [localScores, setLocalScores] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)
  const selectedClass = classes.find(c => c.id === selectedClassId)

  // Students belonging to selected class
  const classStudents = students.filter(st => st.classId === selectedClassId)

  // Eligible students: By default, departmentally eligible. If toggle enabled or subject is Elective/General, all class students.
  const eligibleStudents = classStudents.filter(st => {
    if (showAllClassStudents || !selectedSubject || selectedSubject.department === 'Elective' || selectedSubject.department === 'General') {
      return true
    }
    return isSubjectApplicable(selectedSubject.department, st.department || 'General')
  })

  // Load existing grades into local draft state whenever class, subject, or activeTerm changes
  useEffect(() => {
    const drafts = {}
    classStudents.forEach(st => {
      const existing = grades[st.id]?.[activeTerm]?.[selectedSubjectId] || {}
      drafts[st.id] = {
        ca: existing.ca !== undefined && existing.ca !== null ? String(existing.ca) : '',
        exam: existing.exam !== undefined && existing.exam !== null ? String(existing.exam) : '',
        total: existing.total !== undefined && existing.total !== null ? String(existing.total) : '',
        grade: existing.grade || '',
        remark: existing.remark || ''
      }
    })
    setLocalScores(drafts)
  }, [selectedClassId, selectedSubjectId, activeTerm, grades])

  const handleScoreChange = (studentId, field, val) => {
    const updated = { ...(localScores[studentId] || {}) }
    updated[field] = val

    const caNum = updated.ca !== '' ? Number(updated.ca) : 0
    const examNum = updated.exam !== '' ? Number(updated.exam) : 0
    const hasAny = updated.ca !== '' || updated.exam !== ''

    if (hasAny) {
      const total = caNum + examNum
      updated.total = total
      const { grade, remark } = computeGrade(total, settings.scale)
      updated.grade = grade
      updated.remark = remark
    } else {
      updated.total = ''
      updated.grade = ''
      updated.remark = ''
    }

    setLocalScores(prev => ({ ...prev, [studentId]: updated }))
  }

  const handleSave = async () => {
    if (!selectedClassId || !selectedSubjectId) {
      onShowToast({ type: 'error', message: 'Please choose both a Class and a Subject.' })
      return
    }

    setIsSaving(true)
    try {
      await onSaveGrades({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        termId: activeTerm,
        sessionId: activeSession,
        scores: localScores
      })
      onShowToast({ type: 'success', message: 'Subject grades saved successfully & cached offline!' })
    } catch {
      onShowToast({ type: 'error', message: 'Failed to save subject grades.' })
    } finally {
      setIsSaving(false)
    }
  }

  // Offline CSV Download
  const handleDownloadOfflineCSV = () => {
    if (!selectedClass || !selectedSubject) return
    downloadSubjectScoreSheetCSV({
      className: selectedClass.name,
      subjectName: selectedSubject.name,
      eligibleStudents,
      caWeight: settings.caWeight || 40,
      examWeight: settings.examWeight || 60
    })
    onShowToast({ type: 'info', message: 'Offline CSV score sheet downloaded!' })
  }

  // Offline CSV Upload
  const handleUploadOfflineCSV = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result
        if (typeof text === 'string') {
          const scoreMap = parseSubjectScoreSheetCSV(text)
          const merged = { ...localScores }

          Object.entries(scoreMap).forEach(([studentId, scores]) => {
            const caNum = scores.ca !== '' ? Number(scores.ca) : 0
            const examNum = scores.exam !== '' ? Number(scores.exam) : 0
            const hasAny = scores.ca !== '' || scores.exam !== ''

            let total = ''
            let grade = ''
            let remark = ''

            if (hasAny) {
              total = caNum + examNum
              const res = computeGrade(total, settings.scale)
              grade = res.grade
              remark = res.remark
            }

            merged[studentId] = {
              ca: scores.ca,
              exam: scores.exam,
              total,
              grade,
              remark
            }
          })

          setLocalScores(merged)
          onShowToast({ type: 'success', message: 'Scores imported from offline CSV sheet! Click "Save Grades" to persist.' })
        }
      } catch (err) {
        onShowToast({ type: 'error', message: err.message || 'Failed to parse offline CSV sheet.' })
      }
    }
    reader.readAsText(file)
  }

  // Calculate entry completion
  let enteredCount = 0
  eligibleStudents.forEach(st => {
    const s = localScores[st.id]
    if (s && s.total !== '' && s.total !== undefined) {
      enteredCount++
    }
  })

  const completionStatus =
    enteredCount === 0
      ? { label: 'No Scores Entered', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
      : enteredCount < eligibleStudents.length
      ? { label: `In Progress (${enteredCount}/${eligibleStudents.length})`, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
      : { label: `Entries Complete (${enteredCount}/${eligibleStudents.length})`, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }

  return (
    <div className="space-y-6">
      {/* Top Filter & Subject Actions Row */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* 1. Select Class */}
            <div className="min-w-[180px]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Select Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Select Subject */}
            <div className="min-w-[220px] flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Select Subject
                </label>
                {/* Subject Teacher can add a new subject directly */}
                <button
                  type="button"
                  onClick={onOpenSubjectModal}
                  className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add New Subject</span>
                </button>
              </div>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.department || 'General'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Indicator & Save Button */}
          <div className="flex items-center gap-3 shrink-0">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${completionStatus.color}`}>
              {completionStatus.label}
            </span>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Grades'}</span>
            </button>
          </div>
        </div>

        {/* Offline & Elective Options Sub-bar */}
        <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Elective / Cross-Department Student Toggle */}
          <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={showAllClassStudents}
              onChange={(e) => setShowAllClassStudents(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700"
            />
            <span>Include all students in class (allows elective & cross-departmental grading)</span>
          </label>

          {/* Offline CSV Actions & Mobile Switch */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadOfflineCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors"
              title="Download offline Excel/CSV score sheet to grade without internet"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Download Offline Sheet</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload Offline Sheet</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleUploadOfflineCSV}
                className="hidden"
              />
            </label>

            <div className="border-l border-slate-700 pl-2 flex items-center gap-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Desktop Table View"
              >
                <Table className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg ${viewMode === 'card' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Mobile Cards View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: DESKTOP TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-700">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5 text-center w-36">
                    Continuous Assessment (Max {settings.caWeight || 40})
                  </th>
                  <th className="p-3.5 text-center w-36">
                    Exam Score (Max {settings.examWeight || 60})
                  </th>
                  <th className="p-3.5 text-center w-28">Total (100)</th>
                  <th className="p-3.5 text-center w-24">Grade</th>
                  <th className="p-3.5">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {eligibleStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                      No students found in {selectedClass?.name || 'this class'} eligible for {selectedSubject?.name}.
                    </td>
                  </tr>
                ) : (
                  eligibleStudents.map((st, i) => {
                    const draft = localScores[st.id] || { ca: '', exam: '', total: '', grade: '', remark: '' }
                    const caMax = settings.caWeight || 40
                    const examMax = settings.examWeight || 60
                    const isCaInvalid = draft.ca !== '' && (Number(draft.ca) < 0 || Number(draft.ca) > caMax)
                    const isExamInvalid = draft.exam !== '' && (Number(draft.exam) < 0 || Number(draft.exam) > examMax)

                    return (
                      <tr key={st.id} className="hover:bg-slate-800/50">
                        <td className="p-3.5 text-center font-mono text-slate-500">{i + 1}</td>
                        <td className="p-3.5 font-bold text-white">
                          <div>{st.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{st.reg_no || st.id}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDeptBadgeColor(st.department)}`}>
                            {st.department || 'General'}
                          </span>
                        </td>
                        {/* CA Input */}
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max={caMax}
                            value={draft.ca}
                            onChange={(e) => handleScoreChange(st.id, 'ca', e.target.value)}
                            placeholder="0"
                            className={`w-20 px-2 py-1.5 text-center rounded-lg text-sm font-bold bg-slate-900 border ${
                              isCaInvalid ? 'border-red-500 text-red-400' : 'border-slate-700 text-white'
                            } focus:outline-none focus:border-sky-500`}
                          />
                        </td>
                        {/* Exam Input */}
                        <td className="p-3.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max={examMax}
                            value={draft.exam}
                            onChange={(e) => handleScoreChange(st.id, 'exam', e.target.value)}
                            placeholder="0"
                            className={`w-20 px-2 py-1.5 text-center rounded-lg text-sm font-bold bg-slate-900 border ${
                              isExamInvalid ? 'border-red-500 text-red-400' : 'border-slate-700 text-white'
                            } focus:outline-none focus:border-sky-500`}
                          />
                        </td>
                        {/* Total */}
                        <td className="p-3.5 text-center font-extrabold text-sm text-sky-400">
                          {draft.total !== '' ? draft.total : '-'}
                        </td>
                        {/* Grade */}
                        <td className="p-3.5 text-center">
                          {draft.grade ? (
                            <span className="px-2.5 py-1 rounded-md text-xs font-black bg-slate-900 border border-slate-700 text-white">
                              {draft.grade}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        {/* Remark */}
                        <td className="p-3.5 text-xs text-slate-400 font-medium">
                          {draft.remark || '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: MOBILE-OPTIMIZED CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eligibleStudents.map((st, i) => {
            const draft = localScores[st.id] || { ca: '', exam: '', total: '', grade: '', remark: '' }
            const caMax = settings.caWeight || 40
            const examMax = settings.examWeight || 60

            return (
              <div key={st.id} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{st.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{st.reg_no || st.id}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDeptBadgeColor(st.department)}`}>
                    {st.department || 'General'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      CA (Max {caMax})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={caMax}
                      value={draft.ca}
                      onChange={(e) => handleScoreChange(st.id, 'ca', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-center rounded-xl text-base font-bold bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Exam (Max {examMax})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={examMax}
                      value={draft.exam}
                      onChange={(e) => handleScoreChange(st.id, 'exam', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-center rounded-xl text-base font-bold bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-400">Total: </span>
                    <span className="font-extrabold text-sky-400 text-sm">{draft.total !== '' ? draft.total : '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Grade: </span>
                    <span className="font-black text-white">{draft.grade || '-'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    {draft.remark || '-'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
