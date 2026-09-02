import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
    Video,
    Briefcase,
    Building2,
    Sparkles,
    CheckCircle2,
    Clock,
    FileText,
    Calendar,
    Shield,
    Users,
    ChevronRight,
    Lock,
    ExternalLink,
    Code,
    SlidersHorizontal
} from 'lucide-react';
import ScheduledInterviewsList from '../interview/ScheduledInterviewsList';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';

const SubUserDashboard = () => {
    const { user } = useSelector((store) => store.auth);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'interviews';
    const [interviews, setInterviews] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);

    const permissions = user?.permissions || {
        canViewAssignedInterviews: true,
        canConductInterview: true,
        canSubmitReport: true,
        canViewAllInterviews: false,
        canPostJobs: false,
        canViewAllApplicants: false,
        canManageCompanies: false,
        canFinalizeHiringDecision: false,
    };

    useEffect(() => {
        const fetchInterviews = async () => {
            try {
                setLoadingStats(true);
                axios.defaults.withCredentials = true;
                const res = await axios.get(`${INTERVIEW_API_END_POINT}/my-interviews`);
                if (res.data?.success) {
                    setInterviews(res.data.interviews || []);
                }
            } catch (err) {
                console.error("SubUser fetch interviews err:", err);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchInterviews();
    }, []);

    const handleTabChange = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    // Calculate personal stats
    const totalAssigned = interviews.length;
    const completedEvaluations = interviews.filter(
        (i) => i.panelistReport?.isSubmitted || i.status === 'completed'
    ).length;
    const pendingEvaluations = interviews.filter(
        (i) => !i.panelistReport?.isSubmitted && i.status !== 'cancelled'
    ).length;

    const nextUpcoming = interviews
        .filter((i) => i.status === 'scheduled')
        .sort((a, b) => new Date(`${a.interviewDate}T${a.interviewTime}`) - new Date(`${b.interviewDate}T${b.interviewTime}`))[0];

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header / Sub-User Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start sm:items-center gap-4">
                        <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-indigo-400/40 shadow-md">
                            <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                            <AvatarFallback className="bg-indigo-600 text-white font-black text-xl rounded-2xl">
                                {user?.fullname?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="inline-flex items-center gap-1.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                    <Shield className="w-3 h-3 text-indigo-300" />
                                    Technical Panelist / Sub-User
                                </span>
                                <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    Active Panel Session
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                                {user?.fullname}
                            </h1>
                            <p className="text-xs sm:text-sm text-indigo-200 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-semibold text-white">{user?.subRole || 'Technical Interviewer'}</span>
                                <span>•</span>
                                <span>{user?.department || 'Engineering Department'}</span>
                            </p>
                        </div>
                    </div>

                    {/* Next upcoming interview quick-action */}
                    {nextUpcoming && (
                        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 md:max-w-xs w-full flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                                    Next Scheduled Interview
                                </span>
                                <p className="text-xs font-bold text-white mt-1 line-clamp-1">
                                    {nextUpcoming.job?.title || 'Technical Assessment'}
                                </p>
                                <p className="text-[11px] text-indigo-200 mt-0.5">
                                    Candidate: {nextUpcoming.candidate?.fullname || 'Applicant'} • {nextUpcoming.interviewDate} at {nextUpcoming.interviewTime}
                                </p>
                            </div>
                            <Link to={`/interview/room/${nextUpcoming.roomId}`} className="mt-3">
                                <Button size="sm" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md gap-1.5 h-8">
                                    <Video className="w-3.5 h-3.5" />
                                    Launch Live Room
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Sub-User Permission Pills */}
                <div className="mt-6 pt-5 border-t border-indigo-900/60 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-indigo-300 font-semibold text-[11px] mr-1">Your Granted Privileges:</span>
                    {permissions.canConductInterview && (
                        <span className="bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/10 font-medium">
                            Live Video & Code Evaluation
                        </span>
                    )}
                    {permissions.canSubmitReport && (
                        <span className="bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/10 font-medium">
                            Technical Scorecards & Reports
                        </span>
                    )}
                    {permissions.canViewAllInterviews && (
                        <span className="bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/10 font-medium">
                            Company-Wide Interviews Access
                        </span>
                    )}
                    {permissions.canViewAllApplicants && (
                        <span className="bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/10 font-medium">
                            Candidate Applications Review
                        </span>
                    )}
                    {permissions.canPostJobs && (
                        <span className="bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/10 font-medium">
                            Job Creation Privileges
                        </span>
                    )}
                    {permissions.canManageCompanies && (
                        <span className="bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/10 font-medium">
                            Company Profile Management
                        </span>
                    )}
                </div>
            </div>

            {/* Sub-User Specific KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Assigned Interviews</span>
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">{totalAssigned}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Sessions in your docket</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Completed Reports</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 mt-2">{completedEvaluations}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Submitted scorecards</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Pending Evaluation</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-amber-600 mt-2">{pendingEvaluations}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Awaiting report/conduct</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Live Code Workspace</span>
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <Code className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-indigo-700 mt-2">Ready & Integrated</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Real-time sync enabled</p>
                </div>
            </div>

            {/* Navigation Tabs Bar for Sub-User */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                <button
                    onClick={() => handleTabChange('interviews')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'interviews'
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    <Video className="w-4 h-4" />
                    My Assigned Interviews & Evaluation Hub
                </button>

                {permissions.canViewAllApplicants && (
                    <Link to="/admin/jobs">
                        <button
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                                activeTab === 'applicants'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            Candidate Applicants
                        </button>
                    </Link>
                )}

                {permissions.canPostJobs && (
                    <Link to="/admin/jobs/create">
                        <button className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Post Job Position
                        </button>
                    </Link>
                )}

                {permissions.canManageCompanies && (
                    <Link to="/admin/companies">
                        <button className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Company Management
                        </button>
                    </Link>
                )}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
                <div className="mb-5 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Video className="w-5 h-5 text-indigo-600" />
                            Technical Evaluation Dockets
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Join live video interview rooms, assess coding problems, evaluate domain competency, and submit formal scorecards.
                        </p>
                    </div>
                </div>

                <ScheduledInterviewsList />
            </div>
        </div>
    );
};

export default SubUserDashboard;
