# RiseUp College - Academic Results & Report Card Publishing System

A modern, high-contrast, production-ready school results compilation and terminal report card publishing portal for secondary schools, built with **React 18, Vite, Tailwind CSS, Lucide React, and Supabase Cloud Database** (with full offline fallback & Progressive Web App support).

Designed with a high-contrast **Sky Blue (`#0284C7`), Slate Black (`#0F172A`), and Crisp White (`#FFFFFF`)** design system matching Nigerian and British educational standards.

---

## 🌟 How the System Works

### 1. 🌍 Teachers Can Enter Results from Anywhere (Online & 100% Offline App)
- **Installable PWA**: Teachers can install the web app directly onto their Android phone, iPhone, iPad, or Windows/Mac laptop via the browser&apos;s &quot;Install App&quot; or &quot;Add to Home Screen&quot; option.
- **Instant Offline Auto-Save**: Scores are written instantaneously to the device&apos;s local storage database (`localStorage`), so teachers can enter grades even with poor or zero internet connectivity. Work is never lost.
- **Cloud Synchronization**: When internet connectivity is available, grades automatically sync to the Supabase cloud database so admins and class teachers immediately see updated scores.
- **Offline CSV Score Sheet**: Subject teachers can download an offline CSV/Excel score sheet for their class, enter scores in Microsoft Excel or Google Sheets at home, and upload the sheet with one click.
- **Mobile Card View**: Teachers using a smartphone can toggle from Table View to Mobile Card View for rapid, touch-friendly grade entry on small screens.

---

### 2. 🏛️ Departmental Classification & The SS1 Subject &quot;Twist&quot;

#### A. Junior Secondary School (JSS 1, JSS 2, JSS 3)
- **Unified Curriculum**: Junior students take all subjects uniformly (Mathematics, English Studies, Basic Science, Basic Technology, Social Studies, Business Studies, Civic Education, etc.).
- There is no Science/Art/Commercial departmental division in Junior classes.

#### B. Senior Secondary School (SS 1, SS 2, SS 3)
In Senior Secondary classes (e.g. SS 1A), students share a classroom arm but offer a combination of subjects:
1. **General / Core Compulsory Subjects**:
   - Offered by every student in the class (e.g., *Mathematics, English Language, Civic Education*).
2. **Departmental Core Subjects**:
   - **Science**: *Physics, Chemistry, Biology, Further Mathematics, etc.*
   - **Art / Humanities**: *Literature in English, Government, CRS/IRS, History, etc.*
   - **Commercial**: *Financial Accounting, Commerce, Book Keeping, etc.*
3. **Cross-Departmental Subjects**:
   - Subjects shared between departments (e.g., *Economics* and *Government* offered by both Art and Commercial students).
4. **Elective / Selective Subjects**:
   - Any student in any department can select an elective (e.g., *Computer Studies, Agricultural Science, French, Visual Art*).
5. **Report Card Rule (The Twist Solved)**:
   - When generating a student&apos;s report card, the system **ONLY includes**:
     1. The student&apos;s General compulsory subjects.
     2. Their Departmental core subjects (e.g., Chemistry only appears for Science; Literature only appears for Art; Accounting only appears for Commercial).
     3. Any elective or cross-departmental subject that the student *actually offered and received a score for*.
   - **Subjects meant for other departments NEVER appear on a student&apos;s result sheet.** If a Science student does not take Accounting, Accounting is completely omitted from their report card and does not penalize their subject count or class average!

---

### 3. 👥 Role-Based Portals

#### Administrator Portal
- Add, edit, or delete classes, subjects, and students.
- Customize the official WAEC/NECO 9-point grading scale (A1, B2, B3, C4, C5, C6, D7, E8, F9) and CA/Exam weights (CA max 40, Exam max 60).
- Customize school name, motto, address, phone, and principal name.
- Bulk enroll students via CSV spreadsheet upload.
- Export master student register to CSV.

#### Class Teacher Collation Portal
- Dedicated master results collation matrix with frozen sticky columns for Student Name and Department.
- **Filter by Department**: Toggle between `All Departments`, `Science`, `Art`, `Commercial`, `Junior Class`, or `General`.
- **Vertical Rotated Headers**: Subject columns are condensed to ~45px so all 15+ subjects fit on screen at once without horizontal scrolling.
- **Fullscreen Sheet Mode**: Expands the collation table across the entire screen.
- **Add Student**: Easily add a new student with the active class pre-selected.
- **Department-Specific Batch Printing**:
  - Filter by &quot;Science&quot; and click &quot;Print Science Reports&quot; to print report cards specifically for all Science students.
  - Or print all students in the class with one click.

#### Subject Teacher Portal
- Focused workflow: Strictly **Select Class** and **Select Subject**.
- Automatically lists all students eligible for that subject.
- **&quot;+ Add Subject&quot; button**: Subject teachers can add a new subject directly without calling the administrator!
- **&quot;Include all students in class&quot; checkbox**: Allows grading students from other departments who take this subject as an elective or cross-departmental subject.
- Live auto-sum (CA + Exam = Total) and live WAEC grade/remark computation.
- Offline CSV score sheet download & upload.

#### Student & Parent Portal
- Scratch-card style public result checker: Enter Student ID / Reg Number and 4-digit PIN to check and print results.
- Instant modal preview with celebratory confetti.

---

## 🚀 How to Run Locally in VSCode

1. Open your terminal in this project directory:
   ```bash
   cd school-results-publisher
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser at:
   ```
   http://localhost:3000
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## 🔑 Pre-Seeded Login Credentials

| Role | Username / ID | Password / PIN | Description |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `adminpassword` | Full school administration & settings |
| **Class Teacher** | `class_teacher` | `teacherpassword` | Grade 10A Master Collation & Batch Reports |
| **Subject Teacher** | `subject_teacher` | `teacherpassword` | Score Entry & Auto-Grading |
| **Student (Science)** | `RC/2026/001` or `st1` | `8821` | Chinedu Okafor (Grade 10A Science) |
| **Student (Art)** | `RC/2026/002` or `st2` | `4412` | Amina Yusuf (Grade 10A Art) |
| **Student (Junior)** | `RC/2026/007` or `st7` | `6045` | Blessing Eze (JSS 1A Junior) |

---

## ⚡ Supabase Cloud Database Setup (Optional)

The application works completely **out of the box** using its local storage database. To connect a live cloud Supabase PostgreSQL database:

1. Create a free account at [Supabase.com](https://supabase.com).
2. Create a new project (e.g. `RiseUp-Results`).
3. In your Supabase Dashboard, go to **SQL Editor** -> **New Query**.
4. Copy the entire contents of [`supabase_schema.sql`](file:///C:/Users/USER/Downloads/school-results-publisher/supabase_schema.sql) and click **Run**.
5. Copy your **Project URL** and **Anon Public API Key** from Project Settings -> API.
6. Create or edit `.env` in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-publishable-key-here
   ```
7. Restart the dev server (`npm run dev`). The status badge in the header will switch to **🟢 Supabase Cloud**!
