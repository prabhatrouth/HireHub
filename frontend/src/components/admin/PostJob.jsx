import React, { useState } from 'react';
import Navbar from '../shared/Navbar';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useSelector } from 'react-redux';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import axios from 'axios';
import { JOB_API_END_POINT, AI_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, Briefcase, Sparkles, Building2, ArrowLeft, Wand2 } from 'lucide-react';

const PostJob = () => {
    const [input, setInput] = useState({
        title: "",
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
    const [aiGenerating, setAiGenerating] = useState(false);
    const navigate = useNavigate();
    const { companies } = useSelector(store => store.company);

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const selectChangeHandler = (companyId) => {
        setInput({
            ...input,
            companyId: companyId
        });
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

        if (!input.companyId) {
            toast.error("Please select a registered company");
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
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
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
                                Create a listing with AI candidate skill scoring enabled
                            </p>
                        </div>
                    </div>

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
                                    placeholder="e.g. Senior Full Stack Engineer"
                                    required
                                    className="mt-1 text-sm bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            {/* Company Selector */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Company</Label>
                                {companies?.length > 0 ? (
                                    <Select onValueChange={selectChangeHandler}>
                                        <SelectTrigger className="mt-1 w-full text-sm bg-gray-50/50 border-gray-200">
                                            <SelectValue placeholder="Select a Company" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {companies.map((company) => (
                                                    <SelectItem
                                                        key={company._id}
                                                        value={company._id}
                                                    >
                                                        {company.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="mt-1 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">
                                        No companies found. Please register a company first.
                                    </div>
                                )}
                            </div>

                            {/* Requirements (Crucial for AI evaluation) */}
                            <div className="sm:col-span-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-[#6A38C2]" />
                                        Key Skill Requirements (Comma separated)
                                    </Label>
                                    <span className="text-[11px] text-[#6A38C2] font-semibold">Powers AI Applicant Ranking</span>
                                </div>
                                <Input
                                    type="text"
                                    name="requirements"
                                    value={input.requirements}
                                    onChange={changeEventHandler}
                                    placeholder="e.g. React, TypeScript, Node.js, Tailwind CSS, REST APIs"
                                    required
                                    className="mt-1 text-sm bg-purple-50/20 border-purple-200 focus-visible:border-[#6A38C2]"
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Location</Label>
                                <Input
                                    type="text"
                                    name="location"
                                    value={input.location}
                                    onChange={changeEventHandler}
                                    placeholder="e.g. Remote / Bangalore, India"
                                    required
                                    className="mt-1 text-sm bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            {/* Salary */}
                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Salary (LPA)</Label>
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
                                    placeholder="Describe the day-to-day responsibilities, ideal candidate background, and growth opportunities..."
                                    required
                                    rows={5}
                                    className="mt-1 w-full rounded-md border border-gray-200 bg-gray-50/50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#6A38C2] focus:border-[#6A38C2]"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <Button
                                type="submit"
                                disabled={loading || companies?.length === 0}
                                className="w-full bg-[#6A38C2] hover:bg-[#582da5] text-white font-bold h-11 text-sm shadow-xs"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Publishing Job Listing...
                                    </>
                                ) : (
                                    'Post Job & Enable AI Applicant Screening'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PostJob;
