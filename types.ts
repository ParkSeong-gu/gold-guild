export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export enum QuestStatus {
  OPEN = 'OPEN', // Recruitment open
  ASSIGNED = 'ASSIGNED', // Accepted by student
  SUBMITTED = 'SUBMITTED', // Student submitted work
  COMPLETED = 'COMPLETED', // Approved by teacher
  REJECTED = 'REJECTED', // Rejected by teacher (can resubmit)
  CANCELLED = 'CANCELLED', // Cancelled by teacher
}

export enum TransactionType {
  EARN = 'EARN',
  SPEND = 'SPEND'
}

export interface User {
  id: string;
  name: string;
  studentId?: string; // Optional for teacher
  role: UserRole;
  currentGold: number;
  totalEarnedGold: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardGold: number;
  status: QuestStatus;
  maxAssignees: number;
  currentAssignees: string[]; // User IDs
  dueDate: string;
  createdBy: string; // Teacher ID
}

export interface QuestSubmission {
  id: string;
  questId: string;
  studentId: string;
  studentName: string;
  content: string; // Text report
  evidenceLink?: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedback?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  reason: string;
  date: string;
}

// Helper to determine Level based on Total Earned
export const getLevel = (totalGold: number): string => {
  if (totalGold < 50) return 'Bronze';
  if (totalGold < 150) return 'Silver';
  if (totalGold < 300) return 'Gold';
  if (totalGold < 600) return 'Platinum';
  return 'Diamond';
};

export const getLevelColor = (level: string): string => {
  switch(level) {
    case 'Bronze': return 'bg-orange-700 text-white';
    case 'Silver': return 'bg-gray-400 text-white';
    case 'Gold': return 'bg-yellow-500 text-white';
    case 'Platinum': return 'bg-cyan-500 text-white';
    case 'Diamond': return 'bg-purple-600 text-white';
    default: return 'bg-gray-500 text-white';
  }
}