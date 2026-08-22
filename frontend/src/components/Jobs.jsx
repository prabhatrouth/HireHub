import React, { useEffect, useState } from 'react';
import Navbar from './shared/Navbar';
import FilterCard from './FilterCard';
import Job from './Job';
import RecommendedJobs from './RecommendedJobs';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Filter, Briefcase, Sparkles, SlidersHorizontal, X, FileCheck2, Search, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import Footer from './shared/Footer';

const Jobs = () => {
    const { allJobs, searchedQuery } = useSelector((store) => store.job);
    const { user } = useSelector((store) => store.auth);
    const [filterJobs, setFilterJobs] = useState(allJobs || []);
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [viewMode, setViewMode] = useState('all'); // 'all' | 'recommended'

    useEffect(() => {
        if (searchedQuery) {
            const query = searchedQuery.toLowerCase();
            const filteredJobs = (allJobs || []).filter((job) => {
                return (
                    job.title?.toLowerCase().includes(query) ||
                    job.description?.toLowerCase().includes(query) ||
                    job.location?.toLowerCase().includes(query) ||
                    (job.requirements || []).some((r) => r.toLowerCase().includes(query)) ||
                    job.company?.name?.toLowerCase().includes(query)
                );
            });
            setFilterJobs(filteredJobs);
        } else {
            setFilterJobs(allJobs || []);
        }
    }, [allJobs, searchedQuery]);

    return (
        <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
                {/* Header & View Switch Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#6A38C2] uppercase tracking-wider mb-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Discover Roles
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                            <span>Job Opportunities</span>
                            <span className="text-xs sm:text-sm font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                                {filterJobs.length} Available
                            </span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Browse open positions or switch to AI Recommended matches tailored to your profile
                        </p>
                    </div>

                    {/* View mode toggle pills */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                viewMode === 'all'
                                    ? 'bg-[#6A38C2] text-white shadow-md shadow-purple-500/20'
                                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            All Jobs ({filterJobs.length})
                        </button>

                        <button
                            onClick={() => setViewMode('recommended')}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                                viewMode === 'recommended'
                                    ? 'bg-[#6A38C2] text-white shadow-md shadow-purple-500/20'
                                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            AI Recommended
                        </button>

                        <Link to="/resume-checker">
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm font-bold gap-1.5 border-slate-200 rounded-xl h-10 px-3.5">
                                <FileCheck2 className="w-4 h-4 text-[#6A38C2]" />
                                ATS Checker
                            </Button>
                        </Link>

                        {/* Mobile Filter Toggle Button */}
                        {viewMode === 'all' && (
                            <div className="md:hidden">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowMobileFilter(!showMobileFilter)}
                                    className="text-xs font-bold flex items-center gap-1.5 border-slate-300 rounded-xl h-10 px-3.5"
                                >
                                    <SlidersHorizontal className="w-4 h-4 text-[#6A38C2]" />
                                    Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {viewMode === 'recommended' ? (
                    <RecommendedJobs embedded />
                ) : (
                    /* Main Content Layout */
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Sidebar Filter (Desktop) */}
                        <aside className="hidden md:block w-72 shrink-0">
                            <div className="sticky top-24">
                                <FilterCard />
                            </div>
                        </aside>

                        {/* Mobile Filter Modal / Drawer */}
                        {showMobileFilter && (
                            <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
                                <div className="bg-white w-5/6 max-w-sm h-full p-5 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
                                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
                                        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                                            <SlidersHorizontal className="w-4 h-4 text-[#6A38C2]" />
                                            Filter Opportunities
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowMobileFilter(false)}
                                            className="h-8 w-8 p-0 rounded-full"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <FilterCard onApply={() => setShowMobileFilter(false)} />
                                </div>
                            </div>
                        )}

                        {/* Right Side Job Cards Grid */}
                        <main className="flex-1 min-w-0">
                            {filterJobs.length <= 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#6A38C2] flex items-center justify-center mx-auto mb-4 border border-purple-100">
                                        <Briefcase className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">No jobs match your search</h3>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
                                        Try adjusting your search criteria or resetting filters to explore all active positions.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                    {filterJobs.map((job) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25 }}
                                            key={job?._id}
                                            className="h-full"
                                        >
                                            <Job job={job} />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </main>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Jobs;

