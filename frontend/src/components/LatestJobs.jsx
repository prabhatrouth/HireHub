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

            {/* AI Career Suite Showcase for Students */}
            {user?.role === 'student' ? (
                <div className="mt-12 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-8 sm:p-10 text-white relative overflow-hidden shadow-lg">
                    <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold uppercase tracking-wider mb-3">
                                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                                Personalized AI Matching
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                Jobs Hand-Picked for Your Specific Skillset
                            </h3>
                            <p className="text-sm text-purple-200 mt-2 leading-relaxed">
                                Our AI system continuously evaluates open roles against your profile skills and resume text to calculate compatibility scores and missing keyword opportunities.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <Link to="/recommended">
                                <Button className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Explore AI Matches
                                </Button>
                            </Link>
                            <Link to="/resume-checker">
                                <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs font-bold px-5 py-2.5 rounded-xl">
                                    Run ATS Resume Audit
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
};

export default LatestJobs;
