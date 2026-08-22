import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import Footer from '../shared/Footer';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AdminJobsTable from './AdminJobsTable';
import useGetAllAdminJobs from '@/hooks/useGetAllAdminJobs';
import { setSearchJobByText } from '@/redux/jobSlice';
import { PlusCircle, Search, Briefcase, Sparkles } from 'lucide-react';

const AdminJobs = () => {
    useGetAllAdminJobs();
    const [input, setInput] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setSearchJobByText(input));
    }, [input, dispatch]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
            <div>
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    Posted Job Listings
                                </h1>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                                    <Sparkles className="w-3 h-3 text-purple-600" />
                                    ATS Enabled
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Manage job openings, review applicants, and access AI candidate scoring
                            </p>
                        </div>

                        <Button
                            onClick={() => navigate('/admin/jobs/create')}
                            className="bg-[#6A38C2] hover:bg-[#582da5] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Post New Job
                        </Button>
                    </div>

                    {/* Filter / Search Bar */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs mb-6 flex items-center justify-between">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                className="pl-9 text-sm h-9 bg-gray-50/50 border-gray-200"
                                placeholder="Filter by job role or company..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs overflow-hidden">
                        <AdminJobsTable />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AdminJobs;
