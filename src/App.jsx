import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import ReportCardModal from './components/ReportCardModal'
import BatchReportModal from './components/BatchReportModal'
import StudentResultCheckModal from './components/StudentResultCheckModal'
import StudentModal from './components/StudentModal'
import SubjectModal from './components/SubjectModal'
import ClassModal from './components/ClassModal'
import CSVImportModal from './components/CSVImportModal'
import AdminPortal from './views/AdminPortal'
import SubjectTeacherPortal from './views/SubjectTeacherPortal'
import ClassTeacherPortal from './views/ClassTeacherPortal'
import StudentPortal from './views/StudentPortal'
import LoginOverlay from './views/LoginOverlay'
import { loadAppState, saveAppState, saveGradeRecord, INITIAL_STATE } from './services/dataService'
import { getActiveSession, loginUser, logoutUser } from './services/authService'

export default function App() {
  const [appState, setAppState] = useState(INITIAL_STATE)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [activePortal, setActivePortal] = useState('admin')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('riseup_sidebar_collapsed') === 'true'
  })

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [studentModalClassId, setStudentModalClassId] = useState('')
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
  const [isClassModalOpen, setIsClassModalOpen] = useState(false)
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false)
  const [reportCardStudent, setReportCardStudent] = useState(null)
  const [batchPrintData, setBatchPrintData] = useState(null)
  const [isResultCheckerOpen, setIsResultCheckerOpen] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  const showToast = (toastObj) => {
    setToast(toastObj)
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Load app state and session on start
  useEffect(() => {
    async function init() {
      setIsLoading(true)
      const data = await loadAppState()
      setAppState(data)

      const session = getActiveSession()
      if (session) {
        setCurrentUser(session)
        // Automatically route to appropriate portal
        if (session.role === 'teacher') setActivePortal('subject')
        else if (session.role === 'class_teacher') setActivePortal('class')
        else if (session.role === 'student') setActivePortal('student')
        else setActivePortal('admin')
      }
      setIsLoading(false)
    }
    init()
  }, [])

  // Toggle sidebar collapse
  const handleToggleSidebar = () => {
    const next = !isSidebarCollapsed
    setIsSidebarCollapsed(next)
    localStorage.setItem('riseup_sidebar_collapsed', String(next))
  }

  // Auth handlers
  const handleLogin = ({ username, password }) => {
    const res = loginUser({ username, password, students: appState.students })
    if (res.success) {
      setCurrentUser(res.user)
      if (res.user.role === 'teacher') setActivePortal('subject')
      else if (res.user.role === 'class_teacher') setActivePortal('class')
      else if (res.user.role === 'student') setActivePortal('student')
      else setActivePortal('admin')
      showToast({ type: 'success', message: `Welcome back, ${res.user.name}!` })
      return { success: true }
    }
    return { success: false, error: res.error }
  }

  const handleLogout = () => {
    logoutUser()
    setCurrentUser(null)
    setActivePortal('admin')
    showToast({ type: 'info', message: 'You have signed out successfully.' })
  }

  // Data mutation handlers
  const handleSaveGrades = async ({ classId, subjectId, termId, sessionId, scores }) => {
    const updatedGrades = { ...appState.grades }

    for (const [studentId, scoreObj] of Object.entries(scores)) {
      if (!updatedGrades[studentId]) updatedGrades[studentId] = {}
      if (!updatedGrades[studentId][termId]) updatedGrades[studentId][termId] = {}

      updatedGrades[studentId][termId][subjectId] = {
        ca: scoreObj.ca,
        exam: scoreObj.exam,
        total: scoreObj.total,
        grade: scoreObj.grade,
        remark: scoreObj.remark
      }

      // Background persist to Supabase
      saveGradeRecord({
        studentId,
        classId,
        subjectId,
        termId,
        sessionId,
        ca: scoreObj.ca,
        exam: scoreObj.exam,
        total: scoreObj.total,
        grade: scoreObj.grade,
        remark: scoreObj.remark
      })
    }

    const nextState = { ...appState, grades: updatedGrades }
    setAppState(nextState)
    await saveAppState(nextState)
  }

  const handleAddStudent = async (studentData) => {
    const nextState = {
      ...appState,
      students: [studentData, ...appState.students]
    }
    setAppState(nextState)
    await saveAppState(nextState)
    setIsStudentModalOpen(false)
    showToast({ type: 'success', message: `Student "${studentData.name}" enrolled successfully!` })
  }

  const handleDeleteStudent = async (studentId) => {
    const nextStudents = appState.students.filter(s => s.id !== studentId)
    const nextGrades = { ...appState.grades }
    delete nextGrades[studentId]

    const nextState = { ...appState, students: nextStudents, grades: nextGrades }
    setAppState(nextState)
    await saveAppState(nextState)
    showToast({ type: 'info', message: 'Student removed from register.' })
  }

  const handleImportStudents = async (newStudents) => {
    const nextState = {
      ...appState,
      students: [...newStudents, ...appState.students]
    }
    setAppState(nextState)
    await saveAppState(nextState)
    setIsCSVImportModalOpen(false)
    showToast({ type: 'success', message: `Successfully imported ${newStudents.length} students!` })
  }

  const handleAddSubject = async (subjectData) => {
    const nextState = {
      ...appState,
      subjects: [...appState.subjects, subjectData]
    }
    setAppState(nextState)
    await saveAppState(nextState)
    setIsSubjectModalOpen(false)
    showToast({ type: 'success', message: `Subject "${subjectData.name}" added successfully!` })
  }

  const handleDeleteSubject = async (subjectId) => {
    const nextSubjects = appState.subjects.filter(s => s.id !== subjectId)
    const nextGrades = { ...appState.grades }
    Object.keys(nextGrades).forEach(stId => {
      ['t1', 't2', 't3'].forEach(t => {
        if (nextGrades[stId][t]) {
          delete nextGrades[stId][t][subjectId]
        }
      })
    })

    const nextState = { ...appState, subjects: nextSubjects, grades: nextGrades }
    setAppState(nextState)
    await saveAppState(nextState)
    showToast({ type: 'info', message: 'Subject deleted successfully.' })
  }

  const handleAddClass = async (classData) => {
    const nextState = {
      ...appState,
      classes: [...appState.classes, classData]
    }
    setAppState(nextState)
    await saveAppState(nextState)
    setIsClassModalOpen(false)
    showToast({ type: 'success', message: `Class "${classData.name}" created successfully!` })
  }

  const handleDeleteClass = async (classId) => {
    const nextClasses = appState.classes.filter(c => c.id !== classId)
    const nextState = { ...appState, classes: nextClasses }
    setAppState(nextState)
    await saveAppState(nextState)
    showToast({ type: 'info', message: 'Class deleted successfully.' })
  }

  const handleUpdateSettings = async (newSettings) => {
    const nextState = { ...appState, settings: newSettings }
    setAppState(nextState)
    await saveAppState(nextState)
  }

  const handleChangeSession = async (newSession) => {
    const nextState = { ...appState, activeSession: newSession }
    setAppState(nextState)
    await saveAppState(nextState)
    showToast({ type: 'info', message: `Active session switched to ${newSession}` })
  }

  const handleChangeTerm = async (newTerm) => {
    const nextState = { ...appState, activeTerm: newTerm }
    setAppState(nextState)
    await saveAppState(nextState)
    const termLabel = newTerm === 't1' ? 'First Term' : newTerm === 't2' ? 'Second Term' : 'Third Term (Annual Cumulative)'
    showToast({ type: 'info', message: `Active term switched to ${termLabel}` })
  }

  const handleSaveRemarks = async ({
    studentId,
    termId,
    teacherComment,
    principalComment,
    decision,
    timesOpened,
    timesPresent,
    timesAbsent,
    nextTermBegins,
    reportDate
  }) => {
    const term = termId || appState.activeTerm || 't1'
    const updatedRemarks = { ...(appState.remarks || {}) }
    if (!updatedRemarks[studentId]) updatedRemarks[studentId] = {}
    const prev = updatedRemarks[studentId][term] || {}

    updatedRemarks[studentId][term] = {
      ...prev,
      teacherComment: teacherComment !== undefined ? teacherComment : (prev.teacherComment || ''),
      principalComment: principalComment !== undefined ? principalComment : (prev.principalComment || ''),
      decision: decision !== undefined ? decision : (prev.decision || (term === 't3' ? 'PROMOTED TO DIVISION SIX' : '')),
      timesOpened: timesOpened !== undefined ? Number(timesOpened) : (prev.timesOpened || (term === 't3' ? 94 : 124)),
      timesPresent: timesPresent !== undefined ? Number(timesPresent) : (prev.timesPresent || (term === 't3' ? 92 : 110)),
      timesAbsent: timesAbsent !== undefined ? Number(timesAbsent) : (prev.timesAbsent || (term === 't3' ? 2 : 14)),
      nextTermBegins: nextTermBegins !== undefined ? nextTermBegins : (prev.nextTermBegins || (term === 't3' ? '14th Sept, 2026' : '12th Jan., 2026')),
      reportDate: reportDate !== undefined ? reportDate : (prev.reportDate || (term === 't3' ? '17th July, 2026' : '19th December, 2025'))
    }
    const nextState = { ...appState, remarks: updatedRemarks }
    setAppState(nextState)
    await saveAppState(nextState)
    showToast({ type: 'success', message: 'Teacher & Principal appraisal saved successfully!' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-sm text-slate-300">Initializing RiseUp Results Publisher...</p>
      </div>
    )
  }

  const portalTitles = {
    admin: { title: 'Admin Configuration', subtitle: 'Manage academic structures, students, grading scales, and settings' },
    subject: { title: 'Subject Teacher Portal', subtitle: 'Continuous assessment & examination score entry' },
    class: { title: 'Class Teacher Collation', subtitle: 'Master class results matrix, ranking, and report card publishing' },
    student: { title: 'Student Terminal Results', subtitle: 'View performance analytics and download official report sheets' }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex overflow-x-hidden">
      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Main Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        activePortal={activePortal}
        onSwitchPortal={setActivePortal}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenResultChecker={() => setIsResultCheckerOpen(true)}
      />

      {/* Main Workspace */}
      <main
        className={`flex-1 min-h-screen p-5 sm:p-8 flex flex-col gap-6 transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-72'
        }`}
      >
        {/* Top App Header & Actions */}
        <Navbar
          title={portalTitles[activePortal]?.title || 'Dashboard'}
          subtitle={portalTitles[activePortal]?.subtitle || ''}
          activeSession={appState.activeSession}
          sessions={appState.sessions}
          onChangeSession={handleChangeSession}
          activeTerm={appState.activeTerm}
          onChangeTerm={handleChangeTerm}
          isCloudConnected={appState.isCloudConnected}
        />

        {/* Dynamic View Panels */}
        {activePortal === 'admin' && (
          <AdminPortal
            classes={appState.classes}
            subjects={appState.subjects}
            students={appState.students}
            grades={appState.grades}
            activeTerm={appState.activeTerm}
            onChangeTerm={handleChangeTerm}
            activeSession={appState.activeSession}
            onChangeSession={handleChangeSession}
            sessions={appState.sessions}
            settings={appState.settings}
            onUpdateSettings={handleUpdateSettings}
            onDeleteClass={handleDeleteClass}
            onDeleteSubject={handleDeleteSubject}
            onDeleteStudent={handleDeleteStudent}
            onOpenClassModal={() => setIsClassModalOpen(true)}
            onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
            onOpenStudentModal={() => setIsStudentModalOpen(true)}
            onOpenCSVImportModal={() => setIsCSVImportModalOpen(true)}
            onShowToast={showToast}
          />
        )}

        {activePortal === 'subject' && (
          <SubjectTeacherPortal
            classes={appState.classes}
            subjects={appState.subjects}
            students={appState.students}
            grades={appState.grades}
            activeTerm={appState.activeTerm}
            activeSession={appState.activeSession}
            settings={appState.settings}
            onSaveGrades={handleSaveGrades}
            onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
            onShowToast={showToast}
          />
        )}

        {activePortal === 'class' && (
          <ClassTeacherPortal
            classes={appState.classes}
            subjects={appState.subjects}
            students={appState.students}
            grades={appState.grades}
            remarks={appState.remarks || {}}
            onSaveRemarks={handleSaveRemarks}
            activeTerm={appState.activeTerm}
            activeSession={appState.activeSession}
            settings={appState.settings}
            onOpenStudentModal={(clsId) => {
              setStudentModalClassId(clsId || '')
              setIsStudentModalOpen(true)
            }}
            onOpenReportCard={(st) => setReportCardStudent(st)}
            onOpenBatchPrint={(cls, targetStudents) => setBatchPrintData({ selectedClass: cls, targetStudents })}
          />
        )}

        {activePortal === 'student' && (
          <StudentPortal
            currentUser={currentUser}
            students={appState.students}
            subjects={appState.subjects}
            classes={appState.classes}
            grades={appState.grades}
            activeTerm={appState.activeTerm}
            activeSession={appState.activeSession}
            settings={appState.settings}
            onOpenReportCard={(st) => setReportCardStudent(st)}
          />
        )}
      </main>

      {/* Login Screen (renders if no user is signed in) */}
      {!currentUser && (
        <LoginOverlay
          onLogin={handleLogin}
          onOpenResultChecker={() => setIsResultCheckerOpen(true)}
        />
      )}

      {/* MODAL DIALOGS */}
      {/* 1. Official Printable Student Report Card Modal */}
      {reportCardStudent && (
        <ReportCardModal
          student={reportCardStudent}
          allStudents={appState.students}
          subjects={appState.subjects}
          classes={appState.classes}
          grades={appState.grades}
          remarks={appState.remarks || {}}
          onSaveRemarks={handleSaveRemarks}
          activeTerm={appState.activeTerm}
          activeSession={appState.activeSession}
          settings={appState.settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setReportCardStudent(null)}
        />
      )}

      {/* 2. Batch Print All Reports Modal */}
      {batchPrintData && (
        <BatchReportModal
          selectedClass={batchPrintData.selectedClass}
          students={appState.students}
          targetStudents={batchPrintData.targetStudents}
          subjects={appState.subjects}
          grades={appState.grades}
          remarks={appState.remarks || {}}
          activeTerm={appState.activeTerm}
          activeSession={appState.activeSession}
          settings={appState.settings}
          onClose={() => setBatchPrintData(null)}
        />
      )}

      {/* 3. Student/Parent PIN Result Checker Modal */}
      {isResultCheckerOpen && (
        <StudentResultCheckModal
          students={appState.students}
          onViewReportCard={(st) => {
            setIsResultCheckerOpen(false)
            setReportCardStudent(st)
          }}
          onClose={() => setIsResultCheckerOpen(false)}
        />
      )}

      {/* 4. Add Student Modal */}
      {isStudentModalOpen && (
        <StudentModal
          classes={appState.classes}
          initialClassId={studentModalClassId}
          onSave={handleAddStudent}
          onClose={() => {
            setIsStudentModalOpen(false)
            setStudentModalClassId('')
          }}
        />
      )}

      {/* 5. Add Subject Modal */}
      {isSubjectModalOpen && (
        <SubjectModal
          onSave={handleAddSubject}
          onClose={() => setIsSubjectModalOpen(false)}
        />
      )}

      {/* 6. Add Class Modal */}
      {isClassModalOpen && (
        <ClassModal
          onSave={handleAddClass}
          onClose={() => setIsClassModalOpen(false)}
        />
      )}

      {/* 7. Bulk CSV Student Import Modal */}
      {isCSVImportModalOpen && (
        <CSVImportModal
          classes={appState.classes}
          onImportSuccess={handleImportStudents}
          onClose={() => setIsCSVImportModalOpen(false)}
        />
      )}
    </div>
  )
}
