import React from 'react';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#4a4a48] text-white py-4 border-t border-gray-700">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
        {/* Contact Information */}
        <div className="flex items-center space-x-4">
          <Mail className="h-5 w-5" />
          <span>contact@placementportal.com</span>
          <Phone className="h-5 w-5" />
          <span>+1 (555) 123-4567</span>
        </div>

        {/* Quick Links */}
        <div className="flex space-x-8">
          <Link to="/privacy" className="hover:text-indigo-300 transition">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-indigo-300 transition">
            Terms of Service
          </Link>
          <Link to="/help" className="hover:text-indigo-300 transition">
            Help
          </Link>
        </div>

        {/* Social Media */}
        <div className="flex space-x-4">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300 transition">
            <Facebook className="h-6 w-6" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300 transition">
            <Twitter className="h-6 w-6" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300 transition">
            <Linkedin className="h-6 w-6" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300 transition">
            <Instagram className="h-6 w-6" />
          </a>
        </div>
      </div>

      {/* <div className="mt-6 pt-4 text-center">
        <p>&copy; {currentYear} PlacementPortal. All rights reserved.</p>
      </div> */}
    </footer>
  );
};

export default Footer;
