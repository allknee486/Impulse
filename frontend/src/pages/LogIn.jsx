import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LogIn() {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = validateForm();
    if (Object.keys(newErrors).length) return setErrors(newErrors);

    setLoading(true);
    const result = await login(formData.username, formData.password);
    setLoading(false);

    if (result.success) navigate('/dashboard');
    else {
      if (typeof result.error === 'object') setErrors(result.error);
      else setErrors({ submit: result.error });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-impulse-blue-light to-impulse-indigo-light flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-card p-8 w-full max-w-md">
        <h1 className="text-3xl font-heading font-bold text-impulse-gray-dark mb-2">
          Impulse
        </h1>
        <p className="text-impulse-gray mb-6">Track and control your spending</p>

        {authError && (
          <div className="alert-error">
            {typeof authError === 'string' ? authError : JSON.stringify(authError)}
          </div>
        )}
        {errors.submit && <div className="alert-error">{errors.submit}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-impulse-gray-dark">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`input ${errors.username ? 'input-error' : ''}`}
              placeholder="your_username"
              autoComplete="username"
            />
            {errors.username && <p className="text-impulse-red-dark text-sm mt-1">{errors.username}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-impulse-gray-dark">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && <p className="text-impulse-red-dark text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-impulse-gray mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-impulse-indigo font-semibold hover:text-impulse-indigo-dark">
            Sign up
          </Link>
        </p>

        <div className="mt-6 p-4 bg-impulse-blue-light border border-impulse-blue rounded-lg text-sm text-impulse-blue-dark">
          <p className="font-semibold mb-2">Demo Credentials:</p>
          <p>Username: <code className="bg-white px-1">demo</code></p>
          <p>Password: <code className="bg-white px-1">demo1234</code></p>
        </div>
      </div>
    </div>
  );
}
