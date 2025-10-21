import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

export default function BudgetEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budget, setBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCurrentBudget();
  }, []);

  const fetchCurrentBudget = async () => {
    try {
      const [budgetResponse, categoriesResponse] = await Promise.all([
        apiClient.get('/budgets/current/'),
        apiClient.get('/categories/')
      ]);

      setBudget(budgetResponse.data);
      setCategories(categoriesResponse.data);
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
      await apiClient.put(`/budgets/${budget.id}/`, {
        name: budget.name,
        amount: parseFloat(budget.amount),
        start_date: budget.start_date,
        end_date: budget.end_date,
        is_active: budget.is_active
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving budget:', err);
      setErrors({ submit: err.response?.data?.detail || 'Failed to save budget' });
    } finally {
      setSaving(false);
    }
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
            <button
              onClick={() => {
                const name = prompt('Enter new category name:');
                if (name) handleCategoryAdd(name);
              }}
              className="text-impulse-indigo hover:text-impulse-indigo-dark font-semibold text-sm"
            >
              + Add Category
            </button>
          </div>

          {errors.category && (
            <div className="alert-error mb-4">{errors.category}</div>
          )}

          <div className="space-y-3">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:border-impulse-indigo transition"
                >
                  <div>
                    <p className="font-semibold text-impulse-gray-dark">
                      {category.name}
                    </p>
                    <p className="text-sm text-impulse-gray">
                      Created {new Date(category.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCategoryDelete(category.id)}
                    className="text-impulse-red hover:text-impulse-red-dark transition"
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
    </div>
  );
}