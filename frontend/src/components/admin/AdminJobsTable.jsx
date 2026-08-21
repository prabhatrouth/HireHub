import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit2, Eye, MoreHorizontal, Users, Sparkles, Building2, Calendar } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const AdminJobsTable = () => {
    const { allAdminJobs, searchJobByText } = useSelector((store) => store.job);
    const [filterJobs, setFilterJobs] = useState(allAdminJobs || []);
    const navigate = useNavigate();

    useEffect(() => {
        const filteredJobs = (allAdminJobs || []).filter((job) => {
            if (!searchJobByText) return true;
            const query = searchJobByText.toLowerCase();
            return (
                job?.title?.toLowerCase().includes(query) ||
                job?.company?.name?.toLowerCase().includes(query) ||
                job?.location?.toLowerCase().includes(query)
            );
        });
        setFilterJobs(filteredJobs);
    }, [allAdminJobs, searchJobByText]);

    if (!filterJobs || filterJobs.length === 0) {
        return (
            <div className="p-12 text-center">
                <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-800 text-sm">No job postings found</h4>
                <p className="text-xs text-gray-500 mt-1">Create your first job listing to start receiving and ranking applicants.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableCaption className="pb-3 text-xs text-gray-500">
                    A list of your posted jobs and active candidate tracking pipelines
                </TableCaption>
                <TableHeader className="bg-gray-50/80">
                    <TableRow className="border-b border-gray-200">
                        <TableHead className="font-semibold text-gray-700 text-xs py-3.5 pl-4">Company</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs py-3.5">Job Role</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs py-3.5">Job Type & Salary</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs py-3.5">Applicants</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs py-3.5">Posted Date</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs text-right py-3.5 pr-4">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filterJobs.map((job) => {
                        const applicantCount = job?.applications?.length || 0;
                        return (
                            <TableRow key={job._id} className="hover:bg-purple-50/20 border-b border-gray-100 transition-colors">
                                {/* Company */}
                                <TableCell className="py-3 pl-4">
                                    <div className="flex items-center gap-2.5">
                                        <Avatar className="h-8 w-8 rounded-lg border border-gray-100 bg-gray-50 shrink-0">
                                            <AvatarImage src={job?.company?.logo} alt={job?.company?.name} />
                                            <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs">
                                                {job?.company?.name?.charAt(0) || 'C'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-xs leading-none">{job?.company?.name || 'Company'}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{job?.location || 'Remote'}</p>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Title */}
                                <TableCell className="py-3 font-semibold text-gray-900 text-xs">
                                    {job?.title}
                                </TableCell>

                                {/* Type & Salary */}
                                <TableCell className="py-3">
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className="text-[11px] font-medium py-0 bg-gray-50 border-gray-200">
                                            {job?.jobType || 'Full Time'}
                                        </Badge>
                                        <Badge variant="outline" className="text-[11px] font-semibold text-[#6A38C2] bg-purple-50 border-purple-200 py-0">
                                            {job?.salary ? `${job.salary} LPA` : 'Competitive'}
                                        </Badge>
                                    </div>
                                </TableCell>

                                {/* Applicants with AI Screening link */}
                                <TableCell className="py-3">
                                    <button
                                        onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-[#6A38C2] border border-purple-200 hover:bg-purple-100 transition-colors"
                                    >
                                        <Users className="w-3 h-3" />
                                        {applicantCount} {applicantCount === 1 ? 'Applicant' : 'Applicants'}
                                        <Sparkles className="w-2.5 h-2.5 text-purple-600 ml-0.5" />
                                    </button>
                                </TableCell>

                                {/* Date */}
                                <TableCell className="py-3 text-xs text-gray-500">
                                    {job?.createdAt ? String(job.createdAt).split('T')[0] : 'Recent'}
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="py-3 text-right pr-4">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}
                                            className="h-7 text-xs font-semibold border-purple-200 text-[#6A38C2] hover:bg-purple-50"
                                        >
                                            <Eye className="w-3 h-3 mr-1" />
                                            ATS Portal
                                        </Button>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent align="end" className="w-40 p-1">
                                                <button
                                                    onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}
                                                    className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-md hover:bg-purple-50 text-gray-700 flex items-center gap-2"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 text-[#6A38C2]" />
                                                    <span>View AI Ranking</span>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/description/${job._id}`)}
                                                    className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-md hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                                                    <span>View Public Post</span>
                                                </button>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default AdminJobsTable;
