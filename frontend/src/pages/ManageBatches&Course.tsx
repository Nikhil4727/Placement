import React from 'react';
import { PlusCircle, Trash2 } from "lucide-react";

interface Course {
  id: string ;
  coursename: string;
}

interface Year {
  id: string ;
  year: string;
}

interface ManageCoursesProps {
  courses: Course[];
  years: Year[];
  newCourse: string;
  setNewCourse: (value: string) => void;
  addCourse: () => void;
  deleteCourse: (id:string) => Promise<void>;
  newYear: string;
  setNewYear: (value: string) => void;
  addYear: () => void;
  deleteYear:   (id:string) => Promise<void>;
  showManagement?: boolean;
}

const ManageCourses: React.FC<ManageCoursesProps> = ({
  courses,
  years,
  newCourse,
  setNewCourse,
  addCourse,
  deleteCourse,
  newYear,
  setNewYear,
  addYear,
  deleteYear,
  showManagement = true
}) => {
  return showManagement ? (
    <>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Courses Management */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Manage Courses</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              placeholder="Enter course name"
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addCourse}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <PlusCircle size={20} />
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {courses.map((course) => (
              <li
                key={course.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <span>{course.coursename}</span>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Years Management */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Manage Years</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              placeholder="Enter year range (YYYY-YYYY)"
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addYear}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <PlusCircle size={20} />
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {years.map((year) => (
              <li
                key={year.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <span>{year.year}</span>
                <button
                  onClick={() => deleteYear(year.id)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  ) : (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid gap-6">
        {/* Year Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Year
          </label>
          <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Year</option>
            {years.map((year) => (
              <option key={year.id} value={year.year}>
                {year.year}
              </option>
            ))}
          </select>
        </div>

        {/* Course Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course
          </label>
          <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.coursename}>
                {course.coursename}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ManageCourses;