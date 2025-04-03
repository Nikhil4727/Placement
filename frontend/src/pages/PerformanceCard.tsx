import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Upload, Download, Eye, Trash2, Filter, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

const EnhancedFileUploader: React.FC = () => {
  // File upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form data states
  const [formData, setFormData] = useState({
    year: '',
    course: '',
  });

  // File list states
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [years, setYears] = useState([{id:'1', year:'2022-3022'}]);
  const [courses, setCourses] = useState([{id:'1', coursename:'ss'}]);
  
  // Filter states
  const [filters, setFilters] = useState({
    year: 'All',
    course: 'All',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  // UI states
  const [activeView, setActiveView] = useState<'upload' | 'files'>('files');
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  // Options for dropdowns
  // const years = ;
  // const courses = ;
  const setData = async() => {
    try {
      const res = await axios.get('http://localhost:5000/data');
      console.log(res.data);
      setCourses(res.data.courses);
      setYears(res.data.years);
    } catch(err) {
      console.log(err);
    }
  }
  useEffect(() => {
    setData();
    
  }, [])
  // Filter options
  const yearOptions = ["All", ...years];
  const courseOptions = ["All", ...courses];

  // Fetch files on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  // Fetch files from the server
  const fetchFiles = async () => {
    setLoading(true);
    setFiles([]);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/files', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setError('Failed to load files. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !formData.year || !formData.course) {
      showNotification('Please select a file and fill all fields', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    const uploadData = new FormData();
    uploadData.append('file', selectedFile);
    uploadData.append('year', formData.year);
    uploadData.append('course', formData.course);

    try {
      const token = localStorage.getItem('token');
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      await axios.post('http://localhost:5000/api/upload', uploadData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      showNotification('File uploaded successfully!', 'success');
      setSelectedFile(null);
      setFormData({ year: '', course: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Refresh file list and switch to files view
      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
        setActiveView('files');
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      showNotification('Failed to upload file. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (filename: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/file/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      showNotification('File deleted successfully', 'success');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to delete file:', err);
      showNotification('Failed to delete file. Please try again.', 'error');
    }
  };

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Filter files based on selected filters
  const filteredFiles = files.filter(file => {
    return (
      (filters.year === 'All' || file.year === filters.year) &&
      (filters.course === 'All' || file.course === filters.course)
    );
  });

  return (
    <div className="absolute inset-0 bg-black">
    <div className="min-h-screen bg-black p-4 md:p-8">
    <div className="max-w-4xl mx-auto">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          <p>{notification.message}</p>
          <button 
            onClick={() => setNotification({ ...notification, show: false })}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <FileText className="h-20 w-8 mr-2 text-blue-600" />
          Training Dashboard
        </h1>
        <p className="text-white mt-2">
          Upload and manage files for different years and courses
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveView('files')}
              className={`${
                activeView === 'files'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
            >
              <FileText className="mr-2 h-5 w-5" />
              View Files
            </button>
            <button
              onClick={() => setActiveView('upload')}
              className={`${
                activeView === 'upload'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Files
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        {activeView === 'upload' ? (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Upload New File</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Select Year</option>
                  {
                  years.map(year => (
                    <option key={year.year} value={year.year}>{year.year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.coursename} value={course.coursename}>{course.coursename}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-blue-300 border-dashed rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 mb-3 text-blue-500" />
                    <p className="mb-2 text-lg text-blue-700 font-semibold">
                      <span className="font-bold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-blue-600">
                      PDF, DOCX, XLSX, PPTX (MAX. 10MB)
                    </p>
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
              {selectedFile && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm text-blue-700 font-medium">
                    Selected: {selectedFile.name}
                  </p>
                </div>
              )}
            </div>
            
            {isUploading && (
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
            
            <button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !formData.year || !formData.course}
              className={`mt-6 w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center ${
                isUploading || !selectedFile || !formData.year || !formData.course
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              <Upload className="w-5 h-5 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Files</h2>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-sm text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    name="year"
                    value={filters.year}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    {yearOptions.map(year => (
                      <option key={yea} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select
                    name="course"
                    value={filters.course}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    {courseOptions.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8 bg-red-50 rounded-lg">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <p className="text-lg">{error}</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center text-gray-500 py-16 bg-gray-50 rounded-lg">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-medium mb-2">No files found</p>
                <p className="text-gray-500">No files match your selected criteria</p>
                <button
                  onClick={() => setActiveView('upload')}
                  className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New File
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filename
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFiles.map((file) => (
                      <tr key={file._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-blue-500 mr-2" />
                            {file.filename}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {file.year}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {file.course}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-3">
                            <a
                              href={`http://localhost:5000/api/download/${file.filename}`}
                              download
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded-full transition-colors"
                              title="Download"
                            >
                              <Download className="h-5 w-5" />
                            </a>
                            <a
                              href={`http://localhost:5000/view/${file.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded-full transition-colors"
                              title="View"
                            >
                              <Eye className="h-5 w-5" />
                            </a>
                            <button
                              onClick={() => handleDeleteFile(file.filename)}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
    </div>
  );
};

export default EnhancedFileUploader;