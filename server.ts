import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server-db.js';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable large JSON payloads for base64 images
app.use(express.json({ limit: '15mb' }));

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('Gemini API initialized successfully.');
  } else {
    console.warn('GEMINI_API_KEY is not defined in environment variables.');
  }
} catch (error) {
  console.error('Failed to initialize Gemini Client:', error);
}

// Helper to strip base64 headers
function parseBase64Image(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  // Fallback if it's already raw base64
  return { mimeType: 'image/jpeg', data: dataUrl };
}

// Simple CSV parser for Google Sheets import
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentValue = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentValue.trim());
      currentValue = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentValue.trim());
      result.push(row);
      row = [];
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  if (row.length > 0 || currentValue) {
    row.push(currentValue.trim());
    result.push(row);
  }
  return result.filter(r => r.length > 0 && r.some(cell => cell !== ''));
}

// --- API Endpoints ---

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Authentication Login
app.post('/api/auth/login', (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) {
    return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านและชื่อผู้ใช้งาน' });
  }

  // Admin bypass
  if (id === 'admin') {
    if (password === '44120') {
      const adminUser = db.getUser('admin');
      return res.json({ success: true, user: adminUser });
    } else {
      return res.status(401).json({ error: 'รหัสผ่านแอดมินไม่ถูกต้อง' });
    }
  }

  const user = db.getUser(id);
  if (!user) {
    return res.status(401).json({ error: 'ไม่พบชื่อผู้ใช้งานนี้ในระบบ' });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
  }

  res.json({ success: true, user });
});

// 3. Face Recognition Verification
app.post('/api/auth/login-face', async (req, res) => {
  const { id, faceImage } = req.body;
  if (!id || !faceImage) {
    return res.status(400).json({ error: 'กรุณาระบุรหัสประจำตัวหรืออีเมล และถ่ายภาพใบหน้า' });
  }

  const user = db.getUser(id);
  if (!user) {
    return res.status(401).json({ error: 'ไม่พบชื่อผู้ใช้งานนี้ในระบบ' });
  }

  if (!user.faceImage) {
    return res.status(400).json({ error: 'ผู้ใช้นี้ยังไม่ได้ลงทะเบียนใบหน้า กรุณาเข้าสู่ระบบด้วยรหัสผ่านแล้วลงทะเบียนใบหน้าก่อน' });
  }

  if (!ai) {
    return res.status(500).json({ error: 'ระบบปัญญาประดิษฐ์สแกนใบหน้าไม่พร้อมใช้งาน (GEMINI_API_KEY missing)' });
  }

  try {
    const registeredImg = parseBase64Image(user.faceImage);
    const loginImg = parseBase64Image(faceImage);

    console.log(`Comparing captured face for user: ${user.fullName} (${user.id})`);

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        'You are an extremely accurate and secure facial recognition system. Compare the two images. Determine if they are photographs of the exact same person. Be robust against changes in lighting, hairstyle, background, camera angle, expressions, or glasses. You must verify that the structural facial keypoints match. Return your analysis strictly as JSON matching the schema.',
        {
          inlineData: {
            mimeType: registeredImg.mimeType,
            data: registeredImg.data
          }
        },
        {
          inlineData: {
            mimeType: loginImg.mimeType,
            data: loginImg.data
          }
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMatch: { type: Type.BOOLEAN, description: 'True if both pictures are of the same person, otherwise false.' },
            confidence: { type: Type.NUMBER, description: 'Confidence score of matching, from 0.0 to 1.0.' },
            reason: { type: Type.STRING, description: 'Explanation in Thai language detailing the decision.' }
          },
          required: ['isMatch', 'confidence', 'reason']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('No output from Gemini API');
    }

    const verificationResult = JSON.parse(resultText);
    console.log('Gemini face matching result:', verificationResult);

    // Consider matches above 0.7 confidence as verified
    if (verificationResult.isMatch && verificationResult.confidence >= 0.7) {
      return res.json({
        success: true,
        user,
        verification: verificationResult
      });
    } else {
      return res.status(401).json({
        error: `การจดจำใบหน้าไม่สำเร็จ: ${verificationResult.reason || 'ใบหน้าไม่ตรงกับที่ลงทะเบียนไว้'}`,
        verification: verificationResult
      });
    }
  } catch (error: any) {
    console.error('Face verification server error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบใบหน้าด้วย AI: ' + error.message });
  }
});

// 4. User Registration (Student Face Registration or Teacher Registration)
app.post('/api/auth/register', (req, res) => {
  const { role, fullName, email, password, studentId, faceImage } = req.body;

  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
  }

  const userId = role === 'student' ? studentId : email;
  if (!userId) {
    return res.status(400).json({ error: 'นักศึกษาจำเป็นต้องมีรหัสประจำตัวนักศึกษา' });
  }

  // Check if already exists
  const existingUser = db.getUser(userId);
  if (existingUser) {
    return res.status(400).json({ error: 'รหัสประจำตัวนี้หรืออีเมลนี้ได้รับการลงทะเบียนไปแล้ว' });
  }

  const newUser = db.addUser({
    id: userId,
    fullName,
    email,
    password,
    role,
    faceImage
  });

  res.json({ success: true, user: newUser });
});

// 5. Google Sheets Data Sync
app.post('/api/sheets/import', async (req, res) => {
  const { url, addedBy } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'กรุณาระบุ URL ของ Google Sheet' });
  }

  try {
    // Extract Spreadsheet ID
    const sheetIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      return res.status(400).json({ error: 'รูปแบบ Google Sheet URL ไม่ถูกต้อง' });
    }

    const spreadsheetId = sheetIdMatch[1];
    
    // Check if gid is present
    const gidMatch = url.match(/gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    const csvExportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    console.log(`Fetching spreadsheet data from: ${csvExportUrl}`);

    const fetchResponse = await fetch(csvExportUrl);
    if (!fetchResponse.ok) {
      throw new Error(`ไม่สามารถเข้าถึง Google Sheet ได้ รหัสสถานะ: ${fetchResponse.status}. กรุณาตรวจสอบว่าแชร์เป็น "ทุกคนที่มีลิงก์สามารถดูได้" (Anyone with link can view)`);
    }

    const csvText = await fetchResponse.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      return res.status(400).json({ error: 'Google Sheet ว่างเปล่าหรือไม่มีข้อมูลนักเรียน' });
    }

    // Header structure inspection
    // We expect headers like: Student ID, Full Name, Email, Major/Class, Status (optional)
    const headerRow = rows[0].map(h => h.toLowerCase().replace(/[\s-_]/g, ''));
    
    // Find column indexes
    let idIdx = -1;
    let nameIdx = -1;
    let emailIdx = -1;
    let majorIdx = -1;
    let statusIdx = -1;

    // Smart column headers mapping (Thai & English)
    for (let i = 0; i < headerRow.length; i++) {
      const col = headerRow[i];
      if (col.includes('studentid') || col.includes('id') || col.includes('รหัส') || col.includes('รหัสนักศึกษา') || col.includes('รหัสนักเรียน')) {
        if (idIdx === -1) idIdx = i;
      } else if (col.includes('name') || col.includes('fullname') || col.includes('ชื่อ') || col.includes('ชื่อสกุล') || col.includes('ชื่อนามสกุล')) {
        if (nameIdx === -1) nameIdx = i;
      } else if (col.includes('email') || col.includes('mail') || col.includes('อีเมล') || col.includes('เมล')) {
        if (emailIdx === -1) emailIdx = i;
      } else if (col.includes('class') || col.includes('major') || col.includes('department') || col.includes('ห้อง') || col.includes('สาขา') || col.includes('ชั้นปี') || col.includes('ชั้น')) {
        if (majorIdx === -1) majorIdx = i;
      } else if (col.includes('status') || col.includes('state') || col.includes('สถานะ')) {
        if (statusIdx === -1) statusIdx = i;
      }
    }

    // Fallback if smart mapping fails: use positional mapping (0: ID, 1: Name, 2: Email, 3: Class, 4: Status)
    if (idIdx === -1) idIdx = 0;
    if (nameIdx === -1) nameIdx = 1;
    if (emailIdx === -1) emailIdx = 2;
    if (majorIdx === -1) majorIdx = 3;
    if (statusIdx === -1) statusIdx = 4;

    const importedStudents = [];

    // Parse data rows
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const studentId = row[idIdx];
      const fullName = row[nameIdx];
      
      if (!studentId || !fullName) continue; // Skip invalid records

      const email = emailIdx < row.length ? row[emailIdx] : `${studentId}@student.com`;
      const classMajor = majorIdx < row.length ? row[majorIdx] : 'ไม่ระบุสาขาวิชา';
      const rawStatus = statusIdx < row.length ? row[statusIdx].toLowerCase() : 'active';
      const status = (rawStatus.includes('suspend') || rawStatus.includes('ระงับ') || rawStatus.includes('พัก')) ? 'suspended' : 'active';

      importedStudents.push({
        studentId: studentId.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        classMajor: classMajor.trim(),
        status,
        addedBy: addedBy || 'sheet'
      });
    }

    const syncResult = db.importStudentsFromSheets(importedStudents);
    res.json({
      success: true,
      totalRowsImported: importedStudents.length,
      added: syncResult.added,
      updated: syncResult.updated
    });

  } catch (error: any) {
    console.error('Google Sheets import error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheets: ' + error.message });
  }
});

// 6. Get Students List
app.get('/api/students', (req, res) => {
  res.json({ success: true, students: db.getStudents() });
});

// 7. Add Student (Manually)
app.post('/api/students', (req, res) => {
  const { studentId, fullName, email, classMajor, status, addedBy } = req.body;
  
  if (!studentId || !fullName || !email) {
    return res.status(400).json({ error: 'กรุณากรอก รหัสนักศึกษา, ชื่อ-นามสกุล และ อีเมล' });
  }

  const record = db.addStudent({
    studentId,
    fullName,
    email,
    classMajor: classMajor || 'ไม่ระบุ',
    status: status || 'active',
    addedBy: addedBy || 'teacher'
  });

  res.json({ success: true, student: record });
});

// 8. Delete Student
app.delete('/api/students/:studentId', (req, res) => {
  const { studentId } = req.params;
  const deleted = db.deleteStudent(studentId);
  if (deleted) {
    res.json({ success: true, message: 'ลบข้อมูลนักศึกษาเรียบร้อยแล้ว' });
  } else {
    res.status(404).json({ error: 'ไม่พบข้อมูลนักศึกษาที่ต้องการลบ' });
  }
});

// 8.5. Get AI Report for Teachers
app.post('/api/teacher/ai-report', async (req, res) => {
  const students = db.getStudents();
  if (students.length === 0) {
    return res.json({
      success: true,
      report: {
        summary: "ยังไม่มีข้อมูลนักเรียนนักศึกษาในระบบ กรุณาเพิ่มรายชื่อนักศึกษาก่อนเพื่อทำรายงานวิเคราะห์",
        demographicsInsight: "ไม่สามารถประเมินได้เนื่องจากฐานข้อมูลว่าง",
        securityStatus: "ไม่สามารถประเมินระบบชีวมาตรได้เนื่องจากไม่มีผู้ใช้",
        recommendations: ["เพิ่มรายชื่อนักศึกษาก่อนโดยการป้อนด้วยตนเองหรือนำเข้าผ่าน Google Sheets"],
        warnings: ["ระบบไม่มีข้อมูลผู้เรียน"]
      }
    });
  }

  // Calculate some simple local statistics to construct a high-context prompt
  const total = students.length;
  const enrolled = students.filter(s => s.faceRegistered).length;
  const active = students.filter(s => s.status === 'active').length;
  const suspended = total - active;
  const enrolledPercent = ((enrolled / total) * 100).toFixed(1);

  // Group by major
  const majors: { [key: string]: number } = {};
  students.forEach(s => {
    const major = s.classMajor || 'ไม่ระบุสาขา';
    majors[major] = (majors[major] || 0) + 1;
  });
  const majorsStr = Object.entries(majors).map(([m, count]) => `${m}: ${count} คน`).join(', ');

  // If Gemini API is not initialized/available, return a high-quality mock report
  if (!ai) {
    console.warn("AI Report requested but Gemini client is not initialized. Using premium rule-based generator.");
    
    // Generate a smart, specific, realistic report
    const fallbackReport = {
      summary: `รายงานกลุ่มผู้เรียนในวิชาปัจจุบันมีจำนวนนักศึกษาทั้งหมด ${total} คน โดยมีความพร้อมในการจัดกิจกรรมและการตรวจสอบในชั้นเรียนอยู่ในระดับค่อนข้างเหมาะสม มีผู้เรียนเข้าศึกษาจากหลากหลายกลุ่มวิชา ซึ่งสามารถจัดกิจกรรมที่มุ่งเน้นการบูรณาการได้เป็นอย่างดี`,
      demographicsInsight: `จากการวิเคราะห์พบว่า นักศึกษาส่วนใหญ่อยู่ในกลุ่มวิชา: ${majorsStr} ทั้งนี้มีนักศึกษาที่มีสถานะปกติ (Active) เป็นจำนวน ${active} คน และมีสถานะถูกระงับ (Suspended) ${suspended} คน`,
      securityStatus: `ในส่วนของระบบความปลอดภัยและการยืนยันตัวตนทางชีวมาตร (Biometric) มีผู้ที่สแกนและบันทึกใบหน้าแล้วจำนวน ${enrolled} คน คิดเป็น ${enrolledPercent}% ของชั้นเรียน ซึ่งมีผู้ที่ยังไม่ได้สแกนใบหน้าอีก ${total - enrolled} คน แนะนำให้อาจารย์ผู้สอนเร่งรัดให้นักศึกษาที่เหลือสแกนใบหน้าโดยเร็วเพื่อความปลอดภัยในการทำรายการและเช็คอิน`,
      recommendations: [
        "จัดชั่วโมงปฏิบัติการสั้นๆ ก่อนเริ่มคาบเรียนถัดไป เพื่อช่วยเหลือนักศึกษาที่ยังไม่ได้บันทึกภาพใบหน้า",
        "ใช้ประโยชน์จากความหลากหลายของสาขาวิชาในการแบ่งกลุ่มทำงาน โดยจับคู่กลุ่มที่มีความถนัดด้านไอทีและวิศวกรรมกับกลุ่มสาขาอื่นๆ เพื่อช่วยสนับสนุนกัน",
        "สำหรับนักศึกษาที่มีสถานะระงับการเข้าใช้ (Suspended) ควรตรวจสอบสาเหตุและการชำระค่าลงทะเบียนเรียน เพื่อรักษาสิทธิ์ในการเข้าเรียนและสอบปลายภาค"
      ],
      warnings: parseFloat(enrolledPercent) < 70 
        ? [`เปอร์เซ็นต์การบันทึกใบหน้าค่อนข้างต่ำ (${enrolledPercent}%) อาจส่งผลต่อความล่าช้าในการทำระบบเช็คชื่อด้วยใบหน้าในคาบเรียน`]
        : []
    };
    return res.json({ success: true, report: fallbackReport, isFallback: true });
  }

  try {
    // Construct prompt with rich data context
    const studentListDetails = students.map(s => 
      `- รหัส: ${s.studentId}, ชื่อ: ${s.fullName}, สาขา: ${s.classMajor}, การบันทึกใบหน้า: ${s.faceRegistered ? 'ลงทะเบียนแล้ว' : 'ยังไม่ลงทะเบียน'}, สถานะ: ${s.status === 'active' ? 'ปกติ' : 'ถูกระงับ'}`
    ).join('\n');

    const promptText = `วิเคราะห์รายชื่อนักศึกษาต่อไปนี้และประเมินภาพรวมชั้นเรียน เพื่อสร้างรายงานวิเคราะห์สำหรับครูผู้สอน:
    
สถิติภาพรวม:
- จำนวนนักศึกษาทั้งหมด: ${total} คน
- สแกนใบหน้าแล้ว: ${enrolled} คน (${enrolledPercent}%)
- ยังไม่ได้สแกนใบหน้า: ${total - enrolled} คน
- สถานะปกติ: ${active} คน, ถูกระงับ: ${suspended} คน
- การกระจายกลุ่มวิชา/สาขา: ${majorsStr}

รายชื่อนักศึกษาทั้งหมดในระบบ:
${studentListDetails}

กรุณาสรุปผลเป็นรายงานภาษาไทยที่สวยงาม เป็นมืออาชีพ และเจาะลึก โดยส่งผลลัพธ์เป็น JSON ตามโครงสร้างโครงสร้างที่กำหนดเท่านั้น ห้ามพิมพ์อักขระอื่นใดนอกเหนือจาก JSON เพื่อให้โปรแกรมสามารถนำไปแสดงผลบน Dashboard ได้โดยตรง`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        systemInstruction: "You are an expert academic advisor and security compliance auditor. Analyze the classroom's student data and output a professional Thai language analysis dashboard report inside a highly structured JSON response.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "สรุปภาพรวมผู้เรียน ความพร้อมในการเรียนการสอนในระดับชั้นเรียน" },
            demographicsInsight: { type: Type.STRING, description: "การวิเคราะห์ข้อมูลประชากรผู้เรียนและกลุ่มสาขาวิชาที่ลงทะเบียน ความหลากหลายและแนวทางการสอนที่เหมาะสม" },
            securityStatus: { type: Type.STRING, description: "การวิเคราะห์และประเมินผลการลงทะเบียนใบหน้า (Biometrics Compliance) และความปลอดภัยของระบบระบุตัวตนในชั้นเรียน" },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "ข้อเสนอแนะ 3 ข้อที่ปฏิบัติได้จริงสำหรับอาจารย์ผู้สอนในการจัดการชั้นเรียน การสอน และเร่งสแกนใบหน้า"
            },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "คำเตือนหรือข้อพึงระวัง เช่น นักศึกษาที่ไม่สแกนใบหน้า หรือผู้ที่สถานะผิดปกติ"
            }
          },
          required: ['summary', 'demographicsInsight', 'securityStatus', 'recommendations', 'warnings']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('No output from Gemini API');
    }

    const reportData = JSON.parse(resultText);
    res.json({ success: true, report: reportData, isFallback: false });

  } catch (error: any) {
    console.error('AI Report generation error:', error);
    // Return high-quality rule-based fallback on any Gemini/parsing errors
    const fallbackReport = {
      summary: `รายงานกลุ่มผู้เรียนในวิชาปัจจุบันมีจำนวนนักศึกษาทั้งหมด ${total} คน โดยมีความพร้อมในการทำงานร่วมกันที่สมบูรณ์`,
      demographicsInsight: `นักศึกษากระจายตัวในสาขาต่าง ๆ ได้แก่: ${majorsStr}`,
      securityStatus: `ผู้ที่สแกนและบันทึกใบหน้าแล้วจำนวน ${enrolled} คน (${enrolledPercent}%) และยังไม่ได้สแกนใบหน้าอีก ${total - enrolled} คน`,
      recommendations: [
        "จัดกิจกรรมทำความรู้จักและช่วยลงทะเบียนใบหน้าแบบกลุ่มเพื่อนช่วยเพื่อน",
        "ประสานงานติดต่อฝ่ายทะเบียนเพื่อตรวจสอบสถานะของนักศึกษาที่ถูกระงับเข้าเรียน",
        "ออกแบบกิจกรรมการเรียนรู้แบบ Project-based Learning ที่ผสมผสานความรู้ด้านวิศวกรรมและไอทีตามสาขาของผู้เรียน"
      ],
      warnings: [
        `พบนอกจากนี้ยังมีนักศึกษา ${total - enrolled} คนที่ยังไม่ลงทะเบียนใบหน้าเพื่อความปลอดภัย`,
        `มีนักศึกษาถูกระงับการเข้าใช้งาน ${suspended} คน`
      ]
    };
    res.json({ success: true, report: fallbackReport, isFallback: true, errorMsg: error.message });
  }
});

// 9. Get Teachers List (Admin only)
app.get('/api/teachers', (req, res) => {
  const users = db.getUsers();
  const teachers = users.filter(u => u.role === 'teacher');
  res.json({ success: true, teachers });
});

// 10. Add Teacher
app.post('/api/teachers', (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลอาจารย์ให้ครบถ้วน' });
  }

  const newUser = db.addUser({
    id: email,
    fullName,
    email,
    password,
    role: 'teacher'
  });

  res.json({ success: true, teacher: newUser });
});

// 11. Delete Teacher
app.delete('/api/teachers/:email', (req, res) => {
  const { email } = req.params;
  const deleted = db.deleteUser(email);
  if (deleted) {
    res.json({ success: true, message: 'ลบข้อมูลอาจารย์เรียบร้อยแล้ว' });
  } else {
    res.status(404).json({ error: 'ไม่พบข้อมูลอาจารย์ที่ต้องการลบ' });
  }
});

// 12. Save face photo for logged-in student/user
app.post('/api/auth/save-face', (req, res) => {
  const { id, faceImage } = req.body;
  if (!id || !faceImage) {
    return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
  }

  const user = db.getUser(id);
  if (!user) {
    return res.status(404).json({ error: 'ไม่พบผู้ใช้ในระบบ' });
  }

  // Update face image
  user.faceImage = faceImage;
  db.addUser(user); // saves and triggers sync with student list

  res.json({ success: true, message: 'บันทึกใบหน้าเรียบร้อยแล้ว' });
});


// Start Express + Vite configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
