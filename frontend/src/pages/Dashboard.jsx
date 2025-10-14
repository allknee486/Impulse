import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-impulse-gray-light">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-heading font-bold text-impulse-indigo">
              Impulse
            </h1>

            <div className="flex items-center gap-4 text-impulse-gray-dark">
              <div>
                <span className="text-sm">Welcome, </span>
                <span className="font-semibold">
                  {user?.first_name || user?.username}
                </span>
              </div>

              <button onClick={handleLogout} className="btn-danger">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-6">
        <div className="card">
          <h2 className="text-3xl font-heading font-bold mb-4">Dashboard</h2>
          <p className="text-impulse-gray mb-6">
            Welcome to Impulse! This is your personal budget dashboard.
          </p>

          <div className="bg-impulse-blue-light border border-impulse-blue rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-impulse-blue-dark mb-2">
              User Information
            </h3>
            <ul className="space-y-1 text-impulse-blue-dark">
              <li><strong>Username:</strong> {user?.username}</li>
              <li><strong>Email:</strong> {user?.email}</li>
              <li><strong>Name:</strong> {user?.first_name} {user?.last_name}</li>
              <li><strong>User ID:</strong> {user?.id}</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="font-semibold mb-2">Coming Soon</h3>
              <p className="text-impulse-gray">Budget overview section</p>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-2">Coming Soon</h3>
              <p className="text-impulse-gray">Transaction tracking</p>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-2">Coming Soon</h3>
              <p className="text-impulse-gray">Analytics & Reports</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
