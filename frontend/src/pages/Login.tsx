
// Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setIsAdmin } = useAuth(); // Use context to update isAdmin state

  // Function to handle login logic
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  try {
    const response = await fetch(`https://placement-web.onrender.com/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: formData.username,
        password: formData.password,
      }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json(); // Parse JSON response
    localStorage.setItem('token', data.token); // Store JWT in localStorage
    localStorage.setItem('userRole', 'admin'); // Store user role in localStorage
    setIsAdmin(true); // Update isAdmin state in context
    navigate('/Training'); // Redirect after successful login
  } catch (err) {
    //@ts-ignore
    setError(err.message || 'Login failed');
  }
};



return (
  <div className="min-h-screen bg-[#141414] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Sign in to your admin account
        </h2>
        <div className="mt-8 bg-black border border grey-700 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && <p className="text-red-500">{error}</p>}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white">
                Admin Name
              </label>
              <input
                id="username"
                type="text"
                required
                className="block w-full px-3 py-2 border rounded-md shadow-sm"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="block w-full px-3 py-2 border rounded-md shadow-sm"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <button type="submit" className="w-full bg-gray-600 text-white py-2 rounded-md">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

