import React, { useEffect } from 'react';
import Navbar from './shared/Navbar';
import Job from './Job';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import useGetAllJobs from '@/hooks/useGetAllJobs';
import { Search, Sparkles, Briefcase, Compass } from 'lucide-react';
import Footer from './shared/Footer';

const Browse = () => {
    useGetAllJobs();
    const { allJobs, searchedQuery } = useSelector((store) => store.job);
    const dispatch = useDispatch();

    useEffect(() => {
        return () => {
            dispatch(setSearchedQuery(''));
        };
    }, [dispatch]);

    const jobs = allJobs || [];

    return (
        <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
                {/* Header Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs mb-8">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#6A38C2] uppercase tracking-wider mb-1.5">
                        <Compass className="w-4 h-4" />
                        Explore Positions
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Browse Open Roles
                        </h1>
                        <span className="text-xs sm:text-sm font-bold bg-purple-50 text-[#6A38C2] px-3 py-1 rounded-full border border-purple-100">
                            {jobs.length} Opportunities
                        </span>
                    </div>
                    {searchedQuery ? (
                        <p className="text-xs sm:text-sm text-slate-500 mt-2">
                            Showing verified roles matching <span className="font-bold text-slate-800">"{searchedQuery}"</span>
                        </p>
                    ) : (
                        <p className="text-xs sm:text-sm text-slate-500 mt-2">
                            Explore verified engineering, AI, product, and design roles from high-growth tech companies worldwide.
                        </p>
                    )}
                </div>

                {/* Grid */}
                {jobs.length <= 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-xs">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#6A38C2] flex items-center justify-center mx-auto mb-4 border border-purple-100">
                            <Search className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No jobs found matching your query</h3>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
                            Try searching for different keywords, technical skills, or locations.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {jobs.map((job) => (
                            <Job key={job._id} job={job} />
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Browse;

