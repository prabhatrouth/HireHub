import React, { useState } from 'react';
import { Button } from './ui/button';
import { Search, Sparkles, TrendingUp, ShieldCheck, Briefcase } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import { useNavigate } from 'react-router-dom';

const quickTags = ['Frontend', 'FullStack', 'React', 'Node.js', 'Python', 'Remote', 'Data Engineer'];

const HeroSection = () => {
    const [query, setQuery] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const searchJobHandler = (customQuery) => {
        const searchQuery = customQuery || query;
        if (!searchQuery) return;
        dispatch(setSearchedQuery(searchQuery));
        navigate('/browse');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            searchJobHandler();
        }
    };

    return (
        <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 bg-gradient-to-b from-purple-50/60 via-[#FAFAFB] to-[#FAFAFB]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* AI Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/80 border border-purple-200 text-[#6A38C2] text-xs sm:text-sm font-semibold mb-6 shadow-xs">
                    <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                    <span>Intelligent AI-Powered Job Matching & Recruitment Portal</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-4 sm:mb-6">
                    Connect With Your Dream Career with{' '}
                    <span className="bg-gradient-to-r from-[#6A38C2] via-purple-600 to-[#F83002] bg-clip-text text-transparent">
                        AI Precision
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                    Automated candidate scoring, smart skill verification, and instant recommendations matching top talent with high-growth companies.
                </p>

                {/* Search Bar */}
                <div className="w-full max-w-2xl mx-auto mb-6">
                    <div className="flex items-center bg-white border border-gray-200/90 shadow-md shadow-purple-500/5 rounded-full p-1.5 focus-within:ring-2 focus-within:ring-[#6A38C2]/30 focus-within:border-[#6A38C2] transition-all">
                        <div className="pl-3 sm:pl-4 text-gray-400">
                            <Search className="h-5 w-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Job title, technical skill, or keywords..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full px-3 py-2 text-sm sm:text-base text-gray-800 placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0"
                        />
                        <Button
                            onClick={() => searchJobHandler()}
                            className="rounded-full bg-[#6A38C2] hover:bg-[#582da5] text-white px-5 sm:px-7 py-2.5 h-auto text-sm sm:text-base font-semibold shrink-0 shadow-xs"
                        >
                            Find Jobs
                        </Button>
                    </div>
                </div>

                {/* Trending Quick Search Chips */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
                    <span className="font-semibold text-gray-700 flex items-center gap-1 mr-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#6A38C2]" />
                        Trending:
                    </span>
                    {quickTags.map((tag, idx) => (
                        <button
                            key={idx}
                            onClick={() => searchJobHandler(tag)}
                            className="px-2.5 py-1 rounded-full bg-white border border-gray-200/80 text-gray-600 hover:text-[#6A38C2] hover:border-purple-300 hover:bg-purple-50/50 transition-all font-medium"
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Platform Trust Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-10 pt-8 border-t border-gray-200/70 text-left">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-900">HireHub AI Engine</p>
                            <p className="text-[11px] text-gray-500">Automated resume & skill scoring</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-900">Direct Recruiter Portal</p>
                            <p className="text-[11px] text-gray-500">Applicant tracking & instant filter</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-900">Verified Companies</p>
                            <p className="text-[11px] text-gray-500">Curated opportunities & salaries</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
