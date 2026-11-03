/**
 * Nigerian Secondary School Grading & Departmental Assessment Utility
 */

/**
 * Determines if a subject is standard for a student's department category.
 * - General: Compulsory for all students in that school tier.
 * - Junior: All Junior Secondary students (JSS 1 - 3).
 * - Science: Senior Science department.
 * - Art: Senior Art / Humanities department.
 * - Commercial: Senior Commercial / Business department.
 * - Arts & Commercial: Shared by both Art and Commercial departments (e.g. Economics, Government).
 * - Elective: Any department can select (only reflects if scored).
 */
export function isSubjectApplicable(subDept = 'General', studentDept = 'General') {
  if (subDept === 'General' || subDept === 'Elective') return true
  if (studentDept === 'Junior') {
    return subDept === 'Junior' || subDept === 'General'
  }
  if (subDept === 'Junior') {
    return studentDept === 'Junior'
  }
  if (subDept === 'Arts & Commercial' || subDept === 'Art & Commercial') {
    return studentDept === 'Art' || studentDept === 'Commercial'
  }
  return subDept === studentDept
}

/**
 * Checks if a score has actually been recorded/allocated for a student in a subject across any term.
 */
export function hasScoreAllocated(studentId, subjectId, grades = {}) {
  const studentGrades = grades[studentId]
  if (!studentGrades) return false

  let hasScore = false
  ;['t1', 't2', 't3'].forEach(term => {
    const entry = studentGrades[term]?.[subjectId]
    if (entry) {
      if (
        (entry.total !== undefined && entry.total !== '' && entry.total !== null) ||
        (entry.ca !== undefined && entry.ca !== '' && entry.ca !== null) ||
        (entry.exam !== undefined && entry.exam !== '' && entry.exam !== null)
      ) {
        hasScore = true
      }
    }
  })
  return hasScore
}

/**
 * Checks applicability for a specific student's report sheet:
 * 1. If a score has been recorded for this student in this subject, it is ALWAYS included!
 *    (This handles electives and cross-departmental offerings like a Science student offering Economics).
 * 2. If no score is recorded, Electives are excluded.
 * 3. Otherwise, checks standard department core requirement.
 */
export function isSubjectApplicableForStudent(subject, studentId, studentDept = 'General', grades = {}) {
  // If student has a recorded score, they are actively taking this subject
  if (hasScoreAllocated(studentId, subject.id, grades)) {
    return true
  }

  // Electives ONLY reflect if scored
  if (subject.department === 'Elective') {
    return false
  }

  // Standard departmental requirement
  return isSubjectApplicable(subject.department, studentDept)
}

/**
 * Resolves score to WAEC/NECO Grade and Remark from active grading scale
 */
export function computeGrade(total, scale = []) {
  if (total === '' || total === null || total === undefined || isNaN(total)) {
    return { grade: '', remark: '' }
  }
  const num = Number(total)
  for (const item of scale) {
    if (num >= item.min && num <= item.max) {
      return { grade: item.grade, remark: item.remark }
    }
  }
  return { grade: 'F9', remark: 'Fail' }
}

/**
 * Formats ordinal rank (e.g. 1st, 2nd, 3rd)
 */
export function getOrdinalSuffix(i) {
  if (isNaN(i) || i === '-' || i === null || i === undefined) return '-'
  const num = Number(i)
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) return `${num}st`
  if (j === 2 && k !== 12) return `${num}nd`
  if (j === 3 && k !== 13) return `${num}rd`
  return `${num}th`
}

/**
 * Computes class collation rankings and averages.
 * Dynamically computes individual student subject lists respecting their department & electives.
 */
export function calculateClassCollation({ classStudents, subjects, grades, activeTerm }) {
  const list = classStudents.map(student => {
    let totalScoreSum = 0
    let gradedCount = 0
    const studentDept = student.department || 'General'

    // Determine the exact subjects applicable to this specific student
    const applicableSubjects = subjects.filter(sub =>
      isSubjectApplicableForStudent(sub, student.id, studentDept, grades)
    )

    if (activeTerm === 't3') {
      // Annual Cumulative Average across terms 1, 2, and 3
      applicableSubjects.forEach(sub => {
        let sum = 0
        let count = 0
        ;['t1', 't2', 't3'].forEach(t => {
          const tot = grades[student.id]?.[t]?.[sub.id]?.total
          if (tot !== undefined && tot !== '' && tot !== null) {
            sum += Number(tot)
            count++
          }
        })
        if (count > 0) {
          totalScoreSum += sum / count
          gradedCount++
        }
      })
    } else {
      applicableSubjects.forEach(sub => {
        const tot = grades[student.id]?.[activeTerm]?.[sub.id]?.total
        if (tot !== undefined && tot !== '' && tot !== null) {
          totalScoreSum += Number(tot)
          gradedCount++
        }
      })
    }

    const average = gradedCount > 0 ? (totalScoreSum / gradedCount).toFixed(1) : 0

    return {
      student,
      average: parseFloat(average),
      gradedCount,
      applicableSubjects
    }
  })

  // Rank sorting by average score descending
  const sorted = [...list].sort((a, b) => b.average - a.average)
  list.forEach(item => {
    if (item.gradedCount > 0) {
      item.position = sorted.findIndex(x => x.average === item.average) + 1
    } else {
      item.position = '-'
    }
  })

  return list
}

/**
 * Computes subject rank position among peers offering the subject in the class
 */
export function getSubjectPosition({ studentId, subjectId, classStudents, grades, activeTerm, subDept }) {
  let eligibleStudents = [...classStudents]
  if (subDept === 'Elective') {
    eligibleStudents = eligibleStudents.filter(st => hasScoreAllocated(st.id, subjectId, grades))
  } else if (subDept !== 'General') {
    // Include students in that department PLUS any student who took and was scored in that subject
    eligibleStudents = eligibleStudents.filter(st =>
      isSubjectApplicable(subDept, st.department) || hasScoreAllocated(st.id, subjectId, grades)
    )
  }

  const scores = eligibleStudents.map(st => {
    if (activeTerm === 't3') {
      let sum = 0, count = 0
      ;['t1', 't2', 't3'].forEach(t => {
        const tot = grades[st.id]?.[t]?.[subjectId]?.total
        if (tot !== undefined && tot !== '' && tot !== null) {
          sum += Number(tot)
          count++
        }
      })
      return { studentId: st.id, score: count > 0 ? sum / count : null }
    } else {
      const tot = grades[st.id]?.[activeTerm]?.[subjectId]?.total
      return { studentId: st.id, score: (tot !== undefined && tot !== '' && tot !== null) ? Number(tot) : null }
    }
  }).filter(x => x.score !== null)

  scores.sort((a, b) => b.score - a.score)
  const current = scores.find(x => x.studentId === studentId)
  if (!current) return '-'

  const rank = scores.findIndex(x => x.score === current.score) + 1
  return getOrdinalSuffix(rank)
}

/**
 * Returns Tailwind badge styling based on department category
 */
export function getDeptBadgeColor(dept = 'General') {
  switch (dept) {
    case 'Science':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    case 'Art':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    case 'Commercial':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    case 'Junior':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    case 'Arts & Commercial':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    case 'Elective':
      return 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
    default:
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }
}
