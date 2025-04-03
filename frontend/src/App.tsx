import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Placements from './pages/Placements';
import Training from './pages/Training';
import PerformanceCard from './pages/PerformanceCard';
import BLTraining from './pages/BLTraining';
import NewPage from './pages/NewPage';
import StudentDetails from './pages/StudentDetails';
import axios from 'axios';
import ManageCourses from './pages/ManageBatches&Course';

const AppWrapper = () => {
  const { checkLoginStatus } = useAuth();

  // Add state for ManageCourses component
  const [courses, setCourses] = useState([
    { id: '1', coursename: 'QALR' },
    { id: '2', coursename: 'AWS' }
  ]);
  const [newCourse, setNewCourse] = useState('');

  const [years, setYears] = useState([
    { id: '1', year: '2023-2027' },
    { id: '2', year: '2022-2026' }
  ]);
  const [newYear, setNewYear] = useState('');

  // Add functions for ManageCourses component
  const addCourse = () => {
    addCourses();
  };
  async function addCourses() {
    try {
      const response = await axios.post("https://placement-web.onrender.com/add-course", {
        coursename: newCourse
      })
      console.log(response.data);
      setData();
      setNewCourse('');
    } catch (err) {
      console.log(err);
    }
  }
  const deleteCourse = async (id: string) => {
    try {
      const response = await axios.delete("https://placement-web.onrender.com/delete-course", {
        data: { id }  
      });
      console.log(response.data.message); 

      setCourses(courses.filter(course => course.id !== id));
    } catch (err) {
      console.error('Error deleting course:', err);
    }
};


  const addYears = async () => {
    try {
      const response = await axios.post("https://placement-web.onrender.com/add-year", {
        year: newYear
      })
      console.log(response.data);
      setData();
      setNewYear('');
    } catch (err) {
      console.log(err);
    }
  }


  
  const addYear = () => {
    addYears();
  };

  const deleteYear = async (id: string) => {
    try {
      const response = await axios.delete("https://placement-web.onrender.com/delete-year", {
        data: { id }  // Sending 'id' in the request body
      });
      console.log(response.data.message);  // Success message from backend

      // Optionally, update the frontend state after deletion
      setYears(years.filter(year => year.id !== id));
    } catch (err) {
      console.error('Error deleting year:', err);
    }
};


  const setData = () => {
    axios.get('https://placement-web.onrender.com/data')
    .then(response => {
      // console.log(response.data);
      setCourses(response.data.courses);
      setYears(response.data.years);
      })
  }

  // Check login status when the app loads
  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  useEffect(() => {
    setData();
  },[])

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/placements" element={<Placements />} />
            <Route path="/student-details" element={<StudentDetails />} />
            <Route path="/training" element={<Training />} />
            <Route path="/PerformanceCard" element={<PerformanceCard />} />
            <Route path="/BLTraining" element={<BLTraining />} />
            <Route path="/new-page" element={<NewPage />} />
            <Route
              path='/course'
              element={
                <ManageCourses
                  courses={courses}
                  years={years}
                  newCourse={newCourse}
                  setNewCourse={setNewCourse}
                  addCourse={addCourse}
                  deleteCourse={deleteCourse}
                  newYear={newYear}
                  setNewYear={setNewYear}
                  addYear={addYear}
                  deleteYear={deleteYear}
                  showManagement={true}
                />
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
}

export default App;