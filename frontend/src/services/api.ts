import axios from 'axios';

const API_URL = 'https://placement-wjf9.onrender.com/api';

// Admin Signup Function
export const signup = async (adminName, password) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, { adminName, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Signup failed';
  }
};
