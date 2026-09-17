import React, { useState, useEffect } from 'react';
import Navbar from '../shared/Navbar';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useSelector, useDispatch } from 'react-redux';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import axios from 'axios';
import { JOB_API_END_POINT, AI_API_END_POINT, COMPANY_API_END_POINT } from '@/utils/constant';
import { setCompanies } from '@/redux/companySlice';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, Briefcase, Sparkles, Building2, ArrowLeft, Wand2, RefreshCw, Plus, ShieldCheck, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

const INDUSTRY_DOMAINS = [
    "Technology & Software",
    "Healthcare & Medical",
    "Finance, Banking & Accounting",
    "Marketing, Sales & Growth",
    "Operations & Supply Chain",
    "Human Resources & Legal",
    "Design & Creative Media",
    "Education & Training",
    "Customer Service & Success",
    "Executive & General Management"
];

const PostJob = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(store => store.auth);
    const { companies } = useSelector(store => store.company);

    const [input, setInput] = useState({
        title: "",
        industry: "Technology & Software",
        description: "",
        requirements: "",
        salary: "",
        location: "",
        jobType: "Full-time",
        experience: "",
        position: 1,
        companyId: ""
    });

    const [loading, setLoading] = useState(false);
    const [fetchingCompanies, setFetchingCompanies] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);

    // Quick Company Registration Modal state
    const [isQuickCompanyOpen, setIsQuickCompanyOpen] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState("");
    const [newCompanyLocation, setNewCompanyLocation] = useState("");
    const [creatingCompany, setCreatingCompany] = useState(false);

    // Permission check for sub-users
    const isSubUser = Boolean(user?.isSubUser);
    const hasJobPostPermission = !isSubUser || Boolean(user?.permissions?.canPostJobs);

    // Direct company fetcher
    const fetchCompaniesList = async () => {
        try {
            setFetchingCompanies(true);
            const res = await axios.get(`${COMPANY_API_END_POINT}/get`, { withCredentials: true });
            if (res.data?.success && res.data?.companies) {
                dispatch(setCompanies(res.data.companies));
                if (res.data.companies.length > 0 && !input.companyId) {
                    setInput(prev => ({ ...prev, companyId: String(res.data.companies[0]._id) }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch companies:", error);
        } finally {
            setFetchingCompanies(false);
        }
    };

    useEffect(() => {
        fetchCompaniesList();
    }, []);

    // Auto-select company if companies list changes and none selected
    useEffect(() => {
        if (companies?.length > 0 && !input.companyId) {
            setInput(prev => ({ ...prev, companyId: String(companies[0]._id) }));
        }
    }, [companies]);

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const selectChangeHandler = (companyId) => {
        setInput({
            ...input,
            companyId: companyId
        });
    };

    const industryChangeHandler = (val) => {
        setInput({
            ...input,
            industry: val
        });
    };

    // Quick Register Company Handler
    const handleQuickRegisterCompany = async (e) => {
        e.preventDefault();
        if (!newCompanyName.trim()) {
            toast.error("Company name is required");
            return;
        }
        try {
            setCreatingCompany(true);
            const res = await axios.post(
                `${COMPANY_API_END_POINT}/register`,
                {
                    companyName: newCompanyName.trim(),
                    location: newCompanyLocation.trim() || undefined
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );
            if (res.data?.success) {
                toast.success(res.data.message || "Company registered successfully!");
                setIsQuickCompanyOpen(false);
                setNewCompanyName("");
                setNewCompanyLocation("");
                // Refresh companies and select newly created company
                const newComp = res.data.company;
                await fetchCompaniesList();
                if (newComp?._id) {
                    setInput(prev => ({ ...prev, companyId: String(newComp._id) }));
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to register company");
        } finally {
            setCreatingCompany(false);
        }
    };

    // AI Job Auto-Complete & Enhancer
    const handleAiGenerate = async () => {
        if (!input.title.trim()) {
            toast.error("Please enter a Job Title first so AI can generate the job specifications.");
            return;
        }

        const selectedCompany = companies?.find(c => String(c._id) === String(input.companyId));

        setAiGenerating(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(
                `${AI_API_END_POINT}/generate-job-description`,
                {
                    title: input.title,
                    industry: input.industry,
                    companyName: selectedCompany?.name || "",
                    location: input.location || "",
                    jobType: input.jobType || "Full-time",
                    experience: input.experience || "",
                    skills: input.requirements || "",
                },
                { withCredentials: true }
            );

            if (res.data?.success && res.data?.data) {
                const aiData = res.data.data;
                setInput(prev => ({
                    ...prev,
                    title: aiData.title || prev.title,
                    description: aiData.description || prev.description,
                    requirements: Array.isArray(aiData.requirements)
                        ? aiData.requirements.join(", ")
                        : (aiData.requirements || prev.requirements),
                    experience: aiData.experienceLevel || prev.experience || "2-4 years",
                }));
                toast.success("AI successfully drafted job description and requirements!");
            }
        } catch (error) {
            console.error("AI job generation error:", error);
            toast.error(error.response?.data?.message || "Failed to generate job description with AI");
        } finally {
            setAiGenerating(false);
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        if (isSubUser && !hasJobPostPermission) {
            toast.error("You do not have permission to post jobs. Please ask your lead recruiter to grant 'canPostJobs' permission.");
            return;
        }

        if (!input.companyId) {
            toast.error("Please select or register a company for this job posting.");
            return;
        }

        try {
            setLoading(true);
            axios.defaults.withCredentials = true;
            const res = await axios.post(
                `${JOB_API_END_POINT}/post`,
                input,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );

            if (res.data?.success) {
                toast.success(res.data.message || "Job posted successfully!");
                navigate("/admin/jobs");
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to post job"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Sub-User Permission Banner */}
                {isSubUser && !hasJobPostPermission && (
                    <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wide text-amber-800">Job Posting Permission Required</h3>
                            <p className="text-xs text-amber-700 mt-0.5">
                                Your account is registered as a sub-user/interviewer and currently does not have permission to publish job postings. Please contact your lead recruiter or system administrator to enable the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">canPostJobs</code> permission.
                            </p>
                        </div>
                    </div>
                )}

                {isSubUser && hasJobPostPermission && (
                    <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900 text-xs">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span><strong>Sub-User Authorized:</strong> You have active job posting permissions under your recruiter team.</span>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            canPostJobs: ACTIVE
                        </span>
                    </div>
                )}

                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/admin/jobs')}
                            className="rounded-full h-8 w-8 p-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-[#6A38C2]" />
                                Post a New Job Opportunity
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Create listings across any industry with AI candidate skill scoring enabled
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={handleAiGenerate}
                            disabled={aiGenerating}
                            className="bg-purple-50 hover:bg-purple-100 text-[#6A38C2] border border-purple-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                        >
                            {aiGenerating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Wand2 className="w-3.5 h-3.5 text-[#6A38C2]" />
                            )}
                            {aiGenerating ? 'Writing with AI...' : 'Auto-Draft with AI'}
                        </Button>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs">
                    <form onSubmit={submitHandler} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Title */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Job Title</Label>
                                <Input
                                    type="text"
                                    name="title"
                                    value={input.title}
                                    onChange={changeEventHandler}
                                    placeholder="e.g. Clinical Nurse / Financial Analyst / Marketing Lead / Full Stack Dev"
                                    required
                                    className="mt-1 text-sm bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            {/* Industry Domain */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Industry / Career Domain</Label>
                                <Select value={input.industry} onValueChange={industryChangeHandler}>
                                    <SelectTrigger className="mt-1 w-full text-sm bg-gray-50/50 border-gray-200">
                                        <SelectValue placeholder="Select Industry Domain" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {INDUSTRY_DOMAINS.map((domain) => (
                                                <SelectItem key={domain} value={domain}>
                                                    {domain}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Company Selector */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                        <Building2 className="w-3.5 h-3.5 text-gray-500" />
                                        Company Organization
                                    </Label>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={fetchCompaniesList}
                                            title="Refresh company list"
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${fetchingCompanies ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsQuickCompanyOpen(true)}
                                            className="text-[11px] font-semibold text-[#6A38C2] hover:underline flex items-center gap-0.5"
                                        >
                                            <Plus className="w-3 h-3" /> New
                                        </button>
                                    </div>
                                </div>

                                {fetchingCompanies ? (
                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 p-2 border border-gray-200 rounded-lg">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6A38C2]" />
                                        Loading registered companies...
                                    </div>
                                ) : companies && companies.length > 0 ? (
                                    <Select value={input.companyId} onValueChange={selectChangeHandler}>
                                        <SelectTrigger className="mt-1 w-full text-sm bg-gray-50/50 border-gray-200">
                                            <SelectValue placeholder="Select a Company" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {companies.map((company) => (
                                                    <SelectItem
                                                        key={company._id}
                                                        value={String(company._id)}
                                                    >
                                                        {company.name} {company.location ? `(${company.location})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="mt-1 p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 text-xs text-amber-800 space-y-1.5">
                                        <p className="font-medium">No company registered under your team yet.</p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setIsQuickCompanyOpen(true)}
                                            className="h-7 px-2.5 text-xs bg-[#6A38C2] hover:bg-[#582da5] text-white font-semibold rounded-md flex items-center gap-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Quick Register Company
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Location */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Location</Label>
                                <Input
                                    type="text"
                                    name="location"
                                    value={input.location}
                                    onChange={changeEventHandler}
                                    placeholder="e.g. Remote / Bangalore / Mumbai / New York"
                                    required
                                    className="mt-1 text-sm bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            {/* Requirements (Crucial for AI evaluation) */}
                            <div className="sm:col-span-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-[#6A38C2]" />
                                        Key Competency & Skill Requirements (Comma separated)
                                    </Label>
                                    <span className="text-[11px] text-[#6A38C2] font-semibold">Powers AI Applicant Ranking</span>
                                </div>
                                <Input
                                    type="text"
                                    name="requirements"
                                    value={input.requirements}
                                    onChange={changeEventHandler}
                                    placeholder="e.g. Financial Modeling, Excel, Risk Analysis, Valuation (or) Patient Care, ICU, EHR (or) React, Node.js"
                                    required
                                    className="mt-1 text-sm bg-purple-50/20 border-purple-200 focus-visible:border-[#6A38C2]"
                                />
                            </div>

                            {/* Salary */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Salary (LPA / Annual Range)</Label>
                                <Input
                                    type="number"
                                    name="salary"
                                    value={input.salary}
                                    onChange={changeEventHandler}
                                    placeholder="e.g. 12"
                                    min="1"
                                    required
                                    className="mt-1 text-sm bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            {/* Job Type */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Job Type</Label>
                                <Input
                                    type="text"
                                    name="jobType"
                                    value={input.jobType}
                                    onChange={changeEventHandler}
                                    placeholder="e.g. Full-time / Internship / Contract"
                                    required
                                    className="mt-1 text-sm bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            {/* Experience */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Experience Required (Years)</Label>
                                <Input
                                    type="text"
                                    name="experience"
                                    value={input.experience}
                                    onChange={changeEventHandler}
                                    placeholder="e.g. 2-4 years"
                                    required
                                    className="mt-1 text-sm bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            {/* Positions */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Open Positions</Label>
                                <Input
                                    type="number"
                                    name="position"
                                    value={input.position}
                                    onChange={changeEventHandler}
                                    min="1"
                                    required
                                    className="mt-1 text-sm bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            {/* Description */}
                            <div className="sm:col-span-2">
                                <Label className="text-xs font-semibold text-gray-700">Job Role Description & Responsibilities</Label>
                                <textarea
                                    name="description"
                                    value={input.description}
                                    onChange={changeEventHandler}
                                    placeholder="Describe the day-to-day responsibilities, core domain deliverables, ideal candidate background, and growth opportunities..."
                                    required
                                    rows={5}
                                    className="mt-1 w-full rounded-md border border-gray-200 bg-gray-50/50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#6A38C2] focus:border-[#6A38C2]"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <Button
                                type="submit"
                                disabled={loading || !input.companyId || (isSubUser && !hasJobPostPermission)}
                                className="w-full bg-[#6A38C2] hover:bg-[#582da5] text-white font-bold h-11 text-sm shadow-xs disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Publishing Job Listing...
                                    </>
                                ) : isSubUser && !hasJobPostPermission ? (
                                    'Permission Required to Post Job'
                                ) : (
                                    'Post Job & Enable AI Applicant Screening'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Quick Register Company Modal */}
            <Dialog open={isQuickCompanyOpen} onOpenChange={setIsQuickCompanyOpen}>
                <DialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-[#6A38C2]" />
                            Quick Register Company
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Add a company name for your team or organization to associate with your job listings.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleQuickRegisterCompany} className="space-y-3.5 py-2">
                        <div>
                            <Label className="text-xs font-semibold text-gray-700">Company Name *</Label>
                            <Input
                                type="text"
                                required
                                value={newCompanyName}
                                onChange={(e) => setNewCompanyName(e.target.value)}
                                placeholder="e.g. Acme Health Corp / FinTech Labs"
                                className="mt-1 text-sm"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-gray-700">Location (Optional)</Label>
                            <Input
                                type="text"
                                value={newCompanyLocation}
                                onChange={(e) => setNewCompanyLocation(e.target.value)}
                                placeholder="e.g. San Francisco, CA / Remote"
                                className="mt-1 text-sm"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsQuickCompanyOpen(false)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={creatingCompany}
                                className="bg-[#6A38C2] hover:bg-[#582da5] text-white text-xs font-bold"
                            >
                                {creatingCompany ? 'Registering...' : 'Register & Select'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PostJob;
