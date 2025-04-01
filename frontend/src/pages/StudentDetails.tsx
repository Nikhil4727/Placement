import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

const StudentDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const student = location.state?.student;
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');

  if (!student) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">No student data found</h2>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Portal
        </button>
      </div>
    );
  }

  // Extract assessment data
  const assessmentData: Record<string, { scores: { name: string, value: any }[], total?: number, average?: string }> = {};

  Object.keys(student).forEach((key) => {
    const match = key.match(/(.*?) Assessment (\d+)/);
    if (match) {
      const category = match[1];
      if (!assessmentData[category]) {
        assessmentData[category] = { scores: [] };
      }
      assessmentData[category].scores.push({ name: key, value: student[key] });
    } else if (key.includes("Total")) {
      const category = key.replace(" Total", "");
      if (assessmentData[category]) {
        assessmentData[category].total = student[key];
      }
    } else if (key.includes("Average")) {
      const category = key.replace(" Average", "");
      if (assessmentData[category]) {
        assessmentData[category].average = student[key];
      }
    }
  });

  // Overall performance calculation
  const overallScores = Object.entries(assessmentData).map(([category, data]) => ({
    category,
    total: data.total ?? 0,
    average: data.average ?? "N/A"
  }));

  const overallPercentage = overallScores.length
    ? (overallScores.reduce((sum, item) => sum + item.total, 0) / (overallScores.length * 100)) * 100
    : 0;

  const overallChartData = overallScores.map(({ category, total }) => ({
    name: category,
    Score: total
  }));

  const selectedCourseData = selectedCourse
    ? assessmentData[selectedCourse]?.scores.map(({ name, value }) => ({
        name,
        Score: value
      })) || []
    : [];

  return (
    <div className="flex min-h-screen bg-[#141414]">
      {/* Sidebar */}
      <div className="w-64 bg-[#141414] border border-gray-700 p-6 rounded-xl h-[80vh] sticky top-20 left-3 overflow-y-auto">
        <h1 className="text-xl font-bold text-white mb-6">Welcome</h1>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-400">Registration Number</p>
            <p className="text-white font-semibold">{student["Reg No"]}</p>
          </div>
        </div>

        {/* Courses Dropdown */}
        <div className="mt-6 border-t border-gray-700 pt-4">
          <button 
            onClick={() => setCoursesOpen(!coursesOpen)}
            className="w-full flex items-center justify-between py-2 text-white"
          >
            <span className="font-medium">Courses</span>
            {coursesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {coursesOpen && (
            <div className="mt-2 space-y-1">
              {Object.keys(assessmentData).map((course) => (
                <button
                  key={course}
                  onClick={() => setSelectedCourse(course)}
                  className={`w-full text-left py-2 px-3 rounded text-sm ${
                    selectedCourse === course ? 'bg-gray-700 text-blue-300' : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {course}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="absolute bottom-6 left-6 right-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Back to List
          </button>
        </div>
      </div>

      {/* Main Content - added top padding (pt-24) to push content down */}
      <div className="flex-1 p-8 pt-20 max-w-5xl mx-auto"> {/* Added max-w-5xl and mx-auto to constrain width */}
  <h1 className="text-2xl font-bold text-white mb-8">Overall Performance: {overallPercentage.toFixed(2)}%</h1>
  
  {!selectedCourse ? (
    <div className="space-y-8">
      {/* Performance Cards - now with constrained width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl"> {/* Added max-w-3xl */}
        {overallScores.map(({ category, total, average }) => (
          <div key={category} className="bg-[#83bcd6] rounded-lg p-5 shadow-lg border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
            <div className="flex justify-between mt-2">
              <p className="text-gray-700">Total: <span className="font-bold">{total}</span></p>
              <p className="text-gray-700">Avg: <span className="font-bold">{average}</span></p>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-4">
              <div 
                className="h-2 bg-blue-500 rounded-full" 
                style={{ width: `${total}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart with reduced width */}
      <div className="bg-white p-5 rounded-lg shadow-lg max-w-3xl mx-auto"> {/* Added max-w-3xl */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Comparison</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={overallChartData}
              margin={{ right: 30 }} // Reduced right margin
              barSize={30} // Reduced bar thickness
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Score" fill="#3182ce" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">
              {selectedCourse} Assessment Results
            </h2>

            {/* Assessment Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assessmentData[selectedCourse].scores.map(({ name, value }) => (
                    <tr key={name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Course Chart - Reduced Width */}
        <div className="bg-white p-5 rounded-lg shadow-lg max-w-3xl mx-auto"> {/* Added max-w-3xl and mx-auto */}
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Assessment Scores</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                 data={selectedCourseData}
                  margin={{ left: 20, right: 30 }}
                  barSize={28} 
              >
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}  
              />
                <YAxis 
                  width={40} 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="Score" 
                    fill="#34d399" 
                    radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetails;