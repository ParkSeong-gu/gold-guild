import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { DB } from './services/db';
import Layout from './components/Layout';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const fetchedUsers = DB.getUsers();
    setUsers(fetchedUsers);
    
    // If logged in, update current user object to reflect changes (gold, etc.)
    if (user) {
      const updatedUser = fetchedUsers.find(u => u.id === user.id);
      if (updatedUser) setUser(updatedUser);
    }
    setLoading(false);
  };

  const handleLogin = (selectedUser: User) => {
    setUser(selectedUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleReset = () => {
    if (confirm('Reset all data to default? This cannot be undone.')) {
      DB.reset();
    }
  };

  if (loading) return <div className="flex h-screen justify-center items-center">Loading...</div>;

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <span className="text-6xl">🏴‍☠️</span>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Classroom Gold
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Select a profile to login (Demo Mode)
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Teachers</h3>
                <div className="grid gap-2">
                  {users.filter(u => u.role === UserRole.TEACHER).map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleLogin(u)}
                      className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <span>{u.name}</span>
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Admin</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Students</h3>
                <div className="grid gap-2">
                  {users.filter(u => u.role === UserRole.STUDENT).map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleLogin(u)}
                      className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <div className="flex flex-col items-start">
                        <span>{u.name}</span>
                        <span className="text-xs text-gray-400">{u.studentId}</span>
                      </div>
                      <span className="text-yellow-600 font-bold">{u.currentGold} G</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <button 
                  onClick={handleReset}
                  className="w-full text-center text-xs text-red-500 hover:text-red-700 underline"
                >
                  Reset Demo Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App Layout
  return (
    <Layout user={user} onLogout={handleLogout}>
      {user.role === UserRole.TEACHER ? (
        <TeacherDashboard currentUser={user} refreshData={refreshData} />
      ) : (
        <StudentDashboard currentUser={user} refreshData={refreshData} />
      )}
    </Layout>
  );
};

export default App;