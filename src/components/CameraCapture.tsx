import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  buttonText?: string;
  guideText?: string;
}

export default function CameraCapture({
  onCapture,
  buttonText = 'ถ่ายภาพใบหน้า',
  guideText = 'จัดวางใบหน้าให้อยู่ภายในกรอบและกดปุ่มถ่ายภาพ'
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isCaptured, setIsCaptured] = useState<boolean>(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // Start webcam stream
  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setHasCamera(true);
      setErrorMsg('');
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setHasCamera(false);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'กรุณาอนุญาตให้แอปพลิเคชันเข้าถึงกล้องถ่ายภาพในเบราว์เซอร์ของคุณ'
          : 'ไม่สามารถเปิดใช้งานกล้องได้ กรุณาตรวจสอบการเชื่อมต่อกล้องของคุณ'
      );
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        // Draw video frame to canvas (mirror image for natural camera experience)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform

        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPreview(base64);
        setIsCaptured(true);
        onCapture(base64);
      }
    }
  };

  const handleRecapture = () => {
    setIsCaptured(false);
    setCapturedPreview(null);
    startCamera();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-xl shadow-slate-950/50">
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
        {/* Mirror effect for natural webcam */}
        {!isCaptured && hasCamera && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        )}

        {isCaptured && capturedPreview && (
          <img
            src={capturedPreview}
            alt="Captured Face"
            className="w-full h-full object-cover"
          />
        )}

        {/* High-tech Scanning Laser and Corners */}
        {!isCaptured && hasCamera && (
          <>
            {/* Laser scanning line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400 opacity-70 shadow-[0_0_12px_rgba(34,211,238,0.9)] animate-laser pointer-events-none" />

            {/* Futuristic Grid / Framing Corners */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none"></div>
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none"></div>
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none"></div>
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none"></div>

            {/* Outer guides */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Face Oval Overlay Guide */}
              <div className="w-40 h-52 border border-dashed border-cyan-400 rounded-[50%] opacity-80 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)] flex flex-col items-center justify-center">
                <div className="text-[9px] text-cyan-300 font-mono tracking-widest uppercase bg-slate-950/95 border border-cyan-500/20 px-2 py-0.5 rounded">
                  ALIGN FACE
                </div>
              </div>
            </div>
          </>
        )}

        {isCaptured && (
          <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none flex items-center justify-center border-2 border-cyan-400 rounded-lg animate-pulse">
            <div className="bg-cyan-500 text-slate-950 p-3 rounded-full shadow-lg shadow-cyan-500/30">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
          </div>
        )}

        {!hasCamera && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <p className="font-semibold text-xs mb-2 font-mono">{errorMsg}</p>
            <button
              onClick={startCamera}
              className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg text-xs font-mono transition-colors"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-3.5 text-center px-4 font-sans tracking-wide">
        {isCaptured ? 'ถ่ายภาพใบหน้าสำเร็จเรียบร้อยแล้ว' : guideText}
      </p>

      <div className="mt-4 flex gap-2.5 w-full justify-center">
        {!isCaptured && hasCamera && (
          <button
            type="button"
            onClick={handleCapture}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            {buttonText}
          </button>
        )}

        {isCaptured && (
          <button
            type="button"
            onClick={handleRecapture}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-lg text-xs uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            ถ่ายใหม่ (RE-TAKE)
          </button>
        )}
      </div>

      {/* Hidden capture canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
