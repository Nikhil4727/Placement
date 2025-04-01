// AuthContext.js
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext({
  isAdmin: false,
  setIsAdmin: (value: boolean) => {},
  checkLoginStatus: () => {}
});

import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAdmin, setIsAdmin] = useState(false);

  // Function to check if the user is logged in (e.g., by checking localStorage)
  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAdmin(true);
    }
  };

  return (
    <AuthContext.Provider value={{ isAdmin, setIsAdmin, checkLoginStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);