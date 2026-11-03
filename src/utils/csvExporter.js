/**
 * CSV Helper Utility for School Results Publisher
 */

export function downloadStudentCSVTemplate() {
  const headers = ['Registration Number', 'Full Name', 'Class Name', 'Department', 'Gender', 'Access PIN']
  const sampleRows = [
    ['RC/2026/008', 'Samuel Chukwudi', 'Grade 10A', 'Science', 'M', '7712'],
    ['RC/2026/009', 'Ngozi Okonkwo', 'Grade 10A', 'Art', 'F', '4321'],
    ['RC/2026/010', 'Babatunde Fashola', 'Grade 10A', 'Commercial', 'M', '8843'],
    ['RC/2026/011', 'Zainab Ahmed', 'JSS 1A', 'Junior', 'F', '9021']
  ]

  const csvContent = [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
  triggerDownload(csvContent, 'RiseUp_Student_Enrollment_Template.csv')
}

export function exportStudentsToCSV(students = [], classes = []) {
  const classMap = {}
  classes.forEach(c => { classMap[c.id] = c.name })

  const headers = ['Registration Number', 'Full Name', 'Class', 'Department', 'Access PIN', 'Gender']
  const rows = students.map(st => [
    st.reg_no || st.id,
    st.name,
    classMap[st.classId] || st.classId,
    st.department || 'General',
    st.access_pin || '1234',
    st.gender || 'M'
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
  triggerDownload(csvContent, `RiseUp_Students_Master_Register_${new Date().toISOString().slice(0, 10)}.csv`)
}

export function exportCollationSheetToCSV({ className, collationList = [], subjects = [], activeTerm = 't1' }) {
  const headers = ['Student Name', 'Department']
  subjects.forEach(sub => {
    headers.push(`${sub.name} (${sub.department || 'Gen'})`)
  })
  headers.push('Average Score', 'Position')

  const rows = collationList.map(item => {
    const row = [item.student.name, item.student.department || 'General']
    subjects.forEach(sub => {
      const isApplicable = item.applicableSubjects?.some(s => s.id === sub.id)
      if (!isApplicable) {
        row.push('N/A')
      } else {
        row.push(item.student?.scores?.[sub.id] ?? '-')
      }
    })
    row.push(item.average > 0 ? `${item.average}%` : '-', item.position)
    return row
  })

  const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
  triggerDownload(csvContent, `${className}_Collation_Sheet_${activeTerm.toUpperCase()}.csv`)
}

/**
 * Downloads a pre-formatted offline score sheet template for a specific subject teacher
 */
export function downloadSubjectScoreSheetCSV({ className, subjectName, eligibleStudents = [], caWeight = 40, examWeight = 60 }) {
  const headers = [
    'Student ID (Do Not Change)',
    'Registration Number',
    'Student Name',
    'Department',
    `Continuous Assessment (Max ${caWeight})`,
    `Exam Score (Max ${examWeight})`
  ]

  const rows = eligibleStudents.map(st => [
    st.id,
    st.reg_no || st.id,
    st.name,
    st.department || 'General',
    '',
    ''
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
  const safeClass = className.replace(/\s+/g, '_')
  const safeSub = subjectName.replace(/\s+/g, '_')
  triggerDownload(csvContent, `${safeClass}_${safeSub}_Offline_Score_Sheet.csv`)
}

/**
 * Parses an uploaded subject score sheet CSV
 */
export function parseSubjectScoreSheetCSV(csvText) {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) throw new Error('CSV file is empty or missing headers')

  const scoreMap = {}

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim())
    if (row.length < 2) continue

    const studentId = row[0]
    const ca = row[4] !== undefined && row[4] !== '' ? row[4] : ''
    const exam = row[5] !== undefined && row[5] !== '' ? row[5] : ''

    if (studentId) {
      scoreMap[studentId] = { ca, exam }
    }
  }

  return scoreMap
}

export function parseStudentCSV(text, classes = []) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) throw new Error('CSV file is empty or missing headers')

  const classNameMap = {}
  classes.forEach(c => {
    classNameMap[c.name.toLowerCase().trim()] = c.id
    classNameMap[c.id.toLowerCase().trim()] = c.id
  })

  const newStudents = []

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim())
    if (row.length < 2) continue

    const regNo = row[0] || `RC/${Date.now().toString().slice(-4)}`
    const name = row[1]
    const classStr = (row[2] || '').toLowerCase()
    const dept = row[3] || 'General'
    const gender = (row[4] || 'M').toUpperCase()
    const pin = row[5] || String(Math.floor(1000 + Math.random() * 9000))

    if (!name) continue

    let classId = classNameMap[classStr]
    if (!classId && classes.length > 0) {
      classId = classes[0].id
    }

    newStudents.push({
      id: `st_${Date.now()}_${i}`,
      reg_no: regNo,
      name,
      classId: classId || 'c1',
      department: dept,
      access_pin: pin,
      gender: gender.startsWith('F') ? 'F' : 'M'
    })
  }

  return newStudents
}

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
