// import React from 'react';
// import { Link } from 'react-router-dom';
// import { BookOpen, Users, Award } from 'lucide-react';

// const Home = () => {
//   return (
//     <div className="bg-gray-50">
//       {/* Hero Section */}
//       <div className="bg-[#f2d37e] text-black py-12">
//         <div className="container mx-auto px-4 flex items-center justify-between">
//           {/* Left Section - Text Content */}
//           <div className="w-1/2 text-right">
//             <h1 className="text-3xl md:text-3xl font-bold mb-4">
//               Welcome to Training & Placement Portal
//             </h1>
//             <p className="text-lg md:text-xl mb-6">
//               Your gateway to career opportunities and professional growth
//             </p>
//           </div>

//           {/* Right Section - Image */}
//           <div className="w-1/3 flex justify-left">
//             <img src="./src/public/img1.png" alt="Training & Placement" className="pt-4 w-full h-30 max-w-xs"/>
//           </div>
//         </div>
//       </div>

//       {/* Features Section */}
//       <div className="bg-black py">
//         <div className="container mx-auto px-4">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             <div className="bg-black text-white p-6 rounded-lg shadow-md text-center">
//               <div className="flex justify-center mb-4">
//                 <BookOpen className="h-12 w-12 text-indigo-600" />
//               </div>
//               <h3 className="text-xl font-semibold mb-4">Training Programs</h3>
//               <p className="text-white">
//                 Access comprehensive training materials and resources to enhance your skills
//               </p>
//             </div>

//             <div className="bg-black text-white p-6 rounded-lg shadow-md text-center">
//               <div className="flex justify-center mb-4">
//                 <Users className="h-12 w-12 text-indigo-600" />
//               </div>
//               <h3 className="text-xl font-semibold mb-4">Placement Support</h3>
//               <p className="text-white">
//                 Get guidance and support for your career placement journey
//               </p>
//             </div>

//             <div className="bg-black text-white p-6 rounded-lg shadow-md text-center">
//               <div className="flex justify-center mb-4">
//                 <Award className="h-12 w-12 text-indigo-600" />
//               </div>
//               <h3 className="text-xl font-semibold mb-4">Success Stories</h3>
//               <p className="text-white">
//                 Learn from the experiences of successfully placed students
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;


import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Award } from 'lucide-react';

const Home = () => {
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-100 via-yellow-100 to-pink-100 py-16">
        <div className="container mx-auto px-6 flex flex-col-reverse lg:flex-row items-center justify-between gap-12">
          {/* Left Text Content */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">
              Welcome to the Training & Placement Portal
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8">
              Your gateway to career opportunities, industry connections, and professional growth.
            </p>
            <div className="flex justify-center lg:justify-start gap-4">
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition duration-300"
              >
                Get Started
              </Link>
              <Link
                to="/about"
                className="text-blue-600 hover:underline font-medium text-sm"
              >
                Learn More →
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="lg:w-1/2 flex justify-center">
            <img
              src="./src/public/img1.png"
              alt="Training & Placement"
              className="w-80 md:w-[400px] drop-shadow-xl rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            What We Offer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow">
              <div className="flex justify-center mb-4">
                <BookOpen className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Training Programs</h3>
              <p className="text-gray-600">
                Access curated training material, coding platforms, and skill-enhancing resources.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Placement Support</h3>
              <p className="text-gray-600">
                Resume building, mock interviews, company guidance & continuous mentoring.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition-shadow">
              <div className="flex justify-center mb-4">
                <Award className="h-12 w-12 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Success Stories</h3>
              <p className="text-gray-600">
                Get inspired by our alumni who secured placements at top companies.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
