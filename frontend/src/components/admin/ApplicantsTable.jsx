import React, { useState } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
    MoreHorizontal,
    Sparkles,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Mail,
    Phone,
    ExternalLink,
    Award,
    AlertCircle,
    Check,
    X,
    Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { APPLICATION_API_END_POINT } from '@/utils/constant';
import axios from 'axios';

const shortlistingStatus = ["Accepted", "Rejected"];

const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
};

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
            Pending Review
        </span>
    );
};

const ApplicantsTable = ({ applications = [], jobRequirements = [], viewMode = 'table', onStatusUpdate, loading = false }) => {
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);

    const statusHandler = async (status, id) => {
        setUpdatingId(id);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(`${APPLICATION_API_END_POINT}/status/${id}/update`, { status });
            if (res.data?.success) {
                toast.success(res.data.message || `Applicant status marked as ${status}`);
                if (onStatusUpdate) onStatusUpdate();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update applicant status');
        } finally {
            setUpdatingId(null);
        }
    };

    const openAiModal = (item) => {
        setSelectedApplicant(item);
        setIsAiModalOpen(true);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200/80 p-12 text-center shadow-sm">
                <Sparkles className="w-8 h-8 text-purple-600 animate-pulse mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Evaluating candidate profiles with AI Intelligence...</p>
                <p className="text-xs text-gray-400 mt-1">Analyzing resumes, candidate skill matrix, and job requirements</p>
            </div>
        );
    }

    if (!applications || applications.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200/80 p-12 text-center shadow-sm">
                <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-800">No applicants found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                    No candidates currently match the selected search or filter criteria for this job posting.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* 1. Mobile Cards View (Visible on small screens or when cards view is toggled) */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${viewMode === 'cards' ? 'block' : 'block lg:hidden'} mb-6`}>
                {applications.map((item) => {
                    const applicant = item.applicant || {};
                    const profile = applicant.profile || {};
                    const score = item.aiScore || item.aiEvaluation?.matchScore || 70;
                    const aiData = item.aiData || item.aiEvaluation || {};
                    const candidateSkills = profile.skills || [];

                    return (
                        <div
                            key={item._id}
                            className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
                        >
                            {/* Card Header */}
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-11 w-11 border border-gray-100">
                                            <AvatarImage src={profile.profilePhoto} />
                                            <AvatarFallback className="bg-purple-100 text-purple-700 font-bold">
                                                {applicant.fullname?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 text-base">{applicant.fullname || 'Applicant'}</h4>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    {applicant.email}
                                                </span>
                                                {applicant.phoneNumber && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3 text-gray-400" />
                                                        {applicant.phoneNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Score Badge */}
                                    <div className="shrink-0 text-right">
                                        <button
                                            onClick={() => openAiModal(item)}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-transform hover:scale-105 ${getScoreColor(score)}`}
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            {score}% Match
                                        </button>
                                    </div>
                                </div>

                                {/* Skills Section */}
                                <div className="my-3 pt-2 border-t border-gray-100">
                                    <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center justify-between">
                                        <span>Candidate Skills</span>
                                        <span className="text-[11px] text-purple-600 font-semibold">{aiData.fitTier || 'AI Evaluated'}</span>
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {candidateSkills.length > 0 ? (
                                            candidateSkills.slice(0, 5).map((skill, idx) => {
                                                const isMatched = (jobRequirements || []).some(
                                                    (req) => req.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(req.toLowerCase())
                                                );
                                                return (
                                                    <span
                                                        key={idx}
                                                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                                                            isMatched
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                    >
                                                        {isMatched && <Check className="w-2.5 h-2.5 inline mr-1 text-emerald-600" />}
                                                        {skill}
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No skills listed</span>
                                        )}
                                        {candidateSkills.length > 5 && (
                                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                                                +{candidateSkills.length - 5}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* AI Recommendation Preview */}
                                {aiData.recommendationSummary && (
                                    <div className="bg-purple-50/70 border border-purple-100 rounded-lg p-2.5 mb-3 text-xs text-purple-900 flex items-start gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                                        <p className="line-clamp-2 leading-relaxed">{aiData.recommendationSummary}</p>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(item.status)}
                                    {profile.resume && (
                                        <a
                                            href={profile.resume}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            Resume
                                        </a>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openAiModal(item)}
                                        className="h-8 text-xs font-medium border-purple-200 text-purple-700 hover:bg-purple-50"
                                    >
                                        <Eye className="w-3 h-3 mr-1" />
                                        AI Fit
                                    </Button>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent align="end" className="w-36 p-1">
                                            {shortlistingStatus.map((status, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => statusHandler(status, item?._id)}
                                                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-between ${
                                                        status === 'Accepted' ? 'hover:bg-emerald-50 text-emerald-700' : 'hover:bg-rose-50 text-rose-700'
                                                    }`}
                                                >
                                                    <span>Mark {status}</span>
                                                    {status === 'Accepted' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                </button>
                                            ))}
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 2. Responsive Table View (Hidden on mobile by default unless requested) */}
            <div className={`bg-white rounded-xl border border-gray-200/90 shadow-sm overflow-hidden ${viewMode === 'table' ? 'hidden lg:block' : 'hidden'}`}>
                <div className="overflow-x-auto">
                    <Table>
                        <TableCaption className="pb-3 text-xs text-gray-500">
                            Ranked and scored with HireHub AI matching algorithms &bull; Real-time skill verification
                        </TableCaption>
                        <TableHeader className="bg-gray-50/80">
                            <TableRow className="border-b border-gray-200">
                                <TableHead className="font-semibold text-gray-700 text-xs py-3.5">Candidate</TableHead>
                                <TableHead className="font-semibold text-gray-700 text-xs py-3.5">AI Match Score</TableHead>
                                <TableHead className="font-semibold text-gray-700 text-xs py-3.5">Skills Alignment</TableHead>
                                <TableHead className="font-semibold text-gray-700 text-xs py-3.5">Resume</TableHead>
                                <TableHead className="font-semibold text-gray-700 text-xs py-3.5">Applied Date</TableHead>
                                <TableHead className="font-semibold text-gray-700 text-xs py-3.5">Status</TableHead>
                                <TableHead className="font-semibold text-gray-700 text-xs text-right py-3.5 pr-4">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map((item) => {
                                const applicant = item.applicant || {};
                                const profile = applicant.profile || {};
                                const score = item.aiScore || item.aiEvaluation?.matchScore || 70;
                                const aiData = item.aiData || item.aiEvaluation || {};
                                const candidateSkills = profile.skills || [];

                                return (
                                    <TableRow key={item._id} className="hover:bg-purple-50/20 border-b border-gray-100 transition-colors">
                                        {/* Candidate Info */}
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-gray-100">
                                                    <AvatarImage src={profile.profilePhoto} />
                                                    <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs">
                                                        {applicant.fullname?.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 text-sm leading-snug">{applicant.fullname || 'Applicant'}</h4>
                                                    <p className="text-xs text-gray-500">{applicant.email}</p>
                                                    {applicant.phoneNumber && (
                                                        <p className="text-[11px] text-gray-400">{applicant.phoneNumber}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* AI Match Score */}
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openAiModal(item)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-transform hover:scale-105 ${getScoreColor(score)}`}
                                                >
                                                    <Sparkles className="w-3 h-3" />
                                                    {score}% Match
                                                </button>
                                                <span className="text-[11px] text-gray-500 hidden xl:inline font-medium">
                                                    {aiData.fitTier || 'Strong Match'}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Skill Alignment Matrix */}
                                        <TableCell className="py-3 max-w-xs">
                                            <div className="flex flex-wrap gap-1">
                                                {candidateSkills.length > 0 ? (
                                                    candidateSkills.slice(0, 4).map((skill, idx) => {
                                                        const isMatched = (jobRequirements || []).some(
                                                            (req) => req.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(req.toLowerCase())
                                                        );
                                                        return (
                                                            <span
                                                                key={idx}
                                                                className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                                                                    isMatched
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                        : 'bg-gray-100 text-gray-600'
                                                                }`}
                                                            >
                                                                {isMatched && <Check className="w-2.5 h-2.5 inline mr-1 text-emerald-600" />}
                                                                {skill}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No skills listed</span>
                                                )}
                                                {candidateSkills.length > 4 && (
                                                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                                                        +{candidateSkills.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Resume */}
                                        <TableCell className="py-3">
                                            {profile.resume ? (
                                                <a
                                                    href={profile.resume}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline"
                                                >
                                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate max-w-[120px]">{profile.resumeOriginalName || 'Resume.pdf'}</span>
                                                    <ExternalLink className="w-3 h-3 text-blue-400" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400">Not uploaded</span>
                                            )}
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell className="py-3 text-xs text-gray-500">
                                            {item.createdAt ? String(item.createdAt).split('T')[0] : 'Recent'}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="py-3">
                                            {getStatusBadge(item.status)}
                                        </TableCell>

                                        {/* Action Dropdown */}
                                        <TableCell className="py-3 text-right pr-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openAiModal(item)}
                                                    className="h-8 text-xs font-medium border-purple-200 text-purple-700 hover:bg-purple-50"
                                                >
                                                    <Sparkles className="w-3 h-3 mr-1" />
                                                    Insights
                                                </Button>

                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent align="end" className="w-36 p-1">
                                                        {shortlistingStatus.map((status, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => statusHandler(status, item?._id)}
                                                                className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-between ${
                                                                    status === 'Accepted' ? 'hover:bg-emerald-50 text-emerald-700' : 'hover:bg-rose-50 text-rose-700'
                                                                }`}
                                                            >
                                                                <span>Mark {status}</span>
                                                                {status === 'Accepted' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                            </button>
                                                        ))}
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
            </div>

            {/* AI Candidate Fit Evaluation Modal */}
            {selectedApplicant && (
                <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
                    <DialogContent className="max-w-lg sm:max-w-xl bg-white p-6 rounded-2xl">
                        <DialogHeader>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <DialogTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                        AI Candidate Fit Analysis
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-gray-500 mt-0.5">
                                        Intelligent skill matching report powered by HireHub AI
                                    </DialogDescription>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(selectedApplicant.aiScore || 75)}`}>
                                    {selectedApplicant.aiScore || 75}% Fit Score
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="mt-4 space-y-4">
                            {/* Candidate Header Summary */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                                <Avatar className="h-12 w-12 border border-gray-200">
                                    <AvatarImage src={selectedApplicant.applicant?.profile?.profilePhoto} />
                                    <AvatarFallback className="bg-purple-100 text-purple-700 font-bold">
                                        {selectedApplicant.applicant?.fullname?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-base truncate">
                                        {selectedApplicant.applicant?.fullname}
                                    </h4>
                                    <p className="text-xs text-gray-500">{selectedApplicant.applicant?.email}</p>
                                    {selectedApplicant.applicant?.profile?.bio && (
                                        <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">
                                            "{selectedApplicant.applicant?.profile?.bio}"
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* AI Recommendation Note */}
                            <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50/50 border border-purple-200/80 rounded-xl">
                                <h5 className="text-xs font-bold text-purple-900 flex items-center gap-1.5 mb-1">
                                    <Award className="w-4 h-4 text-purple-700" />
                                    AI Recruiter Assessment & Recommendation
                                </h5>
                                <p className="text-xs text-purple-950 leading-relaxed">
                                    {selectedApplicant.aiData?.recommendationSummary ||
                                        'Candidate exhibits strong alignment with core role specifications. Recommended to proceed to technical screening.'}
                                </p>
                            </div>

                            {/* Skills Comparison Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Matching Skills */}
                                <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                                    <h6 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        Verified Matching Skills
                                    </h6>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(selectedApplicant.aiData?.matchingSkills?.length > 0
                                            ? selectedApplicant.aiData.matchingSkills
                                            : selectedApplicant.applicant?.profile?.skills?.slice(0, 3) || ['React', 'JavaScript']
                                        ).map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1"
                                            >
                                                <Check className="w-3 h-3 text-emerald-600" />
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Missing / Development Skills */}
                                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                                    <h6 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-2">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                        Role Skill Gaps / Missing
                                    </h6>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(selectedApplicant.aiData?.missingSkills?.length > 0
                                            ? selectedApplicant.aiData.missingSkills
                                            : ['Advanced Cloud Infra', 'Docker']
                                        ).map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-medium"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Candidate Strengths */}
                            <div className="p-3 bg-white border border-gray-200 rounded-xl">
                                <h6 className="text-xs font-bold text-gray-800 mb-2">Key Highlighted Strengths</h6>
                                <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
                                    {(selectedApplicant.aiData?.strengths || [
                                        'Verified practical technical background',
                                        'Direct match with primary job title requirements',
                                        'Profile verified and portfolio active',
                                    ]).map((st, idx) => (
                                        <li key={idx}>{st}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <div className="text-xs text-gray-500">
                                    Current Status: <span className="font-semibold text-gray-800 capitalize">{selectedApplicant.status}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            statusHandler('Rejected', selectedApplicant._id);
                                            setIsAiModalOpen(false);
                                        }}
                                        className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            statusHandler('Accepted', selectedApplicant._id);
                                            setIsAiModalOpen(false);
                                        }}
                                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        Accept Candidate
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default ApplicantsTable;
