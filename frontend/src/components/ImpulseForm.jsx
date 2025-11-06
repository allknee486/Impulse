/**
 * ImpulseForm Component
 *
 * Condensed form for quick impulse purchase logging.
 * Shows quick amount buttons and optional description.
 */

import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const ImpulseForm = ({ onSuccess, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const quickAmounts = [1, 5, 10, 20];

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
    setCustomAmount('');
  };

  const handleCustomChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    setAmount(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please select or enter an amount');
      setLoading(false);
      return;
    }

    try {
      // Get the most recent active budget
      const budgetsRes = await apiClient.get('/budgets/active/');
      const budgets = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];
      const recentBudget = budgets.length > 0 ? budgets[0] : null;

      // Get the Disposable Income category (or first available category)
      const categoriesRes = await apiClient.get('/categories/');
      const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
      const disposableCategory = categories.find(
        (c) => c.name.toLowerCase().includes('disposable') || c.name.toLowerCase().includes('misc')
      ) || (categories.length > 0 ? categories[0] : null);

      // Create transaction
      const submitData = {
        budget: recentBudget?.id || null,
        category: disposableCategory?.id || null,
        amount: parseFloat(amount),
        description: description || 'Impulse Purchase',
        notes: '',
        transaction_date: new Date().toISOString().split('T')[0],
        is_impulse: true,
      };

      await apiClient.post('/transactions/', submitData);

      // Reset form
      setAmount('');
      setCustomAmount('');
      setDescription('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error saving impulse transaction:', err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.amount?.[0] ||
          'Failed to save transaction'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg shadow-lg p-6 border-2 border-red-200">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">⚡</span>
        <div>
          <h2 className="text-2xl font-bold text-red-700">Quick Impulse Buy</h2>
          <p className="text-sm text-red-600">Fast track for impulse purchases</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            How much did you spend?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleQuickAmount(value)}
                className={`py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                  amount === value.toString() && !customAmount
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50'
                }`}
              >
                ${value}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Or enter a custom amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-semibold">
              $
            </span>
            <input
              type="number"
              value={customAmount}
              onChange={handleCustomChange}
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className={`w-full pl-10 pr-4 py-3 text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                customAmount
                  ? 'border-red-500 bg-white'
                  : 'border-gray-300 bg-white'
              }`}
            />
          </div>
        </div>

        {/* Optional Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            What did you buy? (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength="255"
            placeholder="e.g., Coffee, Snack, Impulse item..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Info Box */}
        <div className="bg-white border-2 border-red-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-red-700">Quick save:</span> This will be
            automatically marked as an impulse purchase and added to your most recent
            budget.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !amount}
            className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {loading ? 'Adding...' : '⚡ Add Impulse Buy'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-lg font-semibold border-2 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ImpulseForm;
