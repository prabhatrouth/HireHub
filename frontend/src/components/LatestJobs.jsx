import React from 'react';
import LatestJobCards from './LatestJobCards';
import { useSelector } from 'react-redux';
import RecommendedJobs from './RecommendedJobs';
import { Sparkles, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

const LatestJobs = () => {
    const { allJobs } = useSelector((store) => store.job);
    const { user } = useSelector((store) => store.auth);

    const jobsList = allJobs || [];

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6A38C2] uppercase tracking-wider mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        Featured Listings
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                        <span className="text-[#6A38C2]">Latest & Top</span> Job Openings
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Explore hand-picked positions from fast-growing startups and enterprises
                    </p>
                </div>
                <Link to="/jobs">
                    <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-gray-200">
                        View All Jobs
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                </Link>
            </div>

            {jobsList.length <= 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200/80 p-8 text-center shadow-xs">
                    <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">No job postings available at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                    {jobsList.slice(0, 6).map((job) => (
                        <LatestJobCards key={job._id} job={job} />
                    ))}
                </div>
            )}

            {user?.role === 'student' && (
                <div className="mt-8 pt-8 border-t border-gray-200/80">
                    <RecommendedJobs embedded />
                </div>
            )}
        </section>
    );
};

export default LatestJobs;
