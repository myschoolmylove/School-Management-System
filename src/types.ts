export type Section = {
  id: string;
  name: string; // A, B, Boys, Girls, etc.
  studentCount: number;
};

export type SchoolClass = {
  id: string;
  name: string; // Play Group, Nursery, Class 1, etc.
  sections: Section[];
};

export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string; // Fee, Salary, Rent, Utilities, etc.
};

export type UserRole = "super" | "school" | "teacher" | "parent" | "finance" | "registrar" | "librarian" | "admin" | "accountant" | "clerk" | "driver" | "security" | "warden" | "coordinator" | "receptionist" | "student";

export type UserProfile = {
  uid: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  username?: string;
  studentId?: string;
  name: string;
  photoUrl?: string;
  createdAt: string;
  phone?: string;
  designation?: string;
};

export type AuditLog = {
  id: string;
  schoolId: string;
  userId: string;
  userName: string;
  action: string; // e.g., "Updated Marks", "Paid Fee"
  details: string;
  timestamp: string;
  module: "academic" | "finance" | "admission" | "inventory" | "other";
};

export type InventoryItem = {
  id: string;
  schoolId: string;
  name: string;
  category: "furniture" | "electronics" | "lab" | "stationery" | "other";
  quantity: number;
  condition: "new" | "good" | "fair" | "poor";
  lastUpdated: string;
};

export type Student = {
  id: string;
  schoolId: string;
  rollNo: string;
  name: string;
  fatherName: string;
  classId: string;
  sectionId: string;
  photoUrl?: string;
  phone: string;
  address: string;
  dob: string;
  admissionDate: string;
  status: "active" | "inactive" | "graduated";
  attendance?: {
    present: number;
    absent: number;
    total: number;
  };
};

export type ExamResult = {
  id: string;
  studentId: string;
  schoolId: string;
  term: string; // e.g., "First Term", "Final Exam"
  year: string;
  marks: {
    subject: string;
    total: number;
    obtained: number;
    grade: string;
  }[];
  remarks: string;
  teacherId: string;
  createdAt: string;
};

export type Homework = {
  id: string;
  schoolId: string;
  classId: string;
  sectionId: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  teacherId: string;
  createdAt: string;
};

export type SchoolEvent = {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  date: string;
  type: "holiday" | "event" | "exam" | "other";
};

export type GalleryItem = {
  id: string;
  schoolId: string;
  title: string;
  imageUrl: string;
  date: string;
};

export const DEFAULT_CLASSES = [
  "Play Group",
  "Nursery",
  "Prep",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];
