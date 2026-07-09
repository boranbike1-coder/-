import React, { useState } from 'react';
import { User, Lock, Mail, Camera, AlertCircle, CheckCircle, ChevronLeft, Sparkles } from 'lucide-react';
import CameraCapture from './CameraCapture';

interface RegisterViewProps {
  onBackToLogin: () => void;
  onRegisterSuccess: (msg: string) => void;
}

export default function RegisterView({ onBackToLogin, onRegisterSuccess }: RegisterViewProps) {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [studentId, setStudentId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [faceImage, setFaceImage] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleCapture = (base64: string) => {
    setFaceImage(base64);
    setErrorMsg('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName || !email || !password) {
      setErrorMsg('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (role === 'student' && !studentId) {
      setErrorMsg('กรุณากรอกรหัสประจำตัวนักศึกษา');
      return;
    }

    if (role === 'student' && !faceImage) {
      setErrorMsg('กรุณาถ่ายภาพใบหน้าเพื่อเปิดใช้งานการตรวจสอบด้วยใบหน้า (Face Recognition)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          fullName,
          email,
          password,
          studentId: role === 'student' ? studentId : undefined,
          faceImage: faceImage || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'การลงทะเบียนล้มเหลว');
      }

      setSuccessMsg('ลงทะเบียนผู้ใช้งานใหม่เรียบร้อยแล้ว!');
      setTimeout(() => {
        onRegisterSuccess(role === 'student' 
          ? 'ลงทะเบียนสำเร็จ! สามารถเข้าสู่ระบบด้วยรหัสผ่านหรือแสกนใบหน้าได้ทันที'
          : 'ลงทะเบียนอาจารย์สำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่าน'
        );
        onBackToLogin();
      }, 2000);

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-slate-950 px-6 py-5 text-white relative flex items-center justify-between border-b border-slate-800">
        <button
          onClick={onBackToLogin}
          className="flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 font-mono tracking-widest uppercase transition-all bg-slate-900 border border-slate-800 px-3 py-1.5 rounded cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>
        <h2 className="text-sm font-extrabold tracking-wider uppercase font-sans text-white">NEW ACCOUNT</h2>
        <div className="w-16 h-2" /> {/* spacer */}
      </div>

      <div className="p-6">
        <form onSubmit={handleRegister} className="space-y-4">
          {/* User Role Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
              บัญชีผู้ใช้งาน (ACCOUNT TYPE)
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => { setRole('student'); setErrorMsg(''); }}
                className={`py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
                  role === 'student' ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                นักศึกษาใหม่ (STUDENT)
              </button>
              <button
                type="button"
                onClick={() => { setRole('teacher'); setErrorMsg(''); }}
                className={`py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
                  role === 'teacher' ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                อาจารย์ผู้สอน (TEACHER)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left side form fields */}
            <div className="space-y-3">
              {role === 'student' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase font-mono tracking-wider">
                    รหัสนักศึกษา (STUDENT ID) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="เช่น 64010103"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono transition-all"
                      required={role === 'student'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase font-mono tracking-wider">
                  ชื่อ-นามสกุล (FULL NAME) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ภาษาไทย เช่น สมศักดิ์ รักเรียน"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase font-mono tracking-wider">
                  อีเมล (EMAIL) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="เช่น email@university.ac.th"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase font-mono tracking-wider">
                  กำหนดรหัสผ่าน (PASSWORD) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ขั้นต่ำ 6 ตัวอักษร"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Right side webcam captures (only for students) */}
            <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-4">
              {role === 'student' ? (
                <div className="w-full">
                  <label className="block text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1 font-mono tracking-wider uppercase">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    ลงทะเบียนสแกนใบหน้า (BIOMETRIC) *
                  </label>
                  <CameraCapture onCapture={handleCapture} buttonText="ถ่ายรูปใบหน้า" />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-950 rounded-lg border border-slate-800">
                  <Sparkles className="w-10 h-10 text-cyan-400 mb-2 animate-bounce" />
                  <p className="font-bold text-xs text-white mb-1 uppercase font-mono tracking-wider">อาจารย์ผู้สอน (TEACHER)</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    ระบบบัญชีสำหรับอาจารย์จะใช้การยืนยันสิทธิ์ด้วยชื่ออีเมลผู้ใช้งานและรหัสผ่านเพื่อล็อกอินเข้าระบบ ซิงก์ชีตแบบเรียลไทม์
                  </p>
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="flex gap-2.5 p-3 bg-rose-950/20 text-rose-300 border border-rose-900/40 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="flex gap-2.5 p-3 bg-cyan-950/20 text-cyan-300 border border-cyan-900/40 rounded-lg text-xs">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400" />
              <p className="font-medium">{successMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider shadow-md shadow-cyan-500/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>ยืนยันข้อมูลและลงทะเบียน (SUBMIT)</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
