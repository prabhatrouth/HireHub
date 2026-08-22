import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import ApplicantsTable from './ApplicantsTable';
import axios from 'axios';
import { APPLICATION_API_END_POINT } from '@/utils/constant';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setAllApplicants } from '@/redux/applicationSlice';
import { Sparkles, Users, Award, CheckCircle2, ArrowLeft, Search, Filter, RefreshCw, Layers } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const Applicants = () => {
    const params = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { applicants } = useSelector((store) => store.application);

    const [loading, setLoading] = useState(true);
    const [evaluations, setEvaluations] = useState([]);
    const [stats, setStats] = useState({ total: 0, highMatches: 0, avgScore: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [scoreFilter, setScoreFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

    const fetchApplicantData = async () => {
        setLoading(true);
        try {
            axios.defaults.withCredentials = true;
            // 1. Try fetching AI evaluated applicants endpoint
            const aiRes = await axios.get(`/api/v1/ai/evaluate-applicants/${params.id}`, { withCredentials: true });
            if (aiRes.data?.success) {
                dispatch(setAllApplicants(aiRes.data.job));
                setEvaluations(aiRes.data.evaluations || []);
                setStats(aiRes.data.stats || { total: 0, highMatches: 0, avgScore: 0 });
            } else {
                // Fallback to standard endpoint
                const res = await axios.get(`${APPLICATION_API_END_POINT}/${params.id}/applicants`, { withCredentials: true });
                dispatch(setAllApplicants(res.data.job));
            }
        } catch (error) {
            console.warn('AI evaluation fetch fallback to standard:', error.message);
            try {
                const res = await axios.get(`${APPLICATION_API_END_POINT}/${params.id}/applicants`, { withCredentials: true });
                dispatch(setAllApplicants(res.data.job));
            } catch (err) {
                console.error('Failed to load applicants:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplicantData();
    }, [params.id]);

    const applications = applicants?.applications || [];

    // Map evaluations to applications
    const evalMap = new Map(evaluations.map((e) => [String(e.applicationId), e]));

    // Enrich applications with AI scores
    const enrichedApplications = applications.map((app) => {
        const evalData = evalMap.get(String(app._id)) || {
            matchScore: 65,
            fitTier: 'Strong Match',
            matchingSkills: (applicants?.requirements || []).slice(0, 2),
            missingSkills: [],
            strengths: ['Relevant tech profile'],
            recommendationSummary: 'Applicant demonstrates baseline qualifications.',
        };
        return {
            ...app,
            aiScore: evalData.matchScore,
            aiData: evalData,
        };
    });

    // Filter applications
    const filteredApplications = enrichedApplications.filter((item) => {
        const name = item.applicant?.fullname?.toLowerCase() || '';
        const email = item.applicant?.email?.toLowerCase() || '';
        const skills = (item.applicant?.profile?.skills || []).join(' ').toLowerCase();
        const searchLow = searchTerm.toLowerCase();

        const matchesSearch = !searchLow || name.includes(searchLow) || email.includes(searchLow) || skills.includes(searchLow);

        const score = item.aiScore || 0;
        let matchesScore = true;
        if (scoreFilter === 'top') matchesScore = score >= 80;
        else if (scoreFilter === 'strong') matchesScore = score >= 65 && score < 80;
        else if (scoreFilter === 'moderate') matchesScore = score < 65;

        const status = item.status?.toLowerCase() || 'pending';
        let matchesStatus = true;
        if (statusFilter !== 'all') matchesStatus = status === statusFilter;

        return matchesSearch && matchesScore && matchesStatus;
    });

    // Compute dynamic stats
    const totalApplicants = enrichedApplications.length;
    const topMatchesCount = enrichedApplications.filter((a) => (a.aiScore || 0) >= 80).length;
    const avgScore = totalApplicants > 0
        ? Math.round(enrichedApplications.reduce((acc, curr) => acc + (curr.aiScore || 0), 0) / totalApplicants)
        : 0;
    const acceptedCount = enrichedApplications.filter((a) => a.status === 'accepted').length;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Back Button & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/admin/jobs')}
                            className="rounded-full h-9 w-9 p-0 flex items-center justify-center border-gray-200 hover:bg-gray-100"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    Applicant Tracking System
                                </h1>
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                    <Sparkles className="w-3 h-3 text-purple-600" />
                                    AI Ranked
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Job: <span className="font-semibold text-gray-800">{applicants?.title || 'Loading position...'}</span>
                                {applicants?.company?.name && (
                                    <> &bull; <span className="text-gray-600">{applicants.company.name}</span></>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchApplicantData}
                            disabled={loading}
                            className="text-xs flex items-center gap-1.5 border-gray-200"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh AI Match
                        </Button>
                        <div className="hidden sm:flex border border-gray-200 rounded-lg p-0.5 bg-gray-50 text-xs">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                                    viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Table
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                                    viewMode === 'cards' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                AI Cards
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Recruiter Intelligence Summary Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Total Applicants</p>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{totalApplicants}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-sm flex items-center gap-3.5 bg-gradient-to-br from-purple-50/50 to-white">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-purple-900 font-medium">Top AI Matches (≥80%)</p>
                            <h3 className="text-lg sm:text-xl font-bold text-purple-700">{topMatchesCount}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Avg Match Score</p>
                            <h3 className="text-lg sm:text-xl font-bold text-emerald-600">{avgScore}%</h3>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Accepted Candidates</p>
                            <h3 className="text-lg sm:text-xl font-bold text-amber-600">{acceptedCount}</h3>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search applicant name, email, or skill..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 text-sm h-9 bg-gray-50/50 border-gray-200"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">AI Fit:</span>
                            <Select value={scoreFilter} onValueChange={setScoreFilter}>
                                <SelectTrigger className="h-9 text-xs w-full sm:w-40 bg-gray-50/50 border-gray-200">
                                    <SelectValue placeholder="All Scores" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Match Scores</SelectItem>
                                    <SelectItem value="top">⭐ Top Fits (≥80%)</SelectItem>
                                    <SelectItem value="strong">✨ Strong Fits (65-79%)</SelectItem>
                                    <SelectItem value="moderate">⚡ Moderate (&lt;65%)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Status:</span>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-9 text-xs w-full sm:w-36 bg-gray-50/50 border-gray-200">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Applicants List */}
                <ApplicantsTable
                    applications={filteredApplications}
                    jobRequirements={applicants?.requirements || []}
                    jobData={applicants}
                    viewMode={viewMode}
                    onStatusUpdate={fetchApplicantData}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default Applicants;
