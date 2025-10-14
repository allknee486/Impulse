import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const navigate = useNavigate();
  const { register, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirm: '',
  });

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
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email format';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.passwordConfirm)
      newErrors.passwordConfirm = 'Passwords do not match';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = validateForm();
    if (Object.keys(newErrors).length) return setErrors(newErrors);

    setLoading(true);
    const result = await register(
      formData.username,
      formData.email,
      formData.firstName,
      formData.lastName,
      formData.password,
      formData.passwordConfirm
    );
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
        <p className="text-impulse-gray mb-6">Create your account</p>

        {authError && (
          <div className="alert-error">
            {typeof authError === 'string' ? authError : JSON.stringify(authError)}
          </div>
        )}
        {errors.submit && <div className="alert-error">{errors.submit}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-impulse-gray-dark">
              Username
            </label>
            <input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`input ${errors.username ? 'input-error' : ''}`}
              placeholder="your_username"
            />
            {errors.username && <p className="text-impulse-red-dark text-sm mt-1">{errors.username}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-impulse-gray-dark">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-impulse-red-dark text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-impulse-gray-dark">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`input ${errors.firstName ? 'input-error' : ''}`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-impulse-red-dark text-sm mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-impulse-gray-dark">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`input ${errors.lastName ? 'input-error' : ''}`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-impulse-red-dark text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-impulse-gray-dark">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-impulse-red-dark text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-impulse-gray-dark">
              Confirm Password
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              value={formData.passwordConfirm}
              onChange={handleChange}
              className={`input ${errors.passwordConfirm ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            {errors.passwordConfirm && (
              <p className="text-impulse-red-dark text-sm mt-1">{errors.passwordConfirm}</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-impulse-gray mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-impulse-indigo font-semibold hover:text-impulse-indigo-dark">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
