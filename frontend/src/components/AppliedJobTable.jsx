import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { useSelector } from 'react-redux';
import { Briefcase, Building2, CheckCircle2, Clock, XCircle } from 'lucide-react';

const AppliedJobTable = () => {
    const { allAppliedJobs } = useSelector((store) => store.job);

    const jobs = allAppliedJobs || [];

    if (jobs.length <= 0) {
        return (
            <div className="py-8 text-center">
                <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">You haven't applied to any positions yet.</p>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const s = String(status || 'pending').toLowerCase();
        if (s === 'accepted') {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Accepted
                </span>
            );
        }
        if (s === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    Rejected
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
                Under Review
            </span>
        );
    };

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableCaption className="pb-2 text-xs text-gray-500">
                    Track the real-time status of your active applications
                </TableCaption>
                <TableHeader className="bg-gray-50/80">
                    <TableRow className="border-b border-gray-200">
                        <TableHead className="font-semibold text-gray-700 text-xs py-3 pl-3">Applied Date</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs py-3">Role</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs py-3">Company</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs text-right py-3 pr-3">Application Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {jobs.map((appliedJob) => (
                        <TableRow key={appliedJob._id} className="hover:bg-purple-50/20 border-b border-gray-100 transition-colors">
                            <TableCell className="py-3 text-xs text-gray-500 pl-3">
                                {appliedJob?.createdAt ? String(appliedJob.createdAt).split('T')[0] : 'Recent'}
                            </TableCell>
                            <TableCell className="py-3 text-xs font-semibold text-gray-900">
                                {appliedJob.job?.title || 'Job Position'}
                            </TableCell>
                            <TableCell className="py-3 text-xs text-gray-600 font-medium">
                                {appliedJob.job?.company?.name || 'Company'}
                            </TableCell>
                            <TableCell className="py-3 text-right pr-3">
                                {getStatusBadge(appliedJob.status)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default AppliedJobTable;
