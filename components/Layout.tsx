import React from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🏴‍☠️</span>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                Classroom Gold
              </h1>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.role === UserRole.TEACHER ? 'Class Admin' : `ID: ${user.studentId}`}</div>
                </div>
                
                {user.role === UserRole.STUDENT && (
                  <div className="bg-yellow-100 px-3 py-1 rounded-full flex items-center border border-yellow-300">
                    <span className="mr-1 text-lg">🪙</span>
                    <span className="font-bold text-yellow-800">{user.currentGold}</span>
                  </div>
                )}

                <button 
                  onClick={onLogout}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;