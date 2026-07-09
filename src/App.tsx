import React, { useState, useEffect } from 'react';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { Camera, Sparkles, CheckCircle, Shield, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [appStatus, setAppStatus] = useState<string>('connecting');
  const [toastMsg, setToastMsg] = useState<string>('');

  // Validate server health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setAppStatus('online');
        } else {
          setAppStatus('offline');
        }
      } catch (error) {
        console.error('Connection to backend failed:', error);
        setAppStatus('offline');
      }
    };
    checkHealth();
  }, []);

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    showToast(`ยินดีต้อนรับคุณ ${loggedInUser.fullName}! เข้าสู่ระบบสำเร็จ`);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between font-sans antialiased text-slate-200 selection:bg-cyan-500 selection:text-slate-900">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-lg shadow-cyan-500/10 flex items-center gap-2.5 border border-slate-700 animate-slide-in text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-mono tracking-wide">{toastMsg}</span>
        </div>
      )}

      {/* Global Header Banner (Geometric Balance style) */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 md:px-8 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
            <Camera className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white uppercase">
              EDUGATE BIOMETRIC PORTAL
            </h1>
            <p className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase">
              SECURE FACIAL RECOGNITION & SHEETS SYNC
            </p>
          </div>
        </div>

        {/* Server Status Header */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-widest">
              SYSTEM ONLINE
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              appStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`} />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              {appStatus === 'online' ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-grow flex items-center justify-center p-4 py-8 md:p-8 max-w-7xl mx-auto w-full">
        {user ? (
          /* Authenticated Dashboards */
          <div className="w-full animate-fade-in">
            {user.role === 'admin' && (
              <AdminDashboard user={user} onLogout={handleLogout} />
            )}
            {user.role === 'teacher' && (
              <TeacherDashboard user={user} onLogout={handleLogout} />
            )}
            {user.role === 'student' && (
              <StudentDashboard 
                user={user} 
                onLogout={handleLogout} 
                onUpdateUser={(updated) => setUser(updated)} 
              />
            )}
          </div>
        ) : (
          /* Unauthenticated Views */
          <div className="w-full flex justify-center items-center">
            {currentView === 'login' ? (
              <LoginView 
                onLoginSuccess={handleLoginSuccess}
                onNavigateToRegister={() => setCurrentView('register')}
              />
            ) : (
              <RegisterView 
                onBackToLogin={() => setCurrentView('login')}
                onRegisterSuccess={(msg) => showToast(msg)}
              />
            )}
          </div>
        )}
      </main>

      {/* Global Footer (Geometric Balance Style) */}
      <footer className="bg-slate-900 border-t border-slate-800 py-5 px-6 text-slate-400 text-center">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-left font-sans">
            <p className="text-xs font-bold text-white uppercase tracking-wider">EDUGATE SOFTWARE SYSTEM</p>
            <p className="text-[10px] text-slate-500 mt-0.5">ระบบจดจำใบหน้าวิเคราะห์ความปลอดภัยสูงและซิงก์ข้อมูลอัตโนมัติ</p>
          </div>
          
          <div className="flex flex-wrap gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>FACE ENGINE: READY</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHEETS DB: ACTIVE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
