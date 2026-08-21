import React from 'react';
import { Sparkles, Briefcase, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="border-t border-gray-200 bg-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#6A38C2] flex items-center justify-center text-white">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="font-extrabold text-gray-900 text-base">
                                Hire<span className="text-[#6A38C2]">Hub</span> <span className="text-[#F83002] font-black">AI</span>
                            </span>
                            <p className="text-xs text-gray-500">
                                Intelligent Job Recruitment & Applicant Tracking System
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-semibold text-gray-500">
                        <Link to="/" className="hover:text-[#6A38C2] transition-colors">Home</Link>
                        <Link to="/jobs" className="hover:text-[#6A38C2] transition-colors">Jobs</Link>
                        <Link to="/browse" className="hover:text-[#6A38C2] transition-colors">Browse</Link>
                    </div>

                    <p className="text-xs text-gray-400 text-center md:text-right">
                        &copy; {new Date().getFullYear()} HireHub AI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
