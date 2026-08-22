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
    FileCheck,
    Eye,
    CheckSquare,
    Layers
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
    const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, UPCOMING, LIVE, COMPLETED, PENDING_REVIEW

    // Modal state for viewing evaluation scorecard
    const [selectedScorecardInterview, setSelectedScorecardInterview] = useState(null);

    // Modal state for technical panelist submitting scorecard / report
    const [evaluatingInterview, setEvaluatingInterview] = useState(null);
    const [evalSubmitting, setEvalSubmitting] = useState(false);
    const [evalForm, setEvalForm] = useState({
        technicalScore: 4,
        problemSolvingScore: 4,
        communicationScore: 5,
        systemDesignScore: 4,
        cultureFitScore: 4,
        overallRating: 4,
        strengths: '',
        weaknesses: '',
        keyHighlights: '',
        codeQualitySummary: '',
        panelistRecommendation: 'Hire',
        detailedNotes: '',
    });

    // Modal state for Master Recruiter reviewing panelist report & finalizing hiring decision
    const [finalizingInterview, setFinalizingInterview] = useState(null);
    const [finalizingSubmitting, setFinalizingSubmitting] = useState(false);
    const [finalForm, setFinalForm] = useState({
        finalDecision: 'Hire',
        finalRemarks: '',
        advanceApplicationStatus: 'accepted',
        scheduleNextRound: false,
        nextRoundType: 'Executive Founder Round',
    });

    const isRecruiter = user?.role === 'recruiter';
    const isSubUser = user?.isSubUser;

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
        const interval = setInterval(fetchInterviews, 25000);
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

    // Open technical evaluation modal
    const handleOpenEvaluateModal = (item) => {
        setEvaluatingInterview(item);
        const rep = item.panelistReport || {};
        const ev = item.evaluation || {};
        setEvalForm({
            technicalScore: rep.technicalScore || ev.technicalScore || 4,
            problemSolvingScore: rep.problemSolvingScore || ev.problemSolvingScore || 4,
            communicationScore: rep.communicationScore || ev.communicationScore || 5,
            systemDesignScore: rep.systemDesignScore || 4,
            cultureFitScore: ev.cultureFitScore || 4,
            overallRating: rep.overallRating || ev.rating || 4,
            strengths: rep.strengths || '',
            weaknesses: rep.weaknesses || '',
            keyHighlights: rep.keyHighlights || '',
            codeQualitySummary: rep.codeQualitySummary || '',
            panelistRecommendation: rep.panelistRecommendation || ev.hiringDecision || 'Hire',
            detailedNotes: rep.detailedNotes || ev.interviewerFeedback || '',
        });
    };

    // Submit technical panelist report
    const handleSubmitEvaluation = async (e) => {
        e.preventDefault();
        if (!evaluatingInterview) return;

        setEvalSubmitting(true);
        try {
            axios.defaults.withCredentials = true;
            const isRecruiterSelf = evaluatingInterview.interviewerType === 'recruiter' || (!isSubUser && isRecruiter);

            const res = await axios.post(`${INTERVIEW_API_END_POINT}/room/${evaluatingInterview.roomId}/evaluate`, {
                technicalScore: Number(evalForm.technicalScore),
                problemSolvingScore: Number(evalForm.problemSolvingScore),
                communicationScore: Number(evalForm.communicationScore),
                systemDesignScore: Number(evalForm.systemDesignScore),
                cultureFitScore: Number(evalForm.cultureFitScore),
                overallRating: Number(evalForm.overallRating),
                strengths: evalForm.strengths,
                weaknesses: evalForm.weaknesses,
                keyHighlights: evalForm.keyHighlights,
                codeQualitySummary: evalForm.codeQualitySummary,
                panelistRecommendation: evalForm.panelistRecommendation,
                detailedNotes: evalForm.detailedNotes,
                isRecruiterDirectFinalize: isRecruiterSelf,
            });

            if (res.data?.success) {
                toast.success(res.data.message || 'Report submitted successfully!');
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

    // Open Recruiter Final Decision Modal
    const handleOpenFinalizeModal = (item) => {
        setFinalizingInterview(item);
        const report = item.panelistReport || {};
        const rec = report.panelistRecommendation;
        const defaultDecision = ['Strong Hire', 'Hire'].includes(rec) ? 'Hire' : ['No Hire', 'Leaning No Hire'].includes(rec) ? 'Reject' : 'Advance to Next Round';

        setFinalForm({
            finalDecision: item.recruiterFinalDecision?.finalDecision || defaultDecision,
            finalRemarks: item.recruiterFinalDecision?.finalRemarks || '',
            advanceApplicationStatus: defaultDecision === 'Hire' ? 'accepted' : defaultDecision === 'Reject' ? 'rejected' : 'shortlisted',
            scheduleNextRound: Boolean(item.recruiterFinalDecision?.nextRoundScheduled),
            nextRoundType: item.recruiterFinalDecision?.nextRoundType || 'Executive Founder Round',
        });
    };

    // Submit Recruiter Final Decision
    const handleFinalizeRecruiterDecision = async (e) => {
        e.preventDefault();
        if (!finalizingInterview) return;

        setFinalizingSubmitting(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(`${INTERVIEW_API_END_POINT}/room/${finalizingInterview.roomId}/finalize-decision`, {
                finalDecision: finalForm.finalDecision,
                finalRemarks: finalForm.finalRemarks,
                advanceApplicationStatus: finalForm.advanceApplicationStatus,
                scheduleNextRound: finalForm.scheduleNextRound,
                nextRoundType: finalForm.nextRoundType,
            });

            if (res.data?.success) {
                toast.success(res.data.message || 'Hiring decision finalized!');
                setFinalizingInterview(null);
                fetchInterviews();
            }
        } catch (error) {
            console.error('Finalize decision error:', error);
            toast.error(error.response?.data?.message || 'Failed to finalize decision.');
        } finally {
            setFinalizingSubmitting(false);
        }
    };

    // Filter interviews
    const filteredInterviews = interviews.filter((item) => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'UPCOMING') return item.status === 'scheduled';
        if (activeFilter === 'LIVE') return item.status === 'live' || isToday(item.interviewDate);
        if (activeFilter === 'PENDING_REVIEW') {
            return item.status === 'completed' && item.panelistReport?.isSubmitted && !item.recruiterFinalDecision?.isFinalized;
        }
        if (activeFilter === 'COMPLETED') return item.status === 'completed';
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Top filter tabs & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        { key: 'ALL', label: 'All Interviews', count: interviews.length },
                        { key: 'UPCOMING', label: 'Upcoming', count: interviews.filter((i) => i.status === 'scheduled').length },
                        { key: 'LIVE', label: 'Today / Live', count: interviews.filter((i) => i.status === 'live' || isToday(i.interviewDate)).length },
                        {
                            key: 'PENDING_REVIEW',
                            label: 'Pending Recruiter Review',
                            count: interviews.filter((i) => i.status === 'completed' && i.panelistReport?.isSubmitted && !i.recruiterFinalDecision?.isFinalized).length,
                            hideForStudent: true,
                        },
                        { key: 'COMPLETED', label: 'Completed', count: interviews.filter((i) => i.status === 'completed').length },
                    ]
                        .filter((tab) => !(isRecruiter === false && tab.hideForStudent))
                        .map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveFilter(tab.key)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeFilter === tab.key
                                    ? 'bg-[#6A38C2] text-white shadow-xs'
                                    : 'bg-slate-100/80 hover:bg-slate-200 text-slate-700'
                                    }`}
                            >
                                {tab.label}
                                <span
                                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                        }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchInterviews}
                        className="text-xs h-9 rounded-xl border-slate-200 text-slate-600 gap-1"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Interviews List */}
            {loading && interviews.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-xs">
                    <Sparkles className="w-8 h-8 text-[#6A38C2] animate-spin mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">Loading scheduled interviews & rooms...</p>
                </div>
            ) : filteredInterviews.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-xs">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900">No interviews match this filter</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {isRecruiter
                            ? isSubUser
                                ? 'No interviews currently assigned to your profile.'
                                : 'Schedule interviews directly from Job Applicants, or delegate to your technical team.'
                            : 'When recruiters schedule an interview with you, it will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredInterviews.map((item) => {
                        const isLiveToday = isToday(item.interviewDate);
                        const isCompleted = item.status === 'completed';
                        const isLiveNow = item.status === 'live';
                        const report = item.panelistReport || {};
                        const decision = item.recruiterFinalDecision || {};
                        const isAssignedToOther = item.interviewerType === 'assigned_panelist';
                        const panelistName = item.assignedInterviewer?.name || 'Technical Interviewer';

                        return (
                            <div
                                key={item._id || item.roomId}
                                className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 shadow-xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 ${isLiveNow
                                    ? 'border-rose-300 ring-2 ring-rose-500/10'
                                    : isCompleted
                                        ? 'border-slate-200 bg-slate-50/40'
                                        : 'border-slate-200 hover:border-purple-200'
                                    }`}
                            >
                                {/* Left Section: Candidate / Job / Time */}
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-12 w-12 rounded-2xl border border-slate-200 bg-purple-50 text-[#6A38C2] font-black shrink-0">
                                        <AvatarFallback>
                                            {item.candidate?.fullname?.charAt(0) || 'C'}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-extrabold text-slate-900 text-base">
                                                {item.candidate?.fullname || 'Candidate'}
                                            </h3>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs font-semibold text-slate-600">
                                                {item.job?.title || 'Engineering Role'}
                                            </span>

                                            {/* Status Badge */}
                                            {isLiveNow ? (
                                                <Badge className="bg-rose-600 text-white font-bold text-[10px] animate-pulse">
                                                    LIVE NOW
                                                </Badge>
                                            ) : isCompleted ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-[10px]">
                                                    <Check className="w-3 h-3 mr-1" /> Completed
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-purple-100 text-[#6A38C2] border-purple-200 font-bold text-[10px]">
                                                    Scheduled
                                                </Badge>
                                            )}

                                            {/* Round Badge */}
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                                {item.roundType || 'Technical Round'}
                                            </span>
                                        </div>

                                        {/* Date, Time & Company */}
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                                            <span className="flex items-center gap-1 font-medium text-slate-700">
                                                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                                                {item.interviewDate || 'Upcoming'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                {item.interviewTime} ({item.durationMinutes || 45} mins)
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                {item.company?.name || 'HireHub Partner'}
                                            </span>
                                        </div>

                                        {/* Assigned Panelist / Recruiter Tag */}
                                        <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                                            {isAssignedToOther ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold text-[11px]">
                                                    <Shield className="w-3 h-3 text-indigo-600" />
                                                    Panelist: {panelistName} ({item.assignedInterviewer?.role || 'Technical Lead'})
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold text-[11px]">
                                                    <UserCheck className="w-3 h-3 text-purple-600" />
                                                    Conducted by: {item.recruiter?.fullname || 'Lead Recruiter'}
                                                </span>
                                            )}

                                            {/* Report status tags */}
                                            {report.isSubmitted && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                                    <FileCheck className="w-3 h-3" /> Panelist Score: {report.overallRating || report.technicalScore || 4}/5 ({report.panelistRecommendation || 'Recommended'})
                                                </span>
                                            )}

                                            {decision.isFinalized && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-black text-[10px]">
                                                    <Award className="w-3 h-3" /> Final Decision: {decision.finalDecision}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyLink(item.roomId)}
                                        className="h-9 px-3 rounded-xl text-xs border-slate-200 text-slate-600 hover:text-slate-900 gap-1.5"
                                        title="Copy Meeting Link"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy Link
                                    </Button>

                                    {/* Action based on role & status */}
                                    {isCompleted ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedScorecardInterview(item)}
                                                className="h-9 px-3.5 rounded-xl text-xs border-purple-200 text-[#6A38C2] hover:bg-purple-50 font-bold gap-1.5"
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                View Scorecard
                                            </Button>

                                            {/* If Master Recruiter and report submitted, allow final decision */}
                                            {isRecruiter && !isSubUser && isAssignedToOther && !decision.isFinalized && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleOpenFinalizeModal(item)}
                                                    className="h-9 px-4 rounded-xl text-xs bg-gradient-to-r from-[#6A38C2] to-indigo-600 hover:from-[#582da5] hover:to-indigo-700 text-white font-bold shadow-md gap-1.5 animate-pulse"
                                                >
                                                    <Award className="w-3.5 h-3.5" />
                                                    Finalize Decision
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* Recruiter / Inspector / Panelist Join Room Button */}
                                            <Button
                                                size="sm"
                                                onClick={() => navigate(`/interview/room/${item.roomId}`)}
                                                className={`h-9 px-4 rounded-xl text-xs font-bold shadow-sm gap-1.5 ${isRecruiter && !isSubUser && isAssignedToOther
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                    : 'bg-[#6A38C2] hover:bg-[#582da5] text-white'
                                                    }`}
                                            >
                                                <Video className="w-3.5 h-3.5" />
                                                {isRecruiter && !isSubUser && isAssignedToOther
                                                    ? 'Join / Inspect Live'
                                                    : 'Enter Meeting Room'}
                                            </Button>

                                            {/* Quick complete modal if interviewer */}
                                            {isRecruiter && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenEvaluateModal(item)}
                                                    className="h-9 px-3 rounded-xl text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-1"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Score
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Technical Panelist / Quick Evaluation Modal */}
            <Dialog open={Boolean(evaluatingInterview)} onOpenChange={() => setEvaluatingInterview(null)}>
                <DialogContent className="max-w-xl rounded-3xl border-slate-200 p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#6A38C2] flex items-center justify-center font-bold mb-2">
                            <Award className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-xl font-black text-slate-900">
                            {isSubUser ? 'Submit Technical Panelist Report' : 'Candidate Evaluation Scorecard'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Candidate: <span className="font-bold text-slate-800">{evaluatingInterview?.candidate?.fullname}</span> • Position: <span className="font-bold text-slate-800">{evaluatingInterview?.job?.title}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitEvaluation} className="space-y-4 py-2">
                        {/* Rating scales */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                            <div>
                                <Label className="text-[11px] font-bold text-slate-600">Technical Code</Label>
                                <select
                                    value={evalForm.technicalScore}
                                    onChange={(e) => setEvalForm({ ...evalForm, technicalScore: e.target.value })}
                                    className="w-full mt-1 h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    {[5, 4, 3, 2, 1].map((s) => (
                                        <option key={s} value={s}>{s} / 5</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="text-[11px] font-bold text-slate-600">Problem Solving</Label>
                                <select
                                    value={evalForm.problemSolvingScore}
                                    onChange={(e) => setEvalForm({ ...evalForm, problemSolvingScore: e.target.value })}
                                    className="w-full mt-1 h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    {[5, 4, 3, 2, 1].map((s) => (
                                        <option key={s} value={s}>{s} / 5</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="text-[11px] font-bold text-slate-600">System Design</Label>
                                <select
                                    value={evalForm.systemDesignScore}
                                    onChange={(e) => setEvalForm({ ...evalForm, systemDesignScore: e.target.value })}
                                    className="w-full mt-1 h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    {[5, 4, 3, 2, 1].map((s) => (
                                        <option key={s} value={s}>{s} / 5</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="text-[11px] font-bold text-slate-600">Communication</Label>
                                <select
                                    value={evalForm.communicationScore}
                                    onChange={(e) => setEvalForm({ ...evalForm, communicationScore: e.target.value })}
                                    className="w-full mt-1 h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    {[5, 4, 3, 2, 1].map((s) => (
                                        <option key={s} value={s}>{s} / 5</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Panelist Recommendation</Label>
                            <select
                                value={evalForm.panelistRecommendation}
                                onChange={(e) => setEvalForm({ ...evalForm, panelistRecommendation: e.target.value })}
                                className="w-full mt-1 h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                            >
                                <option value="Strong Hire">Strong Hire (Top 5% Candidate)</option>
                                <option value="Hire">Hire (Meets all technical standards)</option>
                                <option value="Advance to Next Round">Advance to Next Round (Recommend second round)</option>
                                <option value="Leaning No Hire">Leaning No Hire (Marginal score)</option>
                                <option value="No Hire">No Hire (Below bar)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Key Technical Strengths</Label>
                                <textarea
                                    rows={2}
                                    value={evalForm.strengths}
                                    onChange={(e) => setEvalForm({ ...evalForm, strengths: e.target.value })}
                                    placeholder="e.g. Strong understanding of async patterns, clean modular code"
                                    className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Areas for Improvement</Label>
                                <textarea
                                    rows={2}
                                    value={evalForm.weaknesses}
                                    onChange={(e) => setEvalForm({ ...evalForm, weaknesses: e.target.value })}
                                    placeholder="e.g. Edge case handling on null states"
                                    className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Detailed Panelist Notes & Code Review Summary</Label>
                            <textarea
                                rows={3}
                                value={evalForm.detailedNotes}
                                onChange={(e) => setEvalForm({ ...evalForm, detailedNotes: e.target.value })}
                                placeholder="Summary of algorithmic complexity, architectural reasoning, and final thoughts for the Lead Recruiter..."
                                className="w-full mt-1 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                            />
                        </div>

                        <DialogFooter className="pt-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEvaluatingInterview(null)}
                                className="rounded-xl text-xs h-10"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={evalSubmitting}
                                className="bg-[#6A38C2] hover:bg-[#582da5] text-white font-bold rounded-xl text-xs h-10 px-5"
                            >
                                {evalSubmitting ? 'Submitting...' : isSubUser ? 'Submit Report to Recruiter' : 'Save Scorecard & Finalize'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Master Recruiter Final Decision Modal */}
            <Dialog open={Boolean(finalizingInterview)} onOpenChange={() => setFinalizingInterview(null)}>
                <DialogContent className="max-w-xl rounded-3xl border-purple-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#6A38C2] to-indigo-600 text-white flex items-center justify-center font-bold mb-2 shadow-md">
                            <Award className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-xl font-black text-slate-900">
                            Recruiter Executive Decision & Final Sign-Off
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Review the submitted technical panelist report and make the authoritative hiring determination.
                        </DialogDescription>
                    </DialogHeader>

                    {finalizingInterview && (
                        <form onSubmit={handleFinalizeRecruiterDecision} className="space-y-4 py-2">
                            {/* Panelist Report Summary Box */}
                            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-purple-900">
                                        Report from: {finalizingInterview.assignedInterviewer?.name || 'Panelist'} ({finalizingInterview.assignedInterviewer?.role})
                                    </span>
                                    <Badge className="bg-purple-200 text-purple-900 font-bold text-[10px]">
                                        Rec: {finalizingInterview.panelistReport?.panelistRecommendation || 'Hire'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-purple-200/60 font-semibold text-slate-700">
                                    <div>Code: <span className="text-purple-800">{finalizingInterview.panelistReport?.technicalScore || 4}/5</span></div>
                                    <div>DSA: <span className="text-purple-800">{finalizingInterview.panelistReport?.problemSolvingScore || 4}/5</span></div>
                                    <div>Design: <span className="text-purple-800">{finalizingInterview.panelistReport?.systemDesignScore || 4}/5</span></div>
                                    <div>Comm: <span className="text-purple-800">{finalizingInterview.panelistReport?.communicationScore || 5}/5</span></div>
                                </div>
                                {finalizingInterview.panelistReport?.detailedNotes && (
                                    <p className="text-slate-600 italic pt-1 border-t border-purple-100">
                                        "{finalizingInterview.panelistReport.detailedNotes}"
                                    </p>
                                )}
                            </div>

                            {/* Final Decision Selector */}
                            <div>
                                <Label className="text-xs font-bold text-slate-900">Recruiter Final Decision *</Label>
                                <select
                                    value={finalForm.finalDecision}
                                    onChange={(e) => setFinalForm({ ...finalForm, finalDecision: e.target.value })}
                                    className="w-full mt-1.5 h-11 px-3 bg-white border-2 border-purple-200 rounded-xl text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-purple-500/20"
                                >
                                    <option value="Hire">🎉 Hire Candidate (Extend Offer)</option>
                                    <option value="Strong Hire">⭐ Strong Hire (High Priority Top Tier)</option>
                                    <option value="Advance to Next Round">⏩ Advance to Next Round (Schedule next step)</option>
                                    <option value="On Hold">⏸️ On Hold (Evaluate against remaining candidates)</option>
                                    <option value="Reject">❌ Reject Application</option>
                                </select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700">Recruiter Executive Remarks & Next Steps</Label>
                                <textarea
                                    rows={3}
                                    value={finalForm.finalRemarks}
                                    onChange={(e) => setFinalForm({ ...finalForm, finalRemarks: e.target.value })}
                                    placeholder="Approved based on technical panelist recommendation. Proceed with compensation offer..."
                                    className="w-full mt-1 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                                />
                            </div>

                            <DialogFooter className="pt-3 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setFinalizingInterview(null)}
                                    className="rounded-xl text-xs h-10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={finalizingSubmitting}
                                    className="bg-gradient-to-r from-[#6A38C2] to-indigo-600 hover:from-[#582da5] hover:to-indigo-700 text-white font-bold rounded-xl text-xs h-10 px-6 shadow-md"
                                >
                                    {finalizingSubmitting ? 'Recording Decision...' : 'Confirm Final Decision'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Scorecard Viewer Modal */}
            <Dialog open={Boolean(selectedScorecardInterview)} onOpenChange={() => setSelectedScorecardInterview(null)}>
                <DialogContent className="max-w-2xl rounded-3xl border-slate-200 p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-2">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-xl font-black text-slate-900">
                            Interview Scorecard & Hiring Dossier
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Candidate: {selectedScorecardInterview?.candidate?.fullname} • Position: {selectedScorecardInterview?.job?.title}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedScorecardInterview && (
                        <div className="space-y-4 py-2 text-xs">
                            {/* Header details */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Interview Date:</span>
                                    <p className="font-bold text-slate-800">{selectedScorecardInterview.interviewDate}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Round Type:</span>
                                    <p className="font-bold text-purple-700">{selectedScorecardInterview.roundType}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Interviewer:</span>
                                    <p className="font-bold text-slate-800">
                                        {selectedScorecardInterview.assignedInterviewer?.name || selectedScorecardInterview.recruiter?.fullname}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Final Decision:</span>
                                    <p className="font-extrabold text-emerald-700">
                                        {selectedScorecardInterview.recruiterFinalDecision?.finalDecision || selectedScorecardInterview.evaluation?.hiringDecision || 'Completed'}
                                    </p>
                                </div>
                            </div>

                            {/* Scores */}
                            <div className="grid grid-cols-4 gap-3 text-center bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500">Technical Code</span>
                                    <p className="text-lg font-black text-purple-900">
                                        {selectedScorecardInterview.panelistReport?.technicalScore || selectedScorecardInterview.evaluation?.technicalScore || 4}/5
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500">Problem Solving</span>
                                    <p className="text-lg font-black text-purple-900">
                                        {selectedScorecardInterview.panelistReport?.problemSolvingScore || selectedScorecardInterview.evaluation?.problemSolvingScore || 4}/5
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500">System Design</span>
                                    <p className="text-lg font-black text-purple-900">
                                        {selectedScorecardInterview.panelistReport?.systemDesignScore || 4}/5
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500">Communication</span>
                                    <p className="text-lg font-black text-purple-900">
                                        {selectedScorecardInterview.panelistReport?.communicationScore || selectedScorecardInterview.evaluation?.communicationScore || 5}/5
                                    </p>
                                </div>
                            </div>

                            {/* Panelist Notes */}
                            {selectedScorecardInterview.panelistReport?.detailedNotes && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                                    <h4 className="font-bold text-slate-900">Panelist Evaluation & Code Notes:</h4>
                                    <p className="text-slate-600 leading-relaxed">
                                        {selectedScorecardInterview.panelistReport.detailedNotes}
                                    </p>
                                </div>
                            )}

                            {/* Recruiter Remarks */}
                            {selectedScorecardInterview.recruiterFinalDecision?.finalRemarks && (
                                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 space-y-1">
                                    <h4 className="font-bold text-purple-900">Lead Recruiter Final Sign-Off Remarks:</h4>
                                    <p className="text-purple-800 leading-relaxed">
                                        {selectedScorecardInterview.recruiterFinalDecision.finalRemarks}
                                    </p>
                                </div>
                            )}

                            <DialogFooter>
                                <Button
                                    onClick={() => setSelectedScorecardInterview(null)}
                                    className="w-full bg-[#6A38C2] hover:bg-[#582da5] text-white font-bold rounded-xl text-xs h-10"
                                >
                                    Close Scorecard
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ScheduledInterviewsList;
