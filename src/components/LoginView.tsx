import React, { useState } from 'react';
import { User, Lock, Camera, AlertCircle, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import CameraCapture from './CameraCapture';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
  onNavigateToRegister: () => void;
}

export default function LoginView({ onLoginSuccess, onNavigateToRegister }: LoginViewProps) {
  const [loginMethod, setLoginMethod] = useState<'password' | 'face'>('password');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [id, setId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [verificationDetails, setVerificationDetails] = useState<any>(null);

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || (role !== 'admin' && !password)) {
      setErrorMsg('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: role === 'admin' ? 'admin' : id,
          password: role === 'admin' ? password : password
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'การเข้าสู่ระบบล้มเหลว');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptureFace = (base64: string) => {
    setCapturedImage(base64);
    setErrorMsg('');
  };

  const handleSubmitFace = async () => {
    if (!id) {
      setErrorMsg(role === 'student' ? 'กรุณากรอกรหัสนักศึกษา' : 'กรุณากรอกอีเมลอาจารย์');
      return;
    }
    if (!capturedImage) {
      setErrorMsg('กรุณาถ่ายภาพใบหน้าเพื่อใช้ในการสแกน');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setVerificationDetails(null);

    try {
      const response = await fetch('/api/auth/login-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          faceImage: capturedImage
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.verification) {
          setVerificationDetails(data.verification);
        }
        throw new Error(data.error || 'การยืนยันใบหน้าไม่ถูกต้อง');
      }

      setVerificationDetails(data.verification);
      
      // Delay slightly for visual satisfaction of green success
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header Visual Decoration */}
      <div className="bg-slate-950 px-6 py-8 text-center text-white relative border-b border-slate-800">
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded text-[9px] font-mono tracking-widest text-cyan-400 uppercase">
          <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>GEMINI 2.0</span>
        </div>
        <h2 className="text-lg font-extrabold tracking-wider uppercase mb-1">SIGN IN PORTAL</h2>
        <p className="text-slate-400 text-xs font-sans">กรุณาเข้าสู่ระบบเพื่อดำเนินการตรวจสอบความปลอดภัย</p>
      </div>

      <div className="p-6">
        {/* Role Toggle Tab */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-lg mb-6 border border-slate-800">
          <button
            onClick={() => { setRole('student'); setErrorMsg(''); }}
            className={`py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
              role === 'student' ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            นักศึกษา
          </button>
          <button
            onClick={() => { setRole('teacher'); setErrorMsg(''); }}
            className={`py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
              role === 'teacher' ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            อาจารย์ผู้สอน
          </button>
          <button
            onClick={() => { setRole('admin'); setErrorMsg(''); }}
            className={`py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
              role === 'admin' ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            ผู้ดูแลระบบ
          </button>
        </div>

        {/* Method selector for non-admins */}
        {role !== 'admin' && (
          <div className="flex justify-center gap-6 mb-6 border-b border-slate-800 pb-4">
            <button
              onClick={() => { setLoginMethod('password'); setErrorMsg(''); }}
              className={`pb-2 text-xs font-bold transition-all relative cursor-pointer ${
                loginMethod === 'password' ? 'text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ใช้รหัสผ่าน (PASSWORD)
              {loginMethod === 'password' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 rounded-full" />
              )}
            </button>
            <button
              onClick={() => { setLoginMethod('face'); setErrorMsg(''); }}
              className={`pb-2 text-xs font-bold flex items-center gap-1.5 transition-all relative cursor-pointer ${
                loginMethod === 'face' ? 'text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              สแกนใบหน้า (BIOMETRIC)
              {loginMethod === 'face' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 rounded-full" />
              )}
            </button>
          </div>
        )}

        {/* Standard Credentials View */}
        {(loginMethod === 'password' || role === 'admin') ? (
          <form onSubmit={handleSubmitPassword} className="space-y-4">
            {role !== 'admin' ? (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
                  {role === 'student' ? 'รหัสนักศึกษา (STUDENT ID)' : 'อีเมลอาจารย์ (TEACHER EMAIL)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder={role === 'student' ? 'เช่น 64010101' : 'เช่น teacher@university.ac.th'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
                  บัญชีผู้ใช้แอดมิน (Admin ID)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value="admin"
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium text-slate-400 font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
                รหัสผ่านเข้าระบบ (PASSWORD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านเพื่อยืนยัน"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex gap-2.5 p-3 bg-rose-950/20 text-rose-300 border border-rose-900/40 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <p className="font-medium">{errorMsg}</p>
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
                <>
                  <span>เข้าสู่ระบบ (LOGIN)</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Face Recognition View */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono tracking-wider">
                {role === 'student' ? 'รหัสนักศึกษา (STUDENT ID)' : 'อีเมลอาจารย์ (TEACHER EMAIL)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder={role === 'student' ? 'กรอกรหัสนักศึกษาเพื่อสแกนใบหน้า' : 'กรอกอีเมลเพื่อสแกนใบหน้า'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="relative">
              <CameraCapture onCapture={handleCaptureFace} guideText="วางใบหน้าตรงหน้าจอและกดถ่ายรูปสแกน" />
              
              {/* AI Loading scan overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-lg overflow-hidden flex flex-col items-center justify-center text-white p-4">
                  <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
                  <div className="w-3/4 h-1 bg-slate-800 rounded-full overflow-hidden mb-3 relative">
                    <div className="absolute top-0 bottom-0 left-0 bg-cyan-400 rounded-full w-1/2 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold font-mono tracking-widest text-cyan-400 animate-pulse uppercase">
                    ANALYZING BIOMETRIC PINPOINTS...
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1 font-mono">POWERED BY GEMINI 2.0 FLASH</p>
                </div>
              )}
            </div>

            {verificationDetails && (
              <div className={`p-4 rounded-lg border text-xs ${
                verificationDetails.isMatch && verificationDetails.confidence >= 0.7
                  ? 'bg-cyan-950/20 border-cyan-900/40 text-cyan-300'
                  : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
              }`}>
                <div className="font-bold mb-1 flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI MATCH DECISION: {verificationDetails.isMatch ? 'PASSED' : 'REJECTED'} ({(verificationDetails.confidence * 100).toFixed(1)}%)</span>
                </div>
                <p className="leading-relaxed text-slate-400 font-sans">{verificationDetails.reason}</p>
              </div>
            )}

            {errorMsg && !verificationDetails && (
              <div className="flex gap-2.5 p-3 bg-rose-950/20 text-rose-300 border border-rose-900/40 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <p className="font-medium">{errorMsg}</p>
              </div>
            )}

            {!isLoading && (
              <button
                type="button"
                onClick={handleSubmitFace}
                disabled={!id || !capturedImage}
                className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 border border-transparent font-bold rounded-lg text-xs uppercase tracking-wider shadow-md shadow-cyan-500/10 transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>ตรวจสอบใบหน้าความปลอดภัย (VERIFY FACE)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Footer actions */}
        {role === 'student' && (
          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>นักศึกษาใหม่ยังไม่มีบัญชีสแกนใบหน้า?</span>{' '}
            <button
              onClick={onNavigateToRegister}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
            >
              ลงทะเบียนใหม่ (REGISTER)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
