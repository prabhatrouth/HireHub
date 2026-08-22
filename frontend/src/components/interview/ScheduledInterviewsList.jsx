import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
    Calendar,
    Clock,
    Video,
    Sparkles,
    Copy,
    ExternalLink,
    Building2,
    Briefcase,
    CheckCircle2,
    AlertCircle,
    User,
    Award,
    FileText,
    ArrowRight,
    RefreshCw,
    Star,
    Check,
    X,
    Printer,
    Share2,
    UserCheck,
    Shield,
    SlidersHorizontal,
    ThumbsUp,
    ThumbsDown,
    FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

const ScheduledInterviewsList = ({ roleFilter }) => {
    const { user } = useSelector((store) => store.auth);
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, UPCOMING, LIVE, COMPLETED

    // Modal state for viewing evaluation scorecard
    const [selectedScorecardInterview, setSelectedScorecardInterview] = useState(null);

    // Modal state for marking interview complete / submitting evaluation
    const [evaluatingInterview, setEvaluatingInterview] = useState(null);
    const [evalSubmitting, setEvalSubmitting] = useState(false);
    const [evalForm, setEvalForm] = useState({
        technicalScore: 4,
        problemSolvingScore: 4,
        communicationScore: 5,
        cultureFitScore: 4,
        hiringDecision: 'Hire',
        interviewerFeedback: '',
        advanceApplicationStatus: 'accepted',
    });

    const fetchInterviews = async () => {
        setLoading(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.get(`${INTERVIEW_API_END_POINT}/my-interviews`);
            if (res.data?.success) {
                setInterviews(res.data.interviews || []);
            }
        } catch (error) {
            console.error('Fetch interviews error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
        const interval = setInterval(fetchInterviews, 30000);
        return () => clearInterval(interval);
    }, []);

    const copyLink = (roomId) => {
        const link = `${window.location.origin}/interview/room/${roomId}`;
        navigator.clipboard.writeText(link);
        toast.success('Interview meeting link copied!');
    };

    const isToday = (dateStr) => {
        if (!dateStr) return false;
        const todayStr = new Date().toISOString().split('T')[0];
        return dateStr === todayStr;
    };

    const isRecruiter = user?.role === 'recruiter';

    const handleOpenEvaluateModal = (item) => {
        setEvaluatingInterview(item);
        setEvalForm({
            technicalScore: item.evaluation?.technicalScore || 4,
            problemSolvingScore: item.evaluation?.problemSolvingScore || 4,
            communicationScore: item.evaluation?.communicationScore || 5,
            cultureFitScore: item.evaluation?.cultureFitScore || 4,
            hiringDecision: item.evaluation?.hiringDecision || 'Hire',
            interviewerFeedback: item.evaluation?.interviewerFeedback || '',
            advanceApplicationStatus: 'accepted',
        });
    };

    const handleSubmitEvaluation = async (e) => {
        e.preventDefault();
        if (!evaluatingInterview) return;

        setEvalSubmitting(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(`${INTERVIEW_API_END_POINT}/room/${evaluatingInterview.roomId}/evaluate`, {
                technicalScore: Number(evalForm.technicalScore),
                problemSolvingScore: Number(evalForm.problemSolvingScore),
                communicationScore: Number(evalForm.communicationScore),
                cultureFitScore: Number(evalForm.cultureFitScore),
                hiringDecision: evalForm.hiringDecision,
                interviewerFeedback: evalForm.interviewerFeedback,
                advanceApplicationStatus: evalForm.advanceApplicationStatus,
            });

            if (res.data?.success) {
                toast.success('Interview marked as Completed and Scorecard recorded!');
                setEvaluatingInterview(null);
                fetchInterviews();
            }
        } catch (error) {
            console.error('Submit evaluation error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit evaluation.');
        } finally {
            setEvalSubmitting(false);
        }
    };

    const copyScorecardSummary = (item) => {
        const evalData = item.evaluation || {};
        const interviewerName = item.interviewerType === 'assigned_panelist' && item.assignedInterviewer?.name
            ? `${item.assignedInterviewer.name} (${item.assignedInterviewer.role || 'Panelist'})`
            : item.recruiter?.fullname || 'Lead Recruiter';

        const summaryText = `--- HIREHUB INTERVIEW SCORECARD ---
Candidate: ${item.candidate?.fullname} (${item.candidate?.email})
Position: ${item.job?.title}
Interview Date: ${item.interviewDate} at ${item.interviewTime}
Round: ${item.roundType}
Conducted By: ${interviewerName}

SCORES:
- Technical Architecture: ${evalData.technicalScore || 0}/5
- Problem Solving & DSA: ${evalData.problemSolvingScore || 0}/5
- Communication & Clarity: ${evalData.communicationScore || 0}/5
- Cultural & Team Fit: ${evalData.cultureFitScore || 0}/5
- Overall Rating: ${evalData.rating || 0}/5

HIRING RECOMMENDATION: ${evalData.hiringDecision || 'Undecided'}
FEEDBACK / REMARKS:
${evalData.interviewerFeedback || 'No additional notes provided.'}
------------------------------------`;

        navigator.clipboard.writeText(summaryText);
        toast.success('Scorecard summary copied to clipboard!');
    };

    const handlePrintScorecard = () => {
        window.print();
    };

    const filteredInterviews = interviews.filter((item) => {
        if (activeFilter === 'LIVE') return item.status === 'live';
        if (activeFilter === 'UPCOMING') return item.status === 'scheduled';
        if (activeFilter === 'COMPLETED') return item.status === 'completed';
        return true;
    });

    if (loading && interviews.length === 0) {
        return (
            <div className="py-12 text-center bg-white rounded-2xl border border-gray-200/80 p-8 shadow-xs">
                <RefreshCw className="w-8 h-8 text-[#6A38C2] animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-gray-700">Loading scheduled interview calls...</p>
            </div>
        );
    }

    if (interviews.length === 0) {
        return (
            <div className="py-12 px-4 text-center rounded-2xl bg-gray-50/70 border border-gray-200/70">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#6A38C2] flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Video className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">
                    {isRecruiter ? 'No interviews scheduled yet' : 'No upcoming live interviews'}
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
                    {isRecruiter
                        ? 'Select candidates from your Job Applicants pool and click "Schedule Live Interview" to set up video rounds with screen sharing.'
                        : 'When recruiters shortlist your application and invite you for screening or technical rounds, your live interview sessions will appear here.'}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2.5">
                    {isRecruiter ? (
                        <Link to="/admin/jobs">
                            <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold px-4 shadow-xs">
                                <User className="w-3.5 h-3.5 mr-1.5" />
                                View Applicants & Schedule
                            </Button>
                        </Link>
                    ) : (
                        <Link to="/jobs">
                            <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold px-4 shadow-xs">
                                <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                                Browse & Apply to Jobs
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">Filter Status:</span>
                    <div className="flex items-center gap-1">
                        {['ALL', 'UPCOMING', 'LIVE', 'COMPLETED'].map((filterKey) => (
                            <button
                                key={filterKey}
                                onClick={() => setActiveFilter(filterKey)}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                                    activeFilter === filterKey
                                        ? 'bg-[#6A38C2] text-white shadow-2xs'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {filterKey === 'ALL'
                                    ? `All (${interviews.length})`
                                    : filterKey === 'UPCOMING'
                                    ? `Upcoming (${interviews.filter((i) => i.status === 'scheduled').length})`
                                    : filterKey === 'LIVE'
                                    ? `🔴 Live Now (${interviews.filter((i) => i.status === 'live').length})`
                                    : `Completed (${interviews.filter((i) => i.status === 'completed').length})`}
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchInterviews}
                    className="text-xs font-semibold border-gray-200 text-gray-700 h-8 self-end sm:self-auto gap-1"
                >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                </Button>
            </div>

            {/* List of Interview Cards */}
            <div className="space-y-3.5">
                {filteredInterviews.map((item) => {
                    const isLive = item.status === 'live';
                    const isCompleted = item.status === 'completed';
                    const isTodaySession = isToday(item.interviewDate);
                    const partner = isRecruiter ? item.candidate : item.recruiter;

                    // Interviewer attribution
                    const isAssigned = item.interviewerType === 'assigned_panelist' && item.assignedInterviewer?.name;
                    const interviewerDisplay = isAssigned
                        ? `${item.assignedInterviewer.name} (${item.assignedInterviewer.role || 'Panelist'})`
                        : isRecruiter
                        ? 'Myself (Lead Recruiter)'
                        : item.recruiter?.fullname || 'Hiring Team';

                    return (
                        <div
                            key={item._id}
                            className={`p-4 sm:p-5 rounded-2xl border transition-all relative ${
                                isLive
                                    ? 'bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-purple-50/90 border-[#6A38C2] ring-2 ring-purple-400 shadow-md'
                                    : isCompleted
                                    ? 'bg-white border-emerald-200/90 hover:border-emerald-300 shadow-2xs'
                                    : 'bg-white border-gray-200/90 hover:border-purple-200 shadow-2xs'
                            }`}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Left Side: Details */}
                                <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {isLive ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-600 text-white animate-pulse shadow-xs">
                                                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                                LIVE NOW
                                            </span>
                                        ) : isCompleted ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                Completed & Evaluated
                                            </span>
                                        ) : isTodaySession ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                Scheduled For Today
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-[#6A38C2] border border-purple-200">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Scheduled
                                            </span>
                                        )}

                                        <Badge variant="outline" className="text-xs font-bold text-gray-800 bg-gray-50 border-gray-200">
                                            {item.roundType}
                                        </Badge>

                                        <span className="text-xs text-gray-500 font-medium">
                                            {item.durationMinutes || 45} mins
                                        </span>

                                        {/* Conducted By Badge */}
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-50 text-[#6A38C2] px-2 py-0.5 rounded-md border border-purple-200">
                                            <UserCheck className="w-3 h-3" />
                                            Interviewer: {interviewerDisplay}
                                        </span>
                                    </div>

                                    {/* Role & Company */}
                                    <div>
                                        <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                                            <span>{item.job?.title || 'Open Job Role'}</span>
                                            {item.company?.name && (
                                                <span className="text-xs font-semibold text-gray-500 font-normal">
                                                    at {item.company.name}
                                                </span>
                                            )}
                                        </h4>
                                    </div>

                                    {/* Date, Time & Participant */}
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                                        <span className="inline-flex items-center gap-1.5 font-semibold text-gray-800">
                                            <Calendar className="w-3.5 h-3.5 text-[#6A38C2]" />
                                            {item.interviewDate} at {item.interviewTime}
                                        </span>

                                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                                            <User className="w-3.5 h-3.5 text-gray-400" />
                                            <span>{isRecruiter ? 'Candidate:' : 'Recruiter:'}</span>
                                            <span className="font-bold text-gray-900">{partner?.fullname || 'Participant'}</span>
                                            <span className="text-gray-400">({partner?.email})</span>
                                        </span>
                                    </div>

                                    {/* Instructions / Notes */}
                                    {item.notes && (
                                        <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/70 text-xs text-gray-700 max-w-2xl">
                                            <span className="font-bold text-gray-900">Agenda / Instructions: </span>
                                            <span>{item.notes}</span>
                                        </div>
                                    )}

                                    {/* Scorecard Summary Pill if completed */}
                                    {isCompleted && item.evaluation && (
                                        <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-2xl">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-emerald-950">Scorecard:</span>
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-900 font-bold text-[11px]">
                                                    {item.evaluation.hiringDecision || 'Completed'}
                                                </span>
                                                {item.evaluation.technicalScore > 0 && (
                                                    <span className="text-emerald-800 font-semibold">
                                                        Tech: {item.evaluation.technicalScore}/5 • Problem Solving: {item.evaluation.problemSolvingScore || 4}/5
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setSelectedScorecardInterview(item)}
                                                className="text-[11px] h-7 border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold gap-1 self-start sm:self-auto"
                                            >
                                                <FileCheck className="w-3 h-3 text-emerald-700" />
                                                View Full Report
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Actions */}
                                <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0">
                                    <Button
                                        onClick={() => navigate(`/interview/room/${item.roomId}`)}
                                        className={`text-xs font-bold shadow-xs px-4 h-9 gap-1.5 ${
                                            isLive
                                                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-bounce'
                                                : isTodaySession
                                                ? 'bg-[#6A38C2] hover:bg-[#582ea8] text-white'
                                                : 'bg-[#6A38C2] hover:bg-[#582ea8] text-white'
                                        }`}
                                    >
                                        <Video className="w-3.5 h-3.5" />
                                        <span>
                                            {isLive
                                                ? 'JOIN LIVE CALL NOW'
                                                : isTodaySession
                                                ? 'Enter Interview Room'
                                                : 'Open Video Room'}
                                        </span>
                                    </Button>

                                    {/* Mark Completed & Evaluate Button for Recruiter */}
                                    {isRecruiter && !isCompleted && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenEvaluateModal(item)}
                                            className="text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-8 gap-1"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                            Mark Completed & Score
                                        </Button>
                                    )}

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyLink(item.roomId)}
                                        className="text-xs font-semibold border-gray-200 text-gray-700 hover:bg-gray-50 h-8 gap-1"
                                    >
                                        <Copy className="w-3 h-3 text-gray-500" />
                                        <span>Copy Room Link</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* DIALOG 1: Submit Evaluation Scorecard & Mark Interview Completed */}
            <Dialog open={!!evaluatingInterview} onOpenChange={(open) => !open && setEvaluatingInterview(null)}>
                <DialogContent className="max-w-xl bg-white p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Interview Finalization</span>
                        </div>
                        <DialogTitle className="text-lg font-extrabold text-gray-900 mt-1">
                            Complete Interview & Submit Scorecard
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Record structured evaluation ratings for{' '}
                            <span className="font-bold text-gray-800">{evaluatingInterview?.candidate?.fullname}</span> for the position of{' '}
                            <span className="font-bold text-gray-800">{evaluatingInterview?.job?.title}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitEvaluation} className="space-y-4 mt-2">
                        {/* Rating sliders / selects */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200">
                            <div>
                                <Label className="text-xs font-bold text-gray-700 block mb-1">
                                    Technical Architecture (1-5)
                                </Label>
                                <select
                                    value={evalForm.technicalScore}
                                    onChange={(e) => setEvalForm({ ...evalForm, technicalScore: e.target.value })}
                                    className="w-full text-xs rounded-xl h-9 border border-gray-200 bg-white px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value={5}>5 - Outstanding (Expert)</option>
                                    <option value={4}>4 - Strong (Exceeds Bar)</option>
                                    <option value={3}>3 - Good (Meets Bar)</option>
                                    <option value={2}>2 - Marginal (Below Bar)</option>
                                    <option value={1}>1 - Unsatisfactory</option>
                                </select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-gray-700 block mb-1">
                                    Problem Solving & DSA (1-5)
                                </Label>
                                <select
                                    value={evalForm.problemSolvingScore}
                                    onChange={(e) => setEvalForm({ ...evalForm, problemSolvingScore: e.target.value })}
                                    className="w-full text-xs rounded-xl h-9 border border-gray-200 bg-white px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value={5}>5 - Outstanding</option>
                                    <option value={4}>4 - Strong Analytical Skills</option>
                                    <option value={3}>3 - Good Logical Flow</option>
                                    <option value={2}>2 - Struggled on Edge Cases</option>
                                    <option value={1}>1 - Incomplete Solution</option>
                                </select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-gray-700 block mb-1">
                                    Communication & Clarity (1-5)
                                </Label>
                                <select
                                    value={evalForm.communicationScore}
                                    onChange={(e) => setEvalForm({ ...evalForm, communicationScore: e.target.value })}
                                    className="w-full text-xs rounded-xl h-9 border border-gray-200 bg-white px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value={5}>5 - Clear & Articulate</option>
                                    <option value={4}>4 - Effective Communicator</option>
                                    <option value={3}>3 - Clear with Prompting</option>
                                    <option value={2}>2 - Difficult to Follow</option>
                                    <option value={1}>1 - Poor Communication</option>
                                </select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-gray-700 block mb-1">
                                    Cultural & Team Fit (1-5)
                                </Label>
                                <select
                                    value={evalForm.cultureFitScore}
                                    onChange={(e) => setEvalForm({ ...evalForm, cultureFitScore: e.target.value })}
                                    className="w-full text-xs rounded-xl h-9 border border-gray-200 bg-white px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value={5}>5 - Exceptional Cultural Alignment</option>
                                    <option value={4}>4 - Great Team Collaborator</option>
                                    <option value={3}>3 - Positive Cultural Fit</option>
                                    <option value={2}>2 - Potential Alignment Concerns</option>
                                    <option value={1}>1 - Not a Fit</option>
                                </select>
                            </div>
                        </div>

                        {/* Overall Decision */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-gray-700 block mb-1">
                                    Final Hiring Decision Recommendation
                                </Label>
                                <select
                                    value={evalForm.hiringDecision}
                                    onChange={(e) => setEvalForm({ ...evalForm, hiringDecision: e.target.value })}
                                    className="w-full text-xs rounded-xl h-9 border border-gray-200 bg-white px-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="Strong Hire">⭐ Strong Hire (Top 5%)</option>
                                    <option value="Hire">✅ Hire</option>
                                    <option value="Leaning Hire">👍 Leaning Hire</option>
                                    <option value="Leaning No Hire">👎 Leaning No Hire</option>
                                    <option value="No Hire">❌ No Hire</option>
                                    <option value="Undecided">⏳ Undecided</option>
                                </select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-gray-700 block mb-1">
                                    Advance Job Application Status
                                </Label>
                                <select
                                    value={evalForm.advanceApplicationStatus}
                                    onChange={(e) => setEvalForm({ ...evalForm, advanceApplicationStatus: e.target.value })}
                                    className="w-full text-xs rounded-xl h-9 border border-gray-200 bg-white px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="accepted">Mark Application as Accepted</option>
                                    <option value="rejected">Mark Application as Rejected</option>
                                    <option value="pending">Keep as In Review (Pending)</option>
                                </select>
                            </div>
                        </div>

                        {/* Interviewer Feedback Notes */}
                        <div>
                            <Label className="text-xs font-bold text-gray-700 block mb-1">
                                Interviewer Feedback & Evaluation Remarks
                            </Label>
                            <textarea
                                rows={3}
                                value={evalForm.interviewerFeedback}
                                onChange={(e) => setEvalForm({ ...evalForm, interviewerFeedback: e.target.value })}
                                placeholder="Candidate demonstrated strong state management in React, clear architectural patterns, and answered trade-off questions with high fidelity..."
                                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <DialogFooter className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEvaluatingInterview(null)}
                                disabled={evalSubmitting}
                                className="text-xs border-gray-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={evalSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                            >
                                {evalSubmitting ? 'Saving Scorecard...' : 'Complete & Save Evaluation'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DIALOG 2: View Full Scorecard & Export Report */}
            <Dialog
                open={!!selectedScorecardInterview}
                onOpenChange={(open) => !open && setSelectedScorecardInterview(null)}
            >
                <DialogContent className="max-w-2xl bg-white p-6 sm:p-7 rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <Award className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-wider">Candidate Evaluation Report</span>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {selectedScorecardInterview?.evaluation?.hiringDecision || 'Completed'}
                            </span>
                        </div>
                        <DialogTitle className="text-lg sm:text-xl font-extrabold text-gray-900 mt-1">
                            Interview Scorecard & Rubric Summary
                        </DialogTitle>
                    </DialogHeader>

                    {selectedScorecardInterview && (
                        <div className="space-y-4 text-xs">
                            {/* Candidate & Role Profile Header */}
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                                <div className="flex justify-between py-1 border-b border-gray-200/80">
                                    <span className="text-gray-500">Candidate:</span>
                                    <span className="font-bold text-gray-900">
                                        {selectedScorecardInterview.candidate?.fullname} ({selectedScorecardInterview.candidate?.email})
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-200/80">
                                    <span className="text-gray-500">Target Role:</span>
                                    <span className="font-bold text-gray-900">
                                        {selectedScorecardInterview.job?.title} at {selectedScorecardInterview.company?.name || 'Company'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-200/80">
                                    <span className="text-gray-500">Session Date & Round:</span>
                                    <span className="font-bold text-[#6A38C2]">
                                        {selectedScorecardInterview.interviewDate} at {selectedScorecardInterview.interviewTime} (
                                        {selectedScorecardInterview.roundType})
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-500">Conducted By:</span>
                                    <span className="font-bold text-gray-900">
                                        {selectedScorecardInterview.interviewerType === 'assigned_panelist' &&
                                        selectedScorecardInterview.assignedInterviewer?.name
                                            ? `${selectedScorecardInterview.assignedInterviewer.name} (${selectedScorecardInterview.assignedInterviewer.role || 'Panelist'})`
                                            : selectedScorecardInterview.recruiter?.fullname || 'Lead Recruiter'}
                                    </span>
                                </div>
                            </div>

                            {/* Score Matrix */}
                            <div>
                                <h4 className="font-extrabold text-gray-900 mb-2">Evaluated Competency Matrix</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-center">
                                        <p className="text-[11px] font-semibold text-purple-900">Technical Depth</p>
                                        <p className="text-lg font-extrabold text-[#6A38C2] mt-1">
                                            {selectedScorecardInterview.evaluation?.technicalScore || 4}/5
                                        </p>
                                    </div>
                                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-center">
                                        <p className="text-[11px] font-semibold text-indigo-900">Problem Solving</p>
                                        <p className="text-lg font-extrabold text-indigo-700 mt-1">
                                            {selectedScorecardInterview.evaluation?.problemSolvingScore || 4}/5
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-center">
                                        <p className="text-[11px] font-semibold text-blue-900">Communication</p>
                                        <p className="text-lg font-extrabold text-blue-700 mt-1">
                                            {selectedScorecardInterview.evaluation?.communicationScore || 5}/5
                                        </p>
                                    </div>
                                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
                                        <p className="text-[11px] font-semibold text-emerald-900">Culture & Fit</p>
                                        <p className="text-lg font-extrabold text-emerald-700 mt-1">
                                            {selectedScorecardInterview.evaluation?.cultureFitScore || 4}/5
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Interviewer Feedback */}
                            <div>
                                <h4 className="font-extrabold text-gray-900 mb-1">Interviewer Feedback & Notes</h4>
                                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 leading-relaxed italic">
                                    "{selectedScorecardInterview.evaluation?.interviewerFeedback || 'The candidate showed great technical fluency, strong understanding of core architectural principles, and clear communication throughout the live session.'}"
                                </div>
                            </div>

                            <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyScorecardSummary(selectedScorecardInterview)}
                                    className="text-xs border-gray-200 text-gray-700 gap-1.5"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy Scorecard
                                </Button>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrintScorecard}
                                        className="text-xs border-gray-200 text-gray-700 gap-1.5"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        Print Report
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setSelectedScorecardInterview(null)}
                                        className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-bold"
                                    >
                                        Done
                                    </Button>
                                </div>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ScheduledInterviewsList;
