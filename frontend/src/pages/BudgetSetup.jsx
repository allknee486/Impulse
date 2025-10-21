import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const PREDEFINED_CATEGORIES = [
  'Rent/Mortgage',
  'Food & Groceries',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Savings',
  'Disposable Income'
];

export default function BudgetSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [budgetData, setBudgetData] = useState({
    name: '',
    amount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    categories: PREDEFINED_CATEGORIES.map(name => ({ name, allocated: '' }))
  });

  const handleInputChange = (field, value) => {
    setBudgetData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleCategoryChange = (index, value) => {
    const newCategories = [...budgetData.categories];
    newCategories[index].allocated = value;
    setBudgetData(prev => ({ ...prev, categories: newCategories }));
  };

  const addCategory = () => {
    setBudgetData(prev => ({
      ...prev,
      categories: [...prev.categories, { name: '', allocated: '' }]
    }));
  };

  const removeCategory = (index) => {
    const newCategories = budgetData.categories.filter((_, i) => i !== index);
    setBudgetData(prev => ({ ...prev, categories: newCategories }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!budgetData.name.trim()) newErrors.name = 'Budget name is required';
    if (!budgetData.amount || budgetData.amount <= 0) newErrors.amount = 'Valid income amount is required';
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    const totalAllocated = budgetData.categories.reduce((sum, cat) =>
      sum + (parseFloat(cat.allocated) || 0), 0);

    if (totalAllocated > parseFloat(budgetData.amount)) {
      newErrors.categories = `Total allocated ($${totalAllocated.toFixed(2)}) exceeds budget ($${budgetData.amount})`;
    }

    budgetData.categories.forEach((cat, index) => {
      if (!cat.name.trim()) newErrors[`cat_${index}_name`] = 'Category name required';
      if (!cat.allocated || parseFloat(cat.allocated) < 0) newErrors[`cat_${index}_allocated`] = 'Valid amount required';
    });

    return newErrors;
  };

  const handleNext = () => {
    if (step === 1) {
      const stepErrors = validateStep1();
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
      // Auto-calculate end date (1 month from start)
      const start = new Date(budgetData.startDate);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
      setBudgetData(prev => ({ ...prev, endDate: end.toISOString().split('T')[0] }));
    }

    if (step === 2) {
      const stepErrors = validateStep2();
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
    }

    setStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    try {
      // Create budget
      const budgetResponse = await apiClient.post('/budgets/', {
        name: budgetData.name,
        amount: parseFloat(budgetData.amount),
        start_date: budgetData.startDate,
        end_date: budgetData.endDate,
        is_active: true,
        categories: budgetData.categories
          .filter(cat => cat.name.trim() && cat.allocated)
          .map(cat => ({
            category_name: cat.name,
            allocated_amount: parseFloat(cat.allocated)
          }))
      });

      // Create categories
      await apiClient.post('/categories/bulk-create/', {
        categories: budgetData.categories
          .filter(cat => cat.name.trim())
          .map(cat => ({ name: cat.name }))
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Budget creation error:', error);
      setErrors({ submit: error.response?.data?.detail || 'Failed to create budget' });
    } finally {
      setLoading(false);
    }
  };

  const totalAllocated = budgetData.categories.reduce((sum, cat) =>
    sum + (parseFloat(cat.allocated) || 0), 0);
  const remaining = parseFloat(budgetData.amount || 0) - totalAllocated;

  return (
    <div className="min-h-screen bg-gradient-to-br from-impulse-blue-light to-impulse-indigo-light flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-xl shadow-card p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-heading font-bold text-impulse-gray-dark">
            Setup Your Budget
          </h1>
          <p className="text-impulse-gray mt-2">
            Welcome {user?.first_name}! Let's create your first budget.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s === step ? 'bg-impulse-indigo text-white' :
                s < step ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-green-500' : 'bg-gray-300'}`} />}
            </div>
          ))}
        </div>

        {errors.submit && (
          <div className="alert-error mb-4">{errors.submit}</div>
        )}

        {/* Step 1: Budget Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Budget Information</h2>

            <div>
              <label className="block text-sm font-medium text-impulse-gray-dark mb-1">
                Budget Name
              </label>
              <input
                type="text"
                value={budgetData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="e.g., Monthly Budget January 2025"
              />
              {errors.name && <p className="text-impulse-red-dark text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-impulse-gray-dark mb-1">
                Monthly Income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-impulse-gray">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className={`input pl-8 ${errors.amount ? 'input-error' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="text-impulse-red-dark text-sm mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-impulse-gray-dark mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={budgetData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="input"
              />
            </div>
          </div>
        )}

        {/* Step 2: Category Allocation */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Allocate Your Budget</h2>
              <div className="text-right">
                <p className="text-sm text-impulse-gray">Total Budget</p>
                <p className="text-2xl font-bold text-impulse-indigo">${parseFloat(budgetData.amount).toFixed(2)}</p>
              </div>
            </div>

            {errors.categories && (
              <div className="alert-error">{errors.categories}</div>
            )}

            <div className="bg-impulse-blue-light p-4 rounded-lg mb-4">
              <div className="flex justify-between text-sm">
                <span>Allocated:</span>
                <span className="font-semibold">${totalAllocated.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span>Remaining:</span>
                <span className={`font-semibold ${remaining < 0 ? 'text-impulse-red-dark' : 'text-green-600'}`}>
                  ${remaining.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {budgetData.categories.map((category, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => {
                        const newCategories = [...budgetData.categories];
                        newCategories[index].name = e.target.value;
                        setBudgetData(prev => ({ ...prev, categories: newCategories }));
                      }}
                      className={`input ${errors[`cat_${index}_name`] ? 'input-error' : ''}`}
                      placeholder="Category name"
                    />
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-impulse-gray">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={category.allocated}
                        onChange={(e) => handleCategoryChange(index, e.target.value)}
                        className={`input pl-8 ${errors[`cat_${index}_allocated`] ? 'input-error' : ''}`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  {budgetData.categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCategory(index)}
                      className="text-impulse-red-dark hover:text-impulse-red p-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addCategory}
              className="text-impulse-indigo hover:text-impulse-indigo-dark font-semibold text-sm"
            >
              + Add Category
            </button>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Review Your Budget</h2>

            <div className="card bg-impulse-blue-light">
              <h3 className="font-semibold mb-2">Budget Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-semibold">{budgetData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Income:</span>
                  <span className="font-semibold">${parseFloat(budgetData.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Period:</span>
                  <span className="font-semibold">{budgetData.startDate} to {budgetData.endDate}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-3">Category Allocations</h3>
              <div className="space-y-2">
                {budgetData.categories.filter(cat => cat.name && cat.allocated).map((cat, index) => (
                  <div key={index} className="flex justify-between text-sm py-2 border-b last:border-b-0">
                    <span>{cat.name}</span>
                    <span className="font-semibold">${parseFloat(cat.allocated).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2">
                  <span>Total:</span>
                  <span>${totalAllocated.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button
              onClick={handlePrevious}
              disabled={loading}
              className="px-6 py-2 border-2 border-impulse-indigo text-impulse-indigo rounded-lg hover:bg-impulse-indigo hover:text-white transition"
            >
              Previous
            </button>
          )}

          <div className="flex-1" />

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="btn-primary px-8"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary px-8"
            >
              {loading ? 'Creating...' : 'Create Budget'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}