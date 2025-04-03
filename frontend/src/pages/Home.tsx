import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Award } from 'lucide-react';

const Home = () => {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#f2d37e] text-black py-12">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Left Section - Text Content */}
          <div className="w-1/2 text-right">
            <h1 className="text-3xl md:text-3xl font-bold mb-4">
              Welcome to Training & Placement Portal
            </h1>
            <p className="text-lg md:text-xl mb-6">
              Your gateway to career opportunities and professional growth
            </p>
          </div>

          {/* Right Section - Image */}
          <div className="w-1/3 flex justify-left">
            <img src="src/public/img1.png" alt="Training & Placement" className="pt-4 w-full h-30 max-w-xs"/>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-black py">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black text-white p-6 rounded-lg shadow-md text-center">
              <div className="flex justify-center mb-4">
                <BookOpen className="h-12 w-12 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Training Programs</h3>
              <p className="text-white">
                Access comprehensive training materials and resources to enhance your skills
              </p>
            </div>

            <div className="bg-black text-white p-6 rounded-lg shadow-md text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Placement Support</h3>
              <p className="text-white">
                Get guidance and support for your career placement journey
              </p>
            </div>

            <div className="bg-black text-white p-6 rounded-lg shadow-md text-center">
              <div className="flex justify-center mb-4">
                <Award className="h-12 w-12 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Success Stories</h3>
              <p className="text-white">
                Learn from the experiences of successfully placed students
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;