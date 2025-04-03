import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import { Search } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";

type Student = {
  "Reg No": string;
  Year: number;
  section: string;
  Batch?: string;
  course?: string;
  [key: string]: any;
};

const PlacementPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("2023-2027");
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [columns, setColumns] = useState<string[]>(["Reg No", "Batch"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regdNoSearch, setRegdNoSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedPercentageRange, setSelectedPercentageRange] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  
  const [years, setYears] = useState([{ id: '1', year: '2022-3022' }]);
  const [availableCourses, setAvailableCourses] = useState([{ id: '1', coursename: 'ss' }]);
  // Define available courses


  const percentageRanges = [
    { label: "All", value: "" },
    { label: "90-100%", value: "90-100" },
    { label: "80-90%", value: "80-90" },
    { label: "70-80%", value: "70-80" },
    { label: "60-70%", value: "60-70" },
    { label: "Below 60%", value: "0-60" },
  ];


  const setData = async() => {
    try {
      const res = await axios.get('https://placement-web.onrender.com/data');
      console.log(res.data);
      setAvailableCourses(res.data.courses);
      setYears(res.data.years);
    } catch(err) {
      console.log(err);
    }
  }
  useEffect(() => {
    setData();
    
  }, [])

  useEffect(() => {
    setLoading(true);
    setError(null);
    setStudents([]);
    setFilteredStudents([]);

    fetch(`https://placement-web.onrender.com/api/students/${activeTab}?timestamp=${new Date().getTime()}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch ${activeTab} data`);
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data.students) && data.students.length > 0) {
          const processedStudents = data.students.map((student: Student) => {
            const updatedStudent = {
              ...student,
              Batch: student.Batch || activeTab
            };

            // Initialize all course-related fields for all available courses
            availableCourses.forEach(course => {
              // Initialize metrics with default values
              (updatedStudent as any)[`${course.coursename} Total`] = 0;
              (updatedStudent as any)[`${course.coursename} Average`] = "0.00";
              (updatedStudent as any)[`${course.coursename} Percentage`] = "0.00";
              
              // Then calculate actual metrics if assessments exist
              const metrics = calculateCourseMetrics(updatedStudent, course.coursename);
              if (metrics.hasAssessments) {
                (updatedStudent as any)[`${course.coursename} Total`] = metrics.total;
                (updatedStudent as any)[`${course.coursename} Average`] = metrics.average;
                (updatedStudent as any)[`${course.coursename} Percentage`] = metrics.percentage;
              }
            });

            // Calculate overall percentage across all courses
            const overallMetrics = calculateOverallMetrics(updatedStudent);
            (updatedStudent as any)['Overall Percentage'] = overallMetrics.percentage;

            return updatedStudent;
          });

          setStudents(processedStudents);
          applyFilters(processedStudents);
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

  const calculateCourseMetrics = (student: Student, course: string) => {
    const assessmentKeys = Object.keys(student).filter(key =>
      key.toLowerCase().startsWith(course.toLowerCase() + " assessment")
    );

    const assessments = assessmentKeys
      .map(key => {
        const value = student[key];
        return typeof value === 'number' ? value :
          typeof value === 'string' && value !== '-' ? parseFloat(value) || 0 : 0;
      })
      .filter(val => !isNaN(val)); // Filter out NaN values

    const total = assessments.reduce((sum, val) => sum + val, 0);
    const average = assessments.length > 0 ? (total / assessments.length) : 0;
    const percentage = assessments.length > 0 ? (total / (assessments.length * 10)) * 100 : 0;

    return {
      total,
      average: average.toFixed(2),
      percentage: percentage.toFixed(2),
      hasAssessments: assessments.length > 0
    };
  };

  const calculateOverallMetrics = (student: Student) => {
    let totalScore = 0;
    let totalMaxScore = 0;
    let hasAnyAssessments = false;

    availableCourses.forEach(course => {
      const assessmentKeys = Object.keys(student).filter(key =>
        key.toLowerCase().startsWith(course.coursename.toLowerCase() + " assessment")
      );

      assessmentKeys.forEach(key => {
        const value = student[key];
        const numericValue = typeof value === 'number' ? value :
          typeof value === 'string' && value !== '-' ? parseFloat(value) || 0 : 0;
        
        if (!isNaN(numericValue)) {
          totalScore += numericValue;
          totalMaxScore += 10; // Assuming each assessment is out of 10
          hasAnyAssessments = true;
        }
      });
    });

    const percentage = hasAnyAssessments ? (totalScore / totalMaxScore) * 100 : 0;

    return {
      percentage: percentage.toFixed(2),
      hasAssessments: hasAnyAssessments
    };
  };

  const applyFilters = (studentsToFilter: Student[]) => {
    let result = [...studentsToFilter];
    
    // Basic columns that are always present
    let columnList = ["Reg No", "Batch"];

    // Filter by registration number
    if (regdNoSearch) {
      result = result.filter(student =>
        student["Reg No"].toLowerCase().includes(regdNoSearch.toLowerCase())
      );
    }

    // Create a map to store course columns
    const courseColumnGroups = new Map<string, Set<string>>();

    // Initialize column sets for each course
    availableCourses.forEach(course => {
      courseColumnGroups.set(course.coursename, new Set<string>());
    });

    // Process all students to identify all possible columns
    result.forEach(student => {
      // For each course, identify all assessment columns
      availableCourses.forEach(course => {
        // Skip if filtering by a specific course and this isn't it
        if (selectedCourse && course.coursename !== selectedCourse) {
          return;
        }

        // Get assessment columns for this course from this student
        const assessmentKeys = Object.keys(student).filter(key =>
          key.toLowerCase().startsWith(course.coursename.toLowerCase() + " assessment")
        );

        if (assessmentKeys.length > 0 || !selectedCourse) {
          // Add assessment columns to the corresponding course group
          const courseColumns = courseColumnGroups.get(course.coursename)!;
          assessmentKeys.forEach(key => courseColumns.add(key));
          
          // Always add metric columns for this course
          courseColumns.add(`${course.coursename} Total`);
          courseColumns.add(`${course.coursename} Average`);
          courseColumns.add(`${course.coursename} Percentage`);
        }
      });
    });

    // Apply percentage range filter if selected
    if (selectedPercentageRange && selectedPercentageRange !== "") {
      const [min, max] = selectedPercentageRange.split("-").map(Number);

      result = result.filter(student => {
        let percentageValue: number;

        if (selectedCourse) {
          // Use specific course percentage
          percentageValue = parseFloat(student[`${selectedCourse} Percentage`] || "0");
        } else {
          // Use overall percentage for "All Courses"
          percentageValue = parseFloat(student['Overall Percentage'] || "0");
        }

        return percentageValue >= min && percentageValue <= max;
      });
    }

    // Build the final columns list in the correct order
    const finalColumns: string[] = [...columnList];

    // If a specific course is selected, only add columns for that course
    if (selectedCourse) {
      const courseColumns = courseColumnGroups.get(selectedCourse);
      if (courseColumns && courseColumns.size > 0) {
        // First add assessment columns (sorted numerically if possible)
        const assessmentColumns = Array.from(courseColumns)
          .filter(col => col.includes("Assessment"))
          .sort((a, b) => {
            // Try to extract assessment numbers for better sorting
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
          });

        finalColumns.push(...assessmentColumns);

        // Then add total, average, percentage for this course
        finalColumns.push(`${selectedCourse} Total`);
        finalColumns.push(`${selectedCourse} Average`);
        finalColumns.push(`${selectedCourse} Percentage`);
      }
    } else {
      // For all courses view, add columns for each course in sequence
      for (const [course, courseColumns] of courseColumnGroups.entries()) {
        // First add assessment columns for this course
        const assessmentColumns = Array.from(courseColumns)
          .filter(col => col.includes("Assessment"))
          .sort((a, b) => {
            // Extract assessment numbers for better sorting
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
          });

        // Only add this course's columns if it has assessment data
        if (assessmentColumns.length > 0) {
          finalColumns.push(...assessmentColumns);
          
          // Then add total, average, percentage for this course
          finalColumns.push(`${course} Total`);
          finalColumns.push(`${course} Average`);
          finalColumns.push(`${course} Percentage`);
        }
      }
      
      // Add Overall Percentage at the end
      finalColumns.push('Overall Percentage');
    }

    setColumns(finalColumns);
    setFilteredStudents(result);
  };

  useEffect(() => {
    if (students.length > 0) {
      applyFilters(students);
    }
  }, [regdNoSearch, selectedCourse, selectedPercentageRange]);

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
      const row = columns.map((col) => {
        const value = student[col];
        if (col.includes("Percentage")) {
          return value ? `${value}%` : "0.00%";
        }
        return value ?? "-";
      }).join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${activeTab.replace(" ", "_")}_Students.csv`);
  };

  return (
    <div className="bg-black min-h-screen">
      <div className="p-[10vh] max-w-[95%] mx-auto bg-black">
        {/* Year tabs */}
        <div className="flex space-x-4 mb-6">
          {years.map((year) => (
            <button
              key={year.id}
              className={`px-4 py-2 rounded-lg text-white ${activeTab === year.year
                ? "bg-gray-600"
                : "bg-gray-400 hover:bg-gray-500"
                } transition-colors`}
              onClick={() => setActiveTab(year.year)}
            >
              {year.year}
            </button>
          ))}
        </div>

        {/* Search and filter section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleViewStudent();
                  }}
                />
              </div>
              <button
                onClick={handleViewStudent}
                disabled={!regdNoSearch}
                className={`px-4 py-2 rounded-lg text-white ${regdNoSearch
                  ? "bg-gray-700 hover:bg-gray-600"
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
            <label htmlFor="course" className="block text-sm font-medium text-white mb-2">
              Filter by Course
            </label>
            <select
              id="course"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">All Courses</option>
              {availableCourses.map((course) => (
                <option key={course.id} value={course.coursename}>
                  {course.coursename}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="percentage" className="block text-sm font-medium text-white mb-2">
              Filter by Percentage Range
            </label>
            <select
              id="percentage"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
              value={selectedPercentageRange}
              onChange={(e) => setSelectedPercentageRange(e.target.value)}
            >
              {percentageRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
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
        <div className="bg-gray-100 p-4 rounded-lg shadow-lg overflow-x-auto">
          {filteredStudents.length > 0 ? (
            <table className="w-full border-collapse border border-gray-300 min-w-[1200px]">
              <thead>
                <tr className="bg-gray-400">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className={`border p-2 whitespace-nowrap ${
                        col === "Reg No" ? "w-[120px]" :
                        col === "Batch" ? "w-[100px]" :
                        col === "Overall Percentage" ? "w-[150px] bg-gray-500 text-white" :
                        col.includes("Assessment") ? "w-[120px]" :
                        col.includes("Total") ? "w-[100px] bg-gray-300" :
                        col.includes("Average") ? "w-[120px] bg-gray-300" :
                        col.includes("Percentage") ? "w-[120px] bg-gray-300" : ""
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={index} className="text-center hover:bg-gray-200">
                    {columns.map((col) => (
                      <td
                        key={col}
                        className={`border p-2 ${
                          col === "Reg No" ? "font-medium" :
                          col === "Overall Percentage" ? "font-bold bg-gray-200" : 
                          col.includes("Total") ? "bg-gray-100 font-medium" :
                          col.includes("Average") ? "bg-gray-100" :
                          col.includes("Percentage") ? "bg-gray-100 font-medium" : ""
                        }`}
                      >
                        {col.includes("Percentage") ?
                          `${student[col] ?? "0.00"}%` :
                          (student[col] ?? "-")}
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