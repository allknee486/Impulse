import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

export default function BudgetEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budget, setBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allocations, setAllocations] = useState({});  // Map of category_id -> allocated_amount
  const [errors, setErrors] = useState({});
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkCategoryText, setBulkCategoryText] = useState('');

  useEffect(() => {
    fetchCurrentBudget();
  }, []);

  const fetchCurrentBudget = async () => {
    try {
      const budgetResponse = await apiClient.get('/budgets/active/');

      // Get first active budget from the list
      const activeBudgets = budgetResponse.data;
      if (!activeBudgets || activeBudgets.length === 0) {
        setBudget(null);
        setLoading(false);
        return;
      }

      const activeBudget = activeBudgets[0];
      setBudget(activeBudget);

      // Fetch categories and allocations in parallel
      const [categoriesResponse, allocationsResponse] = await Promise.all([
        apiClient.get('/categories/'),
        apiClient.get(`/budgets/${activeBudget.id}/allocations/`)
      ]);

      // Categories endpoint now returns array directly (pagination disabled)
      setCategories(categoriesResponse.data);

      // Convert allocations array to a map for easier lookup
      const allocationsMap = {};
      allocationsResponse.data.forEach(alloc => {
        allocationsMap[alloc.category] = alloc.allocated_amount;
      });
      setAllocations(allocationsMap);

    } catch (err) {
      console.error('Error fetching budget:', err);
      setErrors({ fetch: 'Failed to load budget' });
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetChange = (field, value) => {
    setBudget(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});

    try {
      // Save budget details
      await apiClient.put(`/budgets/${budget.id}/`, {
        name: budget.name,
        amount: parseFloat(budget.amount),
        start_date: budget.start_date,
        end_date: budget.end_date,
        is_active: budget.is_active
      });

      // Save allocations
      const allocationsArray = Object.entries(allocations)
        .map(([categoryId, amount]) => ({
          category: parseInt(categoryId),
          allocated_amount: parseFloat(amount) || 0
        }))
        .filter(alloc => alloc.allocated_amount > 0); // Only save non-zero allocations

      if (allocationsArray.length > 0) {
        await apiClient.post(`/budgets/${budget.id}/update_allocations/`, {
          allocations: allocationsArray
        });
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving budget:', err);
      setErrors({ submit: err.response?.data?.detail || 'Failed to save budget' });
    } finally {
      setSaving(false);
    }
  };

  const handleAllocationChange = (categoryId, value) => {
    setAllocations(prev => ({
      ...prev,
      [categoryId]: value
    }));
  };

  const handleCategoryAdd = async (categoryName) => {
    try {
      const response = await apiClient.post('/categories/', {
        name: categoryName
      });
      setCategories(prev => [...prev, response.data]);
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const handleBulkCategoryAdd = async () => {
    if (!bulkCategoryText.trim()) return;

    try {
      // Parse the text - split by newlines and filter empty lines
      const categoryNames = bulkCategoryText
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0)
        .map(name => ({ name }));

      if (categoryNames.length === 0) {
        setErrors({ bulk: 'Please enter at least one category name' });
        return;
      }

      // Call bulk create endpoint
      const response = await apiClient.post('/categories/bulk_create/', {
        categories: categoryNames
      });

      // Add newly created categories to the list
      if (response.data.created) {
        setCategories(prev => [...prev, ...response.data.created]);
      }

      // Close modal and reset
      setShowBulkAdd(false);
      setBulkCategoryText('');
      setErrors({});

      // Show success message if there were any errors
      if (response.data.errors && response.data.errors.length > 0) {
        console.warn('Some categories had errors:', response.data.errors);
      }
    } catch (err) {
      console.error('Error bulk adding categories:', err);
      setErrors({ bulk: err.response?.data?.error || 'Failed to add categories' });
    }
  };

  const handleCategoryDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await apiClient.delete(`/categories/${categoryId}/`);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    } catch (err) {
      console.error('Error deleting category:', err);
      setErrors({ category: 'Failed to delete category' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-impulse-indigo"></div>
          <p className="mt-4 text-impulse-gray">Loading budget...</p>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-impulse-gray-light flex items-center justify-center px-4">
        <div className="card text-center">
          <h2 className="text-2xl font-semibold text-impulse-gray-dark mb-4">
            No Active Budget Found
          </h2>
          <button onClick={() => navigate('/budget/setup')} className="btn-primary">
            Create Budget
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-impulse-gray-light">
      {/* Navigation */}
      <nav className="bg-white shadow-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-impulse-indigo hover:text-impulse-indigo-dark font-semibold"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-xl font-heading font-bold text-impulse-gray-dark">
              Edit Budget
            </h1>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-6">
        {errors.submit && (
          <div className="alert-error mb-4">{errors.submit}</div>
        )}
        {errors.fetch && (
          <div className="alert-error mb-4">{errors.fetch}</div>
        )}

        {/* Budget Details */}
        <div className="card mb-6">
          <h2 className="text-2xl font-semibold text-impulse-gray-dark mb-4">
            Budget Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-impulse-gray-dark mb-1">
                Budget Name
              </label>
              <input
                type="text"
                value={budget.name}
                onChange={(e) => handleBudgetChange('name', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-impulse-gray-dark mb-1">
                Monthly Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-impulse-gray">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budget.amount}
                  onChange={(e) => handleBudgetChange('amount', e.target.value)}
                  className="input pl-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-impulse-gray-dark mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={budget.start_date}
                  onChange={(e) => handleBudgetChange('start_date', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-impulse-gray-dark mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={budget.end_date}
                  onChange={(e) => handleBudgetChange('end_date', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Management */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-impulse-gray-dark">
              Categories
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const name = prompt('Enter new category name:');
                  if (name) handleCategoryAdd(name);
                }}
                className="text-impulse-indigo hover:text-impulse-indigo-dark font-semibold text-sm"
              >
                + Add Category
              </button>
              <button
                onClick={() => setShowBulkAdd(true)}
                className="px-4 py-2 bg-impulse-indigo text-white rounded-lg hover:bg-impulse-indigo-dark font-semibold text-sm"
              >
                Bulk Add
              </button>
            </div>
          </div>

          {errors.category && (
            <div className="alert-error mb-4">{errors.category}</div>
          )}

          <div className="space-y-3">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-impulse-indigo transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-impulse-gray-dark">
                      {category.name}
                    </p>
                    <p className="text-sm text-impulse-gray">
                      Created {new Date(category.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="w-40">
                    <label className="block text-xs text-impulse-gray mb-1">
                      Allocated
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-impulse-gray text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={allocations[category.id] || ''}
                        onChange={(e) => handleAllocationChange(category.id, e.target.value)}
                        className="input pl-7 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleCategoryDelete(category.id)}
                    className="text-impulse-red hover:text-impulse-red-dark transition p-2"
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-impulse-gray py-8">
                No categories yet. Add your first category to organize spending.
              </p>
            )}
          </div>

          {/* Show total allocated */}
          {categories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-impulse-gray-dark">Total Allocated:</span>
                <span className="text-xl font-bold text-impulse-indigo">
                  ${Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-impulse-gray">Budget Amount:</span>
                <span className="text-sm font-semibold">
                  ${parseFloat(budget?.amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-impulse-gray">Unallocated:</span>
                <span className={`text-sm font-semibold ${
                  (parseFloat(budget?.amount || 0) - Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)) < 0
                    ? 'text-impulse-red-dark'
                    : 'text-green-600'
                }`}>
                  ${(parseFloat(budget?.amount || 0) - Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-impulse-gray-dark rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-primary py-3"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </main>

      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-card p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-impulse-gray-dark mb-4">
              Bulk Add Categories
            </h3>

            <p className="text-sm text-impulse-gray mb-4">
              Enter one category name per line. Duplicate categories will be skipped automatically.
            </p>

            {errors.bulk && (
              <div className="alert-error mb-4">{errors.bulk}</div>
            )}

            <textarea
              value={bulkCategoryText}
              onChange={(e) => setBulkCategoryText(e.target.value)}
              className="input min-h-40 resize-y"
              placeholder="Food & Groceries&#10;Transportation&#10;Entertainment&#10;Healthcare"
              rows={8}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowBulkAdd(false);
                  setBulkCategoryText('');
                  setErrors({});
                }}
                className="flex-1 px-6 py-2 border-2 border-gray-300 text-impulse-gray-dark rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCategoryAdd}
                className="flex-1 btn-primary py-2"
              >
                Add Categories
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}