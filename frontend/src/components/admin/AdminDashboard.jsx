import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ADMIN_API_END_POINT } from '@/utils/constant';
import { setUser } from '@/redux/authSlice';
import { toast } from 'sonner';
import {
    ShieldCheck,
    Users,
    Briefcase,
    Building2,
    FileText,
    Video,
    Database,
    Activity,
    Search,
    Plus,
    Trash2,
    UserCheck,
    ExternalLink,
    RefreshCw,
    LogOut,
    CheckCircle2,
    XCircle,
    Clock,
    Sparkles,
    ChevronRight,
    Server,
    Layers,
    Cpu,
    ArrowUpRight,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

const AdminDashboard = () => {
    const { user } = useSelector((store) => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // State for tabs
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'jobs' | 'companies' | 'applications' | 'interviews' | 'database'

    // Data States
    const [stats, setStats] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [jobsList, setJobsList] = useState([]);
    const [companiesList, setCompaniesList] = useState([]);
    const [applicationsList, setApplicationsList] = useState([]);
    const [interviewsList, setInterviewsList] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [jobSearch, setJobSearch] = useState('');
    const [companySearch, setCompanySearch] = useState('');

    // Create User Modal
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        fullname: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'recruiter',
    });
    const [creatingUser, setCreatingUser] = useState(false);

    // Fetch Stats
    const fetchStats = async () => {
        try {
            const res = await axios.get(`${ADMIN_API_END_POINT}/stats`, { withCredentials: true });
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (err) {
            console.error('Fetch Admin Stats Error:', err);
        }
    };

    // Fetch Users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `${ADMIN_API_END_POINT}/users?role=${userRoleFilter}&keyword=${userSearch}`,
                { withCredentials: true }
            );
            if (res.data.success) {
                setUsersList(res.data.users);
            }
        } catch (err) {
            console.error('Fetch Users Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Jobs
    const fetchJobs = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${ADMIN_API_END_POINT}/jobs`, { withCredentials: true });
            if (res.data.success) {
                setJobsList(res.data.jobs);
            }
        } catch (err) {
            console.error('Fetch Jobs Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Companies
    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${ADMIN_API_END_POINT}/companies`, { withCredentials: true });
            if (res.data.success) {
                setCompaniesList(res.data.companies);
            }
        } catch (err) {
            console.error('Fetch Companies Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Applications
    const fetchApplications = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${ADMIN_API_END_POINT}/applications`, { withCredentials: true });
            if (res.data.success) {
                setApplicationsList(res.data.applications);
            }
        } catch (err) {
            console.error('Fetch Applications Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Interviews
    const fetchInterviews = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${ADMIN_API_END_POINT}/interviews`, { withCredentials: true });
            if (res.data.success) {
                setInterviewsList(res.data.interviews);
            }
        } catch (err) {
            console.error('Fetch Interviews Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchStats();
    }, []);

    // Tab Data Switcher
    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'jobs') fetchJobs();
        if (activeTab === 'companies') fetchCompanies();
        if (activeTab === 'applications') fetchApplications();
        if (activeTab === 'interviews') fetchInterviews();
        if (activeTab === 'overview' || activeTab === 'database') fetchStats();
    }, [activeTab]);

    // Handle Create User
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            setCreatingUser(true);
            const res = await axios.post(`${ADMIN_API_END_POINT}/users`, newUser, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true,
            });
            if (res.data.success) {
                toast.success(res.data.message);
                setIsCreateUserOpen(false);
                setNewUser({ fullname: '', email: '', phoneNumber: '', password: '', role: 'recruiter' });
                fetchUsers();
                fetchStats();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to create user');
        } finally {
            setCreatingUser(false);
        }
    };

    // Handle Update User Role
    const handleUpdateUserRole = async (userId, newRole) => {
        try {
            const res = await axios.put(
                `${ADMIN_API_END_POINT}/users/${userId}/role`,
                { role: newRole },
                { withCredentials: true }
            );
            if (res.data.success) {
                toast.success(res.data.message);
                fetchUsers();
                fetchStats();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to change role');
        }
    };

    // Handle Delete User
    const handleDeleteUser = async (userId, name) => {
        if (!window.confirm(`Are you sure you want to delete user "${name}" from the platform?`)) return;
        try {
            const res = await axios.delete(`${ADMIN_API_END_POINT}/users/${userId}`, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchUsers();
                fetchStats();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to delete user');
        }
    };

    // Handle Delete Job
    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Delete this job posting from the entire platform?')) return;
        try {
            const res = await axios.delete(`${ADMIN_API_END_POINT}/jobs/${jobId}`, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchJobs();
                fetchStats();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to delete job');
        }
    };

    // Handle Delete Company
    const handleDeleteCompany = async (companyId) => {
        if (!window.confirm('Delete this company and its associations?')) return;
        try {
            const res = await axios.delete(`${ADMIN_API_END_POINT}/companies/${companyId}`, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchCompanies();
                fetchStats();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to delete company');
        }
    };

    // Handle Update Application Status
    const handleUpdateApplicationStatus = async (appId, status) => {
        try {
            const res = await axios.put(
                `${ADMIN_API_END_POINT}/applications/${appId}/status`,
                { status },
                { withCredentials: true }
            );
            if (res.data.success) {
                toast.success(res.data.message);
                fetchApplications();
                fetchStats();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update application');
        }
    };

    // Handle Delete Interview
    const handleDeleteInterview = async (interviewId) => {
        if (!window.confirm('Delete this interview session?')) return;
        try {
            const res = await axios.delete(`${ADMIN_API_END_POINT}/interviews/${interviewId}`, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchInterviews();
                fetchStats();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to delete interview');
        }
    };

    const handleLogout = () => {
        sessionStorage.clear();
        localStorage.clear();
        dispatch(setUser(null));
        toast.success('Logged out of Admin Command Center.');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-white text-base tracking-tight">
                                    HireHub <span className="text-purple-400">Admin</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-mono font-bold text-purple-300">
                                    ROOT PRIVILEGES
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400">Website Global Administrator</p>
                        </div>
                    </div>

                    {/* Quick Access to All Platform Facilities */}
                    <div className="hidden lg:flex items-center gap-2">
                        <Link
                            to="/admin/portal"
                            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                        >
                            <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                            Recruiter Portal
                        </Link>
                        <Link
                            to="/student/portal"
                            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                        >
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            Candidate Hub
                        </Link>
                        <Link
                            to="/resume-checker"
                            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            ATS AI
                        </Link>
                        <Link
                            to="/"
                            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                        >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            Public Website
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col text-right">
                            <span className="text-xs font-bold text-white">{user?.fullname || 'Admin'}</span>
                            <span className="text-[10px] font-mono text-emerald-400">{user?.email}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="h-9 px-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-semibold"
                        >
                            <LogOut className="w-4 h-4 mr-1.5" />
                            Log Out
                        </Button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-slate-900/60 border-b border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-1 overflow-x-auto py-2.5 no-scrollbar">
                        {[
                            { id: 'overview', label: 'Dashboard & Health', icon: Activity },
                            { id: 'users', label: 'Users & Roles', icon: Users, count: stats?.users?.total },
                            { id: 'jobs', label: 'All Jobs', icon: Briefcase, count: stats?.jobs?.total },
                            { id: 'companies', label: 'Companies', icon: Building2, count: stats?.companies?.total },
                            { id: 'applications', label: 'Applications', icon: FileText, count: stats?.applications?.total },
                            { id: 'interviews', label: 'Live Interviews', icon: Video, count: stats?.interviews?.total },
                            { id: 'database', label: 'MongoDB Telemetry', icon: Database },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${
                                        isActive
                                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                    {typeof tab.count === 'number' && (
                                        <span
                                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                                isActive ? 'bg-purple-800 text-purple-100' : 'bg-slate-800 text-slate-400'
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Welcome Banner */}
                        <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900/60 border border-purple-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
                                    Full Website Authority
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                                    Website Administrator Command Center
                                </h2>
                                <p className="text-sm text-slate-300 max-w-2xl mt-2 leading-relaxed">
                                    You have full administrative privileges to manage all MongoDB data, oversee all recruiter job postings, verify companies, join or moderate live video interviews, and inspect system telemetry.
                                </p>

                                <div className="flex flex-wrap items-center gap-3 mt-6">
                                    <Button
                                        onClick={() => setActiveTab('users')}
                                        className="h-10 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2"
                                    >
                                        <Users className="w-4 h-4" />
                                        Manage Platform Users
                                    </Button>
                                    <Button
                                        onClick={() => setIsCreateUserOpen(true)}
                                        variant="outline"
                                        className="h-10 px-4 border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4 text-purple-400" />
                                        Create New User
                                    </Button>
                                    <Button
                                        onClick={fetchStats}
                                        variant="ghost"
                                        className="h-10 px-3 text-slate-400 hover:text-white text-xs flex items-center gap-1.5"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Refresh Metrics
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* KPI Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-purple-500/40 transition-all">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
                                    <Users className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="mt-3">
                                    <span className="text-3xl font-black text-white font-mono">
                                        {stats?.users?.total ?? '—'}
                                    </span>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                        <span>Students: <strong className="text-slate-200">{stats?.users?.students ?? 0}</strong></span>
                                        <span>•</span>
                                        <span>Recruiters: <strong className="text-slate-200">{stats?.users?.recruiters ?? 0}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-purple-500/40 transition-all">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-xs font-bold uppercase tracking-wider">Jobs Posted</span>
                                    <Briefcase className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="mt-3">
                                    <span className="text-3xl font-black text-white font-mono">
                                        {stats?.jobs?.total ?? '—'}
                                    </span>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                        <span>Active Positions: <strong className="text-slate-200">{stats?.jobs?.totalPositions ?? 0}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-purple-500/40 transition-all">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-xs font-bold uppercase tracking-wider">Companies</span>
                                    <Building2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="mt-3">
                                    <span className="text-3xl font-black text-white font-mono">
                                        {stats?.companies?.total ?? '—'}
                                    </span>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                        <span>Verified: <strong className="text-emerald-400">{stats?.companies?.verified ?? 0}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-purple-500/40 transition-all">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-xs font-bold uppercase tracking-wider">Live Interviews</span>
                                    <Video className="w-5 h-5 text-rose-400" />
                                </div>
                                <div className="mt-3">
                                    <span className="text-3xl font-black text-white font-mono">
                                        {stats?.interviews?.total ?? '—'}
                                    </span>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                        <span>Live: <strong className="text-rose-400">{stats?.interviews?.live ?? 0}</strong></span>
                                        <span>•</span>
                                        <span>Scheduled: <strong className="text-slate-200">{stats?.interviews?.scheduled ?? 0}</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Jump Facilities Matrix */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-purple-400" />
                                Direct Access to All Platform Facilities
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <Link
                                    to="/admin/portal"
                                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 group transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                                            Recruiter Command Hub
                                        </span>
                                        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Manage jobs, schedule interviews, view candidate resumes
                                    </p>
                                </Link>

                                <Link
                                    to="/admin/companies"
                                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 group transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                                            Manage Registered Companies
                                        </span>
                                        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Verify company profiles, edit logos, view company listings
                                    </p>
                                </Link>

                                <Link
                                    to="/admin/jobs"
                                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 group transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                                            All Jobs & Applicants
                                        </span>
                                        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Filter applicants, evaluate talent, advance hiring stages
                                    </p>
                                </Link>

                                <Link
                                    to="/student/portal"
                                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 group transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                                            Candidate Career Hub
                                        </span>
                                        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        View candidate applications, status trackers, and interviews
                                    </p>
                                </Link>

                                <Link
                                    to="/resume-checker"
                                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 group transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                                            ATS Resume AI Diagnostic
                                        </span>
                                        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Gemini AI ATS parsing, scoring, and keyword match tool
                                    </p>
                                </Link>

                                <button
                                    onClick={() => setActiveTab('database')}
                                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 group transition-all text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                                            MongoDB Telemetry & Setup
                                        </span>
                                        <Database className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Inspect database connection, collections, and admin credentials
                                    </p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. USERS MANAGEMENT TAB */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-black text-white">Platform Users & Role Permissions</h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    Inspect, promote, demote, or delete any account in the platform.
                                </p>
                            </div>
                            <Button
                                onClick={() => setIsCreateUserOpen(true)}
                                className="h-10 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add New User
                            </Button>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative flex-1 w-full">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <Input
                                    type="text"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="Search by name, email, or department..."
                                    className="pl-10 h-10 rounded-xl bg-slate-900 border-slate-800 text-white text-xs"
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {['all', 'student', 'recruiter', 'admin'].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => setUserRoleFilter(role)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                                            userRoleFilter === role
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                        }`}
                                    >
                                        {role === 'all' ? 'All Roles' : role}
                                    </button>
                                ))}
                                <Button
                                    onClick={fetchUsers}
                                    variant="outline"
                                    size="sm"
                                    className="h-10 px-3 border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                                        <tr>
                                            <th className="py-3 px-4">User</th>
                                            <th className="py-3 px-4">Role</th>
                                            <th className="py-3 px-4">Contact</th>
                                            <th className="py-3 px-4">ID / Mongo Key</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-300">
                                        {usersList.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-slate-500">
                                                    No users found matching your criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            usersList.map((u) => (
                                                <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                                                                {u.fullname?.charAt(0) || 'U'}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-white block">{u.fullname}</span>
                                                                <span className="text-[11px] text-slate-500">{u.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                                u.role === 'admin'
                                                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                                    : u.role === 'recruiter'
                                                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                            }`}
                                                        >
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono text-slate-400">
                                                        {u.phoneNumber || '—'}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                                                        {String(u._id)}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {/* Quick Role Change */}
                                                            <select
                                                                value={u.role}
                                                                onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                                                                className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] rounded-lg px-2 py-1"
                                                            >
                                                                <option value="student">Candidate</option>
                                                                <option value="recruiter">Recruiter</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteUser(u._id, u.fullname)}
                                                                className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. JOBS MANAGEMENT TAB */}
                {activeTab === 'jobs' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-white">Platform Job Postings</h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    All opportunities published by recruiters across the platform.
                                </p>
                            </div>
                            <Link to="/admin/jobs/create">
                                <Button className="h-10 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Post Job as Admin
                                </Button>
                            </Link>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                                    <tr>
                                        <th className="py-3 px-4">Title & Company</th>
                                        <th className="py-3 px-4">Location</th>
                                        <th className="py-3 px-4">Salary</th>
                                        <th className="py-3 px-4">Applications</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                    {jobsList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-slate-500">
                                                No jobs found.
                                            </td>
                                        </tr>
                                    ) : (
                                        jobsList.map((j) => (
                                            <tr key={j._id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-white block">{j.title}</span>
                                                    <span className="text-[11px] text-purple-400">
                                                        {j.company?.name || 'Independent Recruiter'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-400">{j.location || 'Remote'}</td>
                                                <td className="py-3.5 px-4 font-mono text-emerald-400">{j.salary} LPA</td>
                                                <td className="py-3.5 px-4">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px]">
                                                        {j.applications?.length || 0} applicants
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            to={`/description/${j._id}`}
                                                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                                                        >
                                                            View
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteJob(j._id)}
                                                            className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. COMPANIES TAB */}
                {activeTab === 'companies' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-white">Registered Companies</h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    All employer organizations registered in the platform.
                                </p>
                            </div>
                            <Link to="/admin/companies/create">
                                <Button className="h-10 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Register New Company
                                </Button>
                            </Link>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                                    <tr>
                                        <th className="py-3 px-4">Company</th>
                                        <th className="py-3 px-4">Location</th>
                                        <th className="py-3 px-4">Website</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                    {companiesList.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-500">
                                                No companies found.
                                            </td>
                                        </tr>
                                    ) : (
                                        companiesList.map((c) => (
                                            <tr key={c._id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="py-3.5 px-4 font-bold text-white">{c.name}</td>
                                                <td className="py-3.5 px-4 text-slate-400">{c.location || '—'}</td>
                                                <td className="py-3.5 px-4 text-purple-400">
                                                    {c.website ? (
                                                        <a href={c.website} target="_blank" rel="noreferrer" className="hover:underline">
                                                            {c.website}
                                                        </a>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteCompany(c._id)}
                                                        className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 5. APPLICATIONS TAB */}
                {activeTab === 'applications' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-black text-white">Candidate Applications</h2>
                            <p className="text-xs text-slate-400 mt-1">
                                View applications submitted across all job openings and modify statuses.
                            </p>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                                    <tr>
                                        <th className="py-3 px-4">Candidate</th>
                                        <th className="py-3 px-4">Job Applied</th>
                                        <th className="py-3 px-4">Current Status</th>
                                        <th className="py-3 px-4 text-right">Decision Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                    {applicationsList.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-500">
                                                No applications recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        applicationsList.map((a) => (
                                            <tr key={a._id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-white block">{a.applicant?.fullname || 'Applicant'}</span>
                                                    <span className="text-[11px] text-slate-500">{a.applicant?.email}</span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-medium text-slate-200">{a.job?.title || 'Job Posting'}</span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                            a.status === 'accepted'
                                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                                : a.status === 'rejected'
                                                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        }`}
                                                    >
                                                        {a.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleUpdateApplicationStatus(a._id, 'accepted')}
                                                            className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg"
                                                        >
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleUpdateApplicationStatus(a._id, 'rejected')}
                                                            className="h-7 px-2.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 6. INTERVIEWS TAB */}
                {activeTab === 'interviews' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-black text-white">Live Technical Video Interviews</h2>
                            <p className="text-xs text-slate-400 mt-1">
                                Full administrative visibility into all scheduled, live, and completed coding interviews.
                            </p>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                                    <tr>
                                        <th className="py-3 px-4">Candidate & Recruiter</th>
                                        <th className="py-3 px-4">Schedule</th>
                                        <th className="py-3 px-4">Room ID</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                    {interviewsList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-slate-500">
                                                No technical interviews active.
                                            </td>
                                        </tr>
                                    ) : (
                                        interviewsList.map((i) => (
                                            <tr key={i._id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-white block">
                                                        {i.candidate?.fullname || 'Candidate'}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500">
                                                        Interviewer: {i.recruiter?.fullname || 'Recruiter'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-slate-300">
                                                    {i.interviewDate} at {i.interviewTime}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-purple-400">{i.roomId}</td>
                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            i.status === 'live'
                                                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                                                                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                                        }`}
                                                    >
                                                        {i.status || 'scheduled'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            to={`/interview/room/${i.roomId}`}
                                                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold"
                                                        >
                                                            Enter Room
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteInterview(i._id)}
                                                            className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 7. DATABASE & SYSTEM TELEMETRY TAB */}
                {activeTab === 'database' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-black text-white">MongoDB & Platform Infrastructure</h2>
                            <p className="text-xs text-slate-400 mt-1">
                                System diagnostics, connection parameters, and instructions for managing MongoDB credentials.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* MongoDB Connection Card */}
                            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <Database className="w-5 h-5 text-purple-400" />
                                        <h3 className="font-bold text-white text-base">MongoDB Status</h3>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                                            stats?.database?.connected
                                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                                : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                                        }`}
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full ${
                                                stats?.database?.connected ? 'bg-emerald-400' : 'bg-amber-400'
                                            }`}
                                        />
                                        {stats?.database?.connected ? 'CONNECTED (Atlas / Cloud)' : 'OFFLINE / FALLBACK MODE'}
                                    </span>
                                </div>

                                <div className="space-y-2.5 text-xs text-slate-300 font-mono bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                                        <span className="text-slate-500">Mongoose ReadyState:</span>
                                        <span className="text-purple-300">{stats?.database?.readyState ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                                        <span className="text-slate-500">Database Name:</span>
                                        <span className="text-slate-200">{stats?.database?.name || 'hirehub'}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                                        <span className="text-slate-500">Cluster Host:</span>
                                        <span className="text-slate-200">{stats?.database?.host || 'In-Memory Safe Store'}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500">MONGO_URI Defined:</span>
                                        <span className={stats?.database?.connectionStringConfigured ? 'text-emerald-400' : 'text-slate-500'}>
                                            {stats?.database?.connectionStringConfigured ? 'Yes (Configured in Env)' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* System Health Card */}
                            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <Cpu className="w-5 h-5 text-indigo-400" />
                                    <h3 className="font-bold text-white text-base">Backend Telemetry</h3>
                                </div>

                                <div className="space-y-2.5 text-xs text-slate-300 font-mono bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                                        <span className="text-slate-500">Server Uptime:</span>
                                        <span className="text-emerald-400">{stats?.system?.uptimeSeconds ?? 0}s</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                                        <span className="text-slate-500">Node Runtime:</span>
                                        <span className="text-slate-200">{stats?.system?.nodeVersion || 'v20.x'}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                                        <span className="text-slate-500">Memory Allocation (RSS):</span>
                                        <span className="text-purple-300">{stats?.system?.memoryUsageMB ?? 0} MB</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                                        <span className="text-slate-500">Gemini AI Engine:</span>
                                        <span className={stats?.system?.geminiConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                                            {stats?.system?.geminiConfigured ? 'Active & Ready' : 'Standby'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500">Cloudinary Media Storage:</span>
                                        <span className={stats?.system?.cloudinaryConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                                            {stats?.system?.cloudinaryConfigured ? 'Configured' : 'Standby'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Guide Card for MongoDB Admin Document */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                Setting Up Your MongoDB Admin User
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                To link your custom administrator credentials, create or edit a document in your MongoDB <code className="text-purple-300">users</code> collection with <code className="text-purple-300">role: "admin"</code>:
                            </p>

                            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-purple-300 overflow-x-auto">
                                <pre>{`{\n  "_id": ObjectId("665123456789abcdef012345"),\n  "fullname": "Your Admin Name",\n  "email": "admin@yourdomain.com",\n  "phoneNumber": 9876543210,\n  "password": "your-password-hash-or-plain-text",\n  "role": "admin",\n  "createdAt": ISODate("2026-01-01T00:00:00.000Z")\n}`}</pre>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed">
                                • When logging in at <code className="text-purple-300">/admin/login</code>, you can type your <strong>email</strong> OR your <strong>MongoDB _id</strong> (e.g. <code className="text-purple-300">665123456789abcdef012345</code>) and your password.<br />
                                • Both bcrypt-hashed passwords and plain text passwords directly inserted into MongoDB are accepted for seamless onboarding.<br />
                                • You can also set <code className="text-purple-300">ADMIN_EMAIL</code> and <code className="text-purple-300">ADMIN_PASSWORD</code> in your environment to automatically create an admin user on boot!
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Create User Dialog */}
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white text-lg font-black">Create Platform User</DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            Create a candidate, recruiter, or admin account directly with initial credentials.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateUser} className="space-y-3.5 py-2">
                        <div>
                            <Label className="text-xs text-slate-300">Full Name</Label>
                            <Input
                                type="text"
                                required
                                value={newUser.fullname}
                                onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })}
                                placeholder="e.g. Elena Rostova"
                                className="h-10 bg-slate-950 border-slate-800 text-white text-xs mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-300">Email Address</Label>
                            <Input
                                type="email"
                                required
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="elena@company.com"
                                className="h-10 bg-slate-950 border-slate-800 text-white text-xs mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-300">Initial Password</Label>
                            <Input
                                type="password"
                                required
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                placeholder="Min 6 characters"
                                className="h-10 bg-slate-950 border-slate-800 text-white text-xs mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-300">Role Authority</Label>
                            <select
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                className="w-full h-10 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 mt-1"
                            >
                                <option value="student">Candidate / Jobseeker</option>
                                <option value="recruiter">Recruiter / Employer</option>
                                <option value="admin">System Administrator (Root)</option>
                            </select>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsCreateUserOpen(false)}
                                className="text-slate-400 hover:text-white text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={creatingUser}
                                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                            >
                                {creatingUser ? 'Creating...' : 'Create Account'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminDashboard;
