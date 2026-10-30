import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft, ArrowLeft, ArrowRight, BadgeIndianRupee, BookOpenCheck, Building2,
  Check, ChevronDown, CircleAlert, CreditCard, GraduationCap, LayoutDashboard,
  LogOut, RefreshCw, Search, ShieldCheck, UserRound, Users, WalletCards
} from 'lucide-react';
import { api, jsonBody, money, storedCredentials } from './api.js';

const roleHome = (role) => role === 'STUDENT' ? '/student' : role === 'TEACHER' ? '/teacher' : '/principal';
const readUser = () => {
  try { return JSON.parse(sessionStorage.getItem('fms_user') || 'null'); } catch { return null; }
};
const navigateWorkspace = (label) => window.dispatchEvent(new CustomEvent('paymyfee:navigate', { detail: label }));

function App() {
  const [user, setUser] = useState(readUser);
  const navigate = useNavigate();
  const location = useLocation();

  function signOut() {
    sessionStorage.clear();
    setUser(null);
    navigate('/login', { replace: true });
  }

  async function signIn(username, password) {
    const credentials = btoa(`${username}:${password}`);
    const data = await api('/api/auth/login', {
      headers: { Authorization: `Basic ${credentials}` }
    });
    sessionStorage.setItem('fms_credentials', credentials);
    sessionStorage.setItem('fms_role', data.role || 'ADMIN');
    sessionStorage.setItem('fms_roles', JSON.stringify(data.roles || []));
    sessionStorage.setItem('fms_email', data.username || username);
    sessionStorage.setItem('fms_displayName', data.displayName || data.username || username);
    sessionStorage.setItem('fms_user', JSON.stringify(data));
    setUser(data);
    navigate(roleHome(data.role), { replace: true });
  }

  useEffect(() => {
    if (user && location.pathname === '/login') navigate(roleHome(user.role), { replace: true });
  }, [location.pathname, navigate, user]);

  return (
    <Routes>
      <Route path="/login" element={<Login onSignIn={signIn} />} />
      <Route path="/" element={<Navigate to={user ? roleHome(user.role) : '/login'} replace />} />
      <Route path="/student" element={<Guard user={user} role="STUDENT"><Shell user={user} onSignOut={signOut}><StudentPortal /></Shell></Guard>} />
      <Route path="/teacher" element={<Guard user={user} role="TEACHER"><Shell user={user} onSignOut={signOut}><TeacherPortal /></Shell></Guard>} />
      <Route path="/principal" element={<Guard user={user} role="ADMIN"><Shell user={user} onSignOut={signOut}><PrincipalPortal /></Shell></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Guard({ user, role, children }) {
  if (!storedCredentials() || !user) return <Navigate to="/login" replace />;
  if (role && user.role !== role && !(role === 'ADMIN' && user.role === 'ADMIN')) return <Navigate to={roleHome(user.role)} replace />;
  return children;
}

function Shell({ user, onSignOut, children }) {
  const role = user.role || 'ADMIN';
  const nav = role === 'STUDENT'
    ? [{ label: 'My account', icon: UserRound }]
    : role === 'TEACHER'
      ? [{ label: 'My cohort', icon: Users }, { label: 'Student roster', icon: GraduationCap }]
      : [{ label: 'Overview', icon: LayoutDashboard }, { label: 'Students', icon: GraduationCap }, { label: 'Mentor roster', icon: Users }, { label: 'Fee ledger', icon: WalletCards }, { label: 'Faculty', icon: BookOpenCheck }, { label: 'Transactions', icon: CreditCard }];
  const [active, setActive] = useState(nav[0]?.label || 'Overview');
  useEffect(() => {
    const handleNavigation = (event) => setActive(event.detail);
    window.addEventListener('paymyfee:navigate', handleNavigation);
    return () => window.removeEventListener('paymyfee:navigate', handleNavigation);
  }, []);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to={roleHome(role)}><span className="brand-mark"><BadgeIndianRupee size={21} /></span><span>PayMyFee<small>INSTITUTIONAL FINANCE</small></span></Link>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {nav.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'side-link active' : 'side-link'} onClick={() => { navigateWorkspace(label); const target = label === 'Student roster' ? 'student-enrollment' : label.replaceAll(' ', '-').toLowerCase(); window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })); }}><Icon size={17} />{label}</button>)}
        </nav>
        <div className="sidebar-bottom"><div className="secure-note"><ShieldCheck size={16} /><span>Protected workspace</span></div><div className="profile-chip"><span className="avatar">{(user.displayName || 'U').slice(0, 1).toUpperCase()}</span><span className="profile-info"><strong>{user.displayName || user.username}</strong><small>{role === 'ADMIN' ? 'Administrator' : role.toLowerCase()}</small></span><button aria-label="Sign out" title="Sign out" onClick={onSignOut}><LogOut size={17} /></button></div></div>
      </aside>
      <main className="main-area"><header className="topbar"><div><span className="crumb">PAYMYFEE /</span><strong>{role === 'ADMIN' ? 'ADMINISTRATION' : `${role} PORTAL`}</strong></div><span className="system-status"><i />Service connected</span></header><div className="page-content">{children}</div></main>
    </div>
  );
}

function Login({ onSignIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await onSignIn(username.trim(), password); } catch (problem) { setError(problem.message || 'Could not connect to the backend.'); } finally { setBusy(false); }
  }
  return <main className="login-screen"><div className="login-visual"><div className="login-brand"><BadgeIndianRupee /> PAYMYFEE</div><div className="visual-copy"><span className="eyebrow">CAMPUS FINANCE, IN ORDER</span><h1>Every account.<br /><em>One clear view.</em></h1><p>A focused workspace for fee balances, mentor cohorts, and verified payments.</p></div><div className="visual-foot"><span>STUDENT SERVICES</span><span>FACULTY OVERSIGHT</span><span>ADMINISTRATION</span></div></div><section className="login-panel"><div className="login-box"><span className="eyebrow">SECURE PORTAL</span><h2>Welcome back</h2><p>Sign in with your institutional account.</p><form onSubmit={submit}><label>Username or email<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <div className="notice error"><CircleAlert size={16} />{error}</div>}<button className="button primary full" disabled={busy}>{busy ? 'Connecting...' : <>Continue <ArrowRight size={17} /></>}</button></form><div className="login-foot"><ShieldCheck size={15} />Your access is governed by your account role.</div></div></section></main>;
}

function PageHeading({ eyebrow, title, detail, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{detail}</p></div>{action}</div>;
}

function Metric({ label, value, note, icon: Icon, tone = 'green' }) {
  return <article className="metric"><div className={`metric-icon ${tone}`}><Icon size={18} /></div><span className="metric-label">{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function LoadState({ error, retry }) {
  if (!error) return null;
  return <div className="notice error"><CircleAlert size={16} /><span>{error}</span>{retry && <button className="text-button" onClick={retry}>Retry</button>}</div>;
}

function Empty({ children = 'No records to display.' }) { return <div className="empty-state"><span><ArrowDownLeft size={18} /></span>{children}</div>; }

function StudentPortal() {
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    setError('');
    try { const [student, history] = await Promise.all([api('/student/me'), api('/student/me/payments')]); setProfile(student); setPayments(history || []); }
    catch (problem) { setError(problem.message); }
  }
  useEffect(() => { load(); }, []);
  async function pay(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { const receipt = await api('/student/me/pay', { method: 'POST', body: jsonBody({ amount: Number(amount) }) }); setNotice(`Payment recorded${receipt?.feepaymentId ? ` as receipt #${receipt.feepaymentId}` : ''}.`); setAmount(''); await load(); }
    catch (problem) { setError(problem.message); }
    finally { setBusy(false); }
  }
  const balance = Number(profile?.feebalance || 0);
  return <div id="my-account"><PageHeading eyebrow="STUDENT SERVICES" title={`Good day, ${profile?.studentname?.split(' ')[0] || 'student'}`} detail="Your account balance, mentor details, and payment history." action={<button className="button outline" onClick={load}><RefreshCw size={15} />Refresh</button>} /><LoadState error={error} retry={load} />
    <div className="student-overview"><section className="balance-panel"><span className="eyebrow">CURRENT AMOUNT DUE</span><strong>{money(balance)}</strong><span className={balance === 0 ? 'status-pill paid' : 'status-pill due'}>{balance === 0 ? 'Account settled' : 'Payment outstanding'}</span><div className="balance-rule" /><span className="balance-caption">Updated from your student account</span></section><section className="panel profile-panel"><div className="section-heading"><div><span className="eyebrow">YOUR ACCOUNT</span><h2>Student profile</h2></div><span className="profile-id">#{profile?.studentid ?? '---'}</span></div><Info label="Full name" value={profile?.studentname} /><Info label="Email" value={profile?.email} /><Info label="Parent / guardian" value={profile?.fathername} /><Info label="Assigned mentor" value={profile?.teacherName || 'Not assigned'} /></section></div>
    <div className="student-lower"><section className="panel payment-panel"><div className="section-heading"><div><span className="eyebrow">PAYMENT</span><h2>Make a payment</h2></div><CreditCard size={19} /></div><form onSubmit={pay}><label>Amount to pay<input type="number" min="0.01" max={balance || undefined} step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" required /></label><div className="quick-row"><button type="button" className="quick-link" onClick={() => setAmount(String(Math.min(balance, 1000)))}>₹1,000</button><button type="button" className="quick-link" onClick={() => setAmount(String(Math.min(balance, 5000)))}>₹5,000</button><button type="button" className="quick-link" onClick={() => setAmount(String(balance))}>Pay full balance</button></div>{notice && <div className="notice success"><Check size={16} />{notice}</div>}<button className="button primary" disabled={busy || balance <= 0}>{busy ? 'Processing...' : <>Submit payment <ArrowRight size={16} /></>}</button></form></section><section className="panel history-panel"><div className="section-heading"><div><span className="eyebrow">ACTIVITY</span><h2>Recent payments</h2></div><span className="count-label">{payments.length} records</span></div>{payments.length ? <div className="table-wrap"><table><thead><tr><th>Receipt</th><th>Date</th><th>Mentor</th><th className="numeric">Amount</th></tr></thead><tbody>{payments.map((item, index) => <tr key={item.paymentId || index}><td className="mono">#{item.paymentId}</td><td>{item.date || '—'} {item.time?.slice(0, 5)}</td><td>{item.teacherName || '—'}</td><td className="numeric">{money(item.amount)}</td></tr>)}</tbody></table></div> : <Empty>No payment receipts yet.</Empty>}</section></div>
  </div>;
}

function TeacherPortal() {
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('cohort');
  async function load() {
    setError('');
    try { const [me, cohort, roster] = await Promise.all([api('/teachers/me'), api('/teachers/my-students'), api('/student/all')]); setTeacher(me); setStudents(cohort || []); setAllStudents(roster || []); }
    catch (problem) { setError(problem.message); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const sectionByLabel = { 'My cohort': 'cohort', 'Student roster': 'roster' };
    const handleNavigation = (event) => {
      if (sectionByLabel[event.detail]) setTab(sectionByLabel[event.detail]);
    };
    window.addEventListener('paymyfee:navigate', handleNavigation);
    return () => window.removeEventListener('paymyfee:navigate', handleNavigation);
  }, []);
  async function updateFee(student, value) {
    try { await api(`/teacherupdate/student/${student.studentid}/fee`, { method: 'POST', body: jsonBody({ studentid: student.studentid, studentname: student.studentname, email: student.email, feebalance: Number(value) }) }); setNotice(`Balance updated for ${student.studentname}.`); await load(); }
    catch (problem) { setError(problem.message); }
  }
  const shown = (tab === 'cohort' ? students : allStudents).filter(s => `${s.studentname} ${s.email} ${s.studentid}`.toLowerCase().includes(query.toLowerCase()));
  async function onStudentCreated() {
    setNotice('Student registered and added to your cohort.');
    setTab('roster');
    navigateWorkspace('Student roster');
    await load();
  }
  return <div id="my-cohort"><PageHeading eyebrow="FACULTY WORKSPACE" title={`Hello, ${teacher?.teachername?.split(' ')[0] || 'faculty'}`} detail="Manage your student roster, assigned cohort, and fee balances." action={<button className="button outline" onClick={load}><RefreshCw size={15} />Refresh</button>} /><LoadState error={error} retry={load} />{notice && <div className="notice success"><Check size={16} />{notice}</div>}<div className="metrics-row"><Metric label="Assigned students" value={students.length} note="Your mentor cohort" icon={Users} /><Metric label="Cohort outstanding" value={money(students.reduce((sum, item) => sum + Number(item.feebalance || 0), 0))} note="Across assigned students" icon={WalletCards} tone="amber" /><Metric label="Faculty ID" value={teacher?.teacherid ? `#${teacher.teacherid}` : '—'} note={teacher?.email || 'Account profile'} icon={UserRound} tone="ink" /></div>{tab === 'roster' && <section id="student-enrollment" className="panel data-panel"><div className="section-heading"><div><span className="eyebrow">NEW ENROLMENT</span><h2>Add a student to your cohort</h2></div><span className="count-label">Initial fee required</span></div><StudentEnrollmentForm endpoint="/teachers/addstudent" assignedToTeacher onCreated={onStudentCreated} /></section>}<section id="student-roster" className="panel data-panel"><div className="section-heading"><div><span className="eyebrow">STUDENT RECORDS</span><h2>{tab === 'cohort' ? 'My assigned cohort' : 'Institution roster'}</h2></div><div className="panel-tools"><div className="search-field"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search student" /></div><button className="select-button" onClick={() => { const next = tab === 'cohort' ? 'roster' : 'cohort'; setTab(next); navigateWorkspace(next === 'cohort' ? 'My cohort' : 'Student roster'); }}>{tab === 'cohort' ? 'All students' : 'My cohort'}<ChevronDown size={14} /></button></div></div><StudentTable students={shown} canEdit onUpdate={updateFee} /></section></div>;
}

function StudentTable({ students, canEdit = false, onUpdate }) {
  return students.length ? <div className="table-wrap"><table><thead><tr><th>Student</th><th>Guardian</th><th>Email</th><th>Mentor</th><th className="numeric">Balance</th>{canEdit && <th>Action</th>}</tr></thead><tbody>{students.map((student, index) => <tr key={student.studentid || index}><td><strong>{student.studentname || student.studentName || '—'}</strong><small className="cell-sub">ID #{student.studentid || student.studentId}</small></td><td>{student.fathername || student.fatherName || '—'}</td><td>{student.email || student.studentEmail || '—'}</td><td>{student.teacherName || '—'}</td><td className="numeric">{money(student.feebalance ?? student.feeBalance)}</td>{canEdit && <td><FeeEditor student={student} onUpdate={onUpdate} /></td>}</tr>)}</tbody></table></div> : <Empty>No matching students found.</Empty>;
}

function FeeEditor({ student, onUpdate }) {
  const [value, setValue] = useState(String(student.feebalance || 0));
  return <form className="inline-edit" onSubmit={event => { event.preventDefault(); onUpdate(student, value); }}><input aria-label="New fee balance" type="number" min="0" step="0.01" value={value} onChange={event => setValue(event.target.value)} /><button className="icon-button" title="Save balance" aria-label="Save balance"><Check size={15} /></button></form>;
}

function StudentEnrollmentForm({ endpoint, teachers = [], assignedToTeacher = false, onCreated }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const student = {
      studentname: data.studentname,
      fathername: data.fathername,
      email: data.email,
      birthdate: data.birthdate,
      feebalance: Number(data.feebalance)
    };
    if (!assignedToTeacher) student.teacherId = Number(data.teacherId) || null;

    setError('');
    setBusy(true);
    try {
      await api(endpoint, { method: 'POST', body: jsonBody(student) });
      form.reset();
      await onCreated();
    } catch (problem) {
      setError(problem.message || 'Could not register the student.');
    } finally {
      setBusy(false);
    }
  }

  return <form className="add-student-form" onSubmit={submit}>
    <label>Student name<input name="studentname" autoComplete="name" required /></label>
    <label>Parent / guardian<input name="fathername" required /></label>
    <label>Email<input type="email" name="email" autoComplete="email" required /></label>
    <label>Date of birth<input type="date" name="birthdate" required /></label>
    <label>Initial fee due<input type="number" name="feebalance" min="0.01" step="0.01" required /></label>
    {!assignedToTeacher && <label>Assign mentor<select name="teacherId" defaultValue=""><option value="">Unassigned</option>{teachers.map(teacher => <option key={teacher.teacherid} value={teacher.teacherid}>{teacher.teachername}</option>)}</select></label>}
    {assignedToTeacher && <p className="form-hint">The student will be assigned to your mentor cohort. Their sign-in password will be generated from their date of birth.</p>}
    {error && <div className="notice error"><CircleAlert size={16} />{error}</div>}
    <button className="button primary" disabled={busy}>{busy ? 'Registering...' : <>Register student <ArrowRight size={16} /></>}</button>
  </form>;
}

function PrincipalPortal() {
  const [stats, setStats] = useState({});
  const [relationships, setRelationships] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [unassigned, setUnassigned] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    setError('');
    const paths = ['/api/principal/stats', '/api/principal/relationships', '/student/all', '/teachers/all', '/api/principal/faculty-workload', '/api/principal/recent-transactions'];
    const results = await Promise.allSettled(paths.map(path => api(path)));
    if (results[0].status === 'fulfilled') setStats(results[0].value || {});
    if (results[1].status === 'fulfilled') setRelationships(results[1].value || []);
    if (results[2].status === 'fulfilled') setStudents(results[2].value || []);
    if (results[3].status === 'fulfilled') setTeachers(results[3].value || []);
    if (results[4].status === 'fulfilled') setWorkload(results[4].value || []);
    if (results[5].status === 'fulfilled') setTransactions(results[5].value || []);
    const failure = results.find(item => item.status === 'rejected');
    if (failure) setError(failure.reason.message);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const sectionByLabel = { Overview: 'overview', Students: 'students', 'Mentor roster': 'mentors', 'Fee ledger': 'fees', Faculty: 'faculty', Transactions: 'transactions' };
    const handleNavigation = (event) => {
      if (sectionByLabel[event.detail]) setTab(sectionByLabel[event.detail]);
    };
    window.addEventListener('paymyfee:navigate', handleNavigation);
    return () => window.removeEventListener('paymyfee:navigate', handleNavigation);
  }, []);
  async function assign(studentId, teacherId) {
    try { await api('/api/principal/assign-mentor', { method: 'PUT', body: jsonBody({ studentId, teacherId: Number(teacherId) || 0 }) }); setNotice(`Mentor assignment saved for student #${studentId}.`); await load(); }
    catch (problem) { setError(problem.message); }
  }
  async function saveFee(student, value) {
    try { await api(`/api/principal/student/${student.studentid}/fee`, { method: 'POST', body: jsonBody({ feebalance: Number(value) }) }); setNotice(`Balance updated for ${student.studentname}.`); await load(); }
    catch (problem) { setError(problem.message); }
  }
  async function addTeacher(event) {
    event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    try { await api('/teachers/addteacher', { method: 'POST', body: jsonBody({ teachername: data.teachername, email: data.email, phone: data.phone, birthdate: data.birthdate }) }); setNotice('Faculty member registered.'); form.reset(); await load(); }
    catch (problem) { setError(problem.message); }
  }
  async function deleteTeacher(id) {
    if (!window.confirm(`Remove faculty member #${id}?`)) return;
    try { await api(`/teachers/deleteteacher/${id}`, { method: 'DELETE' }); setNotice(`Faculty member #${id} removed.`); await load(); }
    catch (problem) { setError(problem.message); }
  }
  async function onStudentCreated() {
    setNotice('Student enrolled with the initial fee balance.');
    await load();
  }
  const filteredRelationships = relationships.filter(item => (!unassigned || !item.isAssigned) && `${item.studentName} ${item.teacherName} ${item.studentId}`.toLowerCase().includes(query.toLowerCase()));
  const filteredStudents = students.filter(item => `${item.studentname} ${item.studentid} ${item.email}`.toLowerCase().includes(query.toLowerCase()));
  const tabs = [['overview', 'Overview'], ['students', 'Students'], ['mentors', 'Mentor roster'], ['fees', 'Fee ledger'], ['faculty', 'Faculty'], ['transactions', 'Transactions']];
  return <div id="overview"><PageHeading eyebrow="ADMINISTRATION" title="Institution overview" detail="Fee collection, student relationships, and faculty operations." action={<button className="button outline" onClick={load}><RefreshCw size={15} />Refresh</button>} /><LoadState error={error} retry={load} />{notice && <div className="notice success"><Check size={16} />{notice}<button className="notice-close" onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}<div className="metrics-row four"><Metric label="Enrolled students" value={stats.totalStudents ?? '—'} note={`${stats.assignedStudentsCount ?? 0} assigned to a mentor`} icon={GraduationCap} /><Metric label="Faculty mentors" value={stats.totalTeachers ?? '—'} note="Active faculty accounts" icon={Users} tone="green" /><Metric label="Fees collected" value={money(stats.totalFeesCollected)} note={`${stats.totalTransactions ?? 0} transactions`} icon={BadgeIndianRupee} tone="amber" /><Metric label="Outstanding" value={money(stats.totalOutstandingFees)} note={`${stats.recoveryRate ?? 0}% recovery`} icon={WalletCards} tone="ink" /></div><div className="recovery-line"><div><span className="eyebrow">CAMPUS RECOVERY</span><strong>{stats.recoveryRate ?? 0}%</strong></div><div className="progress-track"><span style={{ width: `${Math.min(Number(stats.recoveryRate) || 0, 100)}%` }} /></div><span>{money(stats.totalFeesCollected)} collected of {money(stats.totalBilled)} billed</span></div><div className="tabs" role="tablist">{tabs.map(([id, label]) => <button key={id} className={tab === id ? 'tab active' : 'tab'} onClick={() => { setTab(id); setQuery(''); navigateWorkspace(label); }}>{label}</button>)}</div>
    {tab === 'overview' && <section className="panel data-panel"><div className="section-heading"><div><span className="eyebrow">LATEST ACTIVITY</span><h2>Recent transactions</h2></div><span className="count-label">Last 5 records</span></div><TransactionTable records={transactions} /></section>}
    {tab === 'students' && <><section id="students" className="panel data-panel"><div className="section-heading"><div><span className="eyebrow">NEW ENROLMENT</span><h2>Register a student</h2></div><span className="count-label">Initial fee required</span></div><StudentEnrollmentForm endpoint="/student/addstudent" teachers={teachers} onCreated={onStudentCreated} /></section><section className="panel data-panel"><div className="section-heading"><div><span className="eyebrow">STUDENT RECORDS</span><h2>Institution directory</h2></div><SearchFilter value={query} onChange={setQuery} /></div><StudentTable students={filteredStudents} /></section></>}
    {tab === 'mentors' && <section id="mentor-roster" className="panel data-panel"><div className="section-heading"><div><span className="eyebrow">STUDENT-TEACHER LINKS</span><h2>Mentor roster</h2></div><div className="panel-tools"><SearchFilter value={query} onChange={setQuery} /><button className={unassigned ? 'select-button active' : 'select-button'} onClick={() => setUnassigned(!unassigned)}>Unassigned only</button></div></div>{filteredRelationships.length ? <div className="table-wrap"><table><thead><tr><th>Student</th><th>Email</th><th>Balance</th><th>Current mentor</th><th>Assign mentor</th></tr></thead><tbody>{filteredRelationships.map(row => <tr key={row.studentId}><td><strong>{row.studentName}</strong><small className="cell-sub">ID #{row.studentId}</small></td><td>{row.studentEmail}</td><td>{money(row.feeBalance)}</td><td>{row.teacherName || 'Unassigned'}</td><td><select className="table-select" defaultValue={row.teacherId || ''} onChange={event => assign(row.studentId, event.target.value)}><option value="">Unassigned</option>{teachers.map(teacher => <option key={teacher.teacherid} value={teacher.teacherid}>{teacher.teachername}</option>)}</select></td></tr>)}</tbody></table></div> : <Empty>No student relationships match.</Empty>}</section>}
    {tab === 'fees' && <section id="fee-ledger" className="panel data-panel"><div className="section-heading"><div><span className="eyebrow">ACCOUNT BALANCES</span><h2>Fee ledger</h2></div><SearchFilter value={query} onChange={setQuery} /></div><StudentTable students={filteredStudents} canEdit onUpdate={saveFee} /></section>}
    {tab === 'faculty' && <section id="faculty" className="panel data-panel"><div className="section-heading"><div><span className="eyebrow">STAFF MANAGEMENT</span><h2>Faculty workload</h2></div><span className="count-label">{workload.length} faculty</span></div><div className="table-wrap"><table><thead><tr><th>Faculty</th><th>Contact</th><th>Mentees</th><th className="numeric">Cohort due</th><th /></tr></thead><tbody>{workload.map(teacher => <tr key={teacher.teacherId}><td><strong>{teacher.teacherName}</strong><small className="cell-sub">ID #{teacher.teacherId}</small></td><td>{teacher.email}<small className="cell-sub">{teacher.phone}</small></td><td>{teacher.menteeCount}</td><td className="numeric">{money(teacher.cohortTotalFeePending)}</td><td><button className="text-button danger" onClick={() => deleteTeacher(teacher.teacherId)}>Remove</button></td></tr>)}</tbody></table></div><form className="add-faculty" onSubmit={addTeacher}><div><span className="eyebrow">NEW ACCOUNT</span><h3>Register faculty</h3></div><label>Name<input name="teachername" required /></label><label>Email<input type="email" name="email" required /></label><label>Phone<input type="tel" name="phone" autoComplete="tel" required /></label><label>Date of birth<input type="date" name="birthdate" required /></label><button className="button primary">Add faculty <ArrowRight size={15} /></button></form></section>}
    {tab === 'transactions' && <section id="transactions" className="panel data-panel"><div className="section-heading"><div><span className="eyebrow">FINANCIAL AUDIT</span><h2>Recent transactions</h2></div><span className="count-label">Latest 5</span></div><TransactionTable records={transactions} /></section>}
  </div>;
}

function SearchFilter({ value, onChange }) { return <div className="search-field"><Search size={15} /><input value={value} onChange={event => onChange(event.target.value)} placeholder="Search records" /></div>; }
function TransactionTable({ records }) {
  return records?.length ? <div className="table-wrap"><table><thead><tr><th>Receipt</th><th>Student</th><th>Mentor</th><th>Date</th><th className="numeric">Amount</th></tr></thead><tbody>{records.map((item, index) => <tr key={item.paymentId || index}><td className="mono">#{item.paymentId}</td><td>{item.studentName}<small className="cell-sub">ID #{item.studentId}</small></td><td>{item.teacherName || '—'}</td><td>{item.date} {item.time?.slice(0, 5)}</td><td className="numeric">{money(item.amount)}</td></tr>)}</tbody></table></div> : <Empty>No transactions recorded.</Empty>;
}
function Info({ label, value }) { return <div className="info-line"><span>{label}</span><strong>{value || '—'}</strong></div>; }

export default App;
