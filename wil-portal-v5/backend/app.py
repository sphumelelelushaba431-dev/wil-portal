from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from functools import wraps
from werkzeug.utils import secure_filename
import uuid, hashlib, os

app = Flask(__name__)

# ── CORS — allow both local dev and deployed frontend ──────────
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]
# Add production frontend URL from environment variable if set
frontend_url = os.environ.get('FRONTEND_URL')
if frontend_url:
    allowed_origins.append(frontend_url)

CORS(app, supports_credentials=True, origins=allowed_origins)

# ── Database — fix Render's postgres:// → postgresql:// ────────
database_url = os.environ.get('DATABASE_URL', 'sqlite:///wil_portal.db')
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.secret_key = os.environ.get('SECRET_KEY', 'change-me-in-production')

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db = SQLAlchemy(app)

def new_id(): return str(uuid.uuid4())[:12]
def now_iso(): return datetime.now(timezone.utc).isoformat()
def hash_pw(pw): return hashlib.sha256(pw.encode()).hexdigest()

def require_auth(f):
    @wraps(f)
    def wrapper(*a, **kw):
        if not session.get('user_email'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*a, **kw)
    return wrapper

def require_admin(f):
    @wraps(f)
    def wrapper(*a, **kw):
        email = session.get('user_email')
        if not email:
            return jsonify({'error': 'Unauthorized'}), 401
        u = User.query.filter_by(email=email).first()
        if not u or u.role not in ('admin', 'coordinator'):
            return jsonify({'error': 'Forbidden'}), 403
        return f(*a, **kw)
    return wrapper

# ── Models ─────────────────────────────────────────────────────
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(12), primary_key=True, default=new_id)
    email = db.Column(db.String(255), unique=True, nullable=False)
    full_name = db.Column(db.String(255))
    password_hash = db.Column(db.String(255))
    role = db.Column(db.String(50), default='student')
    created_date = db.Column(db.String(50), default=now_iso)
    def to_dict(self):
        return {'id': self.id, 'email': self.email, 'full_name': self.full_name,
                'role': self.role, 'created_date': self.created_date}

class StudentProfile(db.Model):
    __tablename__ = 'student_profiles'
    id = db.Column(db.String(12), primary_key=True, default=new_id)
    user_id = db.Column(db.String(255), nullable=False)
    student_number = db.Column(db.String(50))
    programme = db.Column(db.String(255))
    year_of_study = db.Column(db.String(50))
    skills = db.Column(db.Text)
    phone_number = db.Column(db.String(50))
    address = db.Column(db.Text)
    emergency_contact_name = db.Column(db.String(255))
    emergency_contact_phone = db.Column(db.String(50))
    created_date = db.Column(db.String(50), default=now_iso)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.String(12), primary_key=True, default=new_id)
    company_name = db.Column(db.String(255), nullable=False)
    company_email = db.Column(db.String(255))
    company_phone = db.Column(db.String(50))
    address = db.Column(db.Text)
    industry_type = db.Column(db.String(100))
    contact_person_name = db.Column(db.String(255))
    contact_person_position = db.Column(db.String(255))
    contact_person_phone = db.Column(db.String(50))
    registration_number = db.Column(db.String(100))
    created_date = db.Column(db.String(50), default=now_iso)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Opportunity(db.Model):
    __tablename__ = 'opportunities'
    id = db.Column(db.String(12), primary_key=True, default=new_id)
    company_id = db.Column(db.String(12), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    requirements = db.Column(db.Text)
    location = db.Column(db.String(255))
    work_type = db.Column(db.String(50), default='Full-time')
    stipend = db.Column(db.Float, default=0)
    closing_date = db.Column(db.String(20))
    status = db.Column(db.String(50), default='open')
    created_date = db.Column(db.String(50), default=now_iso)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Application(db.Model):
    __tablename__ = 'applications'
    id = db.Column(db.String(12), primary_key=True, default=new_id)
    student_email = db.Column(db.String(255), nullable=False)
    opportunity_id = db.Column(db.String(12), nullable=False)
    status = db.Column(db.String(50), default='submitted')
    cover_letter = db.Column(db.Text)
    reviewed_at = db.Column(db.String(50))
    reviewer_notes = db.Column(db.Text)
    created_date = db.Column(db.String(50), default=now_iso)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Document(db.Model):
    __tablename__ = 'documents'
    id = db.Column(db.String(12), primary_key=True, default=new_id)
    user_email = db.Column(db.String(255), nullable=False)
    application_id = db.Column(db.String(12))
    document_type = db.Column(db.String(100))
    file_url = db.Column(db.Text)
    file_name = db.Column(db.String(255))
    created_date = db.Column(db.String(50), default=now_iso)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.String(12), primary_key=True, default=new_id)
    user_email = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50))
    is_read = db.Column(db.Boolean, default=False)
    link = db.Column(db.String(500))
    created_date = db.Column(db.String(50), default=now_iso)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class SavedOpportunity(db.Model):
    __tablename__ = 'saved_opportunities'
    id = db.Column(db.String(12), primary_key=True, default=new_id)
    user_email = db.Column(db.String(255), nullable=False)
    opportunity_id = db.Column(db.String(12), nullable=False)
    created_date = db.Column(db.String(50), default=now_iso)
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

# ── Public routes ──────────────────────────────────────────────
@app.route('/api/public/stats')
def public_stats():
    return jsonify({
        'open_opportunities': Opportunity.query.filter_by(status='open').count(),
        'total_companies': Company.query.count(),
        'total_students': User.query.filter_by(role='student').count(),
        'total_applications': Application.query.count(),
    })

@app.route('/api/public/opportunities')
def public_opportunities():
    opps = Opportunity.query.filter_by(status='open').order_by(Opportunity.created_date.desc()).limit(6).all()
    result = []
    for o in opps:
        d = o.to_dict()
        comp = Company.query.get(o.company_id)
        d['company_name'] = comp.company_name if comp else ''
        result.append(d)
    return jsonify(result)

# ── Auth ───────────────────────────────────────────────────────
@app.route('/api/auth/register', methods=['POST'])
def register():
    d = request.json
    if not d.get('email') or not d.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    if User.query.filter_by(email=d['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    # Role is always student on public registration — no exceptions
    u = User(email=d['email'], full_name=d.get('full_name', ''),
             password_hash=hash_pw(d['password']), role='student')
    db.session.add(u)
    db.session.commit()
    session['user_email'] = u.email
    return jsonify(u.to_dict()), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    d = request.json
    u = User.query.filter_by(email=d.get('email', '')).first()
    if not u or u.password_hash != hash_pw(d.get('password', '')):
        return jsonify({'error': 'Invalid credentials'}), 401
    session['user_email'] = u.email
    return jsonify(u.to_dict())

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'ok': True})

@app.route('/api/auth/me')
@require_auth
def me():
    u = User.query.filter_by(email=session['user_email']).first()
    return jsonify(u.to_dict())

# ── Manage Students (Admin only) ───────────────────────────────
@app.route('/api/students', methods=['GET'])
@require_admin
def get_students():
    students = User.query.filter_by(role='student').order_by(User.created_date.desc()).all()
    result = []
    for s in students:
        d = s.to_dict()
        # Include application count per student
        d['application_count'] = Application.query.filter_by(student_email=s.email).count()
        # Include profile if exists
        profile = StudentProfile.query.filter_by(user_id=s.email).first()
        d['profile'] = profile.to_dict() if profile else None
        result.append(d)
    return jsonify(result)

@app.route('/api/students/<uid>/promote', methods=['PUT'])
@require_admin
def promote_student(uid):
    u = User.query.get_or_404(uid)
    if u.role != 'student':
        return jsonify({'error': 'User is not a student'}), 400
    u.role = 'coordinator'
    db.session.commit()
    return jsonify(u.to_dict())

@app.route('/api/students/<uid>', methods=['DELETE'])
@require_admin
def delete_student(uid):
    u = User.query.get_or_404(uid)
    if u.role not in ('student',):
        return jsonify({'error': 'Can only delete student accounts'}), 403
    # Clean up related data
    Application.query.filter_by(student_email=u.email).delete()
    Document.query.filter_by(user_email=u.email).delete()
    Notification.query.filter_by(user_email=u.email).delete()
    SavedOpportunity.query.filter_by(user_email=u.email).delete()
    StudentProfile.query.filter_by(user_id=u.email).delete()
    db.session.delete(u)
    db.session.commit()
    return jsonify({'ok': True})

# ── Companies ──────────────────────────────────────────────────
@app.route('/api/companies', methods=['GET'])
@require_auth
def get_companies():
    return jsonify([c.to_dict() for c in Company.query.order_by(Company.created_date.desc()).all()])

@app.route('/api/companies', methods=['POST'])
@require_admin
def create_company():
    d = request.json
    fields = ['company_name','company_email','company_phone','address','industry_type',
              'contact_person_name','contact_person_position','contact_person_phone','registration_number']
    c = Company(**{k: d[k] for k in fields if k in d})
    db.session.add(c); db.session.commit()
    return jsonify(c.to_dict()), 201

@app.route('/api/companies/<cid>', methods=['PUT'])
@require_admin
def update_company(cid):
    c = Company.query.get_or_404(cid)
    for k, v in request.json.items():
        if hasattr(c, k): setattr(c, k, v)
    db.session.commit(); return jsonify(c.to_dict())

@app.route('/api/companies/<cid>', methods=['DELETE'])
@require_admin
def delete_company(cid):
    db.session.delete(Company.query.get_or_404(cid))
    db.session.commit(); return jsonify({'ok': True})

# ── Opportunities ──────────────────────────────────────────────
@app.route('/api/opportunities', methods=['GET'])
@require_auth
def get_opportunities():
    q = Opportunity.query
    if request.args.get('status'): q = q.filter_by(status=request.args['status'])
    return jsonify([o.to_dict() for o in q.order_by(Opportunity.created_date.desc()).all()])

@app.route('/api/opportunities/<oid>', methods=['GET'])
@require_auth
def get_opportunity(oid):
    return jsonify(Opportunity.query.get_or_404(oid).to_dict())

@app.route('/api/opportunities', methods=['POST'])
@require_admin
def create_opportunity():
    d = request.json
    fields = ['company_id','title','description','requirements','location','work_type','stipend','closing_date','status']
    o = Opportunity(**{k: d[k] for k in fields if k in d})
    db.session.add(o); db.session.commit()
    # Notify ALL students
    comp = Company.query.get(o.company_id)
    comp_name = comp.company_name if comp else 'a company'
    students = User.query.filter_by(role='student').all()
    for student in students:
        db.session.add(Notification(
            user_email=student.email,
            message=f'New opportunity posted: "{o.title}" at {comp_name}. Click to view and apply!',
            type='new_opportunity'
        ))
    db.session.commit()
    return jsonify({**o.to_dict(), 'students_notified': len(students)}), 201

@app.route('/api/opportunities/<oid>', methods=['PUT'])
@require_admin
def update_opportunity(oid):
    o = Opportunity.query.get_or_404(oid)
    for k, v in request.json.items():
        if hasattr(o, k): setattr(o, k, v)
    db.session.commit(); return jsonify(o.to_dict())

@app.route('/api/opportunities/<oid>', methods=['DELETE'])
@require_admin
def delete_opportunity(oid):
    db.session.delete(Opportunity.query.get_or_404(oid))
    db.session.commit(); return jsonify({'ok': True})

# ── Applications ───────────────────────────────────────────────
@app.route('/api/applications', methods=['GET'])
@require_auth
def get_applications():
    u = User.query.filter_by(email=session['user_email']).first()
    q = Application.query if u.role in ('admin', 'coordinator') else Application.query.filter_by(student_email=u.email)
    return jsonify([a.to_dict() for a in q.order_by(Application.created_date.desc()).all()])

@app.route('/api/applications', methods=['POST'])
@require_auth
def create_application():
    d = request.json; email = session['user_email']
    if Application.query.filter_by(student_email=email, opportunity_id=d.get('opportunity_id')).first():
        return jsonify({'error': 'Already applied'}), 409
    a = Application(student_email=email, opportunity_id=d['opportunity_id'], cover_letter=d.get('cover_letter', ''))
    db.session.add(a)
    opp = Opportunity.query.get(d['opportunity_id'])
    db.session.add(Notification(user_email=email,
        message=f'Your application for "{opp.title if opp else "opportunity"}" has been submitted.',
        type='status_change'))
    db.session.commit(); return jsonify(a.to_dict()), 201

@app.route('/api/applications/<aid>', methods=['PUT'])
@require_admin
def update_application(aid):
    a = Application.query.get_or_404(aid)
    old = a.status
    for k, v in request.json.items():
        if hasattr(a, k): setattr(a, k, v)
    if 'status' in request.json and not request.json.get('reviewed_at'):
        a.reviewed_at = now_iso()
    if request.json.get('status') and request.json['status'] != old:
        db.session.add(Notification(user_email=a.student_email,
            message=f'Your application status has been updated to "{request.json["status"]}".',
            type='status_change'))
    db.session.commit(); return jsonify(a.to_dict())

# ── Saved Opportunities ────────────────────────────────────────
@app.route('/api/saved-opportunities', methods=['GET'])
@require_auth
def get_saved_opportunities():
    email = session['user_email']
    saved = SavedOpportunity.query.filter_by(user_email=email).order_by(SavedOpportunity.created_date.desc()).all()
    return jsonify([s.to_dict() for s in saved])

@app.route('/api/saved-opportunities', methods=['POST'])
@require_auth
def save_opportunity():
    email = session['user_email']
    opp_id = request.json.get('opportunity_id')
    if SavedOpportunity.query.filter_by(user_email=email, opportunity_id=opp_id).first():
        return jsonify({'error': 'Already saved'}), 409
    s = SavedOpportunity(user_email=email, opportunity_id=opp_id)
    db.session.add(s); db.session.commit()
    return jsonify(s.to_dict()), 201

@app.route('/api/saved-opportunities/<opp_id>', methods=['DELETE'])
@require_auth
def unsave_opportunity(opp_id):
    email = session['user_email']
    s = SavedOpportunity.query.filter_by(user_email=email, opportunity_id=opp_id).first()
    if not s: return jsonify({'error': 'Not found'}), 404
    db.session.delete(s); db.session.commit()
    return jsonify({'ok': True})

# ── Documents ──────────────────────────────────────────────────
@app.route('/api/documents', methods=['GET'])
@require_auth
def get_documents():
    email = session['user_email']
    target = request.args.get('user_email', email)
    u = User.query.filter_by(email=email).first()
    if target != email and u.role not in ('admin', 'coordinator'):
        return jsonify({'error': 'Forbidden'}), 403
    return jsonify([d.to_dict() for d in Document.query.filter_by(user_email=target).order_by(Document.created_date.desc()).all()])

@app.route('/api/documents', methods=['POST'])
@require_auth
def create_document():
    d = request.json
    doc = Document(user_email=session['user_email'], document_type=d.get('document_type', 'Other'),
                   file_url=d.get('file_url', ''), file_name=d.get('file_name', ''),
                   application_id=d.get('application_id'))
    db.session.add(doc); db.session.commit(); return jsonify(doc.to_dict()), 201

@app.route('/api/documents/<did>', methods=['DELETE'])
@require_auth
def delete_document(did):
    doc = Document.query.get_or_404(did)
    if doc.user_email != session['user_email']:
        u = User.query.filter_by(email=session['user_email']).first()
        if u.role not in ('admin', 'coordinator'): return jsonify({'error': 'Forbidden'}), 403
    db.session.delete(doc); db.session.commit(); return jsonify({'ok': True})

# ── File upload ────────────────────────────────────────────────
@app.route('/api/upload', methods=['POST'])
@require_auth
def upload_file():
    if 'file' not in request.files: return jsonify({'error': 'No file'}), 400
    f = request.files['file']
    name = f"{new_id()}_{secure_filename(f.filename)}"
    f.save(os.path.join(UPLOAD_FOLDER, name))
    return jsonify({'file_url': f'/api/uploads/{name}', 'file_name': f.filename})

@app.route('/api/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ── Notifications ──────────────────────────────────────────────
@app.route('/api/notifications')
@require_auth
def get_notifications():
    return jsonify([n.to_dict() for n in Notification.query.filter_by(
        user_email=session['user_email']).order_by(Notification.created_date.desc()).all()])

@app.route('/api/notifications/<nid>', methods=['PUT'])
@require_auth
def update_notification(nid):
    n = Notification.query.get_or_404(nid)
    if n.user_email != session['user_email']: return jsonify({'error': 'Forbidden'}), 403
    if 'is_read' in request.json: n.is_read = request.json['is_read']
    db.session.commit(); return jsonify(n.to_dict())

@app.route('/api/notifications/mark-all-read', methods=['POST'])
@require_auth
def mark_all_read():
    Notification.query.filter_by(user_email=session['user_email'], is_read=False).update({'is_read': True})
    db.session.commit(); return jsonify({'ok': True})

# ── Stats ──────────────────────────────────────────────────────
@app.route('/api/stats')
@require_admin
def get_stats():
    apps = Application.query.all()
    opps = Opportunity.query.all()
    comps = Company.query.all()
    status_counts = {}
    for a in apps: status_counts[a.status] = status_counts.get(a.status, 0) + 1
    comp_map = {c.id: c for c in comps}
    ind_counts = {}
    for o in opps:
        ind = (comp_map.get(o.company_id) or type('x', (), {'industry_type': 'Other'})()).industry_type or 'Other'
        ind_counts[ind] = ind_counts.get(ind, 0) + 1
    return jsonify({
        'total_applications': len(apps),
        'approved': status_counts.get('approved', 0),
        'pending_review': status_counts.get('submitted', 0) + status_counts.get('pending', 0),
        'total_opportunities': len(opps),
        'open_opportunities': sum(1 for o in opps if o.status == 'open'),
        'total_companies': len(comps),
        'total_students': User.query.filter_by(role='student').count(),
        'status_distribution': status_counts,
        'industry_distribution': ind_counts,
    })

# ── Profile ────────────────────────────────────────────────────
@app.route('/api/profile', methods=['GET'])
@require_auth
def get_profile():
    p = StudentProfile.query.filter_by(user_id=session['user_email']).first()
    return jsonify(p.to_dict() if p else None)

@app.route('/api/profile', methods=['POST', 'PUT'])
@require_auth
def upsert_profile():
    d = request.json
    fields = ['student_number','programme','year_of_study','skills','phone_number',
              'address','emergency_contact_name','emergency_contact_phone']
    p = StudentProfile.query.filter_by(user_id=session['user_email']).first()
    if p:
        for f in fields:
            if f in d: setattr(p, f, d[f])
    else:
        p = StudentProfile(user_id=session['user_email'], **{f: d[f] for f in fields if f in d})
        db.session.add(p)
    db.session.commit(); return jsonify(p.to_dict())

# ── Init ───────────────────────────────────────────────────────
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(role='admin').first():
            db.session.add(User(
                email='admin@wilportal.ac.za',
                full_name='WIL Administrator',
                password_hash=hash_pw('admin123'),
                role='admin'
            ))
            db.session.commit()
            print("✅ Admin created — change the password after first login!")
    app.run(debug=True, port=5000)
