import React, { useState, useEffect } from 'react';
import { User, Product, Quest, QuestSubmission, Transaction, TransactionType, getLevel, getLevelColor } from '../types';
import { DB } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface StudentDashboardProps {
  currentUser: User;
  refreshData: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentUser, refreshData }) => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'SHOP' | 'QUESTS'>('HOME');
  const [products, setProducts] = useState<Product[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [mySubmissions, setMySubmissions] = useState<QuestSubmission[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [submitText, setSubmitText] = useState('');
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadData = () => {
    setProducts(DB.getProducts());
    setQuests(DB.getQuests());
    const allSubs = DB.getSubmissions();
    setMySubmissions(allSubs.filter(s => s.studentId === currentUser.id));
    setTransactions(DB.getTransactions().filter(t => t.userId === currentUser.id));
  };

  const handleBuy = (product: Product) => {
    if (confirm(`Buy ${product.name} for ${product.price} Gold?`)) {
      const success = DB.buyProduct(currentUser.id, product.id);
      if (success) {
        alert('Purchase successful!');
        refreshData();
        loadData();
      } else {
        alert('Purchase failed. Check your balance or stock.');
      }
    }
  };

  const handleAcceptQuest = (questId: string) => {
    const success = DB.acceptQuest(questId, currentUser.id);
    if (success) {
      refreshData();
      loadData();
    } else {
      alert('Could not accept quest.');
    }
  };

  const handleSubmitQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestId) return;

    const sub: QuestSubmission = {
      id: Date.now().toString(),
      questId: selectedQuestId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      content: submitText,
      submittedAt: new Date().toISOString(),
      status: 'PENDING'
    };

    DB.submitQuest(sub);
    alert('Quest submitted for review!');
    setSubmitText('');
    setSelectedQuestId(null);
    refreshData();
    loadData();
  };

  const userLevel = getLevel(currentUser.totalEarnedGold);

  // Chart Data preparation
  const chartData = transactions
    .slice(0, 10)
    .reverse()
    .map(t => ({
      name: new Date(t.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
      amount: t.type === TransactionType.EARN ? t.amount : -t.amount,
      reason: t.reason
    }));

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {(['HOME', 'SHOP', 'QUESTS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-white border-b-2 border-indigo-500 text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab === 'HOME' ? '📊 Dashboard' : tab === 'SHOP' ? '🛒 Shop' : '📜 Guild Board'}
          </button>
        ))}
      </div>

      {/* HOME TAB */}
      {activeTab === 'HOME' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Main Stats */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">My Status</h3>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500">Current Gold</p>
                <p className="text-4xl font-bold text-yellow-500 flex items-center">
                  {currentUser.currentGold} <span className="text-2xl ml-1">🪙</span>
                </p>
              </div>
              <div className="text-right">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getLevelColor(userLevel)}`}>
                   {userLevel} Rank
                 </span>
                 <p className="text-xs text-gray-400 mt-1">Total Earned: {currentUser.totalEarnedGold}</p>
              </div>
            </div>
            
            <h4 className="font-medium text-gray-600 mb-2">Recent Activity</h4>
            <div className="space-y-3 h-48 overflow-y-auto">
              {transactions.length === 0 && <p className="text-sm text-gray-400">No activity yet.</p>}
              {transactions.slice(0, 5).map(t => (
                <div key={t.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <span className="truncate w-2/3">{t.reason}</span>
                  <span className={`font-bold ${t.type === TransactionType.EARN ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === TransactionType.EARN ? '+' : '-'}{t.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Gold History</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SHOP TAB */}
      {activeTab === 'SHOP' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                    {product.price} G
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{product.description}</p>
                <div className="text-xs text-gray-400">Stock: {product.stock} left</div>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => handleBuy(product)}
                  disabled={product.stock === 0 || currentUser.currentGold < product.price}
                  className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                    product.stock === 0 || currentUser.currentGold < product.price
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  }`}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUESTS TAB */}
      {activeTab === 'QUESTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Quests */}
          <div className="lg:col-span-2 space-y-4">
             <h3 className="font-bold text-gray-700">Available & Active Quests</h3>
             {quests.length === 0 && <p className="text-gray-500 italic">No quests posted.</p>}
             {quests.map(quest => {
               const isAccepted = quest.currentAssignees.includes(currentUser.id);
               const submission = mySubmissions.find(s => s.questId === quest.id);
               const isCompleted = submission?.status === 'APPROVED';
               const isPending = submission?.status === 'PENDING';

               return (
                 <div key={quest.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                   <div className="flex justify-between items-start">
                     <div>
                       <div className="flex items-center gap-2">
                         <h4 className="font-bold text-lg text-gray-900">{quest.title}</h4>
                         {isCompleted && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>}
                         {isPending && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Reviewing</span>}
                         {isAccepted && !submission && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Active</span>}
                       </div>
                       <p className="text-gray-600 mt-1">{quest.description}</p>
                       <div className="flex gap-4 mt-3 text-sm text-gray-500">
                         <span>💰 Reward: <span className="font-bold text-yellow-600">{quest.rewardGold} G</span></span>
                         <span>📅 Due: {quest.dueDate}</span>
                         <span>👥 Spots: {quest.currentAssignees.length}/{quest.maxAssignees}</span>
                       </div>
                       {submission?.status === 'REJECTED' && (
                         <div className="mt-3 bg-red-50 p-2 rounded text-sm text-red-700">
                           <strong>Teacher Feedback:</strong> {submission.feedback}
                         </div>
                       )}
                     </div>
                     <div className="flex flex-col items-end gap-2">
                        {!isAccepted && !isCompleted && (
                          <button
                            onClick={() => handleAcceptQuest(quest.id)}
                            disabled={quest.currentAssignees.length >= quest.maxAssignees}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              quest.currentAssignees.length >= quest.maxAssignees
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            Accept
                          </button>
                        )}
                        {isAccepted && !isCompleted && !isPending && (
                          <button
                            onClick={() => {
                              setSelectedQuestId(quest.id);
                              // Prefill if rejected
                              if (submission) setSubmitText(submission.content);
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            {submission ? 'Resubmit' : 'Submit'}
                          </button>
                        )}
                     </div>
                   </div>
                 </div>
               );
             })}
          </div>

          {/* Submission Form Sidebar */}
          <div className="lg:col-span-1">
             <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 sticky top-24">
                <h3 className="font-bold text-gray-800 mb-4">
                  {selectedQuestId ? 'Submit Quest' : 'Select a quest to submit'}
                </h3>
                {selectedQuestId ? (
                  <form onSubmit={handleSubmitQuest}>
                    <p className="text-sm text-gray-600 mb-2">
                      Submitting for: <span className="font-semibold">{quests.find(q => q.id === selectedQuestId)?.title}</span>
                    </p>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Description / Proof</label>
                      <textarea
                        required
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm p-2 border"
                        rows={4}
                        placeholder="I completed the task by..."
                        value={submitText}
                        onChange={(e) => setSubmitText(e.target.value)}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedQuestId(null)}
                        className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-indigo-600 rounded-lg text-sm text-white hover:bg-indigo-700"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    Accept a quest,<br/>then click Submit.
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};