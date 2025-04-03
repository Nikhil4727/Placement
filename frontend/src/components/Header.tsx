import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin, setIsAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setIsAdmin(role === 'admin');
  }, [setIsAdmin]);

  const handleSignOut = () => {
    setIsAdmin(false);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <header className="sticky top-0 left-0 w-full bg-[#383837] text-[#b3b0ad] shadow-md z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8" />
            <span className="font-bold text-xl">PlacementPortal</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/placements" className="hover:text-indigo-200 transition">Placements</Link>
            <Link to="/training" className="hover:text-indigo-200 transition">Training</Link>
            {isAdmin && (
              <>
                <Link to="/new-page" className="hover:text-indigo-200 transition">Dashboard</Link>
                <Link to="/course" className="hover:text-indigo-200 transition">Courses</Link>
              </>
            )}
          </nav>

          {isAdmin ? (
            <button
              onClick={handleSignOut}
              className="px-2 py-1 rounded-md bg-[#786748] text-[#fa9907] hover:bg-[#5a4c35]"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="px-6 py-2 rounded-md bg-[#786748] text-[#fa9907] hover:bg-[#5a4c35]"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
