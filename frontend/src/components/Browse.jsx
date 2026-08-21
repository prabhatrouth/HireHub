import React, { useEffect } from 'react';
import Navbar from './shared/Navbar';
import Job from './Job';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import useGetAllJobs from '@/hooks/useGetAllJobs';
import { Search, Sparkles, Briefcase } from 'lucide-react';

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
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Search Results
                        </h1>
                        <span className="text-xs bg-purple-100 text-[#6A38C2] font-semibold px-2.5 py-0.5 rounded-full">
                            {jobs.length} Opportunities
                        </span>
                    </div>
                    {searchedQuery ? (
                        <p className="text-xs sm:text-sm text-gray-500">
                            Showing jobs matching <span className="font-semibold text-gray-800">"{searchedQuery}"</span>
                        </p>
                    ) : (
                        <p className="text-xs sm:text-sm text-gray-500">
                            Browse all active roles across top engineering, design, and product teams.
                        </p>
                    )}
                </div>

                {/* Grid */}
                {jobs.length <= 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-xs">
                        <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-800">No jobs found matching your query</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                            Try searching for different keywords, technical skills, or locations.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {jobs.map((job) => (
                            <Job key={job._id} job={job} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Browse;
