import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
    Briefcase,
    Building2,
    CheckCircle2,
    Clock,
    XCircle,
    Search,
    ExternalLink,
    Sparkles,
    Calendar,
    ArrowRight,
    TrendingUp,
    Check
} from 'lucide-react';

const AppliedJobTable = () => {
    const { allAppliedJobs } = useSelector((store) => store.job);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const jobs = allAppliedJobs || [];

    // Calculate quick stats
    const stats = useMemo(() => {
        const total = jobs.length;
        const accepted = jobs.filter((j) => String(j.status).toLowerCase() === 'accepted').length;
        const rejected = jobs.filter((j) => String(j.status).toLowerCase() === 'rejected').length;
        const pending = jobs.filter((j) => {
            const s = String(j.status || 'pending').toLowerCase();
            return s !== 'accepted' && s !== 'rejected';
        }).length;
        return { total, accepted, rejected, pending };
    }, [jobs]);

    // Filter jobs
    const filteredJobs = useMemo(() => {
        return jobs.filter((appliedJob) => {
            const status = String(appliedJob.status || 'pending').toLowerCase();
            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'PENDING' && status !== 'accepted' && status !== 'rejected') ||
                (statusFilter === 'ACCEPTED' && status === 'accepted') ||
                (statusFilter === 'REJECTED' && status === 'rejected');

            const title = appliedJob.job?.title?.toLowerCase() || '';
            const company = appliedJob.job?.company?.name?.toLowerCase() || '';
            const search = searchTerm.toLowerCase();
            const matchesSearch = !search || title.includes(search) || company.includes(search);

            return matchesStatus && matchesSearch;
        });
    }, [jobs, statusFilter, searchTerm]);

    if (jobs.length <= 0) {
        return (
            <div className="py-12 px-4 text-center rounded-2xl bg-gray-50/70 border border-gray-200/70">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#6A38C2] flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">No applications submitted yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    Explore high-match job postings tailored to your skill set and submit your first application.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2.5">
                    <Link to="/recommended">
                        <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold px-4 shadow-xs">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            Explore AI Matches
                        </Button>
                    </Link>
                    <Link to="/jobs">
                        <Button size="sm" variant="outline" className="text-xs font-semibold border-gray-200">
                            Browse All Jobs
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const s = String(status || 'pending').toLowerCase();
        if (s === 'accepted') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Offer / Accepted
                </span>
            );
        }
        if (s === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Not Selected
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Under Review
            </span>
        );
    };

    const renderPipeline = (status) => {
        const s = String(status || 'pending').toLowerCase();
        const isAccepted = s === 'accepted';
        const isRejected = s === 'rejected';
        const isPending = !isAccepted && !isRejected;

        return (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                {/* Step 1: Submitted */}
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <Check className="w-3 h-3 text-emerald-600" /> Applied
                </span>
                <span className="text-gray-300">→</span>

                {/* Step 2: Under Review */}
                <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                        isPending
                            ? 'text-amber-800 bg-amber-100 font-bold animate-pulse'
                            : isAccepted || isRejected
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-gray-400 bg-gray-100'
                    }`}
                >
                    Reviewing
                </span>
                <span className="text-gray-300">→</span>

                {/* Step 3: Decision */}
                <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                        isAccepted
                            ? 'text-emerald-800 bg-emerald-100 font-bold'
                            : isRejected
                            ? 'text-rose-800 bg-rose-100 font-bold'
                            : 'text-gray-400 bg-gray-100'
                    }`}
                >
                    {isAccepted ? 'Accepted' : isRejected ? 'Rejected' : 'Decision'}
                </span>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div
                    onClick={() => setStatusFilter('ALL')}
                    className={`cursor-pointer p-3 rounded-xl border transition-all text-left ${
                        statusFilter === 'ALL'
                            ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-400'
                            : 'bg-gray-50 border-gray-200/80 hover:bg-gray-100/70'
                    }`}
                >
                    <p className="text-[11px] font-semibold text-gray-500">Total Applied</p>
                    <p className="text-lg font-extrabold text-gray-900">{stats.total}</p>
                </div>

                <div
                    onClick={() => setStatusFilter('PENDING')}
                    className={`cursor-pointer p-3 rounded-xl border transition-all text-left ${
                        statusFilter === 'PENDING'
                            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
                            : 'bg-gray-50 border-gray-200/80 hover:bg-gray-100/70'
                    }`}
                >
                    <p className="text-[11px] font-semibold text-amber-700">In Review</p>
                    <p className="text-lg font-extrabold text-amber-900">{stats.pending}</p>
                </div>

                <div
                    onClick={() => setStatusFilter('ACCEPTED')}
                    className={`cursor-pointer p-3 rounded-xl border transition-all text-left ${
                        statusFilter === 'ACCEPTED'
                            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                            : 'bg-gray-50 border-gray-200/80 hover:bg-gray-100/70'
                    }`}
                >
                    <p className="text-[11px] font-semibold text-emerald-700">Accepted</p>
                    <p className="text-lg font-extrabold text-emerald-900">{stats.accepted}</p>
                </div>

                <div
                    onClick={() => setStatusFilter('REJECTED')}
                    className={`cursor-pointer p-3 rounded-xl border transition-all text-left ${
                        statusFilter === 'REJECTED'
                            ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400'
                            : 'bg-gray-50 border-gray-200/80 hover:bg-gray-100/70'
                    }`}
                >
                    <p className="text-[11px] font-semibold text-rose-700">Not Selected</p>
                    <p className="text-lg font-extrabold text-rose-900">{stats.rejected}</p>
                </div>
            </div>

            {/* Filter and Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search role or company..."
                        className="pl-8 text-xs h-9 rounded-xl border-gray-200"
                    />
                </div>

                <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
                    {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'].map((filterKey) => (
                        <button
                            key={filterKey}
                            onClick={() => setStatusFilter(filterKey)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                                statusFilter === filterKey
                                    ? 'bg-[#6A38C2] text-white shadow-2xs'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {filterKey === 'ALL'
                                ? 'All Statuses'
                                : filterKey === 'PENDING'
                                ? 'Under Review'
                                : filterKey === 'ACCEPTED'
                                ? 'Accepted'
                                : 'Not Selected'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Application Cards / Table */}
            {filteredJobs.length === 0 ? (
                <div className="py-8 text-center bg-gray-50 rounded-xl border border-gray-200/70">
                    <p className="text-xs text-gray-500 font-medium">
                        No applications found matching your search or filter.
                    </p>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            setStatusFilter('ALL');
                            setSearchTerm('');
                        }}
                        className="text-xs text-[#6A38C2] mt-1.5 font-semibold"
                    >
                        Clear Filters
                    </Button>
                </div>
            ) : (
                <div className="overflow-hidden border border-gray-200/80 rounded-2xl bg-white shadow-2xs">
                    <div className="divide-y divide-gray-100">
                        {filteredJobs.map((appliedJob) => {
                            const dateStr = appliedJob?.createdAt
                                ? new Date(appliedJob.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                  })
                                : 'Recent';

                            const jobId = appliedJob.job?._id;

                            return (
                                <div
                                    key={appliedJob._id}
                                    className="p-4 sm:p-5 hover:bg-purple-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-bold text-sm text-gray-900">
                                                {appliedJob.job?.title || 'Job Position'}
                                            </h4>
                                            {getStatusBadge(appliedJob.status)}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                                            <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                                {appliedJob.job?.company?.name || 'Company'}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-gray-500">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                Applied on {dateStr}
                                            </span>
                                        </div>

                                        <div className="pt-1">
                                            {renderPipeline(appliedJob.status)}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                        {jobId && (
                                            <>
                                                <Link to={`/description/${jobId}`}>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs font-semibold border-gray-200 hover:bg-gray-50 h-8 gap-1"
                                                    >
                                                        <span>View Job</span>
                                                        <ExternalLink className="w-3 h-3 text-gray-400" />
                                                    </Button>
                                                </Link>
                                                <Link to={`/student/portal?tab=prep`}>
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold h-8 shadow-2xs gap-1"
                                                    >
                                                        <Sparkles className="w-3 h-3" />
                                                        <span>Prep Interview</span>
                                                    </Button>
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppliedJobTable;

