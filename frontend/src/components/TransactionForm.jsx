/**
 * TransactionForm Component
 *
 * Form for creating and editing transactions.
 * Supports budget and category selection, impulse flagging.
 */

import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const TransactionForm = ({ transaction, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    budget: '',
    category: '',
    amount: '',
    description: '',
    notes: '',
    transaction_date: new Date().toISOString().split('T')[0],
    is_impulse: false,
  });

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load budgets and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [budgetsRes, categoriesRes] = await Promise.all([
          apiClient.get('/budgets/active/'),
          apiClient.get('/categories/'),
        ]);

        setBudgets(budgetsRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Failed to load budgets and categories');
      }
    };

    fetchData();
  }, []);

  // Populate form if editing existing transaction
  useEffect(() => {
    if (transaction) {
      setFormData({
        budget: transaction.budget || '',
        category: transaction.category || '',
        amount: transaction.amount || '',
        description: transaction.description || '',
        notes: transaction.notes || '',
        transaction_date: transaction.transaction_date
          ? transaction.transaction_date.split('T')[0]
          : new Date().toISOString().split('T')[0],
        is_impulse: transaction.is_impulse || false,
      });
    }
  }, [transaction]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        budget: formData.budget || null,
        category: formData.category || null,
      };

      if (transaction) {
        // Update existing transaction
        await apiClient.put(`/transactions/${transaction.id}/`, submitData);
      } else {
        // Create new transaction
        await apiClient.post('/transactions/', submitData);
      }

      // Reset form
      setFormData({
        budget: '',
        category: '',
        amount: '',
        description: '',
        notes: '',
        transaction_date: new Date().toISOString().split('T')[0],
        is_impulse: false,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        {transaction ? 'Edit Transaction' : 'Add Transaction'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            maxLength="255"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Grocery shopping"
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Budget
          </label>
          <select
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a budget (optional)</option>
            {budgets.map((budget) => (
              <option key={budget.id} value={budget.id}>
                {budget.name} - ${budget.amount}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category (optional)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            name="transaction_date"
            value={formData.transaction_date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional notes..."
          />
        </div>


        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : transaction ? 'Update Transaction' : 'Add Transaction'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
