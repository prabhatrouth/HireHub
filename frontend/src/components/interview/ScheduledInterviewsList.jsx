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
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';

const ScheduledInterviewsList = ({ roleFilter }) => {
    const { user } = useSelector((store) => store.auth);
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, UPCOMING, LIVE, COMPLETED

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
        // Check updates every 30s
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

    const filteredInterviews = interviews.filter((item) => {
        if (activeFilter === 'LIVE') return item.status === 'live';
        if (activeFilter === 'UPCOMING') return item.status === 'scheduled';
        if (activeFilter === 'COMPLETED') return item.status === 'completed';
        return true;
    });

    if (loading) {
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
                                    ? 'Upcoming'
                                    : filterKey === 'LIVE'
                                    ? '🔴 Live Now'
                                    : 'Completed'}
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
                    const isTodaySession = isToday(item.interviewDate);
                    const partner = isRecruiter ? item.candidate : item.recruiter;
                    const partnerProfile = isRecruiter ? item.candidate?.profile : {};

                    return (
                        <div
                            key={item._id}
                            className={`p-4 sm:p-5 rounded-2xl border transition-all relative ${
                                isLive
                                    ? 'bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-purple-50/90 border-[#6A38C2] ring-2 ring-purple-400 shadow-md'
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
                                        ) : item.status === 'completed' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                Completed
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
                                            <span>{isRecruiter ? 'Candidate:' : 'Interviewer:'}</span>
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

                                    {/* Scorecard Summary if completed */}
                                    {item.evaluation?.hiringDecision && item.evaluation.hiringDecision !== 'Undecided' && (
                                        <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs flex items-center justify-between gap-3 max-w-xl">
                                            <div>
                                                <span className="font-bold text-emerald-900">Evaluation: </span>
                                                <span className="font-semibold text-emerald-800">{item.evaluation.hiringDecision}</span>
                                                {item.evaluation.technicalScore > 0 && (
                                                    <span className="ml-2 text-emerald-700">
                                                        (Tech Score: {item.evaluation.technicalScore}/5)
                                                    </span>
                                                )}
                                            </div>
                                            {item.evaluation.interviewerFeedback && (
                                                <span className="text-emerald-700 italic truncate max-w-xs">
                                                    "{item.evaluation.interviewerFeedback}"
                                                </span>
                                            )}
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
                                                ? 'JOIN LIVE INTERVIEW NOW'
                                                : isTodaySession
                                                ? 'Enter Interview Room'
                                                : 'Open Video Room'}
                                        </span>
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyLink(item.roomId)}
                                        className="text-xs font-semibold border-gray-200 text-gray-700 hover:bg-gray-50 h-8 gap-1"
                                    >
                                        <Copy className="w-3 h-3 text-gray-500" />
                                        <span>Copy Meeting Link</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ScheduledInterviewsList;
