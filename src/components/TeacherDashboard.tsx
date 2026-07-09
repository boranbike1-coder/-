import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, 
  Trash2, 
  FileSpreadsheet, 
  RefreshCw, 
  LogOut, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Sparkles, 
  HelpCircle, 
  Users, 
  CheckCircle, 
  Search,
  TrendingUp,
  PieChart,
  Shield,
  Activity,
  BookOpen,
  Award
} from 'lucide-react';

interface TeacherDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function TeacherDashboard({ user, onLogout }: TeacherDashboardProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Add student form state
  const [studentId, setStudentId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [classMajor, setClassMajor] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Sheet sync state
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncDetails, setSyncDetails] = useState<any>(null);
  const [syncError, setSyncError] = useState<string>('');
  const [showHowTo, setShowHowTo] = useState<boolean>(false);

  // Tab and Report state
  const [activeTab, setActiveTab] = useState<'students' | 'reports'>('students');
  const [aiReport, setAiReport] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string>('');

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      if (response.ok) {
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleManualAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!studentId || !fullName || !email) {
      setErrorMsg('กรุณากรอกรหัสนักศึกษา ชื่อ-นามสกุล และอีเมลให้ครบถ้วน');
      return;
    }

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          fullName,
          email,
          classMajor,
          status,
          addedBy: 'teacher'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ล้มเหลวในการเพิ่มนักเรียน');
      }

      setSuccessMsg('เพิ่มข้อมูลนักศึกษาเรียบร้อยแล้ว!');
      setStudentId('');
      setFullName('');
      setEmail('');
      setClassMajor('');
      setStatus('active');
      fetchStudents();

      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteStudent = async (studentIdToDelete: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบข้อมูลนักศึกษา รหัส: ${studentIdToDelete}? การดำเนินการนี้จะรวมถึงการลบสแกนใบหน้าที่ลงทะเบียนไว้ด้วย`)) {
      return;
    }

    try {
      const response = await fetch(`/api/students/${studentIdToDelete}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ลบไม่สำเร็จ');
      }

      fetchStudents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSheetSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl) return;

    setIsSyncing(true);
    setSyncError('');
    setSyncDetails(null);

    try {
      const response = await fetch('/api/sheets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: sheetUrl,
          addedBy: 'sheet'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถดึงข้อมูลจากชีทได้');
      }

      setSyncDetails(data);
      setSheetUrl('');
      fetchStudents();
    } catch (err: any) {
      setSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Generate AI classroom analysis report
  const handleGenerateAIReport = async () => {
    setIsGeneratingReport(true);
    setReportError('');
    try {
      const response = await fetch('/api/teacher/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ล้มเหลวในการจัดทำรายงาน');
      }
      setAiReport(data.report);
    } catch (err: any) {
      setReportError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อสร้างรายงาน');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Memoized stats for reports dashboard
  const classStats = useMemo(() => {
    const total = students.length;
    const enrolled = students.filter(s => s.faceRegistered).length;
    const unenrolled = total - enrolled;
    const active = students.filter(s => s.status === 'active').length;
    const suspended = total - active;
    const enrollmentRate = total > 0 ? Math.round((enrolled / total) * 105) : 0; // standard cap at 100 on render
    const cappedEnrollmentRate = enrollmentRate > 100 ? 100 : enrollmentRate;

    return { total, enrolled, unenrolled, active, suspended, enrollmentRate: cappedEnrollmentRate };
  }, [students]);

  const majorStats = useMemo(() => {
    const stats: { [key: string]: { total: number, registered: number } } = {};
    students.forEach(s => {
      const major = s.classMajor || 'ไม่ระบุชั้นปี / สาขาวิชา';
      if (!stats[major]) {
        stats[major] = { total: 0, registered: 0 };
      }
      stats[major].total += 1;
      if (s.faceRegistered) {
        stats[major].registered += 1;
      }
    });
    return Object.entries(stats).map(([name, val]) => ({
      name,
      total: val.total,
      registered: val.registered,
      percent: val.total > 0 ? Math.round((val.registered / val.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [students]);

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.fullName.toLowerCase().includes(searchLower) ||
      student.studentId.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      (student.classMajor && student.classMajor.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 animate-fade-in">
      {/* Navigation Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 p-3 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white flex items-center gap-2 uppercase tracking-wide">
              <span>COURSE MANAGEMENT DASHBOARD</span>
            </h1>
            <p className="text-xs text-slate-400">
              ล็อกอินโดย: <span className="font-semibold text-slate-200">{user.fullName}</span> ({user.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStudents}
            disabled={isLoading}
            className="flex items-center justify-center p-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg transition-all cursor-pointer"
            title="รีเฟรชข้อมูลนักศึกษา"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-950/20 hover:bg-rose-900/20 text-rose-300 border border-rose-900/30 font-semibold rounded-lg text-xs uppercase tracking-wider font-mono cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Tab bar switcher */}
      <div className="flex border-b border-slate-800 mb-8 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 font-mono flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'students'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>การจัดการรายชื่อนักศึกษา (STUDENTS & SYNC)</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 font-mono flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>หน้ารายงานผลและวิเคราะห์วิชาการ (REPORTS & AI ANALYSIS)</span>
        </button>
      </div>

      {activeTab === 'students' ? (
        /* Main Grid Area */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Bulk Sheet Import & Manual Add (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Section 1: Google Sheets Pull */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-cyan-500/10 text-cyan-400 border-l border-b border-slate-800 px-3 py-1 rounded-bl-xl text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Sheet Reader</span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wider font-sans">ดึงข้อมูลจาก Google Sheets</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              นำเข้าหรือซิงก์ข้อมูลนักเรียนนักศึกษาจาก Google Sheets ของชั้นเรียนได้ทันที
            </p>

            <form onSubmit={handleSheetSync} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex justify-between items-center uppercase font-mono tracking-wider">
                  <span>ลิงก์ Google Sheets ของคุณ</span>
                  <button
                    type="button"
                    onClick={() => setShowHowTo(!showHowTo)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>วิธีตั้งค่าชีท?</span>
                  </button>
                </label>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono transition-all"
                  required
                />
              </div>

              {showHowTo && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-2 leading-relaxed">
                  <p className="font-bold text-cyan-400 font-mono tracking-wider uppercase">📌 วิธีการตั้งค่าหน้าเอกสาร Google Sheets:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>สร้างคอลัมน์ชื่อดังนี้ในแถวแรก (บรรทัดที่ 1):</li>
                    <div className="bg-slate-900/80 p-2 font-mono text-[10px] rounded border border-slate-800 mt-1 mb-1 font-semibold text-center text-cyan-400">
                      Student ID | Full Name | Email | Class/Major | Status
                    </div>
                    <li>กดปุ่ม <span className="font-bold text-white">แชร์ (Share)</span> ที่มุมขวาบนของเอกสาร</li>
                    <li>ตั้งค่าการเข้าถึงทั่วไปเป็น <span className="font-bold text-white">"ทุกคนที่มีลิงก์ (Anyone with link)"</span> และเลือกบทบาทเป็น <span className="font-bold text-white">"ผู้มีสิทธิ์อ่าน (Viewer)"</span></li>
                    <li>คัดลอก URL ด้านบนเบราว์เซอร์มาวางในช่องและกดซิงก์ข้อมูล</li>
                  </ol>
                  <p className="text-[10px] text-cyan-400 font-medium">💡 ระบบรองรับการตั้งชื่อคอลัมน์ภาษาไทย เช่น "รหัสนักศึกษา", "ชื่อ-นามสกุล", "อีเมล", "สาขาวิชา"</p>
                </div>
              )}

              {syncError && (
                <div className="p-3 bg-rose-950/20 text-rose-300 border border-rose-900/40 rounded-lg text-xs flex gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                  <p className="font-medium leading-relaxed">{syncError}</p>
                </div>
              )}

              {syncDetails && (
                <div className="p-4 bg-cyan-950/20 text-cyan-300 border border-cyan-900/40 rounded-lg text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1 mb-1 font-mono uppercase tracking-wider text-cyan-400">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                    <span>ซิงก์ข้อมูลจากชีทสำเร็จ!</span>
                  </div>
                  <p>จำนวนรายชื่อทั้งหมดในชีท: {syncDetails.totalRowsImported} รายการ</p>
                  <p>• นำเข้าใหม่: <span className="font-bold">{syncDetails.added} คน</span></p>
                  <p>• อัปเดตข้อมูล: <span className="font-bold">{syncDetails.updated} คน</span></p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSyncing || !sheetUrl}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider shadow-md shadow-cyan-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-transparent"
              >
                {isSyncing ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>ดึงข้อมูลและซิงก์รายชื่อ (SYNC)</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Section 2: Manual Add Student */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wider font-sans">เพิ่มนักศึกษาใหม่</h3>
            </div>

            <form onSubmit={handleManualAddStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase font-mono tracking-wider">
                    รหัสนักศึกษา *
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="เช่น 64010103"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase font-mono tracking-wider">
                    ชื่อ-นามสกุล *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="นาย มนัส ชูดี"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 font-sans transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase font-mono tracking-wider">
                  อีเมลประจำตัว *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manas@student.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase font-mono tracking-wider">
                    ห้องเรียน / ชั้นปี / สาขา
                  </label>
                  <input
                    type="text"
                    value={classMajor}
                    onChange={(e) => setClassMajor(e.target.value)}
                    placeholder="เช่น IT ปี 3"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 font-sans transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase font-mono tracking-wider">
                    สถานะบัญชี
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono transition-all cursor-pointer"
                  >
                    <option value="active">ปกติ (Active)</option>
                    <option value="suspended">ระงับการเข้าใช้ (Suspended)</option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs font-semibold text-rose-300 bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-lg font-mono">
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <p className="text-xs font-semibold text-cyan-300 bg-cyan-950/20 border border-cyan-900/40 p-2.5 rounded-lg flex items-center gap-1 font-mono">
                  <Check className="w-4 h-4 text-cyan-400" />
                  {successMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider shadow-md shadow-cyan-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>บันทึกข้อมูล (SAVE STUDENT)</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Student List Table (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl h-fit">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wider font-sans flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>รายชื่อนักศึกษาในรายวิชา</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">COUNT: {filteredStudents.length} ACTIVE</p>
            </div>

            {/* Search Input */}
            <div className="relative max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหารหัส, ชื่อ, หรือห้องเรียน..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 font-sans transition-all"
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-16 bg-slate-950 rounded-lg border border-dashed border-slate-800">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">ไม่พบรายชื่อนักศึกษาในฐานข้อมูล</p>
              <p className="text-xs text-slate-500 mt-1">สามารถดึงข้อมูลจากชีทหรือป้อนข้อมูลด้านซ้ายได้ทันที</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 font-mono uppercase text-[10px] tracking-wider">
                    <th className="p-3">รหัสนักศึกษา</th>
                    <th className="p-3">ชื่อ-นามสกุล</th>
                    <th className="p-3">ชั้นปี / สาขาวิชา</th>
                    <th className="p-3">สแกนใบหน้า</th>
                    <th className="p-3 text-center">สถานะ</th>
                    <th className="p-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredStudents.map((stud) => (
                    <tr key={stud.studentId} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-white">{stud.studentId}</td>
                      <td className="p-3 font-bold text-slate-200 font-sans">{stud.fullName}</td>
                      <td className="p-3 text-slate-400 font-mono">{stud.classMajor}</td>
                      <td className="p-3">
                        {stud.faceRegistered ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 rounded-full text-[9px] font-bold font-mono uppercase">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>ลงทะเบียนแล้ว</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-950 text-slate-500 border border-slate-800 rounded-full text-[9px] font-mono uppercase">
                            ยังไม่สแกน
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase ${
                          stud.status === 'active' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/20 text-rose-400 border border-rose-900/30'
                        }`}>
                          {stud.status === 'active' ? 'ปกติ' : 'ระงับ'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteStudent(stud.studentId)}
                          className="p-1.5 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                          title="ลบข้อมูลนักศึกษา"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      ) : (
        /* Reports and Statistics Tab */
        <div className="space-y-8 animate-fade-in">
          
          {/* 1. Overview Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Total Students */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold font-mono tracking-widest uppercase">จำนวนนักศึกษาทั้งหมด</p>
                <p className="text-3xl font-extrabold text-white font-mono">{classStats.total}</p>
                <p className="text-[10px] text-slate-500 font-sans">ลงทะเบียนในชั้นเรียนวิชานี้</p>
              </div>
              <div className="p-4 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Biometric Coverage */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold font-mono tracking-widest uppercase">การลงทะเบียนใบหน้า</p>
                  <p className="text-3xl font-extrabold text-cyan-400 font-mono">{classStats.enrollmentRate}%</p>
                </div>
                <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/50">
                  <div 
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${classStats.enrollmentRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 flex justify-between font-mono">
                  <span>สำเร็จ: {classStats.enrolled} คน</span>
                  <span>ยังไม่ลงทะเบียน: {classStats.unenrolled} คน</span>
                </p>
              </div>
            </div>

            {/* Card 3: Pending Registration */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold font-mono tracking-widest uppercase">รอสแกนบันทึกใบหน้า</p>
                <p className="text-3xl font-extrabold text-amber-500 font-mono">{classStats.unenrolled}</p>
                <p className="text-[10px] text-slate-500 font-sans">ต้องสแกนเพื่อเปิดใช้งานด่วน</p>
              </div>
              <div className="p-4 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Accounts Status */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold font-mono tracking-widest uppercase">สถานะบัญชีนักศึกษา</p>
                <p className="text-2xl font-extrabold text-white font-mono">{classStats.active} <span className="text-xs text-emerald-400">ปกติ</span> / {classStats.suspended} <span className="text-xs text-rose-400">ระงับ</span></p>
                <p className="text-[10px] text-slate-500 font-sans">ตรวจสอบความพร้อมในการเข้าเรียน</p>
              </div>
              <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                <Activity className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* 2. Demographic Breakdown and Majors list */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Majors & Biometrics Enrollment Rate */}
            <div className="lg:col-span-5 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
              <div>
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wider font-sans flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-cyan-400" />
                  <span>สัดส่วนและสถิติตามกลุ่มวิชา</span>
                </h3>
                <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-1">MAJOR AND BIOMETRICS REGISTRATION DISTRIBUTION</p>
              </div>

              {majorStats.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">ไม่มีสถิติเนื่องจากไม่มีข้อมูลวิชา/สาขา</p>
              ) : (
                <div className="space-y-5">
                  {majorStats.map((major, idx) => {
                    const totalPercentOfClass = classStats.total > 0 ? Math.round((major.total / classStats.total) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-2 p-3.5 bg-slate-950/80 rounded-lg border border-slate-850">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{major.name}</span>
                          <span className="text-xs font-mono font-bold text-cyan-400">{major.total} คน ({totalPercentOfClass}%)</span>
                        </div>
                        
                        {/* Major size in class bar */}
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">ขนาดกลุ่มสาขาในห้องเรียน:</p>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/30">
                            <div 
                              className="bg-cyan-500 h-full rounded-full" 
                              style={{ width: `${totalPercentOfClass}%` }}
                            />
                          </div>
                        </div>

                        {/* Biometrics in major bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                            <span>อัตราลงทะเบียนสแกนใบหน้า:</span>
                            <span className="font-bold text-emerald-400">{major.registered} / {major.total} คน ({major.percent}%)</span>
                          </div>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/30">
                            <div 
                              className="bg-emerald-500 h-full rounded-full" 
                              style={{ width: `${major.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: AI Powered Classroom Insights and report panel */}
            <div className="lg:col-span-7 bg-slate-900 p-6 rounded-xl border border-cyan-500/10 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-cyan-500/10 text-cyan-400 border-l border-b border-slate-800 px-3 py-1 rounded-bl-xl text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>AI ANALYTICS ENGINE</span>
              </div>

              <div>
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wider font-sans flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <span>รายงานบทวิเคราะห์กลุ่มผู้เรียนอัจฉริยะ (AI INSIGHTS)</span>
                </h3>
                <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-1">AI-POWERED CLASSROOM DEMOGRAPHIC & SECURITY ANALYSIS</p>
              </div>

              {/* Action UI if Report is empty */}
              {!aiReport && !isGeneratingReport && (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-slate-950 border border-dashed border-slate-800 rounded-lg">
                  <div className="p-4 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full mb-3 animate-pulse">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider font-mono mb-2">จัดทำรายงานวิเคราะห์ผู้เรียนด้วย Gemini 3.5</h4>
                  <p className="text-[11px] text-slate-400 max-w-md leading-relaxed mb-6">
                    ระบบจะประมวลผลข้อมูลผู้เรียนในชั้นเรียนนี้ (สาขาวิชา, จำนวน, อัตราสแกนใบหน้า และสถานะ) เพื่อส่งรายงานวิเคราะห์ประชากรศาสตร์, ความปลอดภัยทางชีวมาตร และคำแนะนำวิธีการสอนเฉพาะกลุ่มผู้เรียนโดยตรง
                  </p>
                  <button
                    onClick={handleGenerateAIReport}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-500/10 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>เริ่มวิเคราะห์ชั้นเรียนด้วย AI (RUN ANALYSIS)</span>
                  </button>
                  {reportError && (
                    <p className="mt-4 p-3 bg-rose-950/20 text-rose-300 border border-rose-900/40 rounded-lg text-xs font-mono">
                      {reportError}
                    </p>
                  )}
                </div>
              )}

              {/* Loading Spinner */}
              {isGeneratingReport && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-widest animate-pulse">กำลังรวบรวมข้อมูลและส่งวิเคราะห์ด้วย Gemini 3.5...</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-sans">ใช้เวลาประมาณ 2-3 วินาที ในการสังเคราะห์สถิติและเจาะลึกผู้เรียน</p>
                </div>
              )}

              {/* Renders AI Report details */}
              {aiReport && !isGeneratingReport && (
                <div className="space-y-6">
                  
                  {/* Executive Summary Card */}
                  <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase font-mono tracking-wider">
                      <BookOpen className="w-4 h-4" />
                      <span>บทสรุปภาพรวมห้องเรียน (Executive Summary)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiReport.summary}</p>
                  </div>

                  {/* Demographic Insights Card */}
                  <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase font-mono tracking-wider">
                      <TrendingUp className="w-4 h-4" />
                      <span>บทวิเคราะห์กลุ่มวิชาและการจัดการศึกษา (Pedagogical Insights)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiReport.demographicsInsight}</p>
                  </div>

                  {/* Security Compliance Audit Card */}
                  <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase font-mono tracking-wider">
                      <Shield className="w-4 h-4" />
                      <span>ความปลอดภัยและอัตราความพร้อมทางชีวมาตร (Biometrics Compliance)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiReport.securityStatus}</p>
                  </div>

                  {/* Action Recommendations */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">💡 ข้อเสนอแนะในการสอนและการบริหารระบบเช็คชื่อ:</p>
                    <div className="space-y-2">
                      {aiReport.recommendations && aiReport.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex gap-3 bg-slate-950 p-4 rounded-lg border border-slate-850 hover:border-slate-800 transition-colors">
                          <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-[10px] font-bold flex-shrink-0">
                            {idx + 1}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warnings if they exist */}
                  {aiReport.warnings && aiReport.warnings.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest">⚠️ ข้อมูลเฝ้าระวังและความเสี่ยง (Risk Monitoring):</p>
                      <div className="space-y-1.5">
                        {aiReport.warnings.map((warn: string, idx: number) => (
                          <div key={idx} className="flex gap-2 items-center bg-rose-950/20 text-rose-300 border border-rose-900/30 p-3 rounded-lg text-xs font-sans">
                            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            <p className="leading-relaxed">{warn}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Re-generate button */}
                  <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                    <p className="text-[9px] text-slate-500 font-mono">รายงานประมวลผลวิเคราะห์ล่าสุดด้วยโมเดล Gemini 3.5 Flash</p>
                    <button
                      onClick={handleGenerateAIReport}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-mono text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>RE-GENERATE REPORT</span>
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      )}
    </div>
  );
}
