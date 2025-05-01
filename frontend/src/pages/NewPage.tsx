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
      const res = await axios.get('http://localhost:5000/data');
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

    fetch(`http://localhost:5000/api/students/${activeTab}?timestamp=${new Date().getTime()}`)
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








// import React, { useEffect, useState } from "react";
// import { saveAs } from "file-saver";
// import { Search, Edit } from "lucide-react";
// import { useNavigate } from 'react-router-dom';
// import axios from "axios";

// type Student = {
//   "Reg No": string;
//   Year: number;
//   section: string;
//   Batch?: string;
//   course?: string;
//   [key: string]: any;
// };

// const PlacementPortal: React.FC = () => {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState("2023-2027");
//   const [students, setStudents] = useState<Student[]>([]);
//   const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
//   const [columns, setColumns] = useState<string[]>(["Reg No", "Batch", "Actions"]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [regdNoSearch, setRegdNoSearch] = useState("");
//   const [selectedCourse, setSelectedCourse] = useState("");
//   const [selectedPercentageRange, setSelectedPercentageRange] = useState("");
//   const [searchError, setSearchError] = useState<string | null>(null);
//   const [years, setYears] = useState([{ id: '1', year: '2022-3022' }]);
//   const [availableCourses, setAvailableCourses] = useState([{ id: '1', coursename: 'ss' }]);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
//   const [editedAssessments, setEditedAssessments] = useState<Record<string, string>>({});
//   const [editBatch, setEditBatch] = useState("");
//   const [editCourse, setEditCourse] = useState("");

//   const percentageRanges = [
//     { label: "All", value: "" },
//     { label: "90-100%", value: "90-100" },
//     { label: "80-90%", value: "80-90" },
//     { label: "70-80%", value: "70-80" },
//     { label: "60-70%", value: "60-70" },
//     { label: "Below 60%", value: "0-60" },
//   ];

//   const setData = async () => {
//     try {
//       const res = await axios.get('http://localhost:5000/data');
//       setAvailableCourses(res.data.courses);
//       setYears(res.data.years);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   useEffect(() => {
//     setData();
//   }, []);

//   useEffect(() => {
//     fetchStudentData();
//   }, [activeTab]);

//   const fetchStudentData = async () => {
//     setLoading(true);
//     setError(null);
//     setStudents([]);
//     setFilteredStudents([]);

//     try {
//       const response = await fetch(`http://localhost:5000/api/students/${activeTab}?timestamp=${new Date().getTime()}`);
//       if (!response.ok) throw new Error(`Failed to fetch ${activeTab} data`);
      
//       const data = await response.json();
//       if (Array.isArray(data.students) && data.students.length > 0) {
//         const processedStudents = processStudentData(data.students);
//         setStudents(processedStudents);
//         applyFilters(processedStudents);
//       } else {
//         setError(`No data available for ${activeTab}`);
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setError(error instanceof Error ? error.message : 'Unknown error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const processStudentData = (students: Student[]) => {
//     return students.map(student => {
//       const updatedStudent = {
//         ...student,
//         Batch: student.Batch || activeTab
//       };

//       availableCourses.forEach(course => {
//         const metrics = calculateCourseMetrics(updatedStudent, course.coursename);
//         (updatedStudent as any)[`${course.coursename} Total`] = metrics.total;
//         (updatedStudent as any)[`${course.coursename} Average`] = metrics.average;
//         (updatedStudent as any)[`${course.coursename} Percentage`] = metrics.percentage;
//       });

//       (updatedStudent as any)['Overall Percentage'] = calculateOverallMetrics(updatedStudent).percentage;
//       return updatedStudent;
//     });
//   };

//   const calculateCourseMetrics = (student: Student, course: string) => {
//     const assessmentKeys = Object.keys(student).filter(key =>
//       key.toLowerCase().startsWith(course.toLowerCase() + " assessment")
//     );

//     const assessments = assessmentKeys
//       .map(key => {
//         const value = student[key];
//         if (typeof value === 'number') return value;
//         if (typeof value === 'string') {
//           const num = parseFloat(value);
//           return isNaN(num) ? 0 : num;
//         }
//         return 0;
//       })
//       .filter(val => !isNaN(val));

//     const total = assessments.reduce((sum, val) => sum + val, 0);
//     const average = assessments.length > 0 ? (total / assessments.length) : 0;
//     const percentage = assessments.length > 0 ? (total / (assessments.length * 10)) * 100 : 0;

//     return {
//       total,
//       average: average.toFixed(2),
//       percentage: percentage.toFixed(2),
//       hasAssessments: assessments.length > 0
//     };
//   };

//   const calculateOverallMetrics = (student: Student) => {
//     let totalScore = 0;
//     let totalMaxScore = 0;
//     let hasAnyAssessments = false;

//     availableCourses.forEach(course => {
//       const assessmentKeys = Object.keys(student).filter(key =>
//         key.toLowerCase().startsWith(course.coursename.toLowerCase() + " assessment")
//       );

//       assessmentKeys.forEach(key => {
//         const value = parseFloat(student[key]);
//         if (!isNaN(value)) {
//           totalScore += value;
//           totalMaxScore += 10;
//           hasAnyAssessments = true;
//         }
//       });
//     });

//     const percentage = hasAnyAssessments ? (totalScore / totalMaxScore) * 100 : 0;
//     return {
//       percentage: percentage.toFixed(2),
//       hasAssessments: hasAnyAssessments
//     };
//   };

//   const applyFilters = (studentsToFilter: Student[]) => {
//     let result = [...studentsToFilter];
    
//     if (regdNoSearch) {
//       result = result.filter(student =>
//         student["Reg No"].toLowerCase().includes(regdNoSearch.toLowerCase())
//       );
//     }

//     const courseColumnGroups = new Map<string, Set<string>>();
//     availableCourses.forEach(course => {
//       courseColumnGroups.set(course.coursename, new Set<string>());
//     });

//     result.forEach(student => {
//       availableCourses.forEach(course => {
//         if (selectedCourse && course.coursename !== selectedCourse) return;

//         const assessmentKeys = Object.keys(student).filter(key =>
//           key.toLowerCase().startsWith(course.coursename.toLowerCase() + " assessment")
//         );

//         if (assessmentKeys.length > 0 || !selectedCourse) {
//           const courseColumns = courseColumnGroups.get(course.coursename)!;
//           assessmentKeys.forEach(key => courseColumns.add(key));
//           courseColumns.add(`${course.coursename} Total`);
//           courseColumns.add(`${course.coursename} Average`);
//           courseColumns.add(`${course.coursename} Percentage`);
//         }
//       });
//     });

//     if (selectedPercentageRange && selectedPercentageRange !== "") {
//       const [min, max] = selectedPercentageRange.split("-").map(Number);
//       result = result.filter(student => {
//         const percentageValue = selectedCourse
//           ? parseFloat(student[`${selectedCourse} Percentage`] || "0")
//           : parseFloat(student['Overall Percentage'] || "0");
//         return percentageValue >= min && percentageValue <= max;
//       });
//     }

//     const finalColumns: string[] = ["Reg No", "Batch", "Actions"];
    
//     if (selectedCourse) {
//       const courseColumns = courseColumnGroups.get(selectedCourse);
//       if (courseColumns && courseColumns.size > 0) {
//         finalColumns.push(
//           ...Array.from(courseColumns)
//             .filter(col => col.includes("Assessment"))
//             .sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0)),
//           `${selectedCourse} Total`,
//           `${selectedCourse} Average`,
//           `${selectedCourse} Percentage`
//         );
//       }
//     } else {
//       for (const [course, courseColumns] of courseColumnGroups.entries()) {
//         const assessmentColumns = Array.from(courseColumns)
//           .filter(col => col.includes("Assessment"))
//           .sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0));

//         if (assessmentColumns.length > 0) {
//           finalColumns.push(
//             ...assessmentColumns,
//             `${course} Total`,
//             `${course} Average`,
//             `${course} Percentage`
//           );
//         }
//       }
//       finalColumns.push('Overall Percentage');
//     }

//     setColumns(finalColumns);
//     setFilteredStudents(result);
//   };

//   const handleSaveChanges = async () => {
//     if (!selectedStudent || !editBatch || !editCourse) {
//       alert("Please select both a batch and a course");
//       return;
//     }
  
//     try {
//       setLoading(true);
      
//       const updates = Object.entries(editedAssessments).reduce((acc, [key, value]) => {
//         if (key.toLowerCase().includes(editCourse.toLowerCase())) {
//           acc[key] = value;
//         }
//         return acc;
//       }, {} as Record<string, string>);
  
//       // Updated API endpoint URL
//       const response = await axios.put(
//         `http://localhost:5000/api/students/update-marks`, // Changed endpoint
//         {
//           regNo: selectedStudent["Reg No"],
//           batch: editBatch,
//           course: editCourse,
//           updates
//         }
//       );
  
//       if (response.data.success) {
//         // Refresh the data
//         await fetchStudentData();
//         setIsEditModalOpen(false);
//         alert("Marks updated successfully!");
//       } else {
//         alert(response.data.message || "Update failed");
//       }
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         console.error("API Error:", error.response?.data);
//         alert(`Update failed: ${error.response?.data?.message || error.message}`);
//       } else {
//         console.error("Unknown Error:", error);
//         alert("Failed to update marks due to an unknown error");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewStudent = () => {
//     const student = students.find(s =>
//       s["Reg No"].toLowerCase() === regdNoSearch.toLowerCase().trim()
//     );

//     if (student) {
//       setSearchError(null);
//       navigate('/student-details', {
//         state: {
//           student: JSON.parse(JSON.stringify(student))
//         }
//       });
//     } else {
//       setSearchError("No student found with this registration number");
//     }
//   };

//   const handleDownloadCSV = () => {
//     if (filteredStudents.length === 0) return;

//     let csvContent = columns.filter(col => col !== "Actions").join(",") + "\n";

//     filteredStudents.forEach((student) => {
//       const row = columns
//         .filter(col => col !== "Actions")
//         .map((col) => {
//           const value = student[col];
//           if (col.includes("Percentage")) {
//             return value ? `${value}%` : "0.00%";
//           }
//           return value ?? "-";
//         })
//         .join(",");
//       csvContent += row + "\n";
//     });

//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     saveAs(blob, `${activeTab.replace(" ", "_")}_Students.csv`);
//   };

//   return (
//     <div className="bg-black min-h-screen">
//       <div className="p-[10vh] max-w-[95%] mx-auto bg-black">
//         {/* Year tabs */}
//         <div className="flex space-x-4 mb-6">
//           {years.map((year) => (
//             <button
//               key={year.id}
//               className={`px-4 py-2 rounded-lg text-white ${
//                 activeTab === year.year ? "bg-gray-600" : "bg-gray-400 hover:bg-gray-500"
//               } transition-colors`}
//               onClick={() => setActiveTab(year.year)}
//             >
//               {year.year}
//             </button>
//           ))}
//         </div>

//         {/* Search and filter section */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//           <div className="relative">
//             <label htmlFor="regdSearch" className="block text-sm font-medium text-white mb-2">
//               Search Registration Number
//             </label>
//             <div className="flex gap-2">
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
//                 <input
//                   id="regdSearch"
//                   type="text"
//                   className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-blue-500 outline-none"
//                   placeholder="Enter registration number..."
//                   value={regdNoSearch}
//                   onChange={(e) => {
//                     setRegdNoSearch(e.target.value);
//                     setSearchError(null);
//                   }}
//                   onKeyPress={(e) => {
//                     if (e.key === 'Enter') handleViewStudent();
//                   }}
//                 />
//               </div>
//               <button
//                 onClick={handleViewStudent}
//                 disabled={!regdNoSearch}
//                 className={`px-4 py-2 rounded-lg text-white ${
//                   regdNoSearch ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-400 cursor-not-allowed"
//                 } transition-colors`}
//               >
//                 View
//               </button>
//             </div>
//             {searchError && <p className="mt-1 text-sm text-red-600">{searchError}</p>}
//           </div>

//           <div>
//             <label htmlFor="course" className="block text-sm font-medium text-white mb-2">
//               Filter by Course
//             </label>
//             <select
//               id="course"
//               className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
//               value={selectedCourse}
//               onChange={(e) => setSelectedCourse(e.target.value)}
//             >
//               <option value="">All Courses</option>
//               {availableCourses.map((course) => (
//                 <option key={course.id} value={course.coursename}>
//                   {course.coursename}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label htmlFor="percentage" className="block text-sm font-medium text-white mb-2">
//               Filter by Percentage Range
//             </label>
//             <select
//               id="percentage"
//               className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
//               value={selectedPercentageRange}
//               onChange={(e) => setSelectedPercentageRange(e.target.value)}
//             >
//               {percentageRanges.map((range) => (
//                 <option key={range.value} value={range.value}>
//                   {range.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         {/* Loading state */}
//         {loading && (
//           <div className="flex items-center justify-center p-8">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//             <span className="ml-3 text-gray-600">Loading data...</span>
//           </div>
//         )}

//         {/* Error state */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
//             <p className="text-red-700 text-center">{error}</p>
//           </div>
//         )}

//         {/* Data table */}
//         <div className="bg-gray-100 p-4 rounded-lg shadow-lg overflow-x-auto">
//           {filteredStudents.length > 0 ? (
//             <table className="w-full border-collapse border border-gray-300 min-w-[1200px]">
//               <thead>
//                 <tr className="bg-gray-400">
//                   {columns.map((col) => (
//                     <th
//                       key={col}
//                       className={`border p-2 whitespace-nowrap ${
//                         col === "Reg No" ? "w-[120px]" :
//                         col === "Batch" ? "w-[100px]" :
//                         col === "Actions" ? "w-[80px]" :
//                         col === "Overall Percentage" ? "w-[150px] bg-gray-500 text-white" :
//                         col.includes("Assessment") ? "w-[120px]" :
//                         col.includes("Total") ? "w-[100px] bg-gray-300" :
//                         col.includes("Average") ? "w-[120px] bg-gray-300" :
//                         col.includes("Percentage") ? "w-[120px] bg-gray-300" : ""
//                       }`}
//                     >
//                       {col}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredStudents.map((student, index) => (
//                   <tr key={index} className="text-center hover:bg-gray-200">
//                     {columns.map((col) => (
//                       <td
//                         key={col}
//                         className={`border p-2 ${
//                           col === "Reg No" ? "font-medium" :
//                           col === "Actions" ? "" :
//                           col === "Overall Percentage" ? "font-bold bg-gray-200" : 
//                           col.includes("Total") ? "bg-gray-100 font-medium" :
//                           col.includes("Average") ? "bg-gray-100" :
//                           col.includes("Percentage") ? "bg-gray-100 font-medium" : ""
//                         }`}
//                       >
//                         {col === "Actions" ? (
//                           <button
//                             onClick={() => {
//                               setSelectedStudent(student);
//                               setEditBatch(student.Batch || activeTab);
//                               setEditCourse(selectedCourse || "");
//                               setEditedAssessments({});
//                               setIsEditModalOpen(true);
//                             }}
//                             className="text-blue-500 hover:text-blue-700 flex items-center justify-center w-full"
//                           >
//                             <Edit size={18} />
//                           </button>
//                         ) : col.includes("Percentage") ? (
//                           `${student[col] ?? "0.00"}%`
//                         ) : (
//                           student[col] ?? "-"
//                         )}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           ) : (
//             !loading && (
//               <div className="text-center py-8">
//                 <p className="text-gray-500">
//                   {error || "No data available for the selected filters"}
//                 </p>
//               </div>
//             )
//           )}
//         </div>

//         {/* Download button */}
//         <div className="mt-6 text-center">
//           <button
//             onClick={handleDownloadCSV}
//             disabled={filteredStudents.length === 0}
//             className={`px-6 py-2 rounded-lg text-white ${
//               filteredStudents.length > 0
//                 ? "bg-gray-500 hover:bg-gray-600"
//                 : "bg-gray-400 cursor-not-allowed"
//             } transition-colors`}
//           >
//             Download CSV
//           </button>
//         </div>

//         {/* Edit Modal */}
//         {isEditModalOpen && selectedStudent && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
//               <h2 className="text-2xl font-bold mb-4">
//                 Edit Marks for {selectedStudent["Reg No"]}
//               </h2>
              
//               {/* Batch Selection */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Select Batch
//                 </label>
//                 <select
//                   value={editBatch}
//                   onChange={(e) => setEditBatch(e.target.value)}
//                   className="w-full p-2 border rounded"
//                   required
//                 >
//                   <option value="">Select Batch</option>
//                   {years.map(year => (
//                     <option key={year.id} value={year.year}>{year.year}</option>
//                   ))}
//                 </select>
//               </div>

//               {/* Course Selection */}
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Select Course
//                 </label>
//                 <select
//                   value={editCourse}
//                   onChange={(e) => setEditCourse(e.target.value)}
//                   className="w-full p-2 border rounded"
//                   required
//                 >
//                   <option value="">Select Course</option>
//                   {availableCourses.map(course => (
//                     <option key={course.id} value={course.coursename}>{course.coursename}</option>
//                   ))}
//                 </select>
//               </div>

//               {/* Assessment Inputs */}
//               <div className="space-y-4">
//                 {columns
//                   .filter(col => col.includes("Assessment") && 
//                     (!editCourse || col.toLowerCase().includes(editCourse.toLowerCase())))
//                   .map(col => (
//                     <div key={col}>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         {col}
//                       </label>
//                       <input
//                         type="number"
//                         className="w-full p-2 border rounded"
//                         value={editedAssessments[col] ?? selectedStudent[col] ?? ""}
//                         onChange={(e) => 
//                           setEditedAssessments(prev => ({
//                             ...prev,
//                             [col]: e.target.value
//                           }))
//                         }
//                         min="0"
//                         max="10"
//                         step="0.01"
//                       />
//                     </div>
//                   ))}
//               </div>

//               <div className="flex justify-end gap-3 mt-6">
//                 <button
//                   onClick={() => setIsEditModalOpen(false)}
//                   className="px-4 py-2 border rounded-lg hover:bg-gray-100"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSaveChanges}
//                   className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//                   disabled={!editBatch || !editCourse}
//                 >
//                   Save Changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PlacementPortal;









// import React, { useEffect, useState } from "react";
// import { saveAs } from "file-saver";
// import { Search, Edit } from "lucide-react";
// import { useNavigate } from 'react-router-dom';
// import axios from "axios";
// type Student = {
//   "Reg No": string;
//   Year: number;
//   section: string;
//   Batch?: string;
//   course?: string;
//   [key: string]: any;
// };
// const PlacementPortal: React.FC = () => {
//   const navigate = useNavigate();
//   const [activeTab, setActiveTab] = useState("2023-2027");
//   const [students, setStudents] = useState<Student[]>([]);
//   const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
//   const [columns, setColumns] = useState<string[]>(["Reg No", "Batch"]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [regdNoSearch, setRegdNoSearch] = useState("");
//   const [selectedCourse, setSelectedCourse] = useState("");
//   const [selectedPercentageRange, setSelectedPercentageRange] = useState("");
//   const [searchError, setSearchError] = useState<string | null>(null);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [editingStudent, setEditingStudent] = useState<Student | null>(null);
//   const [editCourse, setEditCourse] = useState("");
//   const [editAssessments, setEditAssessments] = useState<{[key: string]: string}>({});
//   const [updateSuccess, setUpdateSuccess] = useState(false);
//   const [updateError, setUpdateError] = useState<string | null>(null);
//   const [updateLoading, setUpdateLoading] = useState(false);
//   const [years, setYears] = useState([{ id: '1', year: '2022-3022' }]);
//   const [availableCourses, setAvailableCourses] = useState([{ id: '1', coursename: 'ss' }]);
//   const percentageRanges = [
//     { label: "All", value: "" },
//     { label: "90-100%", value: "90-100" },
//     { label: "80-90%", value: "80-90" },
//     { label: "70-80%", value: "70-80" },
//     { label: "60-70%", value: "60-70" },
//     { label: "Below 60%", value: "0-60" },
//   ];
//   const setData = async() => {
//     try {
//       const res = await axios.get('http://localhost:5000/data');
//       console.log(res.data);
//       setAvailableCourses(res.data.courses);
//       setYears(res.data.years);
//     } catch(err) {
//       console.log(err);
//     }
//   }
//   useEffect(() => {
//     setData();
//   }, [])
//   useEffect(() => {
//     setLoading(true);
//     setError(null);
//     setStudents([]);
//     setFilteredStudents([]);
//     fetch(`http://localhost:5000/api/students/${activeTab}?timestamp=${new Date().getTime()}`)
//       .then((response) => {
//         if (!response.ok) throw new Error(`Failed to fetch ${activeTab} data`);
//         return response.json();
//       })
//       .then((data) => {
//         if (Array.isArray(data.students) && data.students.length > 0) {
//           const processedStudents = data.students.map((student: Student) => {
//             const updatedStudent = {
//               ...student,
//               Batch: student.Batch || activeTab
//             };
//             availableCourses.forEach(course => {
//               (updatedStudent as any)[`${course.coursename} Total`] = 0;
//               (updatedStudent as any)[`${course.coursename} Average`] = "0.00";
//               (updatedStudent as any)[`${course.coursename} Percentage`] = "0.00";
//               const metrics = calculateCourseMetrics(updatedStudent, course.coursename);
//               if (metrics.hasAssessments) {
//                 (updatedStudent as any)[`${course.coursename} Total`] = metrics.total;
//                 (updatedStudent as any)[`${course.coursename} Average`] = metrics.average;
//                 (updatedStudent as any)[`${course.coursename} Percentage`] = metrics.percentage;
//               }
//             });
//             const overallMetrics = calculateOverallMetrics(updatedStudent);
//             (updatedStudent as any)['Overall Percentage'] = overallMetrics.percentage;
//             return updatedStudent;
//           });
//           setStudents(processedStudents);
//           applyFilters(processedStudents);
//         } else {
//           setError(`No data available for ${activeTab}`);
//         }
//       })
//       .catch((error) => {
//         console.error("Error fetching data:", error);
//         setError(error.message);
//       })
//       .finally(() => setLoading(false));
//   }, [activeTab]);
//   const calculateCourseMetrics = (student: Student, course: string) => {
//     const assessmentKeys = Object.keys(student).filter(key =>
//       key.toLowerCase().startsWith(course.toLowerCase() + " assessment")
//     );
//     const assessments = assessmentKeys
//       .map(key => {
//         const value = student[key];
//         return typeof value === 'number' ? value :
//           typeof value === 'string' && value !== '-' ? parseFloat(value) || 0 : 0;
//       })
//       .filter(val => !isNaN(val)); // Filter out NaN values
//     const total = assessments.reduce((sum, val) => sum + val, 0);
//     const average = assessments.length > 0 ? (total / assessments.length) : 0;
//     const percentage = assessments.length > 0 ? (total / (assessments.length * 10)) * 100 : 0;
//     return {
//       total,
//       average: average.toFixed(2),
//       percentage: percentage.toFixed(2),
//       hasAssessments: assessments.length > 0
//     };
//   };
//   const calculateOverallMetrics = (student: Student) => {
//     let totalScore = 0;
//     let totalMaxScore = 0;
//     let hasAnyAssessments = false;
//     availableCourses.forEach(course => {
//       const assessmentKeys = Object.keys(student).filter(key =>
//         key.toLowerCase().startsWith(course.coursename.toLowerCase() + " assessment")
//       );
//       assessmentKeys.forEach(key => {
//         const value = student[key];
//         const numericValue = typeof value === 'number' ? value :
//           typeof value === 'string' && value !== '-' ? parseFloat(value) || 0 : 0;
//         if (!isNaN(numericValue)) {
//           totalScore += numericValue;
//           totalMaxScore += 10; // Assuming each assessment is out of 10
//           hasAnyAssessments = true;
//         }
//       });
//     });
//     const percentage = hasAnyAssessments ? (totalScore / totalMaxScore) * 100 : 0;
//     return {
//       percentage: percentage.toFixed(2),
//       hasAssessments: hasAnyAssessments
//     };
//   };
//   const applyFilters = (studentsToFilter: Student[]) => {
//     let result = [...studentsToFilter];
//     let columnList = ["Reg No", "Batch", "Actions"]; 
//     if (regdNoSearch) {
//       result = result.filter(student =>
//         student["Reg No"].toLowerCase().includes(regdNoSearch.toLowerCase())
//       );
//     }
//     const courseColumnGroups = new Map<string, Set<string>>();
//     availableCourses.forEach(course => {
//       courseColumnGroups.set(course.coursename, new Set<string>());
//     });
//     result.forEach(student => {
//       availableCourses.forEach(course => {
//         if (selectedCourse && course.coursename !== selectedCourse) {
//           return;
//         }
//         const assessmentKeys = Object.keys(student).filter(key =>
//           key.toLowerCase().startsWith(course.coursename.toLowerCase() + " assessment")
//         );
//         if (assessmentKeys.length > 0 || !selectedCourse) {
//           const courseColumns = courseColumnGroups.get(course.coursename)!;
//           assessmentKeys.forEach(key => courseColumns.add(key));
//           courseColumns.add(`${course.coursename} Total`);
//           courseColumns.add(`${course.coursename} Average`);
//           courseColumns.add(`${course.coursename} Percentage`);
//         }
//       });
//     });
//     if (selectedPercentageRange && selectedPercentageRange !== "") {
//       const [min, max] = selectedPercentageRange.split("-").map(Number);
//       result = result.filter(student => {
//         let percentageValue: number;
//         if (selectedCourse) {
//           percentageValue = parseFloat(student[`${selectedCourse} Percentage`] || "0");
//         } else {
//           percentageValue = parseFloat(student['Overall Percentage'] || "0");
//         }
//         return percentageValue >= min && percentageValue <= max;
//       });
//     }
//     const finalColumns: string[] = [...columnList];
//     if (selectedCourse) {
//       const courseColumns = courseColumnGroups.get(selectedCourse);
//       if (courseColumns && courseColumns.size > 0) {
//         const assessmentColumns = Array.from(courseColumns)
//           .filter(col => col.includes("Assessment"))
//           .sort((a, b) => {
//             const numA = parseInt(a.replace(/\D/g, '')) || 0;
//             const numB = parseInt(b.replace(/\D/g, '')) || 0;
//             return numA - numB;
//           });
//         finalColumns.push(...assessmentColumns);
//         finalColumns.push(`${selectedCourse} Total`);
//         finalColumns.push(`${selectedCourse} Average`);
//         finalColumns.push(`${selectedCourse} Percentage`);
//       }
//     } else {
//       for (const [course, courseColumns] of courseColumnGroups.entries()) {
//         const assessmentColumns = Array.from(courseColumns)
//           .filter(col => col.includes("Assessment"))
//           .sort((a, b) => {
//             const numA = parseInt(a.replace(/\D/g, '')) || 0;
//             const numB = parseInt(b.replace(/\D/g, '')) || 0;
//             return numA - numB;
//           });
//         if (assessmentColumns.length > 0) {
//           finalColumns.push(...assessmentColumns);
//           finalColumns.push(`${course} Total`);
//           finalColumns.push(`${course} Average`);
//           finalColumns.push(`${course} Percentage`);
//         }
//       }
//       finalColumns.push('Overall Percentage');
//     }
//     setColumns(finalColumns);
//     setFilteredStudents(result);
//   };
//   useEffect(() => {
//     if (students.length > 0) {
//       applyFilters(students);
//     }
//   }, [regdNoSearch, selectedCourse, selectedPercentageRange]);
//   const handleViewStudent = () => {
//     const student = students.find(s =>
//       s["Reg No"].toLowerCase() === regdNoSearch.toLowerCase().trim()
//     );
//     if (student) {
//       setSearchError(null);
//       navigate('/student-details', {
//         state: {
//           student: JSON.parse(JSON.stringify(student))
//         }
//       });
//     } else {
//       setSearchError("No student found with this registration number");
//     }
//   };
//   const handleDownloadCSV = () => {
//     if (filteredStudents.length === 0) return;
//     let csvContent = columns.filter(col => col !== "Actions").join(",") + "\n";
//     filteredStudents.forEach((student) => {
//       const row = columns
//         .filter(col => col !== "Actions")
//         .map((col) => {
//           const value = student[col];
//           if (col.includes("Percentage")) {
//             return value ? `${value}%` : "0.00%";
//           }
//           return value ?? "-";
//         }).join(",");
//       csvContent += row + "\n";
//     });
//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     saveAs(blob, `${activeTab.replace(" ", "_")}_Students.csv`);
//   };
//   const handleEditClick = (student: Student) => {
//     setEditingStudent(student);
//     setEditCourse("");
//     setEditAssessments({});
//     setUpdateSuccess(false);
//     setUpdateError(null);
//     setShowEditModal(true);
//   };
//   const closeEditModal = () => {
//     setShowEditModal(false);
//     setEditingStudent(null);
//     setEditCourse("");
//     setEditAssessments({});
//     setUpdateSuccess(false);
//     setUpdateError(null);
//   };
//   const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const course = e.target.value;
//     setEditCourse(course);
//     if (editingStudent && course) {
//       const assessmentKeys = Object.keys(editingStudent).filter(key => 
//         key.toLowerCase().startsWith(course.toLowerCase() + " assessment")
//       );
//       const initialAssessments: {[key: string]: string} = {};
//       assessmentKeys.forEach(key => {
//         initialAssessments[key] = editingStudent[key]?.toString() || "0";
//       });
//       setEditAssessments(initialAssessments);
//     } else {
//       setEditAssessments({});
//     }
//   };
//   const handleAssessmentChange = (key: string, value: string) => {
//     setEditAssessments(prev => ({
//       ...prev,
//       [key]: value
//     }));
//   };
//   const handleSaveAssessments = async () => {
//     if (!editingStudent) return;
//     // In your handleSaveAssessments function:
// console.log("Student being edited:", {
//   "Reg No": editingStudent["Reg No"],
//   "Batch": editingStudent.Batch || activeTab
// });
//     // Log the student details first
//     console.log("Editing student:", editingStudent);
    
//     const updates = {
//       // Include multiple ways the backend might expect this field
//       regNo: editingStudent["Reg No"],
//       Regnumber: editingStudent["Reg No"],  // Match exact case from schema
//       "Reg No": editingStudent["Reg No"],   // Include with space as it appears in UI
//       batch: editingStudent.Batch || activeTab,
//       Batch: editingStudent.Batch || activeTab,  // Match schema case
//       assessments: editAssessments
//     };
    
//     console.log("Sending update request with:", updates);
//     setUpdateLoading(true);
    
//     try {
//       // Log the full request
//       console.log("Making POST request to:", 'http://localhost:5000/api/update-assessments');
      
//       const response = await axios.post('http://localhost:5000/api/update-assessments', updates);
//       console.log("Response received:", response);
    
//       if (response.status === 200) {
//         setUpdateSuccess(true);
//         const updatedStudents = students.map(student => {
//           if (student["Reg No"] === editingStudent["Reg No"]) {
//             const updatedStudent = { ...student };
//             Object.keys(editAssessments).forEach(key => {
//               updatedStudent[key] = parseFloat(editAssessments[key]) || 0;
//             });
//             if (editCourse) {
//               const metrics = calculateCourseMetrics(updatedStudent, editCourse);
//               updatedStudent[`${editCourse} Total`] = metrics.total;
//               updatedStudent[`${editCourse} Average`] = metrics.average;
//               updatedStudent[`${editCourse} Percentage`] = metrics.percentage;
//             }
//             const overallMetrics = calculateOverallMetrics(updatedStudent);
//             updatedStudent['Overall Percentage'] = overallMetrics.percentage;
//             return updatedStudent;
//           }
//           return student;
//         });
//         setStudents(updatedStudents);
//         applyFilters(updatedStudents);
//         setTimeout(() => {
//           closeEditModal();
//         }, 1500);
//       } else {
//         setUpdateError("Failed to update assessments");
//       }
//     } catch (error) {
//       console.error("Error updating assessments:", error);
//       let errorMessage = "An unexpected error occurred";
//       if (axios.isAxiosError(error)) {
//         // Handle Axios errors
//         errorMessage = error.response?.data?.message || 
//                       error.message || 
//                       "An error occurred while updating assessments";
//       } else if (error instanceof Error) {
//         // Handle standard Error objects
//         errorMessage = error.message;
//       }
//       setUpdateError(errorMessage);
//     } finally {
//       setUpdateLoading(false);
//     }
//   };
//   return (
//     <div className="bg-black min-h-screen">
//       <div className="p-[10vh] max-w-[95%] mx-auto bg-black">
//         {/* Year tabs */}
//         <div className="flex space-x-4 mb-6">
//           {years.map((year) => (
//             <button
//               key={year.id}
//               className={`px-4 py-2 rounded-lg text-white ${activeTab === year.year
//                 ? "bg-gray-600"
//                 : "bg-gray-400 hover:bg-gray-500"
//                 } transition-colors`}
//               onClick={() => setActiveTab(year.year)}
//             >
//               {year.year}
//             </button>
//           ))}
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//           <div className="relative">
//             <label htmlFor="regdSearch" className="block text-sm font-medium text-white mb-2">
//               Search Registration Number
//             </label>
//             <div className="flex gap-2">
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
//                 <input
//                   id="regdSearch"
//                   type="text"
//                   className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-blue-500 outline-none"
//                   placeholder="Enter registration number..."
//                   value={regdNoSearch}
//                   onChange={(e) => {
//                     setRegdNoSearch(e.target.value);
//                     setSearchError(null);
//                   }}
//                   onKeyPress={(e) => {
//                     if (e.key === 'Enter') handleViewStudent();
//                   }}
//                 />
//               </div>
//               <button
//                 onClick={handleViewStudent}
//                 disabled={!regdNoSearch}
//                 className={`px-4 py-2 rounded-lg text-white ${regdNoSearch
//                   ? "bg-gray-700 hover:bg-gray-600"
//                   : "bg-gray-400 cursor-not-allowed"
//                   } transition-colors`}
//               >
//                 View
//               </button>
//             </div>
//             {searchError && (
//               <p className="mt-1 text-sm text-red-600">{searchError}</p>
//             )}
//           </div>
//           <div>
//             <label htmlFor="course" className="block text-sm font-medium text-white mb-2">
//               Filter by Course
//             </label>
//             <select
//               id="course"
//               className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
//               value={selectedCourse}
//               onChange={(e) => setSelectedCourse(e.target.value)}
//             >
//               <option value="">All Courses</option>
//               {availableCourses.map((course) => (
//                 <option key={course.id} value={course.coursename}>
//                   {course.coursename}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label htmlFor="percentage" className="block text-sm font-medium text-white mb-2">
//               Filter by Percentage Range
//             </label>
//             <select
//               id="percentage"
//               className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
//               value={selectedPercentageRange}
//               onChange={(e) => setSelectedPercentageRange(e.target.value)}
//             >
//               {percentageRanges.map((range) => (
//                 <option key={range.value} value={range.value}>
//                   {range.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//         {loading && (
//           <div className="flex items-center justify-center p-8">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//             <span className="ml-3 text-gray-600">Loading data...</span>
//           </div>
//         )}
//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
//             <p className="text-red-700 text-center">{error}</p>
//           </div>
//         )}
//         <div className="bg-gray-100 p-4 rounded-lg shadow-lg overflow-x-auto">
//           {filteredStudents.length > 0 ? (
//             <table className="w-full border-collapse border border-gray-300 min-w-[1200px]">
//               <thead>
//                 <tr className="bg-gray-400">
//                   {columns.map((col) => (
//                     <th
//                       key={col}
//                       className={`border p-2 whitespace-nowrap ${
//                         col === "Reg No" ? "w-[120px]" :
//                         col === "Batch" ? "w-[100px]" :
//                         col === "Actions" ? "w-[100px]" :
//                         col === "Overall Percentage" ? "w-[150px] bg-gray-500 text-white" :
//                         col.includes("Assessment") ? "w-[120px]" :
//                         col.includes("Total") ? "w-[100px] bg-gray-300" :
//                         col.includes("Average") ? "w-[120px] bg-gray-300" :
//                         col.includes("Percentage") ? "w-[120px] bg-gray-300" : ""
//                       }`}
//                     >
//                       {col}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredStudents.map((student, index) => (
//                   <tr key={index} className="text-center hover:bg-gray-200">
//                     {columns.map((col) => (
//                       <td
//                         key={col}
//                         className={`border p-2 ${
//                           col === "Reg No" ? "font-medium" :
//                           col === "Overall Percentage" ? "font-bold bg-gray-200" : 
//                           col.includes("Total") ? "bg-gray-100 font-medium" :
//                           col.includes("Average") ? "bg-gray-100" :
//                           col.includes("Percentage") ? "bg-gray-100 font-medium" : ""
//                         }`}
//                       >
//                         {col === "Actions" ? (
//                           <button
//                             onClick={() => handleEditClick(student)}
//                             className="bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded-lg flex items-center mx-auto"
//                           >
//                             <Edit size={16} className="mr-1" /> Edit
//                           </button>
//                         ) : col.includes("Percentage") ? (
//                           `${student[col] ?? "0.00"}%`
//                         ) : (
//                           student[col] ?? "-"
//                         )}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           ) : (
//             !loading && (
//               <div className="text-center py-8">
//                 <p className="text-gray-500">
//                   {error || "No data available for the selected filters"}
//                 </p>
//               </div>
//             )
//           )}
//         </div>
//         <div className="mt-6 text-center">
//           <button
//             onClick={handleDownloadCSV}
//             disabled={filteredStudents.length === 0}
//             className={`px-6 py-2 rounded-lg text-white ${
//               filteredStudents.length > 0
//                 ? "bg-gray-500 hover:bg-gray-600"
//                 : "bg-gray-400 cursor-not-allowed"
//             } transition-colors`}
//           >
//             Download CSV
//           </button>
//         </div>
//       </div>
//       {showEditModal && editingStudent && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-semibold">
//                   Update Assessment Marks
//                 </h2>
//                 <button
//                   onClick={closeEditModal}
//                   className="text-gray-500 hover:text-gray-700"
//                 >
//                   ✕
//                 </button>
//               </div>
//               <div className="mb-4">
//                 <p className="font-medium">Student: {editingStudent["Reg No"]}</p>
//                 <p>Batch: {editingStudent.Batch}</p>
//               </div>
//               <div className="mb-4">
//                 <label htmlFor="editCourse" className="block text-sm font-medium mb-2">
//                   Select Course to Update
//                 </label>
//                 <select
//                   id="editCourse"
//                   className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
//                   value={editCourse}
//                   onChange={handleCourseChange}
//                 >
//                   <option value="">Select a course</option>
//                   {availableCourses.map((course) => (
//                     <option key={course.id} value={course.coursename}>
//                       {course.coursename}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               {editCourse && Object.keys(editAssessments).length > 0 ? (
//                 <div>
//                   <h3 className="font-medium mb-3">Assessment Marks:</h3>
//                   {Object.keys(editAssessments).sort((a, b) => {
//                     const numA = parseInt(a.replace(/\D/g, '')) || 0;
//                     const numB = parseInt(b.replace(/\D/g, '')) || 0;
//                     return numA - numB;
//                   }).map(key => (
//                     <div key={key} className="mb-3">
//                       <label htmlFor={key} className="block text-sm mb-1">
//                         {key.replace(`${editCourse} `, '')}
//                       </label>
//                       <input
//                         id={key}
//                         type="number"
//                         min="0"
//                         max="10"
//                         step="0.1"
//                         className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
//                         value={editAssessments[key]}
//                         onChange={(e) => handleAssessmentChange(key, e.target.value)}
//                       />
//                     </div>
//                   ))}
//                   <div className="mt-6 flex justify-end">
//                     <button
//                       onClick={handleSaveAssessments}
//                       disabled={updateLoading}
//                       className={`px-4 py-2 rounded-lg text-white ${
//                         updateLoading
//                           ? "bg-gray-400 cursor-not-allowed"
//                           : "bg-gray-600 hover:bg-gray-700"
//                       }`}
//                     >
//                       {updateLoading ? "Saving..." : "Save Changes"}
//                     </button>
//                   </div>
//                   {updateSuccess && (
//                     <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
//                       <p className="text-green-700 text-sm">Assessment marks updated successfully!</p>
//                     </div>
//                   )}
//                   {updateError && (
//                     <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
//                       <p className="text-red-700 text-sm">{updateError}</p>
//                     </div>
//                   )}
//                 </div>
//               ) : editCourse ? (
//                 <div className="p-4 bg-gray-50 rounded-lg text-center">
//                   <p className="text-gray-500">No assessments found for this course</p>
//                 </div>
//               ) : (
//                 <div className="p-4 bg-gray-50 rounded-lg text-center">
//                   <p className="text-gray-500">Please select a course to update assessments</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
// export default PlacementPortal;