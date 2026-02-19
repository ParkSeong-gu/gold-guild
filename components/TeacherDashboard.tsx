import React, { useState, useEffect } from 'react';
import { User, Product, Quest, QuestSubmission, Transaction, TransactionType, UserRole, QuestStatus } from '../types';
import { DB } from '../services/db';

interface TeacherDashboardProps {
  currentUser: User;
  refreshData: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ refreshData }) => {
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'QUESTS' | 'SHOP'>('STUDENTS');
  const [users, setUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<QuestSubmission[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Form States
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  
  const [newQuest, setNewQuest] = useState<Partial<Quest>>({
    title: '', description: '', rewardGold: 10, maxAssignees: 1, dueDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(DB.getUsers().filter(u => u.role === UserRole.STUDENT));
    setSubmissions(DB.getSubmissions().filter(s => s.status === 'PENDING'));
    setQuests(DB.getQuests());
    setProducts(DB.getProducts());
  };

  const handleGiveGold = (type: TransactionType) => {
    if (selectedStudentIds.length === 0 || amount <= 0 || !reason) {
      alert('Please select students, enter amount and reason.');
      return;
    }
    selectedStudentIds.forEach(id => {
      DB.updateUserGold(id, amount, type, reason);
    });
    alert('Transaction processed.');
    setAmount(0);
    setReason('');
    setSelectedStudentIds([]);
    loadData();
    refreshData();
  };

  const handleCreateQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuest.title || !newQuest.rewardGold) return;
    
    const q: Quest = {
      id: Date.now().toString(),
      title: newQuest.title!,
      description: newQuest.description || '',
      rewardGold: Number(newQuest.rewardGold),
      maxAssignees: Number(newQuest.maxAssignees) || 1,
      dueDate: newQuest.dueDate || '2024-12-31',
      status: QuestStatus.OPEN,
      currentAssignees: [],
      createdBy: 't1'
    };
    
    DB.createQuest(q);
    alert('Quest created!');
    setNewQuest({ title: '', description: '', rewardGold: 10, maxAssignees: 1, dueDate: '' });
    loadData();
  };

  const handleReviewSubmission = (id: string, approved: boolean) => {
    const feedback = prompt(approved ? "Approval message (optional):" : "Reason for rejection:");
    if (feedback === null) return; // cancelled
    
    DB.reviewSubmission(id, approved, feedback || (approved ? 'Great job!' : 'Please revise.'));
    loadData();
    refreshData(); // Updates global balance if approved
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedStudentIds.length === users.length) setSelectedStudentIds([]);
    else setSelectedStudentIds(users.map(u => u.id));
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2">
        {(['STUDENTS', 'QUESTS', 'SHOP'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
              activeTab === tab 
                ? 'bg-white border-b-2 border-indigo-500 text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'STUDENTS' ? '👥 Students & Gold' : tab === 'QUESTS' ? '⚔️ Quests' : '🛒 Shop Mgmt'}
          </button>
        ))}
      </div>

      {/* STUDENTS MANAGEMENT */}
      {activeTab === 'STUDENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
               <h3 className="font-bold text-gray-700">Class List</h3>
               <button onClick={selectAll} className="text-sm text-indigo-600 font-medium">
                 {selectedStudentIds.length === users.length ? 'Deselect All' : 'Select All'}
               </button>
             </div>
             <ul className="divide-y divide-gray-100">
               {users.map(user => (
                 <li 
                   key={user.id} 
                   className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${selectedStudentIds.includes(user.id) ? 'bg-indigo-50' : ''}`}
                   onClick={() => toggleStudentSelection(user.id)}
                 >
                   <div className="flex items-center">
                     <input 
                       type="checkbox" 
                       checked={selectedStudentIds.includes(user.id)}
                       onChange={() => {}}
                       className="h-4 w-4 text-indigo-600 rounded border-gray-300 mr-3"
                     />
                     <div>
                       <div className="font-medium text-gray-900">{user.name}</div>
                       <div className="text-xs text-gray-500">ID: {user.studentId} | Total: {user.totalEarnedGold}</div>
                     </div>
                   </div>
                   <div className="font-bold text-yellow-600">{user.currentGold} G</div>
                 </li>
               ))}
             </ul>
          </div>

          <div className="lg:col-span-1">
             <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 sticky top-6">
               <h3 className="font-bold text-gray-800 mb-4">Manage Gold</h3>
               <div className="mb-4">
                 <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selected</span>
                 <p className="text-sm text-gray-800 mt-1">{selectedStudentIds.length} students</p>
               </div>
               
               <div className="space-y-3">
                 <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                   <input 
                     type="number" 
                     className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                     value={amount}
                     onChange={(e) => setAmount(Number(e.target.value))}
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                   <input 
                     type="text" 
                     className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                     placeholder="e.g. Good Participation"
                     value={reason}
                     onChange={(e) => setReason(e.target.value)}
                   />
                 </div>
                 <div className="flex space-x-2 pt-2">
                    <button 
                      onClick={() => handleGiveGold(TransactionType.EARN)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                      Give Gold
                    </button>
                    <button 
                      onClick={() => handleGiveGold(TransactionType.SPEND)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 text-sm font-medium"
                    >
                      Deduct
                    </button>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* QUEST MANAGEMENT */}
      {activeTab === 'QUESTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Quest */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Create New Quest</h3>
             <form onSubmit={handleCreateQuest} className="space-y-3">
               <input 
                 className="w-full p-2 border rounded text-sm" 
                 placeholder="Quest Title" 
                 value={newQuest.title}
                 onChange={e => setNewQuest({...newQuest, title: e.target.value})}
                 required
               />
               <textarea 
                 className="w-full p-2 border rounded text-sm" 
                 placeholder="Description" 
                 rows={3}
                 value={newQuest.description}
                 onChange={e => setNewQuest({...newQuest, description: e.target.value})}
               />
               <div className="flex gap-2">
                 <input 
                   type="number" className="w-1/2 p-2 border rounded text-sm" placeholder="Reward Gold" 
                   value={newQuest.rewardGold} onChange={e => setNewQuest({...newQuest, rewardGold: Number(e.target.value)})}
                 />
                 <input 
                   type="number" className="w-1/2 p-2 border rounded text-sm" placeholder="Max Assignees" 
                   value={newQuest.maxAssignees} onChange={e => setNewQuest({...newQuest, maxAssignees: Number(e.target.value)})}
                 />
               </div>
               <input 
                  type="date" className="w-full p-2 border rounded text-sm" 
                  value={newQuest.dueDate} onChange={e => setNewQuest({...newQuest, dueDate: e.target.value})}
               />
               <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 font-medium">
                 Post Quest
               </button>
             </form>

             <div className="mt-6">
               <h4 className="font-bold text-gray-700 mb-2">Active Quests</h4>
               <ul className="space-y-2">
                 {quests.map(q => (
                   <li key={q.id} className="text-sm border p-2 rounded flex justify-between">
                     <span>{q.title} ({q.currentAssignees.length}/{q.maxAssignees})</span>
                     <button onClick={() => {DB.deleteQuest(q.id); loadData();}} className="text-red-500 hover:text-red-700">Delete</button>
                   </li>
                 ))}
               </ul>
             </div>
          </div>

          {/* Review Submissions */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Pending Submissions</h3>
            {submissions.length === 0 && <p className="text-gray-500 text-sm italic">No pending submissions.</p>}
            <ul className="space-y-4">
              {submissions.map(sub => {
                const quest = quests.find(q => q.id === sub.questId);
                return (
                  <li key={sub.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-gray-800">{sub.studentName}</span>
                      <span className="text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs font-semibold text-indigo-600 mb-1">{quest?.title}</p>
                    <p className="text-sm text-gray-600 bg-white p-2 rounded border mb-2">{sub.content}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReviewSubmission(sub.id, true)}
                        className="flex-1 bg-green-500 text-white text-xs py-1.5 rounded hover:bg-green-600"
                      >
                        Approve (+{quest?.rewardGold}G)
                      </button>
                      <button 
                        onClick={() => handleReviewSubmission(sub.id, false)}
                        className="flex-1 bg-red-500 text-white text-xs py-1.5 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* SHOP MANAGEMENT (Simplified) */}
      {activeTab === 'SHOP' && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
           <h3 className="font-bold text-gray-800 mb-4">Inventory Management</h3>
           <table className="min-w-full divide-y divide-gray-200">
             <thead>
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {products.map(p => (
                 <tr key={p.id}>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.price} G</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.stock}</td>
                 </tr>
               ))}
             </tbody>
           </table>
           <p className="text-xs text-gray-400 mt-4 text-center">To add/edit products, please modify the db.ts initial data in this demo.</p>
        </div>
      )}
    </div>
  );
};