import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [budgetAllocations, setBudgetAllocations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [budgetRes, transactionsRes, dashboardRes] = await Promise.all([
        apiClient.get('/budgets/summary/'),
        apiClient.get('/transactions/recent/'),
        apiClient.get('/dashboard/'),
      ]);

      setBudgetSummary(budgetRes.data);
      setRecentTransactions(transactionsRes.data);
      setDashboardMetrics(dashboardRes.data);

      // Fetch budget allocations if there's an active budget
      if (budgetRes.data?.active_budget?.id) {
        const allocationsRes = await apiClient.get(`/budgets/${budgetRes.data.active_budget.id}/allocations/`);
        setBudgetAllocations(allocationsRes.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleEditBudget = () => {
    navigate('/budget/edit');
  };

  const calculatePercentage = (spent, allocated) => {
    if (!allocated || allocated === 0) return 0;
    return Math.min((spent / allocated) * 100, 100);
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'bg-impulse-red';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-impulse-indigo"></div>
          <p className="mt-4 text-impulse-gray">Loading your budget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-impulse-gray-light">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-heading font-bold text-impulse-indigo cursor-pointer">
                Impulse
              </h1>
              <div className="flex gap-4 text-sm">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-impulse-indigo font-semibold border-b-2 border-impulse-indigo"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  className="text-impulse-gray hover:text-impulse-indigo"
                >
                  Analytics
                </button>
                <button
                  onClick={() => navigate('/transactions')}
                  className="text-impulse-gray hover:text-impulse-indigo"
                >
                  Transactions
                </button>
              </div>
            </div>

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
        {error && (
          <div className="alert-error mb-4">{error}</div>
        )}

        {/* Budget Overview Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-heading font-bold text-impulse-gray-dark">
              Budget Overview
            </h2>
            {budgetSummary?.active_budget && (
              <p className="text-impulse-gray mt-1">
                {budgetSummary.active_budget.name} • {budgetSummary.active_budget.start_date} to {budgetSummary.active_budget.end_date}
              </p>
            )}
          </div>
          
          {budgetSummary?.active_budget && (
            <button onClick={handleEditBudget} className="btn-primary">
              Edit Budget
            </button>
          )}
        </div>

        {!budgetSummary?.active_budget ? (
          // No Budget State
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-2xl font-semibold text-impulse-gray-dark mb-2">
              No Active Budget
            </h3>
            <p className="text-impulse-gray mb-6">
              Create your first budget to start tracking your expenses
            </p>
            <button
              onClick={() => navigate('/budget/setup')}
              className="btn-primary"
            >
              Create Budget
            </button>
          </div>
        ) : (
          <>
            {/* Impulse & Savings Metrics */}
            {dashboardMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500">
                  <p className="text-sm text-green-700 mb-1">Money Saved</p>
                  <p className="text-3xl font-bold text-green-700">
                    ${budgetSummary.remaining.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">From resisting impulses</p>
                </div>

                <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-500">
                  <p className="text-sm text-blue-700 mb-1">Current Streak</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {dashboardMetrics.streakDaysWithoutImpulse}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Day{dashboardMetrics.streakDaysWithoutImpulse !== 1 ? 's' : ''} without impulse buy
                  </p>
                </div>

                <div className="card bg-gradient-to-br from-red-50 to-red-50 border-2 border-red-500">
                  <p className="text-sm text-red-700 mb-1">Impulse Purchases</p>
                  <p className="text-3xl font-bold text-red-700">
                    {dashboardMetrics.impulsesResistedThisMonth}
                  </p>
                  <p className="text-xs text-red-600 mt-1">This month</p>
                </div>

                <div className="card">
                  <p className="text-sm text-impulse-gray mb-1">Quick Action</p>
                  <button
                    onClick={() => navigate('/analytics')}
                    className="w-full mt-2 bg-impulse-indigo text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    View Analytics
                  </button>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <p className="text-sm text-impulse-gray mb-1">Total Income</p>
                <p className="text-3xl font-bold text-impulse-gray-dark">
                  ${budgetSummary.total_income.toFixed(2)}
                </p>
              </div>

              <div className="card">
                <p className="text-sm text-impulse-gray mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-impulse-red">
                  ${budgetSummary.total_spent.toFixed(2)}
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getStatusColor(
                      (budgetSummary.total_spent / budgetSummary.total_income) * 100
                    )}`}
                    style={{
                      width: `${Math.min(
                        (budgetSummary.total_spent / budgetSummary.total_income) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="card">
                <p className="text-sm text-impulse-gray mb-1">Remaining</p>
                <p className="text-3xl font-bold text-green-600">
                  ${budgetSummary.remaining.toFixed(2)}
                </p>
                <p className="text-xs text-impulse-gray mt-1">
                  {((budgetSummary.remaining / budgetSummary.total_income) * 100).toFixed(1)}% of budget
                </p>
              </div>

              <div className="card">
                <p className="text-sm text-impulse-gray mb-1">Savings Rate</p>
                <p className="text-3xl font-bold text-impulse-indigo">
                  {((budgetSummary.remaining / budgetSummary.total_income) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Categories Breakdown */}
            <div className="card mb-8">
              <h3 className="text-xl font-semibold text-impulse-gray-dark mb-4">
                Spending by Category
              </h3>

              {budgetSummary.categories && budgetSummary.categories.length > 0 ? (
                <div className="space-y-4">
                  {budgetSummary.categories.map((category) => {
                    // Find the allocated amount for this category from budget allocations
                    const allocation = budgetAllocations.find(
                      alloc => alloc.category === category.id
                    );
                    const allocated = allocation ? parseFloat(allocation.allocated_amount) : 0;
                    const percentage = calculatePercentage(category.spent, allocated);

                    return (
                      <div key={category.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h4 className="font-semibold text-impulse-gray-dark">
                              {category.name}
                            </h4>
                            <p className="text-sm text-impulse-gray">
                              {category.transaction_count} transaction{category.transaction_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-impulse-gray-dark">
                              ${category.spent.toFixed(2)}
                            </p>
                            <p className="text-sm text-impulse-gray">
                              {allocated > 0 ? `of $${allocated.toFixed(2)}` : 'No allocation'}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${getStatusColor(percentage)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-impulse-gray mt-1 text-right">
                          {allocated > 0 ? `${percentage.toFixed(1)}% used` : 'No budget allocated'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-impulse-gray">
                  <p>No spending categories yet.</p>
                  <p className="text-sm mt-2">Start adding transactions to see your spending breakdown.</p>
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            {recentTransactions.length > 0 && (
              <div className="card mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-impulse-gray-dark">
                    Recent Transactions
                  </h3>
                  <button
                    onClick={() => navigate('/transactions')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center py-2 border-b last:border-b-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-impulse-gray-dark">
                            {transaction.description}
                          </h4>
                          {transaction.is_impulse && (
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                              Impulse
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-impulse-gray">
                          {transaction.category_name || 'Uncategorized'} •{' '}
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-impulse-gray-dark">
                          ${parseFloat(transaction.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => navigate('/transactions')}
                className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
              >
                <div className="text-4xl mb-2">💳</div>
                <h3 className="font-semibold text-impulse-gray-dark mb-1">
                  Transactions
                </h3>
                <p className="text-sm text-impulse-gray">
                  View and manage all transactions
                </p>
              </button>

              <button
                onClick={() => navigate('/transactions?form=impulse')}
                className="card hover:shadow-xl transition-all cursor-pointer text-left bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-500 hover:border-red-600"
              >
                <div className="text-4xl mb-2">⚡</div>
                <h3 className="font-semibold text-red-700 mb-1">
                  Log Impulse Buy
                </h3>
                <p className="text-sm text-red-600 font-medium">
                  Quick impulse purchase logging
                </p>
              </button>

              <button
                onClick={() => navigate('/budget/edit')}
                className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
              >
                <div className="text-4xl mb-2">💰</div>
                <h3 className="font-semibold text-impulse-gray-dark mb-1">
                  Edit Budget
                </h3>
                <p className="text-sm text-impulse-gray">
                  Adjust budget allocations
                </p>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}