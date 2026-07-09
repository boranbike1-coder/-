import React, { useState } from 'react';
import { User, Mail, Camera, Sparkles, CheckCircle, ShieldAlert, LogOut, Check } from 'lucide-react';
import CameraCapture from './CameraCapture';

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
  onUpdateUser: (updatedUser: any) => void;
}

export default function StudentDashboard({ user, onLogout, onUpdateUser }: StudentDashboardProps) {
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [isUpdatingFace, setIsUpdatingFace] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleCapture = (base64: string) => {
    setFaceImage(base64);
    setErrorMsg('');
  };

  const handleSaveFace = async () => {
    if (!faceImage) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/save-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          faceImage
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'บันทึกใบหน้าไม่สำเร็จ');
      }

      setSuccessMsg('ลงทะเบียนสแกนใบหน้าความปลอดภัยเรียบร้อยแล้ว!');
      
      // Update local parent user state
      onUpdateUser({
        ...user,
        faceImage
      });

      setTimeout(() => {
        setIsUpdatingFace(false);
        setFaceImage(null);
        setSuccessMsg('');
      }, 2500);

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 animate-fade-in">
      {/* Container Card */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Banner with user decoration */}
        <div className="bg-slate-950 px-6 py-10 text-white relative border-b border-slate-800">
          <div className="absolute top-4 right-4 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded font-mono text-[9px] uppercase tracking-wider font-bold">
            <Sparkles className="w-4 h-4 text-cyan-400 inline-block mr-1" />
            <span>STUDENT</span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* User Face Registered Icon or Image */}
            <div className="w-24 h-24 rounded-full border-4 border-slate-800 overflow-hidden bg-slate-900 flex items-center justify-center relative shadow-lg shadow-black/40">
              {user.faceImage ? (
                <img
                  src={user.faceImage}
                  alt="Registered Face"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-slate-600" />
              )}

              {user.faceImage && (
                <div className="absolute bottom-1 right-1 bg-cyan-500 text-slate-950 p-1 rounded-full border border-slate-800 shadow">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <div className="text-center md:text-left space-y-1">
              <h1 className="text-xl font-extrabold text-white uppercase tracking-wide">{user.fullName}</h1>
              <p className="text-cyan-400 font-mono text-xs tracking-wider">รหัสประจำตัว (STUDENT ID): {user.id}</p>
              <p className="text-[10px] text-slate-500 font-mono">ลงทะเบียนเมื่อ: {new Date(user.registeredAt).toLocaleDateString('th-TH')}</p>
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Profile fields */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-white text-sm uppercase tracking-wider font-sans border-b border-slate-800 pb-2 mb-4">ข้อมูลบัญชีนักเรียน</h3>
            
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase font-mono tracking-wider">ชื่อ-นามสกุลจริง</p>
                <p className="font-bold text-slate-200">{user.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-400">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase font-mono tracking-wider">อีเมลมหาวิทยาลัย</p>
                <p className="font-semibold text-slate-200 font-mono">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase font-mono tracking-wider">การตรวจสอบสแกนใบหน้า</p>
                {user.faceImage ? (
                  <p className="font-bold text-cyan-400 flex items-center gap-1 text-xs font-mono uppercase tracking-wide">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                    <span>BIOMETRIC OK</span>
                  </p>
                ) : (
                  <p className="font-bold text-amber-500 flex items-center gap-1 text-xs font-mono uppercase tracking-wide animate-pulse">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>NO BIOMETRIC FACE DATA</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-950/20 hover:bg-rose-900/20 text-rose-300 border border-rose-900/30 font-semibold rounded-lg text-xs uppercase tracking-wider font-mono cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>LOGOUT</span>
              </button>
            </div>
          </div>

          {/* Right Column: Face updates camera */}
          <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6">
            {!isUpdatingFace ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-6 bg-slate-950 border border-slate-800 rounded-lg">
                <Camera className="w-10 h-10 text-cyan-400 mb-2 animate-pulse" />
                <h4 className="font-extrabold text-white text-xs mb-1 uppercase tracking-wider font-mono">
                  {user.faceImage ? 'UPDATE BIOMETRIC' : 'REGISTER BIOMETRIC'}
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed mb-4 font-sans">
                  ใช้สำหรับการลงชื่อเข้าใช้งานด่วนด้วยใบหน้าเพื่อความปลอดภัยโดยตรง
                </p>
                <button
                  onClick={() => setIsUpdatingFace(true)}
                  className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer uppercase tracking-wider font-mono"
                >
                  {user.faceImage ? 'RETREAT PHOTO' : 'START SCAN NOW'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-300 text-xs text-center uppercase font-mono tracking-wider">สแกนและบันทึกใบหน้าเพื่อความปลอดภัย</h4>
                <CameraCapture onCapture={handleCapture} buttonText="ถ่ายภาพสแกน" />

                {successMsg && (
                  <p className="p-2.5 bg-cyan-950/20 text-cyan-300 border border-cyan-900/40 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1 font-mono uppercase tracking-wide">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                    {successMsg}
                  </p>
                )}

                {errorMsg && (
                  <p className="p-2.5 bg-rose-950/20 text-rose-300 border border-rose-900/40 rounded-lg text-xs font-semibold text-center font-mono uppercase tracking-wide">
                    {errorMsg}
                  </p>
                )}

                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={handleSaveFace}
                    disabled={!faceImage || isLoading}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-850 disabled:text-slate-600 disabled:border-slate-800 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer font-mono uppercase tracking-wider"
                  >
                    {isLoading ? 'SAVING...' : 'SAVE FACE'}
                  </button>
                  <button
                    onClick={() => { setIsUpdatingFace(false); setFaceImage(null); }}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-lg transition-colors cursor-pointer font-mono text-xs uppercase border border-slate-800"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
