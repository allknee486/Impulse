import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function Analytics() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Analytics data states
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [spendingTrend, setSpendingTrend] = useState([]);
  const [impulseAnalysis, setImpulseAnalysis] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);

  // Color palette for charts
  const COLORS = [
    '#6366f1', // indigo
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#8b5cf6', // violet
    '#ef4444', // red
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [categoryRes, trendRes, impulseRes, summaryRes] = await Promise.all([
        apiClient.get('/analytics/spending_by_category/'),
        apiClient.get('/analytics/spending_trend/'),
        apiClient.get('/analytics/impulse_analysis/'),
        apiClient.get('/analytics/monthly_summary/'),
      ]);

      setSpendingByCategory(categoryRes.data);
      setSpendingTrend(trendRes.data);
      setImpulseAnalysis(impulseRes.data);
      setMonthlySummary(summaryRes.data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded shadow-lg border border-gray-200">
          <p className="font-semibold text-impulse-gray-dark">{label}</p>
          <p className="text-impulse-indigo">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded shadow-lg border border-gray-200">
          <p className="font-semibold text-impulse-gray-dark">{payload[0].name}</p>
          <p className="text-impulse-indigo">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-impulse-indigo"></div>
          <p className="mt-4 text-impulse-gray">Loading analytics...</p>
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
                  className="text-impulse-indigo font-semibold border-b-2 border-impulse-indigo"
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
        {error && <div className="alert-error mb-4">{error}</div>}

        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-heading font-bold text-impulse-gray-dark">
            Spending Analytics
          </h2>
          <p className="text-impulse-gray mt-1">
            Visualize your spending patterns and trends
          </p>
        </div>

        {/* Monthly Summary Cards */}
        {monthlySummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <p className="text-sm text-impulse-gray mb-1">Monthly Budget</p>
              <p className="text-3xl font-bold text-impulse-indigo">
                ${monthlySummary.total_budget.toFixed(2)}
              </p>
            </div>

            <div className="card">
              <p className="text-sm text-impulse-gray mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-impulse-red">
                ${monthlySummary.monthly_spending.toFixed(2)}
              </p>
              {monthlySummary.is_over_budget && (
                <p className="text-xs text-red-600 mt-1 font-semibold">
                  Over Budget!
                </p>
              )}
            </div>

            <div className="card">
              <p className="text-sm text-impulse-gray mb-1">Remaining</p>
              <p className="text-3xl font-bold text-green-600">
                ${monthlySummary.budget_remaining.toFixed(2)}
              </p>
            </div>

            <div className="card">
              <p className="text-sm text-impulse-gray mb-1">Impulse Spending</p>
              <p className="text-3xl font-bold text-orange-500">
                ${monthlySummary.impulse_spending.toFixed(2)}
              </p>
              <p className="text-xs text-impulse-gray mt-1">
                {monthlySummary.total_budget > 0
                  ? `${((monthlySummary.impulse_spending / monthlySummary.total_budget) * 100).toFixed(1)}% of budget`
                  : ''}
              </p>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Spending by Category - Pie Chart */}
          <div className="card">
            <h3 className="text-xl font-semibold text-impulse-gray-dark mb-4">
              Spending by Category
            </h3>
            {spendingByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.category}: $${entry.amount.toFixed(0)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="category"
                  >
                    {spendingByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-impulse-gray">
                <p>No spending data for this month</p>
              </div>
            )}
          </div>

          {/* Impulse vs Planned - Bar Chart */}
          {impulseAnalysis && (
            <div className="card">
              <h3 className="text-xl font-semibold text-impulse-gray-dark mb-4">
                Impulse vs Planned Spending
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: 'Planned',
                      amount: impulseAnalysis.planned_spending,
                    },
                    {
                      name: 'Impulse',
                      amount: impulseAnalysis.impulse_spending,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#6366f1">
                    {[
                      <Cell key="planned" fill="#10b981" />,
                      <Cell key="impulse" fill="#ef4444" />,
                    ]}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-sm text-impulse-gray">
                  {impulseAnalysis.impulse_count} impulse purchase
                  {impulseAnalysis.impulse_count !== 1 ? 's' : ''} this month (
                  {impulseAnalysis.impulse_percentage.toFixed(1)}% of total spending)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Spending Trend - Line Chart */}
        <div className="card mb-8">
          <h3 className="text-xl font-semibold text-impulse-gray-dark mb-4">
            30-Day Spending Trend
          </h3>
          {spendingTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={spendingTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2}
                  name="Daily Spending"
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-impulse-gray">
              <p>No spending trend data available</p>
            </div>
          )}
        </div>

        {/* Category Breakdown List */}
        {spendingByCategory.length > 0 && (
          <div className="card">
            <h3 className="text-xl font-semibold text-impulse-gray-dark mb-4">
              Category Breakdown
            </h3>
            <div className="space-y-3">
              {spendingByCategory
                .sort((a, b) => b.amount - a.amount)
                .map((category, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-semibold text-impulse-gray-dark">
                        {category.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-impulse-gray-dark">
                        ${category.amount.toFixed(2)}
                      </p>
                      {monthlySummary && (
                        <p className="text-xs text-impulse-gray">
                          {((category.amount / monthlySummary.monthly_spending) * 100).toFixed(1)}% of
                          total
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
