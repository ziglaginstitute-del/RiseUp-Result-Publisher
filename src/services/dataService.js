import { supabase, isSupabaseConfigured } from './supabaseClient'

const LOCAL_STORAGE_KEY = 'riseup_results_publisher_state_v2'

// Default Nigerian secondary school seed data (RiseUp College)
export const INITIAL_STATE = {
  classes: [
    { id: 'c1', name: 'Grade 10A', level: 'Senior' },
    { id: 'c2', name: 'Grade 11B', level: 'Senior' },
    { id: 'c3', name: 'JSS 1A', level: 'Junior' }
  ],
  subjects: [
    { id: 's1', name: 'Mathematics', code: 'MTH', department: 'General' },
    { id: 's2', name: 'English Language', code: 'ENG', department: 'General' },
    { id: 's3', name: 'Chemistry', code: 'CHM', department: 'Science' },
    { id: 's4', name: 'Physics', code: 'PHY', department: 'Science' },
    { id: 's5', name: 'Economics', code: 'ECO', department: 'Arts & Commercial' },
    { id: 's6', name: 'Literature in English', code: 'LIT', department: 'Art' },
    { id: 's7', name: 'Government', code: 'GOV', department: 'Arts & Commercial' },
    { id: 's8', name: 'Financial Accounting', code: 'ACC', department: 'Commercial' },
    { id: 's9', name: 'Biology', code: 'BIO', department: 'Science' },
    { id: 's10', name: 'Civic Education', code: 'CIV', department: 'General' },
    { id: 's11', name: 'Computer Studies', code: 'CMP', department: 'Elective' },
    { id: 's12', name: 'Agricultural Science', code: 'AGR', department: 'Elective' },
    { id: 's13', name: 'Basic Science', code: 'BSC', department: 'Junior' },
    { id: 's14', name: 'Basic Technology', code: 'BTC', department: 'Junior' },
    { id: 's15', name: 'Social Studies', code: 'SOS', department: 'Junior' },
    { id: 's16', name: 'Business Studies', code: 'BUS', department: 'Junior' }
  ],
  students: [
    { id: 'st1', reg_no: 'RC/2026/001', name: 'Chinedu Okafor', classId: 'c1', department: 'Science', access_pin: '8821', gender: 'M' },
    { id: 'st2', reg_no: 'RC/2026/002', name: 'Amina Yusuf', classId: 'c1', department: 'Art', access_pin: '4412', gender: 'F' },
    { id: 'st3', reg_no: 'RC/2026/003', name: 'Tunde Bakare', classId: 'c1', department: 'Commercial', access_pin: '9103', gender: 'M' },
    { id: 'st4', reg_no: 'RC/2026/004', name: 'Elizabeth Adebayo', classId: 'c1', department: 'Science', access_pin: '5529', gender: 'F' },
    { id: 'st5', reg_no: 'RC/2026/005', name: 'John Peterson', classId: 'c2', department: 'Science', access_pin: '7311', gender: 'M' },
    { id: 'st6', reg_no: 'RC/2026/006', name: 'Fatima Umar', classId: 'c2', department: 'Art', access_pin: '3284', gender: 'F' },
    { id: 'st7', reg_no: 'RC/2026/007', name: 'Blessing Eze', classId: 'c3', department: 'Junior', access_pin: '6045', gender: 'F' }
  ],
  grades: {
    'st1': {
      't1': {
        's1': { ca: 34, exam: 52, total: 86, grade: 'A1', remark: 'Excellent' },
        's2': { ca: 31, exam: 48, total: 79, grade: 'A1', remark: 'Excellent' },
        's3': { ca: 36, exam: 50, total: 86, grade: 'A1', remark: 'Excellent' },
        's4': { ca: 32, exam: 45, total: 77, grade: 'A1', remark: 'Excellent' },
        's9': { ca: 30, exam: 42, total: 72, grade: 'B2', remark: 'Very Good' },
        's10': { ca: 35, exam: 45, total: 80, grade: 'A1', remark: 'Excellent' },
        's11': { ca: 37, exam: 54, total: 91, grade: 'A1', remark: 'Excellent' }
      }
    },
    'st2': {
      't1': {
        's1': { ca: 28, exam: 40, total: 68, grade: 'B3', remark: 'Good' },
        's2': { ca: 35, exam: 50, total: 85, grade: 'A1', remark: 'Excellent' },
        's5': { ca: 32, exam: 44, total: 76, grade: 'A1', remark: 'Excellent' },
        's6': { ca: 36, exam: 52, total: 88, grade: 'A1', remark: 'Excellent' },
        's7': { ca: 30, exam: 45, total: 75, grade: 'A1', remark: 'Excellent' },
        's10': { ca: 33, exam: 46, total: 79, grade: 'A1', remark: 'Excellent' }
      }
    },
    'st3': {
      't1': {
        's1': { ca: 25, exam: 38, total: 63, grade: 'C4', remark: 'Credit' },
        's2': { ca: 29, exam: 41, total: 70, grade: 'B2', remark: 'Very Good' },
        's5': { ca: 35, exam: 48, total: 83, grade: 'A1', remark: 'Excellent' },
        's7': { ca: 28, exam: 42, total: 70, grade: 'B2', remark: 'Very Good' },
        's8': { ca: 34, exam: 50, total: 84, grade: 'A1', remark: 'Excellent' },
        's10': { ca: 30, exam: 42, total: 72, grade: 'B2', remark: 'Very Good' }
      }
    },
    'st7': {
      't1': {
        's1': { ca: 30, exam: 45, total: 75, grade: 'A1', remark: 'Excellent' },
        's2': { ca: 33, exam: 47, total: 80, grade: 'A1', remark: 'Excellent' },
        's13': { ca: 35, exam: 49, total: 84, grade: 'A1', remark: 'Excellent' },
        's14': { ca: 31, exam: 46, total: 77, grade: 'A1', remark: 'Excellent' },
        's15': { ca: 34, exam: 48, total: 82, grade: 'A1', remark: 'Excellent' },
        's16': { ca: 32, exam: 45, total: 77, grade: 'A1', remark: 'Excellent' }
      }
    }
  },
  activeTerm: 't1',
  activeSession: '2025/2026',
  sessions: ['2024/2025', '2025/2026', '2026/2027'],
  settings: {
    schoolName: 'RiseUp College',
    schoolAddress: '5, Oriade Close, Off Council Road, Water Bus Stop, Ipaja, Lagos.',
    schoolEmail: 'school@riseupcollege.org',
    schoolPhone: '08156202927, 08113792266',
    schoolWebsite: 'www.riseupcollege.org',
    principalName: 'John Ogundijo',
    principalSignature: '',
    caWeight: 40,
    examWeight: 60,
    nextTermBeginsT1: '12th Jan., 2026',
    nextTermBeginsT3: '14th Sept, 2026',
    reportDateT1: '19th December, 2025',
    reportDateT3: '17th July, 2026',
    timesOpenedT1: 124,
    timesOpenedT3: 94,
    scale: [
      { grade: 'A1', min: 75, max: 100, remark: 'EXCELLENT' },
      { grade: 'B2', min: 70, max: 74, remark: 'VERY GOOD' },
      { grade: 'B3', min: 65, max: 69, remark: 'GOOD' },
      { grade: 'C4', min: 60, max: 64, remark: 'CREDIT' },
      { grade: 'C5', min: 55, max: 59, remark: 'CREDIT' },
      { grade: 'C6', min: 50, max: 54, remark: 'CREDIT' },
      { grade: 'D7', min: 45, max: 49, remark: 'PASS' },
      { grade: 'E8', min: 40, max: 44, remark: 'PASS' },
      { grade: 'F9', min: 0, max: 39, remark: 'FAIL' }
    ]
  },
  remarks: {
    'st1': {
      't1': {
        teacherComment: 'Praise shows maturity when solving problems with classmates and uses good communication.',
        principalComment: 'This is a fantastic academic result. Work harder next term to improve your grade in Mathematics and Economics.',
        decision: 'COMMENDED',
        timesOpened: 124,
        timesPresent: 110,
        timesAbsent: 14,
        nextTermBegins: '12th Jan., 2026',
        reportDate: '19th December, 2025'
      },
      't3': {
        teacherComment: 'She is very calm and works hard to meet goals.',
        principalComment: 'You have demonstrated excellence. Keep striving for even greater success as you journey through the last lap of the secondary school.',
        decision: 'PROMOTED TO DIVISION SIX',
        timesOpened: 94,
        timesPresent: 92,
        timesAbsent: 2,
        nextTermBegins: '14th Sept, 2026',
        reportDate: '17th July, 2026'
      }
    }
  }
}

/**
 * Load complete application state.
 * Tries Supabase cloud database first. Falls back to localStorage if offline.
 */
export async function loadAppState() {
  if (isSupabaseConfigured() && supabase) {
    try {
      const [classesRes, subjectsRes, studentsRes, gradesRes, settingsRes] = await Promise.all([
        supabase.from('classes').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('students').select('*'),
        supabase.from('grades').select('*'),
        supabase.from('school_settings').select('*')
      ])

      if (!classesRes.error && !subjectsRes.error && !studentsRes.error) {
        // Construct nested grades dictionary
        const gradesMap = {}
        const gradesList = gradesRes.data || []
        gradesList.forEach(g => {
          if (!gradesMap[g.student_id]) gradesMap[g.student_id] = {}
          if (!gradesMap[g.student_id][g.term_id]) gradesMap[g.student_id][g.term_id] = {}
          gradesMap[g.student_id][g.term_id][g.subject_id] = {
            ca: g.ca ?? '',
            exam: g.exam ?? '',
            total: g.total ?? '',
            grade: g.grade || '',
            remark: g.remark || ''
          }
        })

        // Build settings object
        const settingsMap = { ...INITIAL_STATE.settings }
        let activeTerm = 't1'
        let activeSession = '2025/2026'
        let sessions = ['2024/2025', '2025/2026', '2026/2027']
        let remarks = { ...INITIAL_STATE.remarks }

        ;(settingsRes.data || []).forEach(item => {
          if (item.key === 'activeTerm') activeTerm = item.value
          else if (item.key === 'activeSession') activeSession = item.value
          else if (item.key === 'sessions') sessions = item.value
          else if (item.key === 'remarks') remarks = item.value
          else settingsMap[item.key] = item.value
        })

        const mappedStudents = (studentsRes.data || []).map(st => ({
          id: st.id,
          reg_no: st.reg_no || st.id,
          name: st.name,
          classId: st.class_id,
          department: st.department || 'General',
          access_pin: st.access_pin || '1234',
          gender: st.gender || 'M'
        }))

        const stateObj = {
          classes: classesRes.data || [],
          subjects: subjectsRes.data || [],
          students: mappedStudents,
          grades: gradesMap,
          activeTerm,
          activeSession,
          sessions,
          settings: settingsMap,
          remarks,
          isCloudConnected: true
        }

        // Cache locally for offline resilience
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateObj))
        return stateObj
      }
    } catch (err) {
      console.warn('Could not connect to Supabase, falling back to local storage:', err)
    }
  }

  // Local Storage fallback
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...INITIAL_STATE,
        ...parsed,
        remarks: parsed.remarks || INITIAL_STATE.remarks || {},
        settings: { ...INITIAL_STATE.settings, ...(parsed.settings || {}) },
        isCloudConnected: false
      }
    }
  } catch (e) {
    console.error('Error reading localStorage:', e)
  }

  // Save and return initial state
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_STATE))
  return { ...INITIAL_STATE, isCloudConnected: false }
}

/**
 * Persists updated state to localStorage and Supabase (if online)
 */
export async function saveAppState(state) {
  // Always update localStorage first for instantaneous UI responsiveness
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))

  if (isSupabaseConfigured() && supabase) {
    try {
      // Background sync to Supabase
      await Promise.all([
        supabase.from('school_settings').upsert([
          { key: 'activeTerm', value: state.activeTerm },
          { key: 'activeSession', value: state.activeSession },
          { key: 'sessions', value: state.sessions },
          { key: 'caWeight', value: state.settings.caWeight },
          { key: 'examWeight', value: state.settings.examWeight },
          { key: 'scale', value: state.settings.scale },
          { key: 'schoolName', value: state.settings.schoolName },
          { key: 'principalName', value: state.settings.principalName },
          { key: 'principalSignature', value: state.settings.principalSignature || '' },
          { key: 'remarks', value: state.remarks || {} }
        ])
      ])
    } catch (err) {
      console.warn('Background sync to Supabase failed:', err)
    }
  }
}

/**
 * Saves a single grade record to local state and Supabase
 */
export async function saveGradeRecord({ studentId, classId, subjectId, termId, sessionId, ca, exam, total, grade, remark }) {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('grades').upsert({
        student_id: studentId,
        class_id: classId,
        subject_id: subjectId,
        term_id: termId,
        session_id: sessionId,
        ca: ca !== '' ? Number(ca) : null,
        exam: exam !== '' ? Number(exam) : null,
        total: total !== '' ? Number(total) : null,
        grade,
        remark,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_id,subject_id,session_id,term_id' })
    } catch (err) {
      console.warn('Failed saving grade to Supabase:', err)
    }
  }
}
