import fs from 'fs';
import path from 'path';

// Define the database interfaces
export interface UserRecord {
  id: string; // email for teachers/admin, studentId for students
  fullName: string;
  email: string;
  password?: string;
  role: 'admin' | 'teacher' | 'student';
  faceImage?: string; // base64 data URL
  registeredAt: string;
}

export interface StudentRecord {
  studentId: string;
  fullName: string;
  email: string;
  classMajor: string;
  status: 'active' | 'suspended';
  faceRegistered: boolean;
  addedBy: string; // 'sheet' or 'teacher' or 'admin'
  updatedAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  students: StudentRecord[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Initial default data
const DEFAULT_DB: DatabaseSchema = {
  users: [
    {
      id: 'admin',
      fullName: 'ระบบผู้จัดการ (Admin)',
      email: 'admin@example.com',
      password: '44120',
      role: 'admin',
      registeredAt: new Date().toISOString()
    },
    {
      id: 'teacher1@example.com',
      fullName: 'ดร.สมชาย ใจดี',
      email: 'teacher1@example.com',
      password: 'password123',
      role: 'teacher',
      registeredAt: new Date().toISOString()
    }
  ],
  students: [
    {
      studentId: '64010101',
      fullName: 'นายสมศักดิ์ รักเรียน',
      email: 'somsak@student.com',
      classMajor: 'วิศวกรรมคอมพิวเตอร์ ปี 3',
      status: 'active',
      faceRegistered: false,
      addedBy: 'admin',
      updatedAt: new Date().toISOString()
    },
    {
      studentId: '64010102',
      fullName: 'นางสาววิภาวดี มีสุข',
      email: 'wipawadee@student.com',
      classMajor: 'เทคโนโลยีสารสนเทศ ปี 3',
      status: 'active',
      faceRegistered: false,
      addedBy: 'admin',
      updatedAt: new Date().toISOString()
    }
  ]
};

class JSONDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = { users: [], students: [] };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Ensure standard keys exist
        if (!this.data.users) this.data.users = [];
        if (!this.data.students) this.data.students = [];
        
        // Ensure admin user exists in the system
        const adminExists = this.data.users.some(u => u.id === 'admin');
        if (!adminExists) {
          this.data.users.push(DEFAULT_DB.users[0]);
          this.save();
        }
      } else {
        this.data = { ...DEFAULT_DB };
        this.save();
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      this.data = { ...DEFAULT_DB };
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  // --- User Operations ---
  public getUsers(): UserRecord[] {
    return this.data.users;
  }

  public getUser(id: string): UserRecord | undefined {
    return this.data.users.find(u => u.id.toLowerCase() === id.toLowerCase() || u.email.toLowerCase() === id.toLowerCase());
  }

  public addUser(user: Omit<UserRecord, 'registeredAt'>): UserRecord {
    const newUser: UserRecord = {
      ...user,
      registeredAt: new Date().toISOString()
    };
    
    // Remove existing user with same ID to prevent duplicates
    this.data.users = this.data.users.filter(u => u.id.toLowerCase() !== user.id.toLowerCase());
    this.data.users.push(newUser);
    
    // If this is a student, we update the student's faceRegistered status in students table
    if (user.role === 'student') {
      const student = this.data.students.find(s => s.studentId === user.id);
      if (student) {
        student.faceRegistered = !!user.faceImage;
        student.updatedAt = new Date().toISOString();
      } else {
        // If student record didn't exist in students, create one
        this.data.students.push({
          studentId: user.id,
          fullName: user.fullName,
          email: user.email,
          classMajor: 'นักศึกษาใหม่ (ยังไม่ระบุ)',
          status: 'active',
          faceRegistered: !!user.faceImage,
          addedBy: 'teacher',
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    this.save();
    return newUser;
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id.toLowerCase() !== id.toLowerCase());
    
    // Sync student table status if needed
    const student = this.data.students.find(s => s.studentId === id);
    if (student) {
      student.faceRegistered = false;
      student.updatedAt = new Date().toISOString();
    }
    
    const changed = this.data.users.length !== initialLen;
    if (changed) this.save();
    return changed;
  }

  // --- Student Operations ---
  public getStudents(): StudentRecord[] {
    return this.data.students;
  }

  public addStudent(student: Omit<StudentRecord, 'faceRegistered' | 'updatedAt'>): StudentRecord {
    // Check if user already registered face
    const user = this.data.users.find(u => u.id === student.studentId && u.role === 'student');
    const hasFace = !!(user && user.faceImage);

    const newStudent: StudentRecord = {
      ...student,
      faceRegistered: hasFace,
      updatedAt: new Date().toISOString()
    };

    this.data.students = this.data.students.filter(s => s.studentId !== student.studentId);
    this.data.students.push(newStudent);
    this.save();
    return newStudent;
  }

  public deleteStudent(studentId: string): boolean {
    const initialLen = this.data.students.length;
    this.data.students = this.data.students.filter(s => s.studentId !== studentId);
    
    // Also delete their auth credentials/face image if any
    this.data.users = this.data.users.filter(u => u.id !== studentId || u.role !== 'student');
    
    const changed = this.data.students.length !== initialLen;
    if (changed) this.save();
    return changed;
  }

  public importStudentsFromSheets(studentsList: Omit<StudentRecord, 'faceRegistered' | 'updatedAt'>[]): { added: number, updated: number } {
    let added = 0;
    let updated = 0;

    for (const sheetStud of studentsList) {
      const existingIdx = this.data.students.findIndex(s => s.studentId === sheetStud.studentId);
      
      // Keep face registration state if student already has a user account
      const user = this.data.users.find(u => u.id === sheetStud.studentId && u.role === 'student');
      const hasFace = !!(user && user.faceImage);

      const record: StudentRecord = {
        ...sheetStud,
        faceRegistered: hasFace,
        updatedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        this.data.students[existingIdx] = record;
        updated++;
      } else {
        this.data.students.push(record);
        added++;
      }
    }

    if (added > 0 || updated > 0) {
      this.save();
    }

    return { added, updated };
  }
}

export const db = new JSONDatabase();
