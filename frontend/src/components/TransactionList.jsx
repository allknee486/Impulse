/**
 * TransactionList Component
 *
 * Displays a filterable, paginated list of transactions.
 * Includes search, category filter, budget filter, and date range filter.
 */

import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import TransactionItem from './TransactionItem';

const TransactionList = ({ onEdit, refreshTrigger }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [showImpulseOnly, setShowImpulseOnly] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data for filters
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Load categories and budgets for filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesRes, budgetsRes] = await Promise.all([
          apiClient.get('/categories/'),
          apiClient.get('/budgets/'),
        ]);

        // Handle paginated or direct array responses
        let categoriesData = categoriesRes.data;
        let budgetsData = budgetsRes.data;

        // Extract results from paginated response if needed
        if (categoriesData && typeof categoriesData === 'object' && 'results' in categoriesData) {
          categoriesData = categoriesData.results;
        }
        if (budgetsData && typeof budgetsData === 'object' && 'results' in budgetsData) {
          budgetsData = budgetsData.results;
        }

        // Ensure data is an array
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
      } catch (err) {
        console.error('Error fetching filter data:', err);
      }
    };

    fetchFilters();
  }, []);

  // Load transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query parameters
        const params = new URLSearchParams();

        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedBudget) params.append('budget', selectedBudget);
        if (showImpulseOnly) params.append('is_impulse', 'true');
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await apiClient.get(`/transactions/?${params.toString()}`);
        let data = response.data;

        // Handle paginated response
        if (data && typeof data === 'object' && 'results' in data) {
          // Paginated response from DRF
          data = data.results;
        }

        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.error('Transactions data is not an array:', data);
          data = [];
        }

        // Client-side search filter (for description/notes)
        if (searchTerm) {
          data = data.filter(
            (t) =>
              t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }

        // Client-side pagination
        const totalItems = data.length;
        setTotalPages(Math.ceil(totalItems / itemsPerPage));

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = data.slice(startIndex, endIndex);

        setTransactions(paginatedData);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [
    selectedCategory,
    selectedBudget,
    showImpulseOnly,
    startDate,
    endDate,
    searchTerm,
    currentPage,
    refreshTrigger,
  ]);

  const handleDelete = async (transaction) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await apiClient.delete(`/transactions/${transaction.id}/`);
      // Refresh the list
      setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('Failed to delete transaction');
    }
  };

  const handleToggleImpulse = async (transaction) => {
    try {
      if (transaction.is_impulse) {
        await apiClient.post(`/transactions/${transaction.id}/unmark_impulse/`);
      } else {
        await apiClient.post(`/transactions/${transaction.id}/mark_impulse/`);
      }

      // Update local state
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transaction.id ? { ...t, is_impulse: !t.is_impulse } : t
        )
      );
    } catch (err) {
      console.error('Error toggling impulse flag:', err);
      alert('Failed to update transaction');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBudget('');
    setShowImpulseOnly(false);
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search description or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Budget filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget
            </label>
            <select
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Budgets</option>
              {budgets.map((budget) => (
                <option key={budget.id} value={budget.id}>
                  {budget.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Impulse only checkbox */}
          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showImpulseOnly}
                onChange={(e) => setShowImpulseOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">
                Impulse purchases only
              </span>
            </label>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Transaction list */}
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onEdit={onEdit}
              onDelete={handleDelete}
              onToggleImpulse={handleToggleImpulse}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="px-4 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
