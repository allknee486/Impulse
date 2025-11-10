/**
 * Transactions Page
 *
 * Main page for transaction management with real-time updates.
 * Features:
 * - Add/edit/delete transactions
 * - Real-time WebSocket updates
 * - Filtering and search
 * - Running balance display
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TransactionForm from '../components/TransactionForm';
import ImpulseForm from '../components/ImpulseForm';
import TransactionList from '../components/TransactionList';
import apiClient from '../api/apiClient';

const Transactions = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('detailed'); // 'detailed' or 'impulse'
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [monthlyTotal, setMonthlyTotal] = useState(null);

  // Check for form type in URL params
  useEffect(() => {
    const formParam = searchParams.get('form');
    if (formParam === 'impulse') {
      setFormType('impulse');
      setShowForm(true);
      // Clear the param from URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // WebSocket connection for real-time updates
  const handleWebSocketMessage = useCallback((data) => {
    console.log('WebSocket update received:', data);

    if (data.type === 'transaction_update') {
      // Refresh the transaction list
      setRefreshTrigger((prev) => prev + 1);

      // Update budget summary if available
      if (data.budget_update) {
        setBudgetSummary((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            total_spent: data.budget_update.total_spent,
            remaining: data.budget_update.remaining,
          };
        });
      }
    } else if (data.type === 'budget_update') {
      // Full budget update
      setBudgetSummary(data.budget);
    }
  }, []);

  const { isConnected } = useWebSocket('/ws/transactions/', handleWebSocketMessage);

  // Load budget summary and monthly total
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const [budgetRes, monthlyRes] = await Promise.all([
          apiClient.get('/budgets/summary/'),
          apiClient.get('/transactions/monthly_total/'),
        ]);

        setBudgetSummary(budgetRes.data);
        setMonthlyTotal(monthlyRes.data);
      } catch (err) {
        console.error('Error fetching summary:', err);
      }
    };

    fetchSummary();
  }, [refreshTrigger]);

  const handleFormSuccess = () => {
    setShowForm(false);
    setFormType('detailed');
    setEditingTransaction(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormType('detailed');
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormType('detailed');
    setEditingTransaction(null);
  };

  const handleShowImpulseForm = () => {
    setFormType('impulse');
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleShowDetailedForm = () => {
    setFormType('detailed');
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1
                className="text-2xl font-heading font-bold text-impulse-indigo cursor-pointer"
                onClick={() => navigate('/dashboard')}
              >
                Impulse
              </h1>
              <div className="flex gap-4 text-sm">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-impulse-gray hover:text-impulse-indigo"
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
                  className="text-impulse-indigo font-semibold border-b-2 border-impulse-indigo"
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

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your expenses and track spending
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* WebSocket connection indicator */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-xs text-gray-600">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>

              {!showForm ? (
                <>
                  <button
                    onClick={handleShowImpulseForm}
                    className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 sm:px-6 py-2 rounded-md hover:from-red-700 hover:to-orange-700 transition-all font-semibold shadow-md flex items-center gap-2 text-sm sm:text-base"
                  >
                    <span>⚡</span>
                    <span className="hidden sm:inline">Add Impulse Buy</span>
                    <span className="sm:hidden">Impulse</span>
                  </button>
                  <button
                    onClick={handleShowDetailedForm}
                    className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-semibold shadow-md flex items-center gap-2 text-sm sm:text-base"
                  >
                    <span>📝</span>
                    <span className="hidden sm:inline">Add Detailed Transaction</span>
                    <span className="sm:hidden">Detailed</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Hide Form
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Monthly spending */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              This Month's Spending
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              ${monthlyTotal ? monthlyTotal.total_spent.toFixed(2) : '0.00'}
            </p>
            {monthlyTotal && (
              <p className="text-xs text-gray-500 mt-1">{monthlyTotal.month}</p>
            )}
          </div>

          {/* Budget remaining */}
          {budgetSummary && budgetSummary.active_budget && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Budget Total
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  ${budgetSummary.total_income.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {budgetSummary.active_budget.name}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Remaining
                </h3>
                <p
                  className={`text-3xl font-bold ${
                    budgetSummary.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ${budgetSummary.remaining.toFixed(2)}
                </p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      budgetSummary.remaining >= 0 ? 'bg-green-600' : 'bg-red-600'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (budgetSummary.total_spent / budgetSummary.total_income) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Transaction form */}
        {showForm && (
          <div className="mb-8">
            {formType === 'impulse' ? (
              <ImpulseForm
                onSuccess={handleFormSuccess}
                onCancel={handleCancelForm}
              />
            ) : (
              <TransactionForm
                transaction={editingTransaction}
                onSuccess={handleFormSuccess}
                onCancel={handleCancelForm}
              />
            )}
          </div>
        )}

        {/* Transaction list */}
        <TransactionList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default Transactions;
