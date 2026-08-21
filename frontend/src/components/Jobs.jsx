import React, { useEffect, useState } from 'react';
import Navbar from './shared/Navbar';
import FilterCard from './FilterCard';
import Job from './Job';
import RecommendedJobs from './RecommendedJobs';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Filter, Briefcase, Sparkles, SlidersHorizontal, X, FileCheck2 } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

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
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header & View Switch Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-[#6A38C2]" />
                            Job Opportunities
                            <span className="text-sm font-normal text-gray-500">
                                ({filterJobs.length} {filterJobs.length === 1 ? 'job' : 'jobs'} available)
                            </span>
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            Browse open positions or switch to AI Recommended matches tailored to your profile
                        </p>
                    </div>

                    {/* View mode toggle pills */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                viewMode === 'all'
                                    ? 'bg-[#6A38C2] text-white shadow-xs'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            All Jobs ({filterJobs.length})
                        </button>

                        <button
                            onClick={() => setViewMode('recommended')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                viewMode === 'recommended'
                                    ? 'bg-[#6A38C2] text-white shadow-xs'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            AI Recommended
                        </button>

                        <Link to="/resume-checker">
                            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-gray-200">
                                <FileCheck2 className="w-3.5 h-3.5 text-[#6A38C2]" />
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
                                    className="text-xs flex items-center gap-1.5 border-gray-300"
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
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
                            <div className="sticky top-20">
                                <FilterCard />
                            </div>
                        </aside>

                        {/* Mobile Filter Modal / Drawer */}
                        {showMobileFilter && (
                            <div className="md:hidden fixed inset-0 z-50 bg-black/40 flex justify-end">
                                <div className="bg-white w-5/6 max-w-sm h-full p-4 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
                                        <h3 className="font-bold text-base text-gray-900">Job Filters</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowMobileFilter(false)}
                                            className="h-8 w-8 p-0"
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
                                <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-xs">
                                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-bold text-gray-800">No jobs match your search</h3>
                                    <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-1 mb-4">
                                        Try adjusting your search criteria or resetting filters to explore all active positions.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filterJobs.map((job) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25 }}
                                            key={job?._id}
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
        </div>
    );
};

export default Jobs;
