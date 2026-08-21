import React, { useEffect, useState } from 'react';
import Navbar from './shared/Navbar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { APPLICATION_API_END_POINT, JOB_API_END_POINT, AI_API_END_POINT } from '@/utils/constant';
import { setSingleJob } from '@/redux/jobSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
    Briefcase,
    MapPin,
    Calendar,
    Users,
    DollarSign,
    Award,
    Sparkles,
    CheckCircle2,
    ArrowLeft,
    Building2,
    Globe,
    Loader2,
    FileText,
    BookOpen,
    Copy,
    Share2,
    TrendingUp,
    ShieldAlert,
    Lightbulb,
    HelpCircle,
    Check,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';

const JobDescription = () => {
    const { singleJob, allJobs } = useSelector((store) => store.job);
    const { user } = useSelector((store) => store.auth);
    const navigate = useNavigate();
    const params = useParams();
    const jobId = params.id;
    const dispatch = useDispatch();

    // Look for matching job in Redux store as immediate fallback
    const fallbackJob = allJobs?.find((j) => String(j?._id) === String(jobId));
    const activeJob = singleJob && String(singleJob._id) === String(jobId) ? singleJob : (fallbackJob || singleJob);

    const isInitiallyApplied = activeJob?.applications?.some(
        (application) =>
            application === user?._id ||
            application?._id === user?._id ||
            application?.applicant === user?._id ||
            application?.applicant?._id === user?._id
    ) || false;

    const [isApplied, setIsApplied] = useState(isInitiallyApplied);
    const [applying, setApplying] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // AI Feature States
    const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
    const [coverLetterText, setCoverLetterText] = useState('');
    const [coverLetterLoading, setCoverLetterLoading] = useState(false);
    const [coverLetterNote, setCoverLetterNote] = useState('');
    const [copiedLetter, setCopiedLetter] = useState(false);

    const [isInterviewPrepOpen, setIsInterviewPrepOpen] = useState(false);
    const [interviewPrepData, setInterviewPrepData] = useState(null);
    const [interviewPrepLoading, setInterviewPrepLoading] = useState(false);

    const [isFitAnalysisOpen, setIsFitAnalysisOpen] = useState(false);
    const [fitAnalysisData, setFitAnalysisData] = useState(null);
    const [fitAnalysisLoading, setFitAnalysisLoading] = useState(false);

    // Apply Handler
    const applyJobHandler = async () => {
        if (!user) {
            toast.error('Please log in as a candidate to apply for jobs.');
            navigate('/login');
            return;
        }
        if (user.role === 'recruiter') {
            toast.error('Recruiters cannot apply to jobs. Please switch to a candidate account.');
            return;
        }

        setApplying(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.get(`${APPLICATION_API_END_POINT}/apply/${jobId}`, { withCredentials: true });

            if (res.data?.success) {
                setIsApplied(true);
                const updatedSingleJob = {
                    ...activeJob,
                    applications: [...(activeJob?.applications || []), { applicant: user?._id }],
                };
                dispatch(setSingleJob(updatedSingleJob));
                toast.success(res.data.message || 'Application submitted successfully!');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to submit application');
        } finally {
            setApplying(false);
        }
    };

    // Fetch single job from API
    useEffect(() => {
        let isMounted = true;
        const fetchSingleJob = async () => {
            try {
                setPageLoading(true);
                axios.defaults.withCredentials = true;
                const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, { withCredentials: true });
                if (res.data?.success && isMounted) {
                    dispatch(setSingleJob(res.data.job));
                    const hasApplied = res.data.job.applications?.some(
                        (app) =>
                            app === user?._id ||
                            app?._id === user?._id ||
                            app?.applicant === user?._id ||
                            app?.applicant?._id === user?._id
                    );
                    setIsApplied(Boolean(hasApplied));
                }
            } catch (error) {
                console.error("Fetch single job error:", error);
            } finally {
                if (isMounted) setPageLoading(false);
            }
        };

        if (jobId) {
            fetchSingleJob();
        }

        return () => {
            isMounted = false;
        };
    }, [jobId, dispatch, user?._id]);

    // Handle Cover Letter Generation
    const handleGenerateCoverLetter = async () => {
        setIsCoverLetterOpen(true);
        if (coverLetterText && !coverLetterNote) return;

        setCoverLetterLoading(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(
                `${AI_API_END_POINT}/cover-letter`,
                {
                    jobId: activeJob?._id || jobId,
                    job: activeJob,
                    customNote: coverLetterNote,
                    fullname: user?.fullname,
                    skills: user?.profile?.skills,
                    bio: user?.profile?.bio,
                },
                { withCredentials: true }
            );

            if (res.data?.success) {
                setCoverLetterText(res.data.coverLetter);
            } else {
                toast.error('Could not generate cover letter. Please try again.');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to generate AI cover letter.');
        } finally {
            setCoverLetterLoading(false);
        }
    };

    // Handle Interview Prep Guide
    const handleGenerateInterviewPrep = async () => {
        setIsInterviewPrepOpen(true);
        if (interviewPrepData) return;

        setInterviewPrepLoading(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(
                `${AI_API_END_POINT}/interview-prep`,
                {
                    jobId: activeJob?._id || jobId,
                    job: activeJob,
                },
                { withCredentials: true }
            );

            if (res.data?.success) {
                setInterviewPrepData(res.data.interviewPrep);
            } else {
                toast.error('Could not load interview prep guide.');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to generate interview prep guide.');
        } finally {
            setInterviewPrepLoading(false);
        }
    };

    // Handle Career Fit Analysis
    const handleGenerateFitAnalysis = async () => {
        setIsFitAnalysisOpen(true);
        if (fitAnalysisData) return;

        setFitAnalysisLoading(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(
                `${AI_API_END_POINT}/career-fit`,
                {
                    jobId: activeJob?._id || jobId,
                    job: activeJob,
                    profile: {
                        fullname: user?.fullname,
                        bio: user?.profile?.bio,
                        skills: user?.profile?.skills || [],
                    },
                },
                { withCredentials: true }
            );

            if (res.data?.success) {
                setFitAnalysisData(res.data.fitAnalysis);
            } else {
                toast.error('Could not load career fit analysis.');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to generate career fit analysis.');
        } finally {
            setFitAnalysisLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedLetter(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopiedLetter(false), 2500);
    };

    const shareJob = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Job link copied to clipboard!');
        }
    };

    // Data parsing with safe fallbacks
    const jobTitle = activeJob?.title || activeJob?.name || 'Position Details';
    const companyName =
        (typeof activeJob?.company === 'object' && activeJob?.company?.name) ||
        (typeof activeJob?.company === 'string' && activeJob?.company) ||
        activeJob?.companyName ||
        'Leading Tech Employer';

    const companyLogo =
        (typeof activeJob?.company === 'object' && activeJob?.company?.logo) ||
        activeJob?.companyLogo ||
        '';

    const companyLocation =
        activeJob?.location ||
        (typeof activeJob?.company === 'object' && activeJob?.company?.location) ||
        'Remote / Hybrid';

    const companyWebsite =
        typeof activeJob?.company === 'object' && activeJob?.company?.website ? activeJob?.company?.website : null;

    const userSkills = user?.profile?.skills || [];
    const jobRequirements = Array.isArray(activeJob?.requirements)
        ? activeJob.requirements
        : typeof activeJob?.requirements === 'string'
        ? activeJob.requirements.split(',').map((s) => s.trim())
        : [];

    const matchingSkills = jobRequirements.filter((req) =>
        userSkills.some((s) => s.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.toLowerCase()))
    );

    const isJobCreator = user && activeJob && (
        String(activeJob.created_by) === String(user._id) ||
        String(activeJob.created_by?._id) === String(user._id) ||
        user.role === 'recruiter'
    );

    if (pageLoading && !activeJob) {
        return (
            <div className="min-h-screen bg-[#F8FAFC]">
                <Navbar />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#6A38C2] mb-4" />
                    <p className="text-sm font-semibold text-gray-700">Loading role and company details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Navigation Bar */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Listings
                    </button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={shareJob}
                            className="text-xs font-medium text-gray-600 border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-1.5"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            Share Role
                        </Button>

                        {isJobCreator && (
                            <Link to={`/admin/jobs/${jobId}/applicants`}>
                                <Button
                                    size="sm"
                                    className="bg-purple-50 hover:bg-purple-100 text-[#6A38C2] border border-purple-200 text-xs font-bold flex items-center gap-1.5"
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    View AI Ranked Applicants ({activeJob?.applications?.length || 0})
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Job Header Hero Card */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs mb-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border border-gray-100 bg-purple-50/50 shadow-2xs shrink-0">
                                <AvatarImage src={companyLogo} alt={companyName} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-xl">
                                    {companyName.charAt(0) || 'C'}
                                </AvatarFallback>
                            </Avatar>

                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                                    {jobTitle}
                                </h1>

                                <div className="text-sm font-semibold text-gray-700 mt-2 flex flex-wrap items-center gap-2.5">
                                    <span className="text-gray-900 font-bold text-base">{companyName}</span>
                                    <span className="text-gray-300">&bull;</span>
                                    <span className="text-gray-500 font-medium flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                        {companyLocation}
                                    </span>
                                    {companyWebsite && (
                                        <>
                                            <span className="text-gray-300">&bull;</span>
                                            <a
                                                href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[#6A38C2] hover:underline flex items-center gap-1 text-xs font-semibold"
                                            >
                                                <Globe className="w-3.5 h-3.5" />
                                                Website
                                            </a>
                                        </>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <Badge variant="outline" className="text-blue-700 bg-blue-50/80 border-blue-200 text-xs font-semibold px-2.5 py-1">
                                        {activeJob?.position || 1} {activeJob?.position === 1 ? 'Opening' : 'Openings'}
                                    </Badge>
                                    <Badge variant="outline" className="text-[#F83002] bg-orange-50/80 border-orange-200 text-xs font-semibold px-2.5 py-1">
                                        {activeJob?.jobType || 'Full Time'}
                                    </Badge>
                                    <Badge variant="outline" className="text-[#6A38C2] bg-purple-50/80 border-purple-200 text-xs font-semibold px-2.5 py-1">
                                        {activeJob?.salary ? `${activeJob.salary} LPA` : 'Competitive CTC'}
                                    </Badge>
                                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50/80 border-emerald-200 text-xs font-semibold px-2.5 py-1">
                                        {activeJob?.experienceLevel || activeJob?.experience || '1-3'} Years Exp
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Apply & Primary Actions */}
                        <div className="md:self-start shrink-0 flex flex-col gap-2">
                            <Button
                                onClick={isApplied ? null : applyJobHandler}
                                disabled={isApplied || applying}
                                size="lg"
                                className={`w-full md:w-auto font-bold text-sm px-8 rounded-xl shadow-xs transition-all ${
                                    isApplied
                                        ? 'bg-emerald-600 hover:bg-emerald-600 text-white cursor-default'
                                        : 'bg-[#6A38C2] hover:bg-[#582da5] text-white'
                                }`}
                            >
                                {isApplied ? (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4.5 h-4.5" />
                                        Application Submitted
                                    </span>
                                ) : applying ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting Application...
                                    </span>
                                ) : (
                                    'Apply For This Job'
                                )}
                            </Button>

                            {isApplied && (
                                <p className="text-[11px] text-emerald-700 font-medium text-center">
                                    Your profile has been submitted to {companyName}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Candidate Toolkit Banner */}
                <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-purple-500/30 text-purple-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-purple-400/30 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-purple-300" />
                                    AI Candidate Copilot
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-white mt-1.5">
                                Accelerate Your Application for {jobTitle}
                            </h2>
                            <p className="text-xs text-purple-200/90 mt-0.5 max-w-xl">
                                Leverage intelligent role insights to tailor your resume, craft customized cover letters, and master interview questions.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            <Button
                                onClick={handleGenerateFitAnalysis}
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs"
                            >
                                <TrendingUp className="w-3.5 h-3.5 text-purple-300" />
                                Fit Analysis
                            </Button>

                            <Button
                                onClick={handleGenerateCoverLetter}
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs"
                            >
                                <FileText className="w-3.5 h-3.5 text-purple-300" />
                                AI Cover Letter
                            </Button>

                            <Button
                                onClick={handleGenerateInterviewPrep}
                                size="sm"
                                className="bg-white text-[#6A38C2] hover:bg-purple-50 font-bold text-xs flex items-center gap-1.5 shadow-xs"
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                Interview Prep
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Skill Compatibility Quick Insight */}
                {userSkills.length > 0 && jobRequirements.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200/90 p-5 mb-6 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#6A38C2]" />
                                <h3 className="font-bold text-sm text-gray-900">Your Skill Alignment Overview</h3>
                            </div>
                            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                                {matchingSkills.length} of {jobRequirements.length} required skills matched
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {jobRequirements.map((req, idx) => {
                                const isMatched = matchingSkills.includes(req);
                                return (
                                    <span
                                        key={idx}
                                        className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 ${
                                            isMatched
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                : 'bg-gray-50 text-gray-600 border border-gray-200'
                                        }`}
                                    >
                                        {isMatched ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                        )}
                                        {req}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Description & Requirements */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs">
                            <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100 mb-4 flex items-center gap-2">
                                <Briefcase className="w-4.5 h-4.5 text-[#6A38C2]" />
                                Role Overview & Responsibilities
                            </h2>
                            <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                                {activeJob?.description || 'Detailed role specifications and requirements.'}
                            </div>

                            {jobRequirements.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Award className="w-4.5 h-4.5 text-emerald-600" />
                                        Required Skills & Technical Proficiencies
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {jobRequirements.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Col: Snapshot Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
                            <h3 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100 mb-4">
                                Job Snapshot
                            </h3>
                            <ul className="space-y-3.5 text-xs">
                                <li className="flex items-center justify-between text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                        Hiring Company:
                                    </span>
                                    <span className="font-semibold text-gray-900">{companyName}</span>
                                </li>
                                <li className="flex items-center justify-between text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                        Job Type:
                                    </span>
                                    <span className="font-semibold text-gray-900">{activeJob?.jobType || 'Full Time'}</span>
                                </li>
                                <li className="flex items-center justify-between text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <Award className="w-3.5 h-3.5 text-gray-400" />
                                        Experience:
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {activeJob?.experienceLevel || activeJob?.experience || '1-3'} Years
                                    </span>
                                </li>
                                <li className="flex items-center justify-between text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                                        Offered CTC:
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {activeJob?.salary ? `${activeJob.salary} LPA` : 'Competitive'}
                                    </span>
                                </li>
                                <li className="flex items-center justify-between text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                        Total Applicants:
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {activeJob?.applications?.length || 0} candidates
                                    </span>
                                </li>
                                <li className="flex items-center justify-between text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        Posted Date:
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {activeJob?.createdAt ? String(activeJob.createdAt).split('T')[0] : 'Recent'}
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Quick AI Application Tips Card */}
                        <div className="bg-purple-50/50 rounded-2xl border border-purple-200/70 p-5">
                            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5 mb-2">
                                <Lightbulb className="w-4 h-4 text-purple-700" />
                                Pro Tip for Applicants
                            </h4>
                            <p className="text-xs text-purple-900/80 leading-relaxed">
                                Candidates who customize their profile skills to match the job requirements have a 3x higher interview callback rate.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Cover Letter Generator Dialog */}
            <Dialog open={isCoverLetterOpen} onOpenChange={setIsCoverLetterOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
                                    <Sparkles className="w-5 h-5 text-[#6A38C2]" />
                                    AI Cover Letter Generator
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-500 mt-1">
                                    Tailored specifically for <span className="font-semibold text-gray-800">{jobTitle}</span> at {companyName}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">
                                Custom Note or Focus Area (Optional)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={coverLetterNote}
                                    onChange={(e) => setCoverLetterNote(e.target.value)}
                                    placeholder="e.g. Emphasize my full-stack leadership & React performance optimization"
                                    className="text-xs flex-1 rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-[#6A38C2]"
                                />
                                <Button
                                    onClick={handleGenerateCoverLetter}
                                    disabled={coverLetterLoading}
                                    size="sm"
                                    className="bg-[#6A38C2] hover:bg-[#582da5] text-white text-xs font-semibold shrink-0"
                                >
                                    {coverLetterLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Regenerate'
                                    )}
                                </Button>
                            </div>
                        </div>

                        {coverLetterLoading ? (
                            <div className="py-16 text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#6A38C2] mx-auto mb-3" />
                                <p className="text-sm font-semibold text-gray-700">Writing tailored cover letter...</p>
                                <p className="text-xs text-gray-400 mt-1">Aligning your background with {companyName}'s needs</p>
                            </div>
                        ) : coverLetterText ? (
                            <div className="space-y-3">
                                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs sm:text-sm text-gray-800 leading-relaxed font-mono whitespace-pre-line max-h-96 overflow-y-auto">
                                    {coverLetterText}
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        onClick={() => copyToClipboard(coverLetterText)}
                                        size="sm"
                                        className="bg-[#6A38C2] hover:bg-[#582da5] text-white text-xs font-bold flex items-center gap-1.5"
                                    >
                                        {copiedLetter ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedLetter ? 'Copied!' : 'Copy to Clipboard'}
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            {/* AI Interview Prep Dialog */}
            <Dialog open={isInterviewPrepOpen} onOpenChange={setIsInterviewPrepOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
                            <BookOpen className="w-5 h-5 text-[#6A38C2]" />
                            AI Interview Preparation Guide
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 mt-1">
                            Role-specific technical questions, STAR behavioral frameworks, and interview tips
                        </DialogDescription>
                    </DialogHeader>

                    {interviewPrepLoading ? (
                        <div className="py-16 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#6A38C2] mx-auto mb-3" />
                            <p className="text-sm font-semibold text-gray-700">Generating role-specific interview guide...</p>
                            <p className="text-xs text-gray-400 mt-1">Compiling technical scenarios and behavioral questions</p>
                        </div>
                    ) : interviewPrepData ? (
                        <div className="space-y-5 mt-2">
                            {/* Summary / Tip Banner */}
                            {interviewPrepData.salaryNegotiationTip && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900">
                                    <span className="font-bold block mb-1">Negotiation Insight:</span>
                                    {interviewPrepData.salaryNegotiationTip}
                                </div>
                            )}

                            {/* Technical Questions */}
                            {interviewPrepData.technicalQuestions?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5 text-[#6A38C2]" />
                                        Technical & Domain Scenarios
                                    </h4>
                                    <div className="space-y-2.5">
                                        {interviewPrepData.technicalQuestions.map((item, idx) => (
                                            <div key={idx} className="bg-gray-50 border border-gray-200/80 rounded-xl p-3">
                                                <p className="text-xs font-bold text-gray-900">{idx + 1}. {item.question}</p>
                                                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                                                    <span className="font-semibold text-purple-800">Key Focus:</span> {item.idealAnswerPoints}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Behavioral STAR Questions */}
                            {interviewPrepData.behavioralQuestions?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <HelpCircle className="w-3.5 h-3.5 text-[#6A38C2]" />
                                        Behavioral & Culture Fit (STAR Method)
                                    </h4>
                                    <div className="space-y-2.5">
                                        {interviewPrepData.behavioralQuestions.map((item, idx) => (
                                            <div key={idx} className="bg-gray-50 border border-gray-200/80 rounded-xl p-3">
                                                <p className="text-xs font-bold text-gray-900">{idx + 1}. {item.question}</p>
                                                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                                                    <span className="font-semibold text-purple-800">What Interviewers Look For:</span> {item.starFrameworkAdvice}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Questions to Ask Interviewer */}
                            {interviewPrepData.questionsToAskInterviewer?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                                        Smart Questions to Ask the Hiring Team
                                    </h4>
                                    <ul className="space-y-1.5">
                                        {interviewPrepData.questionsToAskInterviewer.map((q, idx) => (
                                            <li key={idx} className="text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-2.5 flex items-start gap-2">
                                                <span className="text-[#6A38C2] font-bold">&bull;</span>
                                                {q}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* AI Career Fit & Gap Analysis Dialog */}
            <Dialog open={isFitAnalysisOpen} onOpenChange={setIsFitAnalysisOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
                                    <TrendingUp className="w-5 h-5 text-[#6A38C2]" />
                                    AI Career Compatibility Analysis
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-500 mt-1">
                                    Evaluation of your profile match for {jobTitle}
                                </DialogDescription>
                            </div>
                            {fitAnalysisData?.matchScore !== undefined && (
                                <div className="px-3 py-1 bg-purple-50 border border-purple-200 text-[#6A38C2] font-extrabold text-sm rounded-full">
                                    {fitAnalysisData.matchScore}% Match
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    {fitAnalysisLoading ? (
                        <div className="py-16 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#6A38C2] mx-auto mb-3" />
                            <p className="text-sm font-semibold text-gray-700">Evaluating compatibility with role criteria...</p>
                            <p className="text-xs text-gray-400 mt-1">Calculating skill alignment score and growth roadmap</p>
                        </div>
                    ) : fitAnalysisData ? (
                        <div className="space-y-4 mt-2">
                            {/* Summary Box */}
                            <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                                    AI Fit Summary
                                </h4>
                                <p className="text-xs sm:text-sm text-purple-950 leading-relaxed">
                                    {fitAnalysisData.summary}
                                </p>
                            </div>

                            {/* Strengths */}
                            {fitAnalysisData.strengths?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        Your Standout Strengths
                                    </h4>
                                    <div className="space-y-1.5">
                                        {fitAnalysisData.strengths.map((str, idx) => (
                                            <div key={idx} className="text-xs text-gray-700 bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-2.5">
                                                {str}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Missing Skills / Upskilling Recommendations */}
                            {fitAnalysisData.missingSkills?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                                        Skills to Highlight or Develop
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {fitAnalysisData.missingSkills.map((skill, idx) => (
                                            <span key={idx} className="text-xs bg-amber-50 text-amber-800 border border-amber-200 font-semibold px-2.5 py-1 rounded-lg">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actionable Advice */}
                            {fitAnalysisData.actionableAdvice?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Lightbulb className="w-3.5 h-3.5 text-[#6A38C2]" />
                                        Actionable Recommendations
                                    </h4>
                                    <ul className="space-y-1.5">
                                        {fitAnalysisData.actionableAdvice.map((advice, idx) => (
                                            <li key={idx} className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex items-start gap-2">
                                                <span className="text-[#6A38C2] font-bold">&bull;</span>
                                                {advice}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default JobDescription;
