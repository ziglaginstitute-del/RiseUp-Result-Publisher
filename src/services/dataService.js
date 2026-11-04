import { supabase, isSupabaseConfigured } from './supabaseClient.js'

const LOCAL_STORAGE_KEY = 'riseup_results_publisher_state_v2'

// Clean Initial State for RiseUp College
export const INITIAL_STATE = {
  classes: [],
  subjects: [],
  students: [],
  grades: {},
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
  remarks: {},
  teachers: [
    {
      id: 'admin_user',
      username: 'admin',
      password: 'adminpassword',
      role: 'admin',
      name: 'School Administrator',
      assignedClassId: null,
      assignedSubjectId: null
    }
  ]
}

/**
 * Load complete application state.
 * Tries Supabase cloud database first. Falls back to localStorage if offline.
 */
export async function loadAppState() {
  if (isSupabaseConfigured() && supabase) {
    try {
      const [classesRes, subjectsRes, studentsRes, gradesRes, settingsRes, usersRes] = await Promise.all([
        supabase.from('classes').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('students').select('*'),
        supabase.from('grades').select('*'),
        supabase.from('school_settings').select('*'),
        supabase.from('app_users').select('*')
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

        // Map staff accounts
        let teachers = (usersRes?.data || [])
          .filter(u => ['admin', 'class_teacher', 'teacher'].includes(u.role))
          .map(u => ({
            id: u.id,
            username: u.username,
            password: u.password,
            role: u.role,
            name: u.full_name || u.name,
            assignedClassId: u.assigned_class_id,
            assignedSubjectId: u.assigned_subject_id,
            createdAt: u.created_at
          }))

        if (!teachers.some(t => t.role === 'admin')) {
          teachers.unshift({
            id: 'admin_user',
            username: 'admin',
            password: 'adminpassword',
            role: 'admin',
            name: 'School Administrator',
            assignedClassId: null,
            assignedSubjectId: null
          })
        }

        const stateObj = {
          classes: classesRes.data || [],
          subjects: subjectsRes.data || [],
          students: mappedStudents,
          grades: gradesMap,
          teachers,
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
        teachers: parsed.teachers || INITIAL_STATE.teachers || [],
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
      const settingsPayload = [
        { key: 'activeTerm', value: state.activeTerm },
        { key: 'activeSession', value: state.activeSession },
        { key: 'sessions', value: state.sessions },
        { key: 'remarks', value: state.remarks || {} }
      ]

      if (state.settings) {
        Object.entries(state.settings).forEach(([k, v]) => {
          settingsPayload.push({ key: k, value: v })
        })
      }

      await supabase.from('school_settings').upsert(settingsPayload)
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

/**
 * Saves or updates a subject in Supabase cloud
 */
export async function saveSubjectRecord(subject) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('subjects').upsert({
        id: subject.id,
        name: subject.name,
        code: subject.code || '',
        department: subject.department || 'General'
      }).select()
      if (error) console.error('Supabase saveSubjectRecord error:', error)
      return { success: !error, error, data }
    } catch (err) {
      console.warn('Failed saving subject to Supabase:', err)
      return { success: false, error: err }
    }
  }
  return { success: true }
}

/**
 * Deletes a subject and its associated grades from Supabase cloud
 */
export async function deleteSubjectRecord(subjectId) {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('grades').delete().eq('subject_id', subjectId)
      const { error } = await supabase.from('subjects').delete().eq('id', subjectId)
      if (error) console.error('Supabase deleteSubjectRecord error:', error)
      return { success: !error, error }
    } catch (err) {
      console.warn('Failed deleting subject from Supabase:', err)
      return { success: false, error: err }
    }
  }
  return { success: true }
}

/**
 * Saves or updates a class in Supabase cloud
 */
export async function saveClassRecord(cls) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('classes').upsert({
        id: cls.id,
        name: cls.name,
        level: cls.level || 'Senior'
      }).select()
      if (error) console.error('Supabase saveClassRecord error:', error)
      return { success: !error, error, data }
    } catch (err) {
      console.warn('Failed saving class to Supabase:', err)
      return { success: false, error: err }
    }
  }
  return { success: true }
}

/**
 * Deletes a class from Supabase cloud
 */
export async function deleteClassRecord(classId) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('classes').delete().eq('id', classId)
      if (error) console.error('Supabase deleteClassRecord error:', error)
      return { success: !error, error }
    } catch (err) {
      console.warn('Failed deleting class from Supabase:', err)
      return { success: false, error: err }
    }
  }
  return { success: true }
}

/**
 * Saves or updates a student in Supabase cloud
 */
export async function saveStudentRecord(st) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('students').upsert({
        id: st.id,
        reg_no: st.reg_no || st.id,
        name: st.name,
        class_id: st.classId || st.class_id,
        department: st.department || 'General',
        access_pin: st.access_pin || '1234',
        gender: st.gender || 'M'
      }).select()
      if (error) console.error('Supabase saveStudentRecord error:', error)
      return { success: !error, error, data }
    } catch (err) {
      console.warn('Failed saving student to Supabase:', err)
      return { success: false, error: err }
    }
  }
  return { success: true }
}

/**
 * Bulk saves students to Supabase cloud
 */
export async function saveMultipleStudents(studentsList) {
  if (isSupabaseConfigured() && supabase && studentsList.length > 0) {
    try {
      const rows = studentsList.map(st => ({
        id: st.id,
        reg_no: st.reg_no || st.id,
        name: st.name,
        class_id: st.classId || st.class_id,
        department: st.department || 'General',
        access_pin: st.access_pin || '1234',
        gender: st.gender || 'M'
      }))
      const { data, error } = await supabase.from('students').upsert(rows).select()
      if (error) console.error('Supabase saveMultipleStudents error:', error)
      return { success: !error, error, data }
    } catch (err) {
      console.warn('Failed saving bulk students to Supabase:', err)
      return { success: false, error: err }
    }
  }
  return { success: true }
}

/**
 * Deletes a student and their grades from Supabase cloud
 */
export async function deleteStudentRecord(studentId) {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('grades').delete().eq('student_id', studentId)
      const { error } = await supabase.from('students').delete().eq('id', studentId)
      if (error) console.error('Supabase deleteStudentRecord error:', error)
      return { success: !error, error }
    } catch (err) {
      console.warn('Failed deleting student from Supabase:', err)
      return { success: false, error: err }
    }
  }
  return { success: true }
}

/**
 * Saves or updates a teacher/staff member in Supabase cloud
 */
export async function saveTeacherRecord(teacher) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('app_users').upsert({
        id: teacher.id,
        username: teacher.username.trim().toLowerCase(),
        password: teacher.password.trim(),
        role: teacher.role,
        full_name: teacher.name,
        assigned_class_id: teacher.assignedClassId || null,
        assigned_subject_id: teacher.assignedSubjectId || null
      }).select()
      if (error) console.error('Supabase saveTeacherRecord error:', error)
      return { success: !error, error, data }
    } catch (err) {
      console.warn('Failed saving teacher to Supabase:', err)
      return { success: false, error: err }
    }
  }
  return { success: true }
}

/**
 * Deletes a teacher/staff member from Supabase cloud
 */
export async function deleteTeacherRecord(teacherId) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('app_users').delete().eq('id', teacherId)
      if (error) console.error('Supabase deleteTeacherRecord error:', error)
      return { success: !error, error }
    } catch (err) {
      console.warn('Failed deleting teacher from Supabase:', err)
      return { success: false, error: err }
    }
  }
  return { success: true }
}

/**
 * Completely purges mock/sample data from Supabase and resets state
 */
export async function purgeAllDemoData() {
  if (isSupabaseConfigured() && supabase) {
    try {
      await Promise.all([
        supabase.from('grades').delete().neq('id', '___none___'),
        supabase.from('students').delete().neq('id', '___none___'),
        supabase.from('subjects').delete().neq('id', '___none___'),
        supabase.from('classes').delete().neq('id', '___none___'),
        supabase.from('app_users').delete().neq('role', 'admin')
      ])
    } catch (err) {
      console.warn('Failed purging Supabase demo data:', err)
    }
  }
  localStorage.removeItem(LOCAL_STORAGE_KEY)
}
