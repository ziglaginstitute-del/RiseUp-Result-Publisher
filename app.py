import os
import json
from functools import wraps
from flask import Flask, jsonify, request, send_from_directory, session
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

# Load local environment variables from .env if present
load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key_change_in_production')

# Resolve Render/production PostgreSQL vs local SQLite database URLs
db_url = os.environ.get('DATABASE_URL', 'sqlite:///school.db')
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URL'] = db_url
app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models definition
class Class(db.Model):
    __tablename__ = 'classes'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)

class Subject(db.Model):
    __tablename__ = 'subjects'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)

class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    class_id = db.Column(db.String(50), db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)

class Grade(db.Model):
    __tablename__ = 'grades'
    student_id = db.Column(db.String(50), primary_key=True)
    term_id = db.Column(db.String(10), primary_key=True)
    subject_id = db.Column(db.String(50), primary_key=True)
    session_id = db.Column(db.String(50), primary_key=True, default='2025/2026')
    ca = db.Column(db.Float, nullable=True)
    exam = db.Column(db.Float, nullable=True)
    total = db.Column(db.Float, nullable=True)
    grade = db.Column(db.String(10), nullable=True)

class Setting(db.Model):
    __tablename__ = 'settings'
    key = db.Column(db.String(50), primary_key=True)
    value = db.Column(db.JSON, nullable=False)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'admin', 'class_teacher', 'teacher', 'student'
    assigned_subject_id = db.Column(db.String(50), db.ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True)
    student_id = db.Column(db.String(50), db.ForeignKey('students.id', ondelete='CASCADE'), nullable=True)

# Authentication and Authorization Middleware Decorators
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized: Login required"}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'admin':
            return jsonify({"error": "Forbidden: Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated_function

# Root route serving the main dashboard page
@app.route('/')
def index():
    return app.send_static_file('index.html')

# Endpoint to fetch complete app state from database tables
@app.route('/api/state', methods=['GET'])
@login_required
def get_state():
    try:
        role = session.get('role')
        student_id = session.get('student_id')
        
        # Pull settings values
        settings = {}
        for s in Setting.query.all():
            settings[s.key] = s.value
            
        # Standard defaults if settings table is empty
        if 'caWeight' not in settings:
            settings['caWeight'] = 40
        if 'examWeight' not in settings:
            settings['examWeight'] = 60
        if 'scale' not in settings:
            settings['scale'] = [
                { 'grade': 'A1', 'min': 75, 'max': 100, 'remark': 'Excellent' },
                { 'grade': 'B2', 'min': 70, 'max': 74, 'remark': 'Very Good' },
                { 'grade': 'B3', 'min': 65, 'max': 69, 'remark': 'Good' },
                { 'grade': 'C4', 'min': 60, 'max': 64, 'remark': 'Credit' },
                { 'grade': 'C5', 'min': 55, 'max': 59, 'remark': 'Credit' },
                { 'grade': 'C6', 'min': 50, 'max': 54, 'remark': 'Credit' },
                { 'grade': 'D7', 'min': 45, 'max': 49, 'remark': 'Pass' },
                { 'grade': 'E8', 'min': 40, 'max': 44, 'remark': 'Pass' },
                { 'grade': 'F9', 'min': 0, 'max': 39, 'remark': 'Fail' }
            ]
            
        # Get active term setting
        active_term_setting = Setting.query.filter_by(key='activeTerm').first()
        active_term = active_term_setting.value if active_term_setting else 't1'

        # Get active session setting
        active_session_setting = Setting.query.filter_by(key='activeSession').first()
        global_active_session = active_session_setting.value if active_session_setting else '2025/2026'
        
        # Pull sessions list
        sessions_setting = Setting.query.filter_by(key='sessions').first()
        sessions = sessions_setting.value if sessions_setting else ['2025/2026']

        # Determine which session's grades we should return
        requested_session = request.args.get('session')
        active_session = requested_session if requested_session else global_active_session

        if role == 'student' and student_id:
            student_obj = Student.query.get(student_id)
            if not student_obj:
                return jsonify({"error": "Student not found"}), 404
            
            cls_obj = Class.query.get(student_obj.class_id)
            classes = [{"id": cls_obj.id, "name": cls_obj.name}] if cls_obj else []
            subjects = [{"id": s.id, "name": s.name} for s in Subject.query.all()]
            students = [{"id": student_obj.id, "name": student_obj.name, "classId": student_obj.class_id}]
            
            grades_dict = {}
            for g in Grade.query.filter_by(student_id=student_id, session_id=active_session).all():
                if g.student_id not in grades_dict:
                    grades_dict[g.student_id] = {}
                if g.term_id not in grades_dict[g.student_id]:
                    grades_dict[g.student_id][g.term_id] = {}
                    
                grades_dict[g.student_id][g.term_id][g.subject_id] = {
                    "ca": g.ca if g.ca is not None else "",
                    "exam": g.exam if g.exam is not None else "",
                    "total": g.total if g.total is not None else "",
                    "grade": g.grade or ""
                }
        else:
            classes = [{"id": c.id, "name": c.name} for c in Class.query.all()]
            subjects = [{"id": s.id, "name": s.name} for s in Subject.query.all()]
            students = [{"id": st.id, "name": st.name, "classId": st.class_id} for st in Student.query.all()]

            # Structure grades dictionary matching frontend state grades format
            grades_dict = {}
            for g in Grade.query.filter_by(session_id=active_session).all():
                if g.student_id not in grades_dict:
                    grades_dict[g.student_id] = {}
                if g.term_id not in grades_dict[g.student_id]:
                    grades_dict[g.student_id][g.term_id] = {}
                    
                grades_dict[g.student_id][g.term_id][g.subject_id] = {
                    "ca": g.ca if g.ca is not None else "",
                    "exam": g.exam if g.exam is not None else "",
                    "total": g.total if g.total is not None else "",
                    "grade": g.grade or ""
                }

        return jsonify({
            "classes": classes,
            "subjects": subjects,
            "students": students,
            "grades": grades_dict,
            "activeTerm": active_term,
            "activeSession": active_session,
            "sessions": sessions,
            "settings": settings
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint to bulk save/synchronize state back to the database tables
@app.route('/api/state', methods=['POST'])
@admin_required
def save_state():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Missing JSON payload"}), 400

        active_session = data.get('activeSession', '2025/2026')
        sessions = data.get('sessions', ['2025/2026'])

        # Perform updates in a single transaction
        db.session.query(Grade).filter_by(session_id=active_session).delete()
        db.session.query(Student).delete()
        db.session.query(Subject).delete()
        db.session.query(Class).delete()
        db.session.query(Setting).delete()

        # Insert classes
        for c in data.get('classes', []):
            db.session.add(Class(id=c['id'], name=c['name']))

        # Insert subjects
        for s in data.get('subjects', []):
            db.session.add(Subject(id=s['id'], name=s['name']))

        # Insert students
        for st in data.get('students', []):
            db.session.add(Student(id=st['id'], name=st['name'], class_id=st['classId']))

        # Insert settings values
        settings_data = data.get('settings', {})
        db.session.add(Setting(key='caWeight', value=settings_data.get('caWeight', 40)))
        db.session.add(Setting(key='examWeight', value=settings_data.get('examWeight', 60)))
        db.session.add(Setting(key='scale', value=settings_data.get('scale', [])))
        db.session.add(Setting(key='activeTerm', value=data.get('activeTerm', 't1')))
        db.session.add(Setting(key='activeSession', value=active_session))
        db.session.add(Setting(key='sessions', value=sessions))

        # Insert grades
        grades_data = data.get('grades', {})
        for student_id, terms in grades_data.items():
            for term_id, subjects in terms.items():
                for subject_id, info in subjects.items():
                    def parse_float(val):
                        if val == "" or val is None:
                            return None
                        try:
                            return float(val)
                        except ValueError:
                            return None

                    ca = parse_float(info.get('ca'))
                    exam = parse_float(info.get('exam'))
                    total = parse_float(info.get('total'))
                    grade_str = info.get('grade', '')

                    db.session.add(Grade(
                        student_id=student_id,
                        term_id=term_id,
                        subject_id=subject_id,
                        session_id=active_session,
                        ca=ca,
                        exam=exam,
                        total=total,
                        grade=grade_str
                    ))

        db.session.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Session authentication and validation endpoints
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing username or password"}), 400
    
    user = User.query.filter_by(username=data.get('username')).first()
    if not user or not check_password_hash(user.password_hash, data.get('password')):
        return jsonify({"error": "Invalid username or password"}), 401
    
    session['user_id'] = user.id
    session['username'] = user.username
    session['role'] = user.role
    session['assigned_subject_id'] = user.assigned_subject_id
    session['student_id'] = user.student_id
    
    return jsonify({
        "status": "success",
        "user": {
            "username": user.username,
            "role": user.role,
            "assigned_subject_id": user.assigned_subject_id,
            "student_id": user.student_id
        }
    })

@app.route('/api/logout', methods=['POST'])
def logout_route():
    session.clear()
    return jsonify({"status": "success"})

@app.route('/api/session', methods=['GET'])
def get_session():
    if 'user_id' in session:
        return jsonify({
            "logged_in": True,
            "user": {
                "username": session.get('username'),
                "role": session.get('role'),
                "assigned_subject_id": session.get('assigned_subject_id'),
                "student_id": session.get('student_id')
            }
        })
    return jsonify({"logged_in": False})

# Secure grades submission endpoint for teachers and admins
@app.route('/api/grades', methods=['POST'])
@login_required
def save_grades():
    data = request.json
    if not data or not data.get('classId') or not data.get('subjectId') or 'grades' not in data:
        return jsonify({"error": "Missing classId, subjectId, or grades"}), 400
    
    subject_id = data.get('subjectId')
    class_id = data.get('classId')
    role = session.get('role')
    
    # Class Teachers are read-only for score entry (only Admin or Subject Teachers can write)
    if role == 'class_teacher':
         return jsonify({"error": "Forbidden: Class Teachers cannot edit scores"}), 403

    grades_data = data.get('grades', {})
    term_id = data.get('termId', 't1')
    
    try:
        # Get current active session
        active_session_setting = Setting.query.filter_by(key='activeSession').first()
        active_session = active_session_setting.value if active_session_setting else '2025/2026'

        # Loop through student grades and update or insert
        for student_id, info in grades_data.items():
            # Validate that student belongs to class
            student = Student.query.filter_by(id=student_id, class_id=class_id).first()
            if not student:
                continue
            
            def parse_float(val):
                if val == "" or val is None:
                    return None
                try:
                    return float(val)
                except ValueError:
                    return None

            ca = parse_float(info.get('ca'))
            exam = parse_float(info.get('exam'))
            total = parse_float(info.get('total'))
            grade_str = info.get('grade', '')

            # Query existing grade
            g = Grade.query.filter_by(student_id=student_id, term_id=term_id, subject_id=subject_id, session_id=active_session).first()
            if g:
                g.ca = ca
                g.exam = exam
                g.total = total
                g.grade = grade_str
            else:
                db.session.add(Grade(
                    student_id=student_id,
                    term_id=term_id,
                    subject_id=subject_id,
                    session_id=active_session,
                    ca=ca,
                    exam=exam,
                    total=total,
                    grade=grade_str
                ))
        
        db.session.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Server startup database initialization and user seeding
with app.app_context():
    # Inspect database schema to check if column upgrade is required
    try:
        inspector = db.inspect(db.engine)
        if 'grades' in inspector.get_table_names():
            columns = [c['name'] for c in inspector.get_columns('grades')]
            if 'session_id' not in columns:
                print("Upgrading database schema: session_id column missing. Recreating tables...")
                db.drop_all()
    except Exception as e:
        print(f"Error inspecting database schema: {e}")

    db.create_all()
    
    # Check if users table is empty and seed default credentials
    if User.query.count() == 0:
        # Seed default classes if empty
        if Class.query.count() == 0:
            db.session.add(Class(id='c1', name='Grade 10A'))
            db.session.add(Class(id='c2', name='Grade 11B'))
        
        # Seed default subjects if empty
        if Subject.query.count() == 0:
            db.session.add(Subject(id='s1', name='Mathematics'))
            db.session.add(Subject(id='s2', name='English Language'))
            db.session.add(Subject(id='s3', name='Chemistry'))
            db.session.add(Subject(id='s4', name='Physics'))
        
        # Seed students if empty (to avoid empty lists on initial load)
        if Student.query.count() == 0:
            student_seeds = [
                ('st1', 'Chinedu Okafor', 'c1'),
                ('st2', 'Amina Yusuf', 'c1'),
                ('st3', 'Tunde Bakare', 'c1'),
                ('st4', 'Elizabeth Adebayo', 'c1'),
                ('st5', 'John Peterson', 'c2'),
                ('st6', 'Fatima Umar', 'c2')
            ]
            for sid, sname, cid in student_seeds:
                db.session.add(Student(id=sid, name=sname, class_id=cid))
                
                parts = sname.replace(',', ' ').split()
                spass = parts[-1].lower() if parts else 'studentpassword'
                
                db.session.add(User(
                    username=sid,
                    password_hash=generate_password_hash(spass),
                    role='student',
                    student_id=sid
                ))
            db.session.commit()

        # Admin
        db.session.add(User(
            username='admin',
            password_hash=generate_password_hash('adminpassword'),
            role='admin'
        ))
        
        # Class Teacher
        db.session.add(User(
            username='class_teacher',
            password_hash=generate_password_hash('teacherpassword'),
            role='class_teacher'
        ))
        
        # Unified Subject Teacher
        db.session.add(User(
            username='subject_teacher',
            password_hash=generate_password_hash('teacherpassword'),
            role='teacher'
        ))
        
        # Overwrite scale settings key
        new_scale = [
            { 'grade': 'A1', 'min': 75, 'max': 100, 'remark': 'Excellent' },
            { 'grade': 'B2', 'min': 70, 'max': 74, 'remark': 'Very Good' },
            { 'grade': 'B3', 'min': 65, 'max': 69, 'remark': 'Good' },
            { 'grade': 'C4', 'min': 60, 'max': 64, 'remark': 'Credit' },
            { 'grade': 'C5', 'min': 55, 'max': 59, 'remark': 'Credit' },
            { 'grade': 'C6', 'min': 50, 'max': 54, 'remark': 'Credit' },
            { 'grade': 'D7', 'min': 45, 'max': 49, 'remark': 'Pass' },
            { 'grade': 'E8', 'min': 40, 'max': 44, 'remark': 'Pass' },
            { 'grade': 'F9', 'min': 0, 'max': 39, 'remark': 'Fail' }
        ]
        db.session.add(Setting(key='scale', value=new_scale))
        db.session.add(Setting(key='caWeight', value=40))
        db.session.add(Setting(key='examWeight', value=60))
        db.session.add(Setting(key='activeSession', value='2025/2026'))
        db.session.add(Setting(key='sessions', value=['2025/2026']))
        
        db.session.commit()
        print("Default database users pre-seeded successfully!")

# Secure endpoint to add new students
@app.route('/api/students', methods=['POST'])
@login_required
def add_student():
    role = session.get('role')
    if role not in ['admin', 'class_teacher']:
        return jsonify({"error": "Forbidden: Access denied"}), 403
    
    data = request.json
    if not data or not data.get('id') or not data.get('name') or not data.get('classId'):
        return jsonify({"error": "Missing student id, name, or classId"}), 400
    
    student_id = data.get('id').strip()
    
    try:
        # Check if student ID already exists
        existing_stud = Student.query.get(student_id)
        if existing_stud:
            return jsonify({"error": "Student ID already exists in register!"}), 400
            
        # Check if username already exists in users
        existing_user = User.query.filter_by(username=student_id).first()
        if existing_user:
            return jsonify({"error": "Username matching Student ID is already taken!"}), 400

        # Check if class exists
        cls = Class.query.filter_by(id=data.get('classId')).first()
        if not cls:
            return jsonify({"error": "Class not found"}), 404
        
        # Insert student
        new_stud = Student(
            id=student_id,
            name=data.get('name').strip(),
            class_id=data.get('classId')
        )
        db.session.add(new_stud)
        
        # Create student User account with lowercase of last name as password
        parts = data.get('name').strip().replace(',', ' ').split()
        spass = parts[-1].lower() if parts else 'studentpassword'
        
        new_user = User(
            username=student_id,
            password_hash=generate_password_hash(spass),
            role='student',
            student_id=student_id
        )
        db.session.add(new_user)
        
        db.session.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
