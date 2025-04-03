import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import { Search } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

type Student = {
  "Reg No": string;
  Year: number;
  section: string;
  [key: string]: any;
};

const PlacementPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("2023-2027");
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [columns, setColumns] = useState<string[]>(["Reg No", "Year", "Section"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regdNoSearch, setRegdNoSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`https://placement-wjf9.onrender.com/api/students/${activeTab}?timestamp=${new Date().getTime()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch ${activeTab} data`);
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data.students) && data.students.length > 0) {
          const allColumns = new Set<string>(["Reg No", "Year", "section"]);
          const processedStudents = data.students.map((student: Student) => {
            const updatedStudent = { ...student };
            const assessmentCategories = new Set<string>();
  
            Object.keys(student).forEach((key) => {
              allColumns.add(key);
              const match = key.match(/(.*?) Assessment \d+/);
              if (match) {
                assessmentCategories.add(match[1]);
              }
            });
  
            assessmentCategories.forEach((category) => {
              const assessments = Object.keys(student)
                .filter((key) => key.startsWith(category + " Assessment"))
                .map((key) => student[key] ?? 0);
  
              const total = assessments.reduce((sum, val) => sum + val, 0);
              const average = assessments.length > 0 ? (total / assessments.length).toFixed(2) : "0.00";
  
              updatedStudent[`${category} Total`] = total;
              updatedStudent[`${category} Average`] = average;
  
              allColumns.add(`${category} Total`);
              allColumns.add(`${category} Average`);
            });
  
            return updatedStudent;
          });
  
          setColumns([...allColumns]);
          setStudents(processedStudents);
          setFilteredStudents(processedStudents);

          const uniqueSections = [...new Set(processedStudents.map((student: { section: any; }) => student.section))];
          setSections(uniqueSections as string[]);
        } else {
          setStudents([]);
          setFilteredStudents([]);
          setSections([]);
          setError("No data available for this year");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError(error.message);
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => {
    let filtered = [...students];

    if (regdNoSearch) {
      filtered = filtered.filter(student => 
        student["Reg No"].toLowerCase().includes(regdNoSearch.toLowerCase())
      );
    }

    if (selectedSection) {
      filtered = filtered.filter(student => 
        student.section === selectedSection
      );
    }

    setFilteredStudents(filtered);
  }, [regdNoSearch, selectedSection, students]);

  const handleViewStudent = () => {
    const student = students.find(s => 
      s["Reg No"].toLowerCase() === regdNoSearch.toLowerCase().trim()
    );
    
    if (student) {
      setSearchError(null);
      navigate('/student-details', { 
        state: { 
          student: JSON.parse(JSON.stringify(student))
        } 
      });
    } else {
      setSearchError("No student found with this registration number");
    }
  };

  const handleDownloadCSV = () => {
    if (filteredStudents.length === 0) return;

    let csvContent = columns.join(",") + "\n";

    filteredStudents.forEach((student) => {
      const row = columns.map((col) => student[col] ?? "-").join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${activeTab.replace(" ", "_")}_Students.csv`);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex space-x-4 mb-6">
        {["2023-2027", "2022-2026", "2021-2025"].map((year) => (
          <button
            key={year}
            className={`px-4 py-2 rounded-lg text-white ${
              activeTab === year 
                ? "bg-gray-700 font-bold"
            : "bg-gray-400 hover:bg-gray-500"
            } transition-colors`}
            onClick={() => setActiveTab(year)}
          >
            {year}
          </button>
        ))}
      </div>
        
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <label htmlFor="regdSearch" className="block text-sm font-medium text-gray-700 mb-6">
            Search Registration Number
          </label>
          <div className="flex gap-10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="regdSearch"
                type="text"
                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2   focus:border-blue-500 outline-none"
                placeholder="Enter registration number..."
                value={regdNoSearch}
                onChange={(e) => {
                  setRegdNoSearch(e.target.value);
                  setSearchError(null);
                }}
              />
            </div>
            <button
              onClick={handleViewStudent}
              disabled={!regdNoSearch}
              className={`px-4 py-2 rounded-lg text-white ${
                regdNoSearch
                  ? "bg-gray-600 hover:bg-gray-800"
                  : "bg-gray-400 cursor-not-allowed"
              } transition-colors`}
            >
              View
            </button>
          </div>
          {searchError && (
            <p className="mt-1 text-sm text-red-600">{searchError}</p>
          )}
        </div>

        <div>
       
         
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-center">{error}</p>
        </div>
      )}

  

     
    </div>
  );
};
export default PlacementPortal;