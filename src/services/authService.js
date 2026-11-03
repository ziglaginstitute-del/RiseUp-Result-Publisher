const SESSION_STORAGE_KEY = 'riseup_auth_session_v2'

export const DEFAULT_USERS = [
  {
    username: 'admin',
    password: 'adminpassword',
    role: 'admin',
    name: 'School Administrator',
    roleLabel: 'School Coordinator'
  },
  {
    username: 'class_teacher',
    password: 'teacherpassword',
    role: 'class_teacher',
    name: 'Mr. Emmanuel Adeyemi',
    roleLabel: 'Class Teacher (Grade 10A)',
    assignedClassId: 'c1'
  },
  {
    username: 'subject_teacher',
    password: 'teacherpassword',
    role: 'teacher',
    name: 'Mrs. Folashade Adeleke',
    roleLabel: 'Subject Teacher',
    assignedSubjectId: 's1'
  }
]

export function getActiveSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to read auth session:', e)
  }
  return null
}

export function loginUser({ username, password, students = [] }) {
  const cleanUsername = username.trim().toLowerCase()
  const cleanPassword = password.trim()

  // 1. Check pre-configured staff accounts
  const staff = DEFAULT_USERS.find(
    u => u.username.toLowerCase() === cleanUsername && u.password === cleanPassword
  )
  if (staff) {
    const sessionData = {
      username: staff.username,
      name: staff.name,
      role: staff.role,
      roleLabel: staff.roleLabel,
      assignedClassId: staff.assignedClassId || null,
      assignedSubjectId: staff.assignedSubjectId || null,
      studentId: null
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
    return { success: true, user: sessionData }
  }

  // 2. Check student accounts (using Student ID or Reg Number, and PIN or last name)
  const student = students.find(st => {
    const matchId = st.id.toLowerCase() === cleanUsername
    const matchReg = st.reg_no && st.reg_no.toLowerCase() === cleanUsername
    return matchId || matchReg
  })

  if (student) {
    const parts = student.name.replace(',', ' ').split(' ')
    const lastName = (parts[parts.length - 1] || '').toLowerCase()
    const pin = student.access_pin || '1234'

    if (cleanPassword === pin || cleanPassword.toLowerCase() === lastName) {
      const sessionData = {
        username: student.reg_no || student.id,
        name: student.name,
        role: 'student',
        roleLabel: `Student (${student.department})`,
        assignedClassId: student.classId,
        assignedSubjectId: null,
        studentId: student.id
      }
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
      return { success: true, user: sessionData }
    }
  }

  return { success: false, error: 'Invalid username/Student ID or password/PIN' }
}

export function logoutUser() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}
