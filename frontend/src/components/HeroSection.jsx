import React, { useState } from 'react';
import { Button } from './ui/button';
import { Search, Sparkles, TrendingUp, ShieldCheck, Briefcase, Bot, Video, Award, ArrowRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import { useNavigate, Link } from 'react-router-dom';

const quickTags = ['Frontend', 'FullStack', 'React', 'Node.js', 'Python', 'Remote', 'AI / ML', 'DevOps'];

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
        <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20 bg-gradient-to-b from-purple-100/50 via-slate-50 to-[#FAFAFC]">
            {/* Ambient subtle glow backdrop */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-purple-400/10 via-indigo-300/10 to-rose-300/10 blur-3xl pointer-events-none rounded-full" />

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                {/* AI Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-purple-200/90 text-[#6A38C2] text-xs sm:text-sm font-bold mb-6 shadow-sm shadow-purple-500/10 hover:border-purple-300 transition-all cursor-default">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6A38C2]"></span>
                    </span>
                    <span>Intelligent AI-Powered Job Matching & Live Video Hiring</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-5 sm:mb-6">
                    Land Your Next Career Move with{' '}
                    <span className="bg-gradient-to-r from-[#6A38C2] via-purple-600 to-[#F83002] bg-clip-text text-transparent">
                        AI Precision
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
                    Automated ATS resume scoring, smart skill verification, and instant recommendations matching high-growth tech talent with leading companies.
                </p>

                {/* Search Bar */}
                <div className="w-full max-w-2xl mx-auto mb-6">
                    <div className="flex flex-col sm:flex-row items-center bg-white border border-slate-200 shadow-lg shadow-purple-500/5 rounded-2xl sm:rounded-full p-2 sm:p-2 focus-within:ring-2 focus-within:ring-[#6A38C2]/25 focus-within:border-[#6A38C2] transition-all gap-2">
                        <div className="flex items-center w-full pl-3 text-slate-400">
                            <Search className="h-5 w-5 shrink-0 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by job title, skill (React, Python), or company..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full px-3 py-2 text-sm sm:text-base text-slate-800 placeholder-slate-400 bg-transparent border-none outline-none focus:ring-0"
                            />
                        </div>
                        <Button
                            onClick={() => searchJobHandler()}
                            className="w-full sm:w-auto rounded-xl sm:rounded-full bg-[#6A38C2] hover:bg-[#582da5] text-white px-6 sm:px-8 py-3 h-auto text-sm sm:text-base font-bold shrink-0 shadow-md shadow-purple-500/20 transition-all"
                        >
                            Find Jobs
                        </Button>
                    </div>
                </div>

                {/* Trending Quick Search Chips */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto mb-10">
                    <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#6A38C2]" />
                        Popular Searches:
                    </span>
                    {quickTags.map((tag, idx) => (
                        <button
                            key={idx}
                            onClick={() => searchJobHandler(tag)}
                            className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-[#6A38C2] hover:border-purple-300 hover:bg-purple-50/50 transition-all font-medium text-xs"
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Key Pillars Showcase Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto text-left">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6A38C2] flex items-center justify-center shrink-0 border border-purple-100 font-bold">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">AI Resume & Skill Audit</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Instant ATS score, match gaps & suggested bullet points.</p>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 font-bold">
                            <Video className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Live Video Interviewing</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">In-app video calls with scorecard rubrics & screenshare.</p>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 font-bold">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Direct Recruiter ATS</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Automated pipelines, multi-interviewer delegation & hiring.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;

