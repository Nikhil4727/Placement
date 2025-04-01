import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import { Search } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

type Student = {
  "Reg No": string;
  Year: number;
  section: string;
  Batch?: string; // Added Batch to type definition
  [key: string]: any;
};

const PlacementPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("2023-2027");
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [columns, setColumns] = useState<string[]>(["Reg No", "Batch"]); // Updated initial columns
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regdNoSearch, setRegdNoSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setStudents([]);
    setFilteredStudents([]);
    setSections([]);
  
    fetch(`http://localhost:5000/api/students/${activeTab}?timestamp=${new Date().getTime()}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch ${activeTab} data`);
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data.students) && data.students.length > 0) {
          const displayedColumns = new Set<string>(["Reg No", "Batch"]);
          const processedStudents = data.students.map((student: Student) => {
            // Ensure Batch has a value - use the one from data or fallback to activeTab
            const updatedStudent = { 
              ...student,
              Batch: student.Batch || activeTab // This ensures Batch is never empty
            };
            
            const assessmentCategories = new Set<string>();

            Object.keys(student).forEach((key) => {
              if (key.includes("Assessment")) {
                displayedColumns.add(key);
              }

              const match = key.match(/(.*?) Assessment \d+/);
              if (match) assessmentCategories.add(match[1]);
            });

            assessmentCategories.forEach((category) => {
              const assessments = Object.keys(student)
                .filter((key) => key.startsWith(category + " Assessment"))
                .map((key) => student[key] ?? 0);

              const total = assessments.reduce((sum, val) => sum + val, 0);
              const average = assessments.length > 0 ? (total / assessments.length).toFixed(2) : "0.00";

              (updatedStudent as any)[`${category} Total`] = total;
              (updatedStudent as any)[`${category} Average`] = average;

              displayedColumns.add(`${category} Total`);
              displayedColumns.add(`${category} Average`);
            });

            return updatedStudent;
          });

          setColumns([...displayedColumns]);
          setStudents(processedStudents);
          setFilteredStudents(processedStudents);

          const uniqueSections = [...new Set(processedStudents.map((student: any) => student.section))];
          setSections(uniqueSections as string[]);
        } else {
          setError(`No data available for ${activeTab}`);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError(error.message);
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => {
    setFilteredStudents([]);
  }, []);

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
    <div className="bg-black">
      <div className="p-[11vh] max-w-6xl mx-auto bg-black">
        {/* Year tabs */}
        <div className="flex space-x-4 mb-6">
          {["2023-2027", "2022-2026", "2021-2025"].map((year) => (
            <button
              key={year}
              className={`px-4 py-2 rounded-lg text-white ${
                activeTab === year 
                  ? "bg-gray-600" 
                  : "bg-gray-400 hover:bg-gray-500"
              } transition-colors`}
              onClick={() => setActiveTab(year)}
            >
              {year}
            </button>
          ))}
        </div>
        
        {/* Search and filter section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <label htmlFor="regdSearch" className="block text-sm font-medium text-white mb-2">
              Search Registration Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="regdSearch"
                  type="text"
                  className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-blue-500 outline-none"
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
                    ? "bg-gray-700"
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
            <label htmlFor="section" className="block text-sm font-medium text-white mb-2">
              Filter by Section
            </label>
            <select
              id="section"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  Section {section}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading data...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}

        {/* Data table */}
        <div className="bg-gray-100 p-4 rounded-lg shadow-lg overflow-auto">
          {filteredStudents.length > 0 ? (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-400">
                  {columns.map((col) => (
                    <th key={col} className="border p-2 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={index} className="text-center">
                    {columns.map((col) => (
                      <td key={col} className="border p-2 whitespace-nowrap">
                        {student[col] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {error || "No data available for the selected filters"}
                </p>
              </div>
            )
          )}
        </div>

        {/* Download button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleDownloadCSV}
            disabled={filteredStudents.length === 0}
            className={`px-6 py-2 rounded-lg text-white ${
              filteredStudents.length > 0
                ? "bg-gray-500 hover:bg-gray-600"
                : "bg-gray-400 cursor-not-allowed"
            } transition-colors`}
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlacementPortal;