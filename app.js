/**
 * ==========================================================================
 * SCHOOL RESULTS PUBLISHER - APPLICATION LOGIC (app.js)
 * Coordinates data state, browser localStorage caching, seeder setups, 
 * dynamic score grids, collation systems, and term-specific report sheets.
 * ==========================================================================
 */

/**
 * Core Application State Object
 * Holds collections of classes, subjects, students, grades structure, 
 * active term variables, and letter grade criteria settings.
 * @type {Object}
 */
let state = {
    classes: [],
    subjects: [],
    students: [],
    grades: {}, // Structure: { studentId: { termId: { subjectId: { ca, exam, total, grade } } } }
    activeTerm: 't1', // Default term code (t1 = 1st Term, t2 = 2nd Term, t3 = 3rd Term)
    activeSession: '2025/2026', // Active academic session (e.g. 2025/2026)
    sessions: ['2025/2026'], // Configured academic sessions list
    settings: {
        caWeight: 40,   // Continuous Assessment max percentage weight
        examWeight: 60, // Final Examination max percentage weight
        scale: [
            { grade: 'A1', min: 75, max: 100, remark: 'Excellent' },
            { grade: 'B2', min: 70, max: 74, remark: 'Very Good' },
            { grade: 'B3', min: 65, max: 69, remark: 'Good' },
            { grade: 'C4', min: 60, max: 64, remark: 'Credit' },
            { grade: 'C5', min: 55, max: 59, remark: 'Credit' },
            { grade: 'C6', min: 50, max: 54, remark: 'Credit' },
            { grade: 'D7', min: 45, max: 49, remark: 'Pass' },
            { grade: 'E8', min: 40, max: 44, remark: 'Pass' },
            { grade: 'F9', min: 0, max: 39, remark: 'Fail' }
        ]
    }
};

/**
 * Tracks the student ID currently being viewed in the report card preview screen
 * Used to reload views when shifting terms.
 * @type {string|null}
 */
let activeStudentId = null;
let currentUser = null; // Stores authenticated session user: { username, role, assignedSubjectId }

/**
 * App Initializer callback. Triggers loading cached state and opens the admin view on start.
 */
window.onload = async function() {
    await initSession();
};

/**
 * Checks backend session authentication, filters navigation links, and handles login redirections.
 */
async function initSession() {
    try {
        const response = await fetch('/api/session');
        const data = await response.json();
        if (data.logged_in) {
            currentUser = data.user;
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('profile-footer').style.display = 'flex';
            document.getElementById('profile-name').innerText = currentUser.username;
            
            // Format role label
            let roleLabel = 'School Coordinator';
            if (currentUser.role === 'teacher') roleLabel = 'Subject Teacher';
            else if (currentUser.role === 'class_teacher') roleLabel = 'Class Teacher';
            else if (currentUser.role === 'student') roleLabel = 'Student';
            document.getElementById('profile-role').innerText = roleLabel;
            
            // Set initials avatar icon
            const initials = currentUser.username.substring(0, 2).toUpperCase();
            document.getElementById('profile-avatar').innerText = initials;

            // Restrict sidebar links based on active user role
            const navAdmin = document.getElementById('nav-admin');
            const navSubject = document.getElementById('nav-subject');
            const navClass = document.getElementById('nav-class');
            
            navAdmin.style.display = 'none';
            navSubject.style.display = 'none';
            navClass.style.display = 'none';
            
            if (currentUser.role === 'admin') {
                navAdmin.style.display = 'flex';
                navSubject.style.display = 'flex';
                navClass.style.display = 'flex';
            } else if (currentUser.role === 'class_teacher') {
                navClass.style.display = 'flex';
            } else if (currentUser.role === 'teacher') {
                navSubject.style.display = 'flex';
            }
            
            const backBtn = document.getElementById('report-back-btn');
            if (backBtn) {
                backBtn.style.display = (currentUser.role === 'student') ? 'none' : 'flex';
            }
            
            await loadState();
            
            // Open the appropriate landing view
            if (currentUser.role === 'admin') {
                switchPortal('admin');
            } else if (currentUser.role === 'class_teacher') {
                switchPortal('class');
            } else if (currentUser.role === 'teacher') {
                switchPortal('subject');
            } else if (currentUser.role === 'student' && currentUser.student_id) {
                previewReportCard(currentUser.student_id);
            }
        } else {
            currentUser = null;
            document.getElementById('login-overlay').style.display = 'flex';
            document.getElementById('profile-footer').style.display = 'none';
        }
    } catch (e) {
        console.error("Session verification failed", e);
        // Serve local backup copy if server is offline
        currentUser = null;
        document.getElementById('login-overlay').style.display = 'none';
        await loadState();
        switchPortal('admin');
    }
}

/**
 * Handles the login overlay form submission and triggers credentials verification.
 */
async function onLoginSubmit(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('login-error');
    
    errorEl.style.display = 'none';
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });
        
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            await initSession();
        } else {
            errorEl.innerText = data.error || "Invalid username or password!";
            errorEl.style.display = 'block';
        }
    } catch (e) {
        console.error("Authentication request failed", e);
        errorEl.innerText = "Connection error. Please try again later.";
        errorEl.style.display = 'block';
    }
}

/**
 * Clears active session credentials and hides dashboard view panel structures.
 */
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
        console.error("Logout request failed", e);
    }
    currentUser = null;
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('profile-footer').style.display = 'none';
}

/**
 * Loads the application state object from the Flask API backend.
 * Automatically falls back to local browser localStorage if the server is offline.
 */
async function loadState(sessionQuery = null) {
    try {
        let url = '/api/state';
        if (sessionQuery) {
            url += '?session=' + encodeURIComponent(sessionQuery);
        } else if (state.activeSession) {
            url += '?session=' + encodeURIComponent(state.activeSession);
        }
        const response = await fetch(url);
        if (response.ok) {
            state = await response.json();
            // Cache locally as backup
            localStorage.setItem('schoolData', JSON.stringify(state));
        } else {
            throw new Error("API response error: " + response.status);
        }
    } catch (e) {
        console.warn("Could not load state from backend API. Falling back to localStorage.", e);
        const saved = localStorage.getItem('schoolData');
        if (saved) {
            try {
                state = JSON.parse(saved);
            } catch (err) {
                console.error("Error loading cached state", err);
            }
        }
    }
    
    if (!state.activeTerm) {
        state.activeTerm = 't1';
    }
    if (!state.activeSession) {
        state.activeSession = '2025/2026';
    }
    if (!state.sessions || state.sessions.length === 0) {
        state.sessions = ['2025/2026'];
    }
    
    // Update global dropdown select values
    document.getElementById('global-term-select').value = state.activeTerm;
    populateSessionDropdown();
    document.getElementById('global-session-select').value = state.activeSession;
    
    updateStats();
    populateSelects();
    renderAdminTable();
    renderGradingScale();
}

/**
 * Persists the current state to the Flask API backend and saves a local backup in localStorage.
 * Updates dashboard cards and active admin grids.
 */
async function saveState() {
    // Optimistically save locally to localStorage first
    localStorage.setItem('schoolData', JSON.stringify(state));
    
    // Non-admins don't have write access to configuration settings/state on the server
    if (currentUser && currentUser.role !== 'admin') {
        return;
    }
    
    try {
        await fetch('/api/state', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        });
    } catch (e) {
        console.error("Could not sync state to Flask backend API.", e);
    }
    
    updateStats();
    renderAdminTable();
}

/**
 * Handles global changes to the active term dropdown in the dashboard header.
 * Automatically triggers reloading the visible view with the selected term's data context.
 */
function onGlobalTermChange() {
    const termVal = document.getElementById('global-term-select').value;
    
    if (currentUser && currentUser.role === 'student') {
        state.activeTerm = termVal;
        if (activeStudentId) previewReportCard(activeStudentId);
        return;
    }
    
    state.activeTerm = termVal;
    saveState();
    
    // Check which view is currently active in the navigation bar
    const activeLink = document.querySelector('nav .nav-link.active');
    
    if (document.getElementById('panel-report-cards').style.display === 'flex') {
        if (activeStudentId) previewReportCard(activeStudentId);
    }
    
    if (!activeLink) return;
    
    if (activeLink.innerHTML.includes('Admin Settings')) {
        renderAdminTable();
    } else if (activeLink.innerHTML.includes('Subject Teacher')) {
        renderScoreEntryTable();
    } else if (activeLink.innerHTML.includes('Class Teacher')) {
        if (document.getElementById('panel-report-cards').style.display === 'flex') {
            // Already handled above
        } else {
            loadCollationSheet();
        }
    }
}

/**
 * Seeds comprehensive mock data into state for testing purposes.
 * Configures demo classes, subjects, students, and three terms worth of academic grades.
 */
function seedMockData() {
    state.classes = [
        { id: 'c1', name: 'Grade 10A' },
        { id: 'c2', name: 'Grade 11B' }
    ];
    state.subjects = [
        { id: 's1', name: 'Mathematics' },
        { id: 's2', name: 'English Language' },
        { id: 's3', name: 'Chemistry' },
        { id: 's4', name: 'Physics' }
    ];
    state.students = [
        { id: 'st1', name: 'Chinedu Okafor', classId: 'c1' },
        { id: 'st2', name: 'Amina Yusuf', classId: 'c1' },
        { id: 'st3', name: 'Tunde Bakare', classId: 'c1' },
        { id: 'st4', name: 'Elizabeth Adebayo', classId: 'c1' },
        { id: 'st5', name: 'John Peterson', classId: 'c2' },
        { id: 'st6', name: 'Fatima Umar', classId: 'c2' }
    ];
    
    // Seed some mock grades across all terms (t1, t2, t3)
    state.grades = {
        'st1': {
            't1': {
                's1': { ca: 30, exam: 52, total: 82, grade: 'A' },
                's2': { ca: 25, exam: 40, total: 65, grade: 'B' },
                's3': { ca: 28, exam: 44, total: 72, grade: 'A' }
            },
            't2': {
                's1': { ca: 32, exam: 54, total: 86, grade: 'A' },
                's2': { ca: 26, exam: 41, total: 67, grade: 'B' },
                's3': { ca: 30, exam: 48, total: 78, grade: 'A' }
            },
            't3': {
                's1': { ca: 36, exam: 58, total: 94, grade: 'A' },
                's2': { ca: 28, exam: 42, total: 70, grade: 'A' },
                's3': { ca: 30, exam: 45, total: 75, grade: 'A' }
            }
        },
        'st2': {
            't1': {
                's1': { ca: 20, exam: 35, total: 55, grade: 'C' },
                's2': { ca: 32, exam: 45, total: 77, grade: 'A' },
                's3': { ca: 15, exam: 32, total: 47, grade: 'D' }
            },
            't2': {
                's1': { ca: 22, exam: 38, total: 60, grade: 'B' },
                's2': { ca: 30, exam: 46, total: 76, grade: 'A' },
                's3': { ca: 16, exam: 33, total: 49, grade: 'D' }
            },
            't3': {
                's1': { ca: 22, exam: 41, total: 63, grade: 'B' },
                's2': { ca: 35, exam: 48, total: 83, grade: 'A' },
                's3': { ca: 18, exam: 35, total: 53, grade: 'C' }
            }
        },
        'st3': {
            't1': {
                's1': { ca: 12, exam: 25, total: 37, grade: 'F' },
                's2': { ca: 18, exam: 30, total: 48, grade: 'D' }
            },
            't2': {
                's1': { ca: 14, exam: 28, total: 42, grade: 'E' },
                's2': { ca: 20, exam: 32, total: 52, grade: 'C' }
            },
            't3': {
                's1': { ca: 15, exam: 30, total: 45, grade: 'D' },
                's2': { ca: 22, exam: 34, total: 56, grade: 'C' }
            }
        }
    };
    
    saveState();
    populateSelects();
    renderGradingScale();
    alert("Demo data successfully seeded!");
}

/**
 * Updates stats dashboard widgets with total items count.
 */
function updateStats() {
    document.getElementById('stat-classes').innerText = state.classes.length;
    document.getElementById('stat-subjects').innerText = state.subjects.length;
    document.getElementById('stat-students').innerText = state.students.length;
}

/**
 * Router Navigation Controller. Switches panels and updates headings.
 * @param {string} portal - The target portal ID ('admin', 'subject', 'class')
 */
function switchPortal(portal) {
    activeStudentId = null;
    
    // Clear navigation highlight styles
    document.querySelectorAll('nav .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Hide all panel divisions
    document.getElementById('panel-admin').style.display = 'none';
    document.getElementById('panel-subject').style.display = 'none';
    document.getElementById('panel-class').style.display = 'none';
    document.getElementById('panel-report-cards').style.display = 'none';

    const titleEl = document.getElementById('portal-title');
    const subtitleEl = document.getElementById('portal-subtitle');
    
    // Swap visible panel content and set title highlights
    if (portal === 'admin') {
        document.querySelector("nav div:nth-child(1)").classList.add('active');
        document.getElementById('panel-admin').style.display = 'flex';
        titleEl.innerText = "Admin Configuration";
        subtitleEl.innerText = "Manage school structures, students, and grading criteria";
    } else if (portal === 'subject') {
        document.querySelector("nav div:nth-child(2)").classList.add('active');
        document.getElementById('panel-subject').style.display = 'flex';
        titleEl.innerText = "Subject Teacher Portal";
        subtitleEl.innerText = "Enter continuous assessments and exam scores per student";
        resetSubjectPortal();
    } else if (portal === 'class') {
        document.querySelector("nav div:nth-child(3)").classList.add('active');
        document.getElementById('panel-class').style.display = 'flex';
        titleEl.innerText = "Class Results Collation";
        subtitleEl.innerText = "Check subject progress, calculate averages, and publish report cards";
        resetClassPortal();
    }
}

/**
 * Populates all select dropdown menus across portals with classes/subjects options list.
 */
function populateSelects() {
    const newStudentClassSel = document.getElementById('new-student-class');
    const teacherClassSel = document.getElementById('teacher-class-select');
    const classTeacherSel = document.getElementById('class-teacher-select');
    const teacherSubjectSel = document.getElementById('teacher-subject-select');
    
    // Reset contents
    newStudentClassSel.innerHTML = '<option value="">-- Choose Class --</option>';
    teacherClassSel.innerHTML = '<option value="">-- Choose Class --</option>';
    classTeacherSel.innerHTML = '<option value="">-- Choose Class --</option>';
    teacherSubjectSel.innerHTML = '<option value="">-- Choose Subject --</option>';

    state.classes.forEach(cls => {
        newStudentClassSel.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
        teacherClassSel.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
        classTeacherSel.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
    });

    state.subjects.forEach(sub => {
        teacherSubjectSel.innerHTML += `<option value="${sub.id}">${sub.name}</option>`;
    });

    teacherSubjectSel.disabled = false;
}

/**
 * Triggers rendering target dialog overlays.
 * @param {string} id - The modal element HTML ID.
 */
function openModal(id) {
    document.getElementById(id).classList.add('open');
}

/**
 * Triggers closing target dialog overlays.
 * @param {string} id - The modal element HTML ID.
 */
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

/**
 * Adds a new class structure to configuration settings. Saves to cache.
 */
function addClass() {
    const name = document.getElementById('new-class-name').value.trim();
    if (!name) return alert("Class name is required!");
    
    const newClass = {
        id: 'c_' + Date.now(),
        name: name
    };
    state.classes.push(newClass);
    document.getElementById('new-class-name').value = '';
    closeModal('classModal');
    saveState();
    populateSelects();
}

/**
 * Adds a new subject to configuration settings. Saves to cache.
 */
function addSubject() {
    const name = document.getElementById('new-subject-name').value.trim();
    if (!name) return alert("Subject name is required!");
    
    const newSub = {
        id: 's_' + Date.now(),
        name: name
    };
    state.subjects.push(newSub);
    document.getElementById('new-subject-name').value = '';
    closeModal('subjectModal');
    saveState();
    populateSelects();
}

/**
 * Adds a new student record and maps them to a class structure. Saves to cache.
 */
async function addStudent() {
    const customId = document.getElementById('new-student-id').value.trim();
    const name = document.getElementById('new-student-name').value.trim();
    const classId = document.getElementById('new-student-class').value;
    
    if (!customId || !name || !classId) return alert("Student ID, name, and class assignment are all required!");
    
    const newStud = {
        id: customId,
        name: name,
        classId: classId
    };
    
    try {
        const res = await fetch('/api/students', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newStud)
        });
        
        if (res.ok) {
            state.students.push(newStud);
            localStorage.setItem('schoolData', JSON.stringify(state));
            document.getElementById('new-student-id').value = '';
            document.getElementById('new-student-name').value = '';
            document.getElementById('new-student-class').value = '';
            closeModal('studentModal');
            
            // If currently viewing collation sheet, refresh it to show the new student
            if (currentUser && currentUser.role === 'class_teacher') {
                loadCollationSheet();
            } else {
                renderAdminTable();
                updateStats();
            }
            alert("Student successfully added!");
        } else {
            const errData = await res.json();
            alert("Failed to add student: " + (errData.error || res.statusText));
        }
    } catch (e) {
        console.error("Add student API error", e);
        alert("Network error: Could not sync student to database.");
    }
}

/**
 * Renders the structural list of school classes, enrolled numbers, and actions inside the admin panel.
 */
function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '';
    
    if (state.classes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No classes configured yet. Add classes to start.</td></tr>';
        return;
    }

    state.classes.forEach(cls => {
        const studentCount = state.students.filter(st => st.classId === cls.id).length;
        const subjectsList = state.subjects.map(s => s.name).join(', ') || 'All subjects offered';
        
        tbody.innerHTML += `
            <tr>
                <td><strong>${cls.name}</strong></td>
                <td style="font-size: 0.85rem; color: var(--text-secondary); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${subjectsList}</td>
                <td><span class="badge badge-success">${studentCount} Students</span></td>
                <td>
                    <button class="btn btn-danger btn-icon" onclick="deleteClass('${cls.id}')"><i class="ri-delete-bin-line"></i></button>
                </td>
            </tr>
        `;
    });
}

/**
 * Deletes a class, clears class mappings, and deletes student lists. Saves to cache.
 * @param {string} classId - Target class ID.
 */
function deleteClass(classId) {
    if (!confirm("Are you sure you want to delete this class? This will delete student mappings and results associated with it.")) return;
    state.classes = state.classes.filter(c => c.id !== classId);
    state.students = state.students.filter(st => st.classId !== classId);
    saveState();
    populateSelects();
}

/**
 * Renders weight settings inputs and standard grading scales definitions.
 */
function renderGradingScale() {
    document.getElementById('ca-weight').value = state.settings.caWeight;
    document.getElementById('exam-weight').value = state.settings.examWeight;
    
    const tbody = document.getElementById('grading-scale-body');
    tbody.innerHTML = '';
    
    state.settings.scale.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${item.grade}</strong></td>
                <td>${item.min} - ${item.max}% (${item.remark})</td>
            </tr>
        `;
    });
}

/**
 * Validates and updates assessment percentage division weights (e.g. 40/60 division).
 */
function updateAssessmentWeights() {
    const ca = parseInt(document.getElementById('ca-weight').value) || 0;
    if (ca < 0 || ca > 100) return alert("CA weight must be between 0 and 100%");
    
    state.settings.caWeight = ca;
    state.settings.examWeight = 100 - ca;
    document.getElementById('exam-weight').value = 100 - ca;
    saveState();
}

/**
 * Clears form select inputs on the Subject entry panel.
 */
function resetSubjectPortal() {
    document.getElementById('teacher-class-select').value = '';
    document.getElementById('teacher-subject-select').value = '';
    document.getElementById('score-entry-table-body').innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">Please select a class and subject to input scores.</td></tr>';
    document.getElementById('subject-entry-status').innerText = 'Selecting Subject...';
    document.getElementById('subject-entry-status').className = 'badge badge-warning';
    
    document.getElementById('ca-max-label').innerText = state.settings.caWeight;
    document.getElementById('exam-max-label').innerText = state.settings.examWeight;
}

/**
 * Subject class dropdown trigger listener. Triggers score entry grid reloading.
 */
function onTeacherClassChange() {
    renderScoreEntryTable();
}

/**
 * Subject dropdown trigger listener. Triggers score entry grid reloading.
 */
function onTeacherSubjectChange() {
    renderScoreEntryTable();
}

/**
 * Returns letter grade code matching target numerical score values.
 * @param {number} score - Total composite score.
 * @returns {string} Grade letters.
 */
function calculateGrade(score) {
    const scaleItem = state.settings.scale.find(s => score >= s.min && score <= s.max);
    return scaleItem ? scaleItem.grade : 'F';
}

/**
 * Renders dynamic inputs lists for subject teachers to input scores per student based on active configurations.
 */
function renderScoreEntryTable() {
    const classId = document.getElementById('teacher-class-select').value;
    const subjectId = document.getElementById('teacher-subject-select').value;
    const tbody = document.getElementById('score-entry-table-body');
    
    if (!classId || !subjectId) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">Please select both a class and subject to input scores.</td></tr>';
        return;
    }

    const filteredStudents = state.students.filter(st => st.classId === classId);
    if (filteredStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No students registered in this class. Go to Admin Settings to add students.</td></tr>';
        return;
    }

    const termId = state.activeTerm || 't1';

    tbody.innerHTML = '';
    filteredStudents.forEach((student, index) => {
        const studentGrades = (state.grades[student.id] && state.grades[student.id][termId]) || {};
        const subjectGrade = studentGrades[subjectId] || { ca: '', exam: '', total: '', grade: '' };
        
        tbody.innerHTML += `
            <tr data-student-id="${student.id}">
                <td>${index + 1}</td>
                <td><strong>${student.name}</strong></td>
                <td style="text-align: center;">
                    <input type="number" class="score-input ca-score" value="${subjectGrade.ca}" min="0" max="${state.settings.caWeight}" oninput="calcRowScore(this)">
                </td>
                <td style="text-align: center;">
                    <input type="number" class="score-input exam-score" value="${subjectGrade.exam}" min="0" max="${state.settings.examWeight}" oninput="calcRowScore(this)">
                </td>
                <td style="text-align: center; font-weight: 700;" class="total-score-cell">${subjectGrade.total || 0}</td>
                <td style="text-align: center;" class="grade-cell"><span class="badge ${getGradeBadgeClass(subjectGrade.grade)}">${subjectGrade.grade || '-'}</span></td>
            </tr>
        `;
    });
    
    updateSubjectEntryStatus();
}

/**
 * Calculates sum, letter grade, and updates badge styles inside row on input change events.
 * @param {HTMLInputElement} input - Target edited input element.
 */
function calcRowScore(input) {
    const row = input.closest('tr');
    const caVal = parseFloat(row.querySelector('.ca-score').value) || 0;
    const examVal = parseFloat(row.querySelector('.exam-score').value) || 0;
    
    // Range verification checks
    if (caVal > state.settings.caWeight || examVal > state.settings.examWeight) {
        row.querySelector('.total-score-cell').innerText = 'Error';
        row.querySelector('.grade-cell').innerHTML = `<span class="badge badge-danger">Out of range</span>`;
        return;
    }

    const total = caVal + examVal;
    const grade = calculateGrade(total);
    
    row.querySelector('.total-score-cell').innerText = total;
    row.querySelector('.grade-cell').innerHTML = `<span class="badge ${getGradeBadgeClass(grade)}">${grade}</span>`;
}

/**
 * Helper mapping color highlight class badges matching target grades.
 * @param {string} grade - Letter grade code.
 * @returns {string} Badge CSS class name selector string.
 */
function getGradeBadgeClass(grade) {
    if (grade === 'A' || grade === 'B') return 'badge-success';
    if (grade === 'C' || grade === 'D' || grade === 'E') return 'badge-warning';
    return 'badge-danger';
}

/**
 * Validates, compiles, and saves all subject score rows inputted by the subject teacher.
 * Saves values under the currently active term.
 */
async function saveSubjectScores() {
    const classId = document.getElementById('teacher-class-select').value;
    const subjectId = document.getElementById('teacher-subject-select').value;
    
    if (!classId || !subjectId) return alert("Please select a valid class and subject!");
    
    let hasError = false;
    const gradesPayload = {};
    const termId = state.activeTerm || 't1';

    document.querySelectorAll('#score-entry-table-body tr').forEach(row => {
        const studentId = row.getAttribute('data-student-id');
        const caInput = row.querySelector('.ca-score');
        const examInput = row.querySelector('.exam-score');
        
        if (!caInput || !examInput) return;
        
        const ca = caInput.value;
        const exam = examInput.value;
        
        if (ca === "" && exam === "") return; // Skip unfilled rows
        
        const validCa = ca === "" ? 0 : parseFloat(ca);
        const validExam = exam === "" ? 0 : parseFloat(exam);

        if (validCa > state.settings.caWeight || validExam > state.settings.examWeight || validCa < 0 || validExam < 0) {
            hasError = true;
            return;
        }

        const total = validCa + validExam;
        const grade = calculateGrade(total);

        gradesPayload[studentId] = {
            ca: ca === "" ? "" : parseFloat(ca),
            exam: exam === "" ? "" : parseFloat(exam),
            total: total,
            grade: grade
        };
    });

    if (hasError) {
        alert("Some scores are invalid or out of range. Check limits and try again.");
        return;
    }

    try {
        const res = await fetch('/api/grades', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                classId: classId,
                subjectId: subjectId,
                termId: termId,
                grades: gradesPayload
            })
        });

        if (res.ok) {
            // Apply updates locally
            Object.keys(gradesPayload).forEach(studentId => {
                if (!state.grades[studentId]) state.grades[studentId] = {};
                if (!state.grades[studentId][termId]) state.grades[studentId][termId] = {};
                state.grades[studentId][termId][subjectId] = gradesPayload[studentId];
            });

            // Cache to localStorage as backup
            localStorage.setItem('schoolData', JSON.stringify(state));
            updateSubjectEntryStatus();
            alert("Subject scores successfully saved!");
        } else {
            const errData = await res.json();
            alert("Failed to save scores: " + (errData.error || res.statusText));
        }
    } catch (e) {
        console.error("Save grades API error", e);
        alert("Network error: Could not sync scores to database.");
    }
}

/**
 * Re-evaluates entry completeness numbers for active subjects in classes and updates indicator badges.
 */
function updateSubjectEntryStatus() {
    const classId = document.getElementById('teacher-class-select').value;
    const subjectId = document.getElementById('teacher-subject-select').value;
    const statusEl = document.getElementById('subject-entry-status');
    
    if (!classId || !subjectId) {
        statusEl.innerText = "Selecting Subject...";
        statusEl.className = "badge badge-warning";
        return;
    }

    const classStudents = state.students.filter(st => st.classId === classId);
    let enteredCount = 0;
    const termId = state.activeTerm || 't1';
    
    classStudents.forEach(st => {
        if (state.grades[st.id] && state.grades[st.id][termId] && state.grades[st.id][termId][subjectId] && state.grades[st.id][termId][subjectId].total !== undefined) {
            enteredCount++;
        }
    });

    if (enteredCount === 0) {
        statusEl.innerText = "No Scores Entered";
        statusEl.className = "badge badge-danger";
    } else if (enteredCount < classStudents.length) {
        statusEl.innerText = `In Progress (${enteredCount}/${classStudents.length})`;
        statusEl.className = "badge badge-warning";
    } else {
        statusEl.innerText = "Entries Complete";
        statusEl.className = "badge badge-success";
    }
}

/**
 * Resets selections in Class collation panels.
 */
function resetClassPortal() {
    document.getElementById('class-teacher-select').value = '';
    document.getElementById('collation-table-body').innerHTML = '<tr><td style="text-align: center; color: var(--text-secondary);">Please select a class to load the collation sheet.</td></tr>';
}

/**
 * Gathers entered results across all student, structures, and subjects in target classes.
 * Dynamically computes ranks and session cumulative averages for active terms.
 */
function loadCollationSheet() {
    const classId = document.getElementById('class-teacher-select').value;
    const table = document.getElementById('collation-table');
    
    if (!classId) {
        table.innerHTML = '<thead></thead><tbody id="collation-table-body"><tr><td style="text-align: center; color: var(--text-secondary);">Please select a class to load the collation sheet.</td></tr></tbody>';
        return;
    }

    const classStudents = state.students.filter(st => st.classId === classId);
    if (classStudents.length === 0) {
        table.innerHTML = '<thead></thead><tbody id="collation-table-body"><tr><td style="text-align: center; color: var(--text-secondary);">No students configured in this class.</td></tr></tbody>';
        return;
    }

    const termId = state.activeTerm || 't1';

    // Build dynamic header columns based on active subjects configuration
    let headerHtml = `<tr><th>Student Name</th>`;
    state.subjects.forEach(sub => {
        let label = sub.name;
        if (termId === 't3') {
            label += ' (Session Avg)';
        }
        headerHtml += `<th style="text-align: center;">${label}</th>`;
    });
    headerHtml += `<th style="text-align: center;">Average Score</th><th style="text-align: center;">Position</th><th style="text-align: center;">Report Card</th></tr>`;
    
    table.querySelector('thead').innerHTML = headerHtml;

    // Compile dynamic averages per student based on active terms
    const collationList = classStudents.map(student => {
        let totalScoreSum = 0;
        let subjectsGraded = 0;
        
        if (termId === 't3') {
            // Third term average represents the overall cumulative session averages
            state.subjects.forEach(sub => {
                let sum = 0, count = 0;
                ['t1', 't2', 't3'].forEach(t => {
                    const total = state.grades[student.id] && state.grades[student.id][t] && state.grades[student.id][t][sub.id] && state.grades[student.id][t][sub.id].total;
                    if (total !== undefined && total !== '') {
                        sum += total;
                        count++;
                    }
                });
                if (count > 0) {
                    totalScoreSum += (sum / count);
                    subjectsGraded++;
                }
            });
        } else {
            // First and second terms represent simple active term averages
            state.subjects.forEach(sub => {
                const gradeObj = (state.grades[student.id] && state.grades[student.id][termId] && state.grades[student.id][termId][sub.id]) || {};
                if (gradeObj.total !== undefined && gradeObj.total !== '') {
                    totalScoreSum += gradeObj.total;
                    subjectsGraded++;
                }
            });
        }

        const average = subjectsGraded > 0 ? (totalScoreSum / subjectsGraded).toFixed(1) : 0;
        return {
            student: student,
            average: parseFloat(average),
            gradedCount: subjectsGraded
        };
    });

    // Calculate ranking positions based on average scores
    const sortedList = [...collationList].sort((a, b) => b.average - a.average);
    collationList.forEach(item => {
        if (item.gradedCount > 0) {
            item.position = sortedList.findIndex(x => x.average === item.average) + 1;
        } else {
            item.position = '-';
        }
    });

    // Render collation rows dynamically
    const tbody = document.getElementById('collation-table-body');
    tbody.innerHTML = '';

    collationList.forEach(item => {
        let rowHtml = `<tr><td><strong>${item.student.name}</strong></td>`;
        
        state.subjects.forEach(sub => {
            if (termId === 't3') {
                let sum = 0, count = 0;
                ['t1', 't2', 't3'].forEach(t => {
                    const total = state.grades[item.student.id] && state.grades[item.student.id][t] && state.grades[item.student.id][t][sub.id] && state.grades[item.student.id][t][sub.id].total;
                    if (total !== undefined && total !== '') {
                        sum += total;
                        count++;
                    }
                });
                const term3TotalObj = (state.grades[item.student.id] && state.grades[item.student.id]['t3'] && state.grades[item.student.id]['t3'][sub.id]) || {};
                const t3Display = term3TotalObj.total !== undefined ? term3TotalObj.total : '-';
                const cumAvgDisplay = count > 0 ? (sum / count).toFixed(1) : '-';
                rowHtml += `<td style="text-align: center;">${t3Display} (${cumAvgDisplay})</td>`;
            } else {
                const gradeObj = (state.grades[item.student.id] && state.grades[item.student.id][termId] && state.grades[item.student.id][termId][sub.id]) || {};
                const display = gradeObj.total !== undefined ? `${gradeObj.total} (${gradeObj.grade})` : '<span style="color: var(--text-muted)">-</span>';
                rowHtml += `<td style="text-align: center;">${display}</td>`;
            }
        });

        rowHtml += `
            <td style="text-align: center; font-weight: 700;">${item.average > 0 ? item.average + '%' : '-'}</td>
            <td style="text-align: center;"><span class="badge badge-success">${item.position}</span></td>
            <td style="text-align: center;">
                <button class="btn btn-primary btn-icon" onclick="previewReportCard('${item.student.id}')"><i class="ri-article-line"></i> View Report</button>
            </td>
        </tr>`;
        
        tbody.innerHTML += rowHtml;
    });
}

/**
 * Triggers loading the preview report card container page for target student.
 * @param {string} studentId - Unique ID of the student.
 */
function previewReportCard(studentId) {
    activeStudentId = studentId;
    document.getElementById('panel-admin').style.display = 'none';
    document.getElementById('panel-subject').style.display = 'none';
    document.getElementById('panel-class').style.display = 'none';
    document.getElementById('panel-report-cards').style.display = 'flex';
    
    if (currentUser && currentUser.role === 'student') {
        document.getElementById('portal-title').innerText = "Student Portal";
        document.getElementById('portal-subtitle').innerText = "View your term results and academic reports";
    } else {
        document.getElementById('portal-title').innerText = "Report Card View";
        document.getElementById('portal-subtitle').innerText = "Individual academic report card preview";
    }

    const container = document.getElementById('report-card-container');
    container.innerHTML = generateReportCardHtml(studentId);
}

/**
 * Triggers going back to the class teacher collation matrix sheet view.
 */
function goBackToClassTeacher() {
    activeStudentId = null;
    document.getElementById('panel-report-cards').style.display = 'none';
    document.getElementById('panel-class').style.display = 'flex';
    document.getElementById('portal-title').innerText = "Class Results Collation";
    loadCollationSheet();
}

/**
 * Utility function to convert numbers to standard ordinal suffixes (e.g. 1st, 2nd, 3rd).
 * @param {number|string} i - Input rank.
 * @returns {string} Ordinal rank output.
 */
function getOrdinalSuffix(i) {
    if (isNaN(i) || i === '-') return '-';
    var j = i % 10, k = i % 100;
    if (j == 1 && k != 11) return i + "st";
    if (j == 2 && k != 12) return i + "nd";
    if (j == 3 && k != 13) return i + "rd";
    return i + "th";
}

/**
 * Computes a student's dynamic rank/position in a specific subject compared to classmates.
 * @param {string} studentId - Unique student ID.
 * @param {string} subjectId - Unique subject ID.
 * @param {string} termId - Current active term ID.
 * @param {boolean} isCumulative - If true, evaluates position based on session cumulative averages.
 * @returns {string} Ordinal rank string.
 */
function getSubjectPosition(studentId, subjectId, termId, isCumulative) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return '-';
    
    const classStudents = state.students.filter(st => st.classId === student.classId);
    const scoreList = classStudents.map(st => {
        let val = null;
        if (isCumulative) {
            let sum = 0, count = 0;
            ['t1', 't2', 't3'].forEach(t => {
                const total = state.grades[st.id] && state.grades[st.id][t] && state.grades[st.id][t][subjectId] && state.grades[st.id][t][subjectId].total;
                if (total !== undefined && total !== '') {
                    sum += total;
                    count++;
                }
            });
            val = count > 0 ? (sum / count) : null;
        } else {
            const total = state.grades[st.id] && state.grades[st.id][termId] && state.grades[st.id][termId][subjectId] && state.grades[st.id][termId][subjectId].total;
            val = (total !== undefined && total !== '') ? total : null;
        }
        return { studentId: st.id, val: val };
    }).filter(x => x.val !== null);

    const sorted = [...scoreList].sort((a, b) => b.val - a.val);
    const rank = sorted.findIndex(x => x.studentId === studentId);
    return rank !== -1 ? getOrdinalSuffix(rank + 1) : '-';
}

/**
 * Generates custom HTML structures for printable student report cards based on active terms.
 * Includes past term scores, CA/Exams splits, cumulative averages, class ranks, subject ranks, and teacher/principal comments.
 * @param {string} studentId - Unique student ID.
 * @returns {string} Dynamic HTML string.
 */
function generateReportCardHtml(studentId) {
    const student = state.students.find(s => s.id === studentId);
    const cls = state.classes.find(c => c.id === student.classId);
    const activeTerm = state.activeTerm || 't1';
    
    // Compile class rankings
    const classStudents = state.students.filter(st => st.classId === cls.id);
    const collationList = classStudents.map(st => {
        let total = 0, count = 0;
        if (activeTerm === 't3') {
            let cumAvgSum = 0, subjectsCount = 0;
            state.subjects.forEach(sub => {
                let subSum = 0, subCount = 0;
                ['t1', 't2', 't3'].forEach(t => {
                    const totalScore = state.grades[st.id] && state.grades[st.id][t] && state.grades[st.id][t][sub.id] && state.grades[st.id][t][sub.id].total;
                    if (totalScore !== undefined && totalScore !== '') {
                        subSum += totalScore;
                        subCount++;
                    }
                });
                if (subCount > 0) {
                    cumAvgSum += (subSum / subCount);
                    subjectsCount++;
                }
            });
            return { id: st.id, avg: subjectsCount > 0 ? (cumAvgSum / subjectsCount) : 0 };
        } else {
            state.subjects.forEach(s => {
                const score = (state.grades[st.id] && state.grades[st.id][activeTerm] && state.grades[st.id][activeTerm][s.id]) || {};
                if (score.total !== undefined && score.total !== '') {
                    total += score.total;
                    count++;
                }
            });
            return { id: st.id, avg: count > 0 ? (total / count) : 0 };
        }
    });
    
    const sorted = [...collationList].sort((a, b) => b.avg - a.avg);
    const studentRank = sorted.findIndex(x => x.id === studentId) + 1;
    const finalAvg = collationList.find(x => x.id === studentId).avg;

    let subjectsTableHead = '';
    let subjectsRows = '';

    // Conditionally check layouts matching terms
    if (activeTerm === 't3') {
        // Full Session Cumulative layout format
        subjectsTableHead = `
            <tr>
                <th>Subject Name</th>
                <th style="text-align: center;">1st Term (100)</th>
                <th style="text-align: center;">2nd Term (100)</th>
                <th style="text-align: center;">3rd Term CA (${state.settings.caWeight}%)</th>
                <th style="text-align: center;">3rd Term Exam (${state.settings.examWeight}%)</th>
                <th style="text-align: center;">3rd Term Total (100)</th>
                <th style="text-align: center;">Cumulative Average</th>
                <th style="text-align: center;">Session Grade</th>
                <th style="text-align: center;">Subject Position</th>
                <th style="text-align: center;">Remarks</th>
            </tr>
        `;

        state.subjects.forEach(sub => {
            const t1Score = (state.grades[studentId] && state.grades[studentId]['t1'] && state.grades[studentId]['t1'][sub.id] && state.grades[studentId]['t1'][sub.id].total) || '-';
            const t2Score = (state.grades[studentId] && state.grades[studentId]['t2'] && state.grades[studentId]['t2'][sub.id] && state.grades[studentId]['t2'][sub.id].total) || '-';
            const t3CA = (state.grades[studentId] && state.grades[studentId]['t3'] && state.grades[studentId]['t3'][sub.id] && state.grades[studentId]['t3'][sub.id].ca) || '-';
            const t3Exam = (state.grades[studentId] && state.grades[studentId]['t3'] && state.grades[studentId]['t3'][sub.id] && state.grades[studentId]['t3'][sub.id].exam) || '-';
            const t3Total = (state.grades[studentId] && state.grades[studentId]['t3'] && state.grades[studentId]['t3'][sub.id] && state.grades[studentId]['t3'][sub.id].total) || '-';
            
            // Calculate cumulative average
            let sum = 0, count = 0;
            ['t1', 't2', 't3'].forEach(t => {
                const total = state.grades[studentId] && state.grades[studentId][t] && state.grades[studentId][t][sub.id] && state.grades[studentId][t][sub.id].total;
                if (total !== undefined && total !== '') {
                    sum += total;
                    count++;
                }
            });
            const cumAvg = count > 0 ? (sum / count) : 0;
            const cumGrade = count > 0 ? calculateGrade(cumAvg) : '-';
            
            let remark = '-';
            if (count > 0) {
                const match = state.settings.scale.find(s => s.grade === cumGrade);
                remark = match ? match.remark : '-';
            }

            const subjectPos = getSubjectPosition(studentId, sub.id, 't3', true);

            subjectsRows += `
                <tr>
                    <td><strong>${sub.name}</strong></td>
                    <td style="text-align: center;">${t1Score}</td>
                    <td style="text-align: center;">${t2Score}</td>
                    <td style="text-align: center;">${t3CA}</td>
                    <td style="text-align: center;">${t3Exam}</td>
                    <td style="text-align: center; font-weight: 700;">${t3Total}</td>
                    <td style="text-align: center; font-weight: 700; background: #f8fafc;">${count > 0 ? cumAvg.toFixed(1) + '%' : '-'}</td>
                    <td style="text-align: center; font-weight: 700;">${cumGrade}</td>
                    <td style="text-align: center; font-weight: 600;"><span class="badge badge-success">${subjectPos}</span></td>
                    <td style="text-align: center;">${remark}</td>
                </tr>
            `;
        });
    } else {
        // Independent term layout format
        subjectsTableHead = `
            <tr>
                <th>Subject Name</th>
                <th style="text-align: center;">Continuous Assessment (${state.settings.caWeight}%)</th>
                <th style="text-align: center;">Examination (${state.settings.examWeight}%)</th>
                <th style="text-align: center;">Total Score (100)</th>
                <th style="text-align: center;">Grade</th>
                <th style="text-align: center;">Subject Position</th>
                <th style="text-align: center;">Remarks</th>
            </tr>
        `;

        state.subjects.forEach(sub => {
            const gradeObj = (state.grades[studentId] && state.grades[studentId][activeTerm] && state.grades[studentId][activeTerm][sub.id]) || {};
            const caVal = gradeObj.ca !== undefined ? gradeObj.ca : '-';
            const examVal = gradeObj.exam !== undefined ? gradeObj.exam : '-';
            const totalVal = gradeObj.total !== undefined ? gradeObj.total : '-';
            const gradeVal = gradeObj.grade !== undefined ? gradeObj.grade : '-';
            
            let remark = '-';
            if (gradeObj.grade) {
                const match = state.settings.scale.find(s => s.grade === gradeObj.grade);
                remark = match ? match.remark : '-';
            }

            const subjectPos = getSubjectPosition(studentId, sub.id, activeTerm, false);

            subjectsRows += `
                <tr>
                    <td><strong>${sub.name}</strong></td>
                    <td style="text-align: center;">${caVal}</td>
                    <td style="text-align: center;">${examVal}</td>
                    <td style="text-align: center; font-weight: 700;">${totalVal}</td>
                    <td style="text-align: center; font-weight: 700;">${gradeVal}</td>
                    <td style="text-align: center; font-weight: 600;"><span class="badge badge-success">${subjectPos}</span></td>
                    <td style="text-align: center;">${remark}</td>
                </tr>
            `;
        });
    }

    // Select scale to display in legend (ensuring all WAEC grades are present even if settings are empty)
    const scaleToUse = (state.settings.scale && state.settings.scale.length > 1) ? state.settings.scale : [
        { grade: 'A1', min: 75, max: 100, remark: 'Excellent' },
        { grade: 'B2', min: 70, max: 74, remark: 'Very Good' },
        { grade: 'B3', min: 65, max: 69, remark: 'Good' },
        { grade: 'C4', min: 60, max: 64, remark: 'Credit' },
        { grade: 'C5', min: 55, max: 59, remark: 'Credit' },
        { grade: 'C6', min: 50, max: 54, remark: 'Credit' },
        { grade: 'D7', min: 45, max: 49, remark: 'Pass' },
        { grade: 'E8', min: 40, max: 44, remark: 'Pass' },
        { grade: 'F9', min: 0, max: 39, remark: 'Fail' }
    ];
    let legendHtml = scaleToUse.map(s => `<strong>${s.grade}</strong>: ${s.min}-${s.max}% (${s.remark})`).join(' | ');

    // Load saved teacher and principal remarks from localStorage
    const savedRemarks = localStorage.getItem(`remarks_${studentId}_${activeTerm}`) || "";
    const savedPrincipalRemarks = localStorage.getItem(`remarks_principal_${studentId}_${activeTerm}`) || "";
    
    const termLabel = activeTerm === 't1' ? 'First Term' : (activeTerm === 't2' ? 'Second Term' : 'Third Term (Cumulative Session)');

    return `
        <div class="report-card">
            <div class="report-watermark">
                <img src="RiseUp Logo.png" alt="RiseUp Logo Watermark">
            </div>
            <div class="report-header">
                <div class="logo-and-info">
                    <img src="RiseUp Logo.png" class="school-logo" alt="RiseUp College Logo">
                    <div class="school-info">
                        <h2>RiseUp College</h2>
                        <p>5, Oriade Close, Off Council Road, Water Bus-stop, Ipaja, Lagos</p>
                    </div>
                </div>
                <div class="report-title">
                    <h3>STUDENT REPORT CARD</h3>
                    <p>Academic Term: ${termLabel}, 2026</p>
                </div>
            </div>

            <div class="student-meta-grid">
                <div class="meta-item"><strong>Student Name:</strong> ${student.name}</div>
                <div class="meta-item"><strong>Class:</strong> ${cls.name}</div>
                <div class="meta-item"><strong>Student ID:</strong> ${student.id}</div>
                <div class="meta-item"><strong>Total Subjects Offered:</strong> ${state.subjects.length}</div>
            </div>

            <table>
                <thead>
                    ${subjectsTableHead}
                </thead>
                <tbody>
                    ${subjectsRows}
                </tbody>
            </table>

            <div class="summary-metrics">
                <div class="metric-box">
                    <div class="metric-title">${activeTerm === 't3' ? 'Session Avg' : 'Average Score'}</div>
                    <div class="metric-value">${finalAvg > 0 ? finalAvg.toFixed(1) + '%' : '-'}</div>
                </div>
                <div class="metric-box">
                    <div class="metric-title">${activeTerm === 't3' ? 'Session Grade' : 'Overall Grade'}</div>
                    <div class="metric-value">${finalAvg > 0 ? calculateGrade(finalAvg) : '-'}</div>
                </div>
                <div class="metric-box">
                    <div class="metric-title">Class Position</div>
                    <div class="metric-value">${finalAvg > 0 ? getOrdinalSuffix(studentRank) : '-'}</div>
                </div>
                <div class="metric-box">
                    <div class="metric-title">Total Class Size</div>
                    <div class="metric-value">${classStudents.length} Students</div>
                </div>
            </div>

            <!-- Remarks section displaying both Teacher and Principal inputs -->
            <div class="remarks-section">
                <!-- Class Teacher Remarks panel -->
                <div class="remark-box">
                    <strong>Class Teacher's Remark:</strong>
                    <div style="margin-top: 5px;">
                        <textarea class="no-print" id="teacher-remark-input" style="height: 60px; padding: 8px; margin-bottom: 8px;" placeholder="Enter custom remark..." oninput="saveRemark('${studentId}', '${activeTerm}', this.value)">${savedRemarks}</textarea>
                        <p class="print-only" id="teacher-remark-print" style="font-style: italic; color: #334155;">${savedRemarks || 'No comment added yet.'}</p>
                    </div>
                </div>
                <!-- Principal Remarks panel -->
                <div class="remark-box">
                    <strong>Principal's Remark:</strong>
                    <div style="margin-top: 5px;">
                        <textarea class="no-print" id="principal-remark-input" style="height: 60px; padding: 8px; margin-bottom: 8px;" placeholder="Enter principal remark..." oninput="savePrincipalRemark('${studentId}', '${activeTerm}', this.value)">${savedPrincipalRemarks}</textarea>
                        <p class="print-only" id="principal-remark-print" style="font-style: italic; color: #334155;">${savedPrincipalRemarks || 'No comment added yet.'}</p>
                    </div>
                </div>
                <div class="remark-box">
                    <strong>Grading Legend:</strong>
                    <p style="font-size: 0.8rem; color: #64748b; margin-top: 5px;">${legendHtml}</p>
                </div>
            </div>

            <div class="signature-row">
                <div class="signature-line">Class Teacher Signature</div>
                <div class="signature-line">Principal's Signature</div>
            </div>
        </div>
    `;
}

/**
 * Saves class teacher's custom remarks into localStorage. Updates screen displays.
 * @param {string} studentId - Unique student ID.
 * @param {string} termId - Target term ID.
 * @param {string} text - Entered comment.
 */
function saveRemark(studentId, termId, text) {
    localStorage.setItem(`remarks_${studentId}_${termId}`, text);
    const printEl = document.getElementById('teacher-remark-print');
    if (printEl) {
        printEl.innerText = text || 'No comment added yet.';
    }
}

/**
 * Saves school principal's custom remarks into localStorage. Updates screen displays.
 * @param {string} studentId - Unique student ID.
 * @param {string} termId - Target term ID.
 * @param {string} text - Entered comment.
 */
function savePrincipalRemark(studentId, termId, text) {
    localStorage.setItem(`remarks_principal_${studentId}_${termId}`, text);
    const printEl = document.getElementById('principal-remark-print');
    if (printEl) {
        printEl.innerText = text || 'No comment added yet.';
    }
}

/**
 * Collates and print reports card elements for all students of selected class in sequence.
 */
function printAllReportCards() {
    const classId = document.getElementById('class-teacher-select').value;
    if (!classId) return alert("Select a class first!");
    
    const classStudents = state.students.filter(st => st.classId === classId);
    if (classStudents.length === 0) return alert("No students found in this class!");

    document.getElementById('panel-class').style.display = 'none';
    document.getElementById('panel-report-cards').style.display = 'flex';
    
    const container = document.getElementById('report-card-container');
    container.innerHTML = '';

    classStudents.forEach(st => {
        container.innerHTML += generateReportCardHtml(st.id);
    });

    setTimeout(() => {
        window.print();
    }, 500);
}

/**
 * Handles global session dropdown change event.
 * Triggers loading the state for the selected session and refreshes views.
 */
async function onGlobalSessionChange() {
    const selectedSession = document.getElementById('global-session-select').value;
    
    state.activeSession = selectedSession;
    
    if (currentUser && currentUser.role === 'admin') {
        await saveState();
    }
    
    await loadState(selectedSession);
}

/**
 * Creates a new academic session. Retains structures and clears grades locally and globally.
 */
function createNewSession() {
    const sessionName = document.getElementById('new-session-name').value.trim();
    if (!sessionName) return alert("Session name is required!");
    
    if (state.sessions.includes(sessionName)) {
        return alert("This academic session already exists!");
    }
    
    // Register new session
    state.sessions.push(sessionName);
    state.activeSession = sessionName;
    state.activeTerm = 't1';
    
    // Clear local grades state for the new session (starts clean)
    state.grades = {};
    
    document.getElementById('new-session-name').value = '';
    closeModal('sessionModal');
    
    populateSessionDropdown();
    document.getElementById('global-session-select').value = state.activeSession;
    document.getElementById('global-term-select').value = state.activeTerm;
    
    // Save state globally (as admin)
    saveState();
    
    // Reload state and refresh view
    loadState(state.activeSession);
    
    alert(`Academic Session ${sessionName} successfully created and activated!`);
}

/**
 * Populates the session select dropdown list options.
 */
function populateSessionDropdown() {
    const sessionSel = document.getElementById('global-session-select');
    if (!sessionSel) return;
    
    sessionSel.innerHTML = '';
    const list = state.sessions || ['2025/2026'];
    list.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.innerText = s;
        sessionSel.appendChild(opt);
    });
}

/**
 * Helper to refresh the current visible view based on updated context.
 */
function refreshCurrentView() {
    const activeLink = document.querySelector('nav .nav-link.active');
    
    if (document.getElementById('panel-report-cards').style.display === 'flex') {
        if (activeStudentId) previewReportCard(activeStudentId);
        return;
    }
    
    if (!activeLink) return;
    
    if (activeLink.innerHTML.includes('Admin Settings')) {
        renderAdminTable();
    } else if (activeLink.innerHTML.includes('Subject Teacher')) {
        renderScoreEntryTable();
    } else if (activeLink.innerHTML.includes('Class Teacher')) {
        loadCollationSheet();
    }
}
