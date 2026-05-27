import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const LoginRegister = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        const response = await api.post('/auth/token', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        login(response.data.access_token);
        navigate('/');
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        await api.post('/auth/register', {
          email,
          password,
          full_name: fullName
        });
        // Auto login after register
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        const response = await api.post('/auth/token', formData);
        login(response.data.access_token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-3 text-gray-500">
            {isLogin ? 'Enter your details to access your account' : 'Join us to start shopping today'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md animate-slide-up">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                required
                className="input-field bg-gray-50"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
            <input
              type="email"
              required
              className="input-field bg-gray-50"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              required
              className="input-field bg-gray-50"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                required
                className="input-field bg-gray-50"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 disabled:opacity-70"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : isLogin ? (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                Sign Up
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setConfirmPassword('');
            }}
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
