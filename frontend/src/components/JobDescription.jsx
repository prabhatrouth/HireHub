import React, { useEffect, useState } from 'react';
import Navbar from './shared/Navbar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { APPLICATION_API_END_POINT, JOB_API_END_POINT } from '@/utils/constant';
import { setSingleJob } from '@/redux/jobSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Briefcase, MapPin, Calendar, Users, DollarSign, Award, Sparkles, CheckCircle2, ArrowLeft, Building2, Globe, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const JobDescription = () => {
    const { singleJob } = useSelector((store) => store.job);
    const { user } = useSelector((store) => store.auth);
    const navigate = useNavigate();

    const isInitiallyApplied = singleJob?.applications?.some(
        (application) => application.applicant === user?._id || application.applicant?._id === user?._id
    ) || false;
    const [isApplied, setIsApplied] = useState(isInitiallyApplied);
    const [applying, setApplying] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const params = useParams();
    const jobId = params.id;
    const dispatch = useDispatch();

    const applyJobHandler = async () => {
        if (!user) {
            toast.error('Please log in as a candidate to apply for jobs.');
            navigate('/login');
            return;
        }
        if (user.role === 'recruiter') {
            toast.error('Recruiters cannot apply to jobs. Please use a candidate account.');
            return;
        }

        setApplying(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.get(`${APPLICATION_API_END_POINT}/apply/${jobId}`, { withCredentials: true });

            if (res.data?.success) {
                setIsApplied(true);
                const updatedSingleJob = {
                    ...singleJob,
                    applications: [...(singleJob?.applications || []), { applicant: user?._id }],
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
                        (app) => app.applicant === user?._id || app.applicant?._id === user?._id
                    );
                    setIsApplied(hasApplied);
                }
            } catch (error) {
                console.error("Fetch single job error:", error);
            } finally {
                if (isMounted) setPageLoading(false);
            }
        };
        if (jobId) fetchSingleJob();
        return () => {
            isMounted = false;
        };
    }, [jobId, dispatch, user?._id]);

    const companyName =
        (typeof singleJob?.company === 'object' && singleJob?.company?.name) ||
        (typeof singleJob?.company === 'string' && singleJob?.company) ||
        singleJob?.companyName ||
        'Company';

    const companyLogo =
        (typeof singleJob?.company === 'object' && singleJob?.company?.logo) ||
        singleJob?.companyLogo ||
        '';

    const companyLocation =
        singleJob?.location ||
        (typeof singleJob?.company === 'object' && singleJob?.company?.location) ||
        'Remote';

    const companyWebsite =
        typeof singleJob?.company === 'object' && singleJob?.company?.website ? singleJob?.company?.website : null;

    const userSkills = user?.profile?.skills || [];
    const jobRequirements = singleJob?.requirements || [];
    const matchingSkills = jobRequirements.filter((req) =>
        userSkills.some((s) => s.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.toLowerCase()))
    );

    if (pageLoading && (!singleJob || String(singleJob._id) !== String(jobId))) {
        return (
            <div className="min-h-screen bg-[#F8FAFC]">
                <Navbar />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#6A38C2] mb-4" />
                    <p className="text-sm font-semibold text-gray-600">Loading role and company details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Link */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Listings
                </button>

                {/* Job Header Card */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border border-gray-100 bg-gray-50 shrink-0">
                                <AvatarImage src={companyLogo} alt={companyName} />
                                <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-lg">
                                    {companyName.charAt(0) || 'C'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                                    {singleJob?.title}
                                </h1>
                                <p className="text-sm sm:text-base font-semibold text-gray-700 mt-1.5 flex flex-wrap items-center gap-2">
                                    <span className="text-gray-900 font-bold">{companyName}</span>
                                    &bull;
                                    <span className="text-gray-500 font-normal flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                        {companyLocation}
                                    </span>
                                    {companyWebsite && (
                                        <>
                                            &bull;
                                            <a
                                                href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[#6A38C2] hover:underline flex items-center gap-1 text-xs font-medium"
                                            >
                                                <Globe className="w-3.5 h-3.5" />
                                                Website
                                            </a>
                                        </>
                                    )}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <Badge variant="outline" className="text-blue-700 bg-blue-50/70 border-blue-200 text-xs font-semibold">
                                        {singleJob?.position || 1} Positions
                                    </Badge>
                                    <Badge variant="outline" className="text-[#F83002] bg-orange-50/70 border-orange-200 text-xs font-semibold">
                                        {singleJob?.jobType || 'Full Time'}
                                    </Badge>
                                    <Badge variant="outline" className="text-[#6A38C2] bg-purple-50/70 border-purple-200 text-xs font-semibold">
                                        {singleJob?.salary ? `${singleJob.salary} LPA` : 'Competitive'}
                                    </Badge>
                                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50/70 border-emerald-200 text-xs font-semibold">
                                        {singleJob?.experienceLevel || singleJob?.experience || '1-3'} Years Exp
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="sm:self-start shrink-0">
                            <Button
                                onClick={isApplied ? null : applyJobHandler}
                                disabled={isApplied || applying}
                                size="lg"
                                className={`w-full sm:w-auto font-bold text-sm px-8 rounded-xl shadow-xs transition-all ${
                                    isApplied
                                        ? 'bg-emerald-600 text-white cursor-default'
                                        : 'bg-[#6A38C2] hover:bg-[#582da5] text-white'
                                }`}
                            >
                                {isApplied ? (
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Application Submitted
                                    </span>
                                ) : applying ? (
                                    'Submitting...'
                                ) : (
                                    'Apply For This Job'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* AI Match Overview (For Candidates) */}
                {user?.role === 'student' && userSkills.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white rounded-2xl border border-purple-200/80 p-5 mb-6 shadow-xs">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[#6A38C2]" />
                            <h3 className="font-bold text-sm text-purple-900">Your AI Skill Compatibility</h3>
                        </div>
                        <p className="text-xs text-purple-900/80 mb-3">
                            You possess <span className="font-bold">{matchingSkills.length}</span> of the required tech capabilities for this position.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {jobRequirements.map((req, idx) => {
                                const isMatched = matchingSkills.includes(req);
                                return (
                                    <span
                                        key={idx}
                                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                                            isMatched
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : 'bg-white/80 text-gray-600 border border-gray-200'
                                        }`}
                                    >
                                        {isMatched && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
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
                            <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100 mb-4">
                                Role Overview & Responsibilities
                            </h2>
                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                                {singleJob?.description || 'No detailed description provided.'}
                            </div>

                            {jobRequirements.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h3 className="text-base font-bold text-gray-900 mb-3">Role Requirements & Key Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {jobRequirements.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold px-3 py-1 rounded-lg"
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
                                    <span className="font-semibold text-gray-900">{singleJob?.jobType || 'Full Time'}</span>
                                </li>
                                <li className="flex items-center justify-between text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <Award className="w-3.5 h-3.5 text-gray-400" />
                                        Experience:
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {singleJob?.experienceLevel || singleJob?.experience || '1-3'} Years
                                    </span>
                                </li>
                                <li className="flex items-center justify-between text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                                        Offered CTC:
                                    </span>
                                    <span className="font-semibold text-gray-900">{singleJob?.salary ? `${singleJob.salary} LPA` : 'Competitive'}</span>
                                </li>
                                <li className="flex items-center justify-between text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                        Total Applicants:
                                    </span>
                                    <span className="font-semibold text-gray-900">{singleJob?.applications?.length || 0} candidates</span>
                                </li>
                                <li className="flex items-center justify-between text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        Posted Date:
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {singleJob?.createdAt ? String(singleJob.createdAt).split('T')[0] : 'Recent'}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDescription;
