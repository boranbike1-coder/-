import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, Users, RefreshCw, LogOut, Key, Mail, Check, Sparkles } from 'lucide-react';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Add teacher form state
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const fetchStatsAndTeachers = async () => {
    setIsLoading(true);
    try {
      // Fetch teachers
      const resTeachers = await fetch('/api/teachers');
      const dataTeachers = await resTeachers.json();
      if (resTeachers.ok) {
        setTeachers(dataTeachers.teachers || []);
      }

      // Fetch students for quick statistics
      const resStudents = await fetch('/api/students');
      const dataStudents = await resStudents.json();
      if (resStudents.ok) {
        setStudents(dataStudents.students || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndTeachers();
  }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName || !email || !password) {
      setErrorMsg('กรุณากรอกข้อมูลอาจารย์ให้ครบถ้วน');
      return;
    }

    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถเพิ่มอาจารย์ได้');
      }

      setSuccessMsg('เพิ่มบัญชีอาจารย์เรียบร้อยแล้ว!');
      setFullName('');
      setEmail('');
      setPassword('');
      fetchStatsAndTeachers();

      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteTeacher = async (teacherEmail: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบบัญชีอาจารย์: ${teacherEmail}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/teachers/${encodeURIComponent(teacherEmail)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ลบไม่สำเร็จ');
      }

      fetchStatsAndTeachers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 animate-fade-in">
      {/* Top Bar Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 p-3 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white flex items-center gap-2 uppercase tracking-wide">
              <span>SYSTEM CONTROL CENTRE</span>
              <span className="text-[9px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-widest">Super Admin</span>
            </h1>
            <p className="text-xs text-slate-400">จัดการสิทธิ์ผู้สอนอาจารย์ ตรวจสอบระบบและประสิทธิภาพ</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStatsAndTeachers}
            disabled={isLoading}
            className="flex items-center justify-center p-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg transition-all cursor-pointer"
            title="รีเฟรชข้อมูล"
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

      {/* Statistical Bento Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center gap-4 shadow-lg shadow-slate-950/20">
          <div className="bg-cyan-500 text-slate-950 p-3 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold font-mono tracking-wider uppercase">อาจารย์ในระบบ (TEACHERS)</p>
            <p className="text-2xl font-extrabold text-cyan-400 mt-1 font-sans">{teachers.length} ท่าน</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center gap-4 shadow-lg shadow-slate-950/20">
          <div className="bg-emerald-500 text-slate-950 p-3 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold font-mono tracking-wider uppercase">นักศึกษาในระบบ (STUDENTS)</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1 font-sans">{students.length} คน</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center gap-4 shadow-lg shadow-slate-950/20">
          <div className="bg-amber-500 text-slate-950 p-3 rounded-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold font-mono tracking-wider uppercase">ลงทะเบียนใบหน้าสำเร็จ</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-1 font-sans">
              {students.filter(s => s.faceRegistered).length} คน
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Add Teacher Form (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl h-fit">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-white text-sm uppercase tracking-wider font-sans">สร้างบัญชีอาจารย์</h3>
          </div>

          <form onSubmit={handleAddTeacher} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
                ชื่อ-นามสกุลผู้สอน
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ดร. วีรยุทธ เพียรดี"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
                อีเมลที่เข้าใช้ (Email ID)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="เช่น weera@university.ac.th"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
                กำหนดรหัสผ่านเข้าใช้
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสเข้าใช้ชั่วคราว"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-medium text-rose-300 bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-lg font-mono">
                {errorMsg}
              </p>
            )}

            {successMsg && (
              <p className="text-xs font-medium text-cyan-300 bg-cyan-950/20 border border-cyan-900/40 p-2.5 rounded-lg flex items-center gap-1 font-mono">
                <Check className="w-4 h-4" />
                {successMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider shadow-md shadow-cyan-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>สร้างบัญชีอาจารย์ (CREATE)</span>
            </button>
          </form>
        </div>

        {/* Right: Teachers List Table (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-sm uppercase tracking-wider font-sans flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>รายชื่ออาจารย์ผู้สอนในระบบ</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">COUNT: {teachers.length} ACTIVE</span>
          </div>

          {teachers.length === 0 ? (
            <div className="text-center py-12 bg-slate-950 rounded-lg border border-dashed border-slate-800">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">ยังไม่พบรายชื่ออาจารย์ในระบบ</p>
              <p className="text-xs text-slate-500 mt-1">สามารถสร้างรายชื่อด้วยแบบฟอร์มด้านซ้าย</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 font-mono uppercase text-xs tracking-wider">
                    <th className="p-4 text-[10px]">อาจารย์ผู้สอน</th>
                    <th className="p-4 text-[10px]">อีเมล (Email ID)</th>
                    <th className="p-4 text-[10px]">วันที่ลงทะเบียน</th>
                    <th className="p-4 text-center text-[10px]">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-bold text-white font-sans">{teacher.fullName}</td>
                      <td className="p-4 font-mono text-xs text-slate-400">{teacher.email}</td>
                      <td className="p-4 text-xs text-slate-500 font-mono">
                        {new Date(teacher.registeredAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteTeacher(teacher.email)}
                          className="p-1.5 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                          title="ลบบัญชีผู้สอน"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
