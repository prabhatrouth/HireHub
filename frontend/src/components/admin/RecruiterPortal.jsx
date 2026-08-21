import React, { useState, useEffect } from 'react';
import Navbar from '../shared/Navbar';
import Footer from '../shared/Footer';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AI_API_END_POINT, JOB_API_END_POINT, COMPANY_API_END_POINT } from '@/utils/constant';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
    Briefcase,
    Building2,
    Users,
    Sparkles,
    TrendingUp,
    PlusCircle,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    ArrowRight,
    Loader2,
    ShieldAlert,
    BarChart3,
    Layers,
    FileSpreadsheet,
    Zap
} from 'lucide-react';
import useGetAllAdminJobs from '@/hooks/useGetAllAdminJobs';
import useGetAllCompanies from '@/hooks/useGetAllCompanies';

const RecruiterPortal = () => {
    useGetAllAdminJobs();
    useGetAllCompanies();

    const { user } = useSelector((store) => store.auth);
    const { allAdminJobs } = useSelector((store) => store.job);
    const { companies } = useSelector((store) => store.company);
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'overview';
    const [activeTab, setActiveTab] = useState(initialTab);

    // AI Job generator in portal
    const [jobForm, setJobForm] = useState({
        title: '',
        companyName: '',
        location: 'Remote',
        jobType: 'Full-time',
        experience: '2',
        skills: 'React, Node.js, TypeScript',
    });
    const [generatingJobDesc, setGeneratingJobDesc] = useState(false);
    const [generatedJobDesc, setGeneratedJobDesc] = useState(null);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };

    const handleGenerateJobDescription = async (e) => {
        e.preventDefault();
        if (!jobForm.title) {
            toast.error("Please enter a job title.");
            return;
        }

        try {
            setGeneratingJobDesc(true);
            const res = await axios.post(`${AI_API_END_POINT}/generate-job-description`, jobForm, {
                withCredentials: true
            });

            if (res.data?.success && res.data?.data) {
                setGeneratedJobDesc(res.data.data);
                toast.success("AI generated job description & requirements!");
            }
        } catch (error) {
            console.error("Generate job description error:", error);
            toast.error(error.response?.data?.message || "Failed to generate job description.");
        } finally {
            setGeneratingJobDesc(false);
        }
    };

    const totalPostings = allAdminJobs?.length || 0;
    const totalCompanies = companies?.length || 0;
    const totalApplications = (allAdminJobs || []).reduce((acc, job) => acc + (job.applications?.length || 0), 0);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
            <div>
                <Navbar />

                {/* Recruiter Hero Header */}
                <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white py-10 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold uppercase tracking-wider mb-3">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                                    Recruiter Command Center
                                </div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                                    Talent & Hiring Hub
                                </h1>
                                <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl leading-relaxed">
                                    Manage your companies, post AI-optimized job listings, and rank candidate applications with our automated ATS scoring matrix.
                                </p>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3">
                                <Link to="/admin/companies/create">
                                    <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs font-semibold">
                                        <Building2 className="w-3.5 h-3.5 mr-1.5" />
                                        New Company
                                    </Button>
                                </Link>
                                <Link to="/admin/jobs/create">
                                    <Button className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold shadow-md">
                                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                                        Post New Job
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Top KPI Cards */}
                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                                <p className="text-xs font-medium text-purple-200">Active Job Postings</p>
                                <p className="text-2xl font-extrabold text-white mt-1">{totalPostings}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                                <p className="text-xs font-medium text-purple-200">Registered Companies</p>
                                <p className="text-2xl font-extrabold text-white mt-1">{totalCompanies}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                                <p className="text-xs font-medium text-purple-200">Total Applicants</p>
                                <p className="text-2xl font-extrabold text-emerald-400 mt-1">{totalApplications}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                                <p className="text-xs font-medium text-purple-200">AI Screening Matrix</p>
                                <p className="text-2xl font-extrabold text-purple-300 mt-1">Active</p>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <button
                                onClick={() => handleTabChange('overview')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                                    activeTab === 'overview'
                                        ? 'bg-white text-gray-900 shadow-md'
                                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                                }`}
                            >
                                <BarChart3 className="w-4 h-4 text-[#6A38C2]" />
                                Overview & Jobs ({totalPostings})
                            </button>

                            <button
                                onClick={() => handleTabChange('ai-generator')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                                    activeTab === 'ai-generator'
                                        ? 'bg-white text-gray-900 shadow-md'
                                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                                }`}
                            >
                                <Sparkles className="w-4 h-4 text-[#6A38C2]" />
                                AI Job Description Studio
                            </button>

                            <button
                                onClick={() => handleTabChange('companies')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                                    activeTab === 'companies'
                                        ? 'bg-white text-gray-900 shadow-md'
                                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                                }`}
                            >
                                <Building2 className="w-4 h-4 text-[#6A38C2]" />
                                Companies ({totalCompanies})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Body */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* TAB 1: Overview & Jobs */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-[#6A38C2]" />
                                        Your Active Job Openings
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Click on any job to view candidate applications with automated AI match ratings.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link to="/admin/jobs/create">
                                        <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582da5] text-white text-xs font-semibold gap-1.5">
                                            <PlusCircle className="w-3.5 h-3.5" />
                                            Post Job
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Job listings grid */}
                            {allAdminJobs?.length === 0 ? (
                                <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-xs">
                                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-base font-bold text-gray-900">No Job Postings Yet</h3>
                                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-4">
                                        Create a company profile first and start posting jobs with automated AI candidate evaluation.
                                    </p>
                                    <Link to="/admin/jobs/create">
                                        <Button className="bg-[#6A38C2] hover:bg-[#582da5] text-white text-xs font-semibold">
                                            Create First Job Listing
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {allAdminJobs.map((job) => (
                                        <div
                                            key={job._id}
                                            className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div>
                                                        <span className="text-[11px] font-bold text-[#6A38C2] bg-purple-50 px-2 py-0.5 rounded-md">
                                                            {job.company?.name || 'Company'}
                                                        </span>
                                                        <h3 className="text-base font-bold text-gray-900 mt-1.5 leading-snug">
                                                            {job.title}
                                                        </h3>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                                                        {job.applications?.length || 0} applicants
                                                    </Badge>
                                                </div>

                                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                                                    {job.description}
                                                </p>

                                                <div className="flex flex-wrap gap-1.5 mb-4">
                                                    {job.requirements?.slice(0, 3).map((req, idx) => (
                                                        <span key={idx} className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                                                            {req}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-gray-800">
                                                    {job.salary ? `${job.salary} LPA` : 'Competitive'}
                                                </span>
                                                <Link to={`/admin/jobs/${job._id}/applicants`}>
                                                    <Button size="sm" variant="outline" className="text-xs font-semibold gap-1 hover:bg-purple-50 hover:text-[#6A38C2] hover:border-purple-200">
                                                        <Users className="w-3.5 h-3.5" />
                                                        AI Applicant Matrix
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: AI Job Description Studio */}
                    {activeTab === 'ai-generator' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Form */}
                                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-[#6A38C2]" />
                                            AI Job Description Studio
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Quickly draft engaging, role-specific job descriptions and skill requirements with our intelligent assistant.
                                        </p>
                                    </div>

                                    <form onSubmit={handleGenerateJobDescription} className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 block mb-1">Job Title:</label>
                                            <Input
                                                placeholder="e.g. Senior Frontend React Engineer"
                                                value={jobForm.title}
                                                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                                                className="text-xs rounded-xl"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-gray-700 block mb-1">Company Name:</label>
                                            <Input
                                                placeholder="e.g. TechCorp Solutions"
                                                value={jobForm.companyName}
                                                onChange={(e) => setJobForm({ ...jobForm, companyName: e.target.value })}
                                                className="text-xs rounded-xl"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-gray-700 block mb-1">Location:</label>
                                                <Input
                                                    placeholder="e.g. Remote / Bangalore"
                                                    value={jobForm.location}
                                                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                                                    className="text-xs rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-700 block mb-1">Experience (Yrs):</label>
                                                <Input
                                                    placeholder="e.g. 2-4"
                                                    value={jobForm.experience}
                                                    onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })}
                                                    className="text-xs rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-gray-700 block mb-1">Key Skills (Comma separated):</label>
                                            <Input
                                                placeholder="e.g. React, TypeScript, Next.js, Redux"
                                                value={jobForm.skills}
                                                onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })}
                                                className="text-xs rounded-xl"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={generatingJobDesc || !jobForm.title}
                                            className="w-full bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-bold py-2.5 rounded-xl shadow-xs gap-2"
                                        >
                                            {generatingJobDesc ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Generating Job Posting with AI...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4" />
                                                    Generate Job Description
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </div>

                                {/* Preview */}
                                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-[#6A38C2]" />
                                                Generated Job Specifications
                                            </h4>
                                            {generatedJobDesc && (
                                                <Link to="/admin/jobs/create">
                                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5">
                                                        <PlusCircle className="w-3.5 h-3.5" />
                                                        Use to Post Job
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>

                                        {!generatedJobDesc && !generatingJobDesc && (
                                            <div className="py-16 text-center text-gray-400">
                                                <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                                <p className="text-xs font-medium text-gray-500">
                                                    Fill in the job details on the left and click Generate to see the full AI description.
                                                </p>
                                            </div>
                                        )}

                                        {generatingJobDesc && (
                                            <div className="py-16 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-[#6A38C2] mx-auto mb-3" />
                                                <p className="text-xs font-semibold text-gray-700">
                                                    Generating structured role description, responsibilities, and requirements...
                                                </p>
                                            </div>
                                        )}

                                        {generatedJobDesc && !generatingJobDesc && (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-2xl">
                                                    <h5 className="text-sm font-bold text-purple-900">{generatedJobDesc.title}</h5>
                                                    <p className="text-xs text-purple-800 mt-1 font-medium">
                                                        Suggested Salary: {generatedJobDesc.suggestedSalary}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h6 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                                                        Description & Responsibilities:
                                                    </h6>
                                                    <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-200 leading-relaxed">
                                                        {generatedJobDesc.description}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h6 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                                                        Key Requirements:
                                                    </h6>
                                                    <ul className="space-y-1.5">
                                                        {generatedJobDesc.requirements?.map((req, idx) => (
                                                            <li key={idx} className="text-xs font-medium text-gray-700 flex items-start gap-2">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                                {req}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: Companies */}
                    {activeTab === 'companies' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-[#6A38C2]" />
                                        Managed Companies
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Set up company profiles, branding logos, and location details.
                                    </p>
                                </div>
                                <Link to="/admin/companies/create">
                                    <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582da5] text-white text-xs font-semibold gap-1.5">
                                        <PlusCircle className="w-3.5 h-3.5" />
                                        Register New Company
                                    </Button>
                                </Link>
                            </div>

                            {companies?.length === 0 ? (
                                <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-xs">
                                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-base font-bold text-gray-900">No Companies Registered Yet</h3>
                                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-4">
                                        Register your company name and logo to attach when publishing job openings.
                                    </p>
                                    <Link to="/admin/companies/create">
                                        <Button className="bg-[#6A38C2] hover:bg-[#582da5] text-white text-xs font-semibold">
                                            Register Company
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {companies.map((comp) => (
                                        <div
                                            key={comp._id}
                                            className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#6A38C2] flex items-center justify-center font-bold text-lg border border-purple-100 overflow-hidden shrink-0">
                                                        {comp.logo ? (
                                                            <img src={comp.logo} alt={comp.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            comp.name?.charAt(0) || 'C'
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-gray-900 truncate">{comp.name}</h3>
                                                        <p className="text-xs text-gray-500 truncate">{comp.location || 'Location Not Set'}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                                                    {comp.description || 'No company description added.'}
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                                <span className="text-[11px] text-gray-400 font-medium">
                                                    Created {new Date(comp.createdAt).toLocaleDateString()}
                                                </span>
                                                <Link to={`/admin/companies/${comp._id}`}>
                                                    <Button size="sm" variant="outline" className="text-xs font-semibold">
                                                        Edit Details
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default RecruiterPortal;
