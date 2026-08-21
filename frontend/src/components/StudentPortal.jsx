import React, { useState, useEffect } from 'react';
import Navbar from './shared/Navbar';
import Footer from './shared/Footer';
import RecommendedJobs from './RecommendedJobs';
import ResumeChecker from './ResumeChecker';
import AppliedJobTable from './AppliedJobTable';
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs';
import { useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AI_API_END_POINT } from '@/utils/constant';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
    Sparkles,
    FileCheck2,
    Briefcase,
    FileText,
    Bot,
    Compass,
    CheckCircle2,
    Copy,
    Check,
    Send,
    Loader2,
    ArrowRight,
    TrendingUp,
    Building2,
    MapPin,
    Bookmark,
    SlidersHorizontal,
    UserCheck,
    GraduationCap,
    Lightbulb,
    HelpCircle
} from 'lucide-react';

const StudentPortal = () => {
    useGetAppliedJobs();
    const { user } = useSelector((store) => store.auth);
    const { allAppliedJobs } = useSelector((store) => store.job);
    const { allJobs } = useSelector((store) => store.job);

    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'matches';
    const [activeTab, setActiveTab] = useState(initialTab);

    // AI Cover Letter State
    const [selectedJobId, setSelectedJobId] = useState('');
    const [customNote, setCustomNote] = useState('');
    const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
    const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
    const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);

    // AI Interview Coach State
    const [interviewJobId, setInterviewJobId] = useState('');
    const [generatingPrep, setGeneratingPrep] = useState(false);
    const [prepData, setPrepData] = useState(null);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };

    // Generate Cover Letter
    const handleGenerateCoverLetter = async (e) => {
        e.preventDefault();
        if (!selectedJobId) {
            toast.error('Please select a job to generate a cover letter.');
            return;
        }

        try {
            setGeneratingCoverLetter(true);
            const res = await axios.post(
                `${AI_API_END_POINT}/cover-letter`,
                {
                    jobId: selectedJobId,
                    customNote,
                },
                { withCredentials: true }
            );

            if (res.data?.success) {
                setGeneratedCoverLetter(res.data.coverLetter);
                toast.success('AI Cover Letter created successfully!');
            }
        } catch (error) {
            console.error('Cover letter failed:', error);
            toast.error(error.response?.data?.message || 'Failed to generate cover letter.');
        } finally {
            setGeneratingCoverLetter(false);
        }
    };

    // Generate Interview Prep
    const handleGenerateInterviewPrep = async (e) => {
        e.preventDefault();
        if (!interviewJobId) {
            toast.error('Please select a job to prepare for.');
            return;
        }

        try {
            setGeneratingPrep(true);
            const res = await axios.post(
                `${AI_API_END_POINT}/interview-prep`,
                { jobId: interviewJobId },
                { withCredentials: true }
            );

            if (res.data?.success) {
                setPrepData(res.data.interviewPrep);
                toast.success('Interview Prep Coach ready!');
            }
        } catch (error) {
            console.error('Interview prep failed:', error);
            toast.error(error.response?.data?.message || 'Failed to generate interview prep.');
        } finally {
            setGeneratingPrep(false);
        }
    };

    const copyCoverLetter = () => {
        navigator.clipboard.writeText(generatedCoverLetter);
        setCopiedCoverLetter(true);
        toast.success('Cover letter copied!');
        setTimeout(() => setCopiedCoverLetter(false), 2500);
    };

    const availableJobs = allJobs || [];

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
            <div>
                <Navbar />

                {/* Hero Banner */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold uppercase tracking-wider mb-3">
                                    <GraduationCap className="w-3.5 h-3.5 text-purple-300" />
                                    Student & Candidate Career Center
                                </div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                                    Welcome, <span className="text-purple-300">{user?.fullname || 'Candidate'}</span>
                                </h1>
                                <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl leading-relaxed">
                                    Supercharge your job search with AI matching, ATS resume scoring, personalized cover letters, and live interview coaching.
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
                                    <p className="text-xl sm:text-2xl font-extrabold text-white">{allAppliedJobs?.length || 0}</p>
                                    <p className="text-[11px] font-medium text-purple-200">Applied Jobs</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
                                    <p className="text-xl sm:text-2xl font-extrabold text-emerald-400">{user?.profile?.skills?.length || 0}</p>
                                    <p className="text-[11px] font-medium text-purple-200">Skills Listed</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
                                    <p className="text-xl sm:text-2xl font-extrabold text-purple-300">92%</p>
                                    <p className="text-[11px] font-medium text-purple-200">ATS Target</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <button
                                onClick={() => handleTabChange('matches')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                                    activeTab === 'matches'
                                        ? 'bg-white text-purple-900 shadow-md'
                                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                                }`}
                            >
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                AI Job Matches
                            </button>

                            <button
                                onClick={() => handleTabChange('resume')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                                    activeTab === 'resume'
                                        ? 'bg-white text-purple-900 shadow-md'
                                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                                }`}
                            >
                                <FileCheck2 className="w-4 h-4 text-purple-500" />
                                ATS Resume Checker
                            </button>

                            <button
                                onClick={() => handleTabChange('cover-letter')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                                    activeTab === 'cover-letter'
                                        ? 'bg-white text-purple-900 shadow-md'
                                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                                }`}
                            >
                                <FileText className="w-4 h-4 text-purple-500" />
                                AI Cover Letter Studio
                            </button>

                            <button
                                onClick={() => handleTabChange('interview')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                                    activeTab === 'interview'
                                        ? 'bg-white text-purple-900 shadow-md'
                                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                                }`}
                            >
                                <Bot className="w-4 h-4 text-purple-500" />
                                AI Interview Coach
                            </button>

                            <button
                                onClick={() => handleTabChange('applications')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                                    activeTab === 'applications'
                                        ? 'bg-white text-purple-900 shadow-md'
                                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                                }`}
                            >
                                <Briefcase className="w-4 h-4 text-purple-500" />
                                My Applications ({allAppliedJobs?.length || 0})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Content Body */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* TAB 1: AI Job Matches */}
                    {activeTab === 'matches' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-[#6A38C2]" />
                                        Your Personalized AI Job Matches
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Ranked by your profile skills, experience, and background compatibility.
                                    </p>
                                </div>
                                <Link to="/profile">
                                    <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5">
                                        <UserCheck className="w-3.5 h-3.5" />
                                        Update Profile Skills
                                    </Button>
                                </Link>
                            </div>

                            <RecommendedJobs embedded />
                        </div>
                    )}

                    {/* TAB 2: ATS Resume Checker */}
                    {activeTab === 'resume' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <FileCheck2 className="w-5 h-5 text-[#6A38C2]" />
                                        ATS Resume Audit & Optimization
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Scan against enterprise applicant tracking systems, discover missing keywords, and rewrite bullet points.
                                    </p>
                                </div>
                                <Link to="/resume-checker">
                                    <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582da5] text-white text-xs font-semibold gap-1.5">
                                        Open Fullscreen Studio
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            </div>

                            {/* Render Resume Checker UI inline */}
                            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8">
                                <Link to="/resume-checker">
                                    <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-[#6A38C2] text-white flex items-center justify-center font-bold shrink-0">
                                                <FileCheck2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-base sm:text-lg">Launch Full ATS Resume Audit</h3>
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    Check scores for {user?.profile?.skills?.join(', ') || 'your tech stack'}, get 4-pillar breakdown, and rewrite bullets.
                                                </p>
                                            </div>
                                        </div>
                                        <Button className="bg-[#6A38C2] hover:bg-[#582da5] text-white text-xs font-bold shrink-0">
                                            Launch ATS Scanner Now
                                        </Button>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: AI Cover Letter Studio */}
                    {activeTab === 'cover-letter' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Form */}
                                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-[#6A38C2]" />
                                            AI Cover Letter Generator
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Generates tailored, high-converting cover letters matching your skills with the company's requirements.
                                        </p>
                                    </div>

                                    <form onSubmit={handleGenerateCoverLetter} className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 block mb-1">
                                                Select Job Opening:
                                            </label>
                                            <select
                                                value={selectedJobId}
                                                onChange={(e) => setSelectedJobId(e.target.value)}
                                                className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            >
                                                <option value="">-- Choose an open position --</option>
                                                {availableJobs.map((job) => (
                                                    <option key={job._id} value={job._id}>
                                                        {job.title} at {job.company?.name || 'Company'} ({job.location})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-gray-700 block mb-1">
                                                Personalize Note / Specific Project Focus (Optional):
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={customNote}
                                                onChange={(e) => setCustomNote(e.target.value)}
                                                placeholder="e.g. Mention my experience scaling REST APIs to 50k users or my love for product design."
                                                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={generatingCoverLetter || !selectedJobId}
                                            className="w-full bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm gap-2"
                                        >
                                            {generatingCoverLetter ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Drafting Tailored Cover Letter...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4" />
                                                    Generate Tailored Cover Letter
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </div>

                                {/* Right Preview */}
                                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-[#6A38C2]" />
                                                Generated Application Letter
                                            </h4>
                                            {generatedCoverLetter && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={copyCoverLetter}
                                                    className="text-xs font-semibold gap-1.5 border-gray-200"
                                                >
                                                    {copiedCoverLetter ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5" />
                                                            Copy Text
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>

                                        {!generatedCoverLetter && !generatingCoverLetter && (
                                            <div className="py-16 text-center text-gray-400">
                                                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                                <p className="text-xs font-medium text-gray-500">
                                                    Select a job on the left and click Generate to create a custom cover letter.
                                                </p>
                                            </div>
                                        )}

                                        {generatingCoverLetter && (
                                            <div className="py-16 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-[#6A38C2] mx-auto mb-3" />
                                                <p className="text-xs font-semibold text-gray-700">
                                                    Analyzing company requirements and crafting compelling application letter...
                                                </p>
                                            </div>
                                        )}

                                        {generatedCoverLetter && !generatingCoverLetter && (
                                            <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-2xl">
                                                <pre className="whitespace-pre-wrap text-xs sm:text-sm font-sans text-gray-800 leading-relaxed">
                                                    {generatedCoverLetter}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: AI Interview Coach */}
                    {activeTab === 'interview' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <Bot className="w-5 h-5 text-[#6A38C2]" />
                                        AI Technical & Behavioral Interview Coach
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Select any target job position to generate role-specific technical questions, STAR behavioral frameworks, and salary negotiation strategies.
                                    </p>
                                </div>

                                <form onSubmit={handleGenerateInterviewPrep} className="flex flex-col sm:flex-row items-center gap-3">
                                    <select
                                        value={interviewJobId}
                                        onChange={(e) => setInterviewJobId(e.target.value)}
                                        className="w-full sm:flex-1 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">-- Choose job position to prepare for --</option>
                                        {availableJobs.map((job) => (
                                            <option key={job._id} value={job._id}>
                                                {job.title} ({job.company?.name || 'Company'})
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        type="submit"
                                        disabled={generatingPrep || !interviewJobId}
                                        className="w-full sm:w-auto bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs"
                                    >
                                        {generatingPrep ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                                                Generating Q&A Coaching...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-1.5" />
                                                Generate Interview Guide
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>

                            {prepData && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {/* Briefing */}
                                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1">
                                            Executive Interview Briefing
                                        </h4>
                                        <p className="text-xs sm:text-sm text-purple-950 font-medium leading-relaxed">
                                            {prepData.roleSummary}
                                        </p>
                                    </div>

                                    {/* Technical Qs */}
                                    <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
                                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4 text-amber-500" />
                                            Technical Questions & Focus Areas
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {prepData.technicalQuestions?.map((q, idx) => (
                                                <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md mb-2 inline-block">
                                                            Technical Q{idx + 1}
                                                        </span>
                                                        <p className="text-xs font-bold text-gray-900 leading-snug">
                                                            {q.question}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 mt-1 italic">
                                                            Why asked: {q.context}
                                                        </p>
                                                    </div>
                                                    <div className="mt-3 pt-2 border-t border-gray-200/70">
                                                        <p className="text-[10px] font-bold text-gray-700 uppercase">Key talking points:</p>
                                                        <ul className="text-[11px] text-gray-600 list-disc list-inside mt-0.5 space-y-0.5">
                                                            {q.sampleKeyPoints?.map((pt, pIdx) => (
                                                                <li key={pIdx}>{pt}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Behavioral & Situational */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-3">
                                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                <HelpCircle className="w-4 h-4 text-indigo-500" />
                                                Behavioral (STAR Method)
                                            </h4>
                                            {prepData.behavioralQuestions?.map((b, idx) => (
                                                <div key={idx} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                                                    <p className="text-xs font-bold text-gray-900">
                                                        {b.question}
                                                    </p>
                                                    <span className="inline-block text-[10px] text-indigo-700 font-semibold mt-1">
                                                        Framework: {b.framework}
                                                    </span>
                                                    <ul className="text-[11px] text-gray-600 list-disc list-inside mt-1.5 space-y-0.5">
                                                        {b.sampleKeyPoints?.map((pt, pIdx) => (
                                                            <li key={pIdx}>{pt}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-3">
                                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                Salary & Strategy Insights
                                            </h4>
                                            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
                                                <div>
                                                    <p className="text-[11px] font-bold text-emerald-900 uppercase">Market Benchmark:</p>
                                                    <p className="text-xs font-semibold text-emerald-950 mt-0.5">
                                                        {prepData.salaryInsights?.marketBenchmark || 'Competitive industry range'}
                                                    </p>
                                                </div>
                                                <div className="pt-2 border-t border-emerald-200/60">
                                                    <p className="text-[11px] font-bold text-emerald-900 uppercase">Negotiation Strategy Tip:</p>
                                                    <p className="text-xs text-emerald-900 mt-0.5">
                                                        {prepData.salaryInsights?.negotiationTip}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 5: My Applications Tracker */}
                    {activeTab === 'applications' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">
                                            Submitted Applications & Real-time Status
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Track your recruitment pipeline and interview invitations.
                                        </p>
                                    </div>
                                    <Link to="/jobs">
                                        <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582da5] text-white text-xs font-semibold">
                                            Explore More Jobs
                                        </Button>
                                    </Link>
                                </div>

                                <AppliedJobTable />
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default StudentPortal;
