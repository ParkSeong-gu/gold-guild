import { User, Product, Quest, QuestSubmission, Transaction, UserRole, QuestStatus, TransactionType } from '../types';

const STORAGE_KEYS = {
  USERS: 'app_users',
  PRODUCTS: 'app_products',
  QUESTS: 'app_quests',
  SUBMISSIONS: 'app_submissions',
  TRANSACTIONS: 'app_transactions',
};

// --- Initial Seed Data ---
const initialUsers: User[] = [
  { id: 't1', name: 'Mr. Anderson', role: UserRole.TEACHER, currentGold: 0, totalEarnedGold: 0 },
  { id: 's1', name: 'Alice Smith', studentId: '202401', role: UserRole.STUDENT, currentGold: 120, totalEarnedGold: 150 },
  { id: 's2', name: 'Bob Jones', studentId: '202402', role: UserRole.STUDENT, currentGold: 50, totalEarnedGold: 50 },
  { id: 's3', name: 'Charlie Day', studentId: '202403', role: UserRole.STUDENT, currentGold: 200, totalEarnedGold: 310 },
];

const initialProducts: Product[] = [
  { id: 'p1', name: 'Homework Pass', price: 100, stock: 10, description: 'Skip one homework assignment.' },
  { id: 'p2', name: 'Sit with a Friend', price: 150, stock: 5, description: 'Change your seat for one day.' },
  { id: 'p3', name: 'Snack Pack', price: 50, stock: 20, description: 'A small bag of chips or cookies.' },
];

const initialQuests: Quest[] = [
  { id: 'q1', title: 'Clean the Classroom', description: 'Sweep the floor and organize the bookshelves.', rewardGold: 50, status: QuestStatus.OPEN, maxAssignees: 2, currentAssignees: [], dueDate: '2024-12-31', createdBy: 't1' },
  { id: 'q2', title: 'Math Tutor', description: 'Help a classmate with fractions for 30 mins.', rewardGold: 100, status: QuestStatus.OPEN, maxAssignees: 1, currentAssignees: [], dueDate: '2024-11-20', createdBy: 't1' },
];

// --- Helper for LocalStorage ---
const getStorage = <T,>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const setStorage = <T,>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Service Methods ---

export const DB = {
  reset: () => {
    localStorage.clear();
    window.location.reload();
  },

  getUsers: (): User[] => getStorage(STORAGE_KEYS.USERS, initialUsers),
  getProducts: (): Product[] => getStorage(STORAGE_KEYS.PRODUCTS, initialProducts),
  getQuests: (): Quest[] => getStorage(STORAGE_KEYS.QUESTS, initialQuests),
  getSubmissions: (): QuestSubmission[] => getStorage(STORAGE_KEYS.SUBMISSIONS, []),
  getTransactions: (): Transaction[] => getStorage(STORAGE_KEYS.TRANSACTIONS, []),

  // User Actions
  updateUserGold: (userId: string, amount: number, type: TransactionType, reason: string) => {
    const users = DB.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    const user = users[userIndex];
    if (type === TransactionType.EARN) {
      user.currentGold += amount;
      user.totalEarnedGold += amount;
    } else {
      user.currentGold = Math.max(0, user.currentGold - amount);
    }
    users[userIndex] = user;
    setStorage(STORAGE_KEYS.USERS, users);

    // Log Transaction
    const transactions = DB.getTransactions();
    transactions.unshift({
      id: Date.now().toString(),
      userId,
      type,
      amount,
      reason,
      date: new Date().toISOString()
    });
    setStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  },

  // Shop Actions
  buyProduct: (userId: string, productId: string): boolean => {
    const users = DB.getUsers();
    const products = DB.getProducts();
    const user = users.find(u => u.id === userId);
    const productIndex = products.findIndex(p => p.id === productId);

    if (!user || productIndex === -1) return false;
    const product = products[productIndex];

    if (product.stock <= 0 || user.currentGold < product.price) return false;

    // Deduct stock
    product.stock -= 1;
    products[productIndex] = product;
    setStorage(STORAGE_KEYS.PRODUCTS, products);

    // Deduct gold & Log
    DB.updateUserGold(userId, product.price, TransactionType.SPEND, `Purchased: ${product.name}`);
    return true;
  },

  // Quest Actions (Teacher)
  createQuest: (quest: Quest) => {
    const quests = DB.getQuests();
    quests.push(quest);
    setStorage(STORAGE_KEYS.QUESTS, quests);
  },

  deleteQuest: (questId: string) => {
    let quests = DB.getQuests();
    quests = quests.filter(q => q.id !== questId);
    setStorage(STORAGE_KEYS.QUESTS, quests);
  },

  // Quest Actions (Student)
  acceptQuest: (questId: string, userId: string): boolean => {
    const quests = DB.getQuests();
    const questIndex = quests.findIndex(q => q.id === questId);
    if (questIndex === -1) return false;
    
    const quest = quests[questIndex];
    if (quest.currentAssignees.includes(userId)) return false; // Already accepted
    if (quest.currentAssignees.length >= quest.maxAssignees) return false; // Full

    quest.currentAssignees.push(userId);
    // If full, close it visually, though logic handles array check
    // keeping status OPEN until filled completely or manually closed
    quests[questIndex] = quest;
    setStorage(STORAGE_KEYS.QUESTS, quests);
    return true;
  },

  submitQuest: (submission: QuestSubmission) => {
    const subs = DB.getSubmissions();
    // Check if re-submission
    const existingIndex = subs.findIndex(s => s.questId === submission.questId && s.studentId === submission.studentId);
    
    if (existingIndex > -1) {
      subs[existingIndex] = { ...submission, status: 'PENDING' }; // Reset to pending
    } else {
      subs.push(submission);
    }
    setStorage(STORAGE_KEYS.SUBMISSIONS, subs);

    // Update quest status for this user logically? 
    // The "Status" on the quest object is global, but the UI should derive status from the submission list.
  },

  // Quest Review (Teacher)
  reviewSubmission: (submissionId: string, approved: boolean, feedback: string) => {
    const subs = DB.getSubmissions();
    const subIndex = subs.findIndex(s => s.id === submissionId);
    if (subIndex === -1) return;

    const sub = subs[subIndex];
    sub.status = approved ? 'APPROVED' : 'REJECTED';
    sub.feedback = feedback;
    subs[subIndex] = sub;
    setStorage(STORAGE_KEYS.SUBMISSIONS, subs);

    if (approved) {
      const quests = DB.getQuests();
      const quest = quests.find(q => q.id === sub.questId);
      if (quest) {
        DB.updateUserGold(sub.studentId, quest.rewardGold, TransactionType.EARN, `Quest Reward: ${quest.title}`);
      }
    }
  }
};