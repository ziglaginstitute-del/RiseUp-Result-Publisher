# RiseUp College - Results Publisher Portal

A modern, role-based web application designed for schools to manage, collate, and publish academic results. Built using a robust Flask backend and an interactive JavaScript frontend, the portal offers specialized views for Administrators, Subject Teachers, Class Teachers, and Students.

## 🚀 Key Features

* **Admin Portal**: 
  * Add and manage classes, subjects, and students.
  * Customize Continuous Assessment (CA) and Exam weight distributions (e.g., 40/60 splits).
  * Configure grading scales (WAEC/NECO standard) and automatic remarks.
  * **Academic Session Rollover**: Start a new academic session with a single click—preserving classes, subjects, and student lists while archiving historical grade data.
* **Subject Teacher Portal**:
  * Input scores for assigned classes and subjects.
  * Automatic real-time calculations for totals, grades, and completion metrics.
* **Class Teacher Portal**:
  * View master collation broadsheets with student positions and averages.
  * Single-click batch printing of report cards optimized for paper/PDF layouts.
* **Student Portal**:
  * Clean, interactive digital report cards.
  * Dynamic dropdown toggles to switch between First, Second, and Third term results, as well as past academic sessions.

## 🛠️ Technology Stack

* **Backend**: Python, Flask, Flask-SQLAlchemy
* **Database**: SQLite (local development) / PostgreSQL (production-ready)
* **Frontend**: HTML5 (Semantic), CSS3 (Vanilla design tokens, print stylesheets), JavaScript (ES6, Fetch API)
* **Icons**: Remix Icons

## 💻 Getting Started

### Prerequisites
* Python 3.8 or higher installed on your system.

### Installation & Run
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/school-results-publisher.git
   cd school-results-publisher
