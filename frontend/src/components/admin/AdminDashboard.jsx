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
    Eye,
    EyeOff,
    Key,
    Copy,
    Check,
    Pencil,
    Sliders,
    Download,
    UserPlus,
    Filter,
    Lock,
    Unlock,
    Mail,
    Phone,
    Calendar,
    AlertCircle,
    FileCheck,
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

    // Password Visibility Map per User
    const [revealedPasswords, setRevealedPasswords] = useState({});
    const [copiedKey, setCopiedKey] = useState(null);

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

    // Edit User Modal & Form
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [editUserForm, setEditUserForm] = useState({
        _id: '',
        fullname: '',
        email: '',
        phoneNumber: '',
        role: 'student',
        department: '',
        subRole: '',
        isSubUser: false,
        newPassword: '',
        bio: '',
        permissions: {
            canPostJobs: false,
            canManageCompanies: false,
            canViewAllApplicants: false,
            canConductInterview: false,
            canSubmitReport: false,
            canFinalizeHiringDecision: false,
            canViewAllInterviews: false,
        },
    });
    const [savingEditUser, setSavingEditUser] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);

    // Reset Password Modal
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
    const [newResetPassword, setNewResetPassword] = useState('');
    const [resettingPassword, setResettingPassword] = useState(false);
    const [showResetPasswordVal, setShowResetPasswordVal] = useState(true);

    // Job Applicants Modal
    const [isJobApplicantsOpen, setIsJobApplicantsOpen] = useState(false);
    const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
    const [jobApplicantsList, setJobApplicantsList] = useState([]);
    const [loadingJobApplicants, setLoadingJobApplicants] = useState(false);
    const [applicantFilterStatus, setApplicantFilterStatus] = useState('all');

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

    // Copy Helper
    const copyText = (text, label = 'Content') => {
        if (!text) return;
        navigator.clipboard.writeText(String(text));
        setCopiedKey(String(text));
        toast.success(`${label} copied to clipboard!`);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Toggle Password Visibility
    const togglePasswordVisibility = (userId) => {
        setRevealedPasswords((prev) => ({
            ...prev,
            [userId]: !prev[userId],
        }));
    };

    // Random Password Generator
    const generateRandomPassword = () => {
        const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lowercase = 'abcdefghijkmnopqrstuvwxyz';
        const numbers = '23456789';
        const symbols = '!@#$%&*';
        const all = uppercase + lowercase + numbers + symbols;
        let pass = '';
        pass += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
        pass += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
        pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
        pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
        for (let i = 0; i < 6; i++) {
            pass += all.charAt(Math.floor(Math.random() * all.length));
        }
        return pass;
    };

    // Open Edit User Modal
    const handleOpenEditUser = (u) => {
        setEditUserForm({
            _id: u._id,
            fullname: u.fullname || '',
            email: u.email || '',
            phoneNumber: u.phoneNumber || '',
            role: u.role || 'student',
            department: u.department || '',
            subRole: u.subRole || '',
            isSubUser: Boolean(u.isSubUser),
            newPassword: '',
            bio: u.profile?.bio || '',
            permissions: {
                canPostJobs: Boolean(u.permissions?.canPostJobs),
                canManageCompanies: Boolean(u.permissions?.canManageCompanies),
                canViewAllApplicants: Boolean(u.permissions?.canViewAllApplicants),
                canConductInterview: Boolean(u.permissions?.canConductInterview),
                canSubmitReport: Boolean(u.permissions?.canSubmitReport),
                canFinalizeHiringDecision: Boolean(u.permissions?.canFinalizeHiringDecision),
                canViewAllInterviews: Boolean(u.permissions?.canViewAllInterviews),
            },
        });
        setShowEditPassword(false);
        setIsEditUserOpen(true);
    };

    // Save Edit User
    const handleSaveEditUser = async (e) => {
        e.preventDefault();
        try {
            setSavingEditUser(true);
            const payload = {
                fullname: editUserForm.fullname,
                email: editUserForm.email,
                phoneNumber: editUserForm.phoneNumber,
                role: editUserForm.role,
                department: editUserForm.department,
                subRole: editUserForm.subRole,
                isSubUser: editUserForm.isSubUser,
                permissions: editUserForm.permissions,
                bio: editUserForm.bio,
            };
            if (editUserForm.newPassword) {
                payload.password = editUserForm.newPassword;
            }

            const res = await axios.put(
                `${ADMIN_API_END_POINT}/users/${editUserForm._id}`,
                payload,
                { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
            );

            if (res.data.success) {
                toast.success(res.data.message || 'User profile updated successfully.');
                setIsEditUserOpen(false);
                fetchUsers();
                fetchStats();
            }
        } catch (err) {
            console.error('Update User Error:', err);
            toast.error(err.response?.data?.message || 'Failed to update user profile');
        } finally {
            setSavingEditUser(false);
        }
    };

    // Open Reset Password Modal
    const handleOpenResetPassword = (u) => {
        setResetPasswordTarget(u);
        setNewResetPassword(generateRandomPassword());
        setShowResetPasswordVal(true);
        setIsResetPasswordOpen(true);
    };

    // Save Reset Password
    const handleSaveResetPassword = async (e) => {
        e.preventDefault();
        if (!resetPasswordTarget || !newResetPassword) return;
        try {
            setResettingPassword(true);
            const res = await axios.put(
                `${ADMIN_API_END_POINT}/users/${resetPasswordTarget._id}/password`,
                { newPassword: newResetPassword },
                { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
            );
            if (res.data.success) {
                toast.success(`Password reset successfully for ${resetPasswordTarget.fullname}`);
                setIsResetPasswordOpen(false);
                fetchUsers();
            }
        } catch (err) {
            console.error('Reset Password Error:', err);
            toast.error(err.response?.data?.message || 'Failed to reset user password');
        } finally {
            setResettingPassword(false);
        }
    };

    // Open Job Applicants Inspector Modal
    const handleViewJobApplicants = async (job) => {
        setSelectedJobForApplicants(job);
        setApplicantFilterStatus('all');
        setIsJobApplicantsOpen(true);
        try {
            setLoadingJobApplicants(true);
            const res = await axios.get(`${ADMIN_API_END_POINT}/jobs/${job._id}/applicants`, {
                withCredentials: true,
            });
            if (res.data.success) {
                setJobApplicantsList(res.data.applications || []);
            }
        } catch (err) {
            console.error('Fetch Job Applicants Error:', err);
            toast.error(err.response?.data?.message || 'Failed to load applicants for this job');
        } finally {
            setLoadingJobApplicants(false);
        }
    };

    // Update Application Status from inside Job Applicants Inspector Modal
    const handleUpdateJobApplicantStatus = async (appId, newStatus) => {
        try {
            const res = await axios.put(
                `${ADMIN_API_END_POINT}/applications/${appId}/status`,
                { status: newStatus },
                { withCredentials: true }
            );
            if (res.data.success) {
                toast.success(`Applicant status updated to ${newStatus}`);
                setJobApplicantsList((prev) =>
                    prev.map((a) => (a._id === appId ? { ...a, status: newStatus } : a))
                );
                fetchJobs();
                fetchApplications();
                fetchStats();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update applicant status');
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
                                            <th className="py-3 px-4">User Account</th>
                                            <th className="py-3 px-4">Role & Team</th>
                                            <th className="py-3 px-4">Password Credentials</th>
                                            <th className="py-3 px-4">Contact / MongoDB ID</th>
                                            <th className="py-3 px-4 text-right">Admin Actions</th>
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
                                                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                                                                {u.fullname?.charAt(0) || 'U'}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-white block">{u.fullname}</span>
                                                                    {u.isSubUser && (
                                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 border border-purple-800/60 text-purple-300">
                                                                            Sub-User
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                                                    <span>{u.email}</span>
                                                                    <button
                                                                        onClick={() => copyText(u.email, 'Email')}
                                                                        title="Copy Email"
                                                                        className="hover:text-slate-300"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span
                                                                className={`inline-block w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                                    u.role === 'admin'
                                                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                                        : u.role === 'recruiter'
                                                                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                                }`}
                                                            >
                                                                {u.role}
                                                            </span>
                                                            {u.department && (
                                                                <span className="text-[10px] text-slate-400 font-medium">
                                                                    Dept: {u.department}
                                                                </span>
                                                            )}
                                                            {u.subRole && (
                                                                <span className="text-[10px] text-indigo-400 font-medium">
                                                                    {u.subRole}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-purple-300 flex items-center gap-1.5 font-mono text-xs select-all">
                                                                <Lock className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                                                <span>
                                                                    {revealedPasswords[u._id]
                                                                        ? (u.plainPassword || u.passwordDisplay || '••••••••')
                                                                        : '••••••••'}
                                                                </span>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => togglePasswordVisibility(u._id)}
                                                                title={revealedPasswords[u._id] ? "Hide password" : "Reveal password"}
                                                                className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                                                            >
                                                                {revealedPasswords[u._id] ? (
                                                                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                                                                ) : (
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => copyText(u.plainPassword || u.passwordDisplay, 'Password')}
                                                                title="Copy password"
                                                                className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                                                            >
                                                                {copiedKey === (u.plainPassword || u.passwordDisplay) ? (
                                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleOpenResetPassword(u)}
                                                                title="Reset / Set user password"
                                                                className="h-7 w-7 p-0 text-slate-400 hover:text-purple-300 hover:bg-purple-950/50 rounded-lg"
                                                            >
                                                                <Key className="w-3.5 h-3.5 text-purple-400" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono text-xs">
                                                        <div className="text-slate-300">{u.phoneNumber || '—'}</div>
                                                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                                                            <span className="truncate max-w-[110px]">{String(u._id)}</span>
                                                            <button
                                                                onClick={() => copyText(String(u._id), 'User ID')}
                                                                title="Copy MongoDB ID"
                                                                className="hover:text-slate-300 p-0.5"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleOpenEditUser(u)}
                                                                title="Edit Profile, Roles & Sub-user Permissions"
                                                                className="h-7 px-2.5 bg-slate-950 border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white text-[11px] rounded-lg flex items-center gap-1"
                                                            >
                                                                <Pencil className="w-3 h-3 text-purple-400" />
                                                                <span>Edit</span>
                                                            </Button>
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
                                                                title="Delete User"
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
                                    All opportunities published by recruiters across the platform with direct per-job candidate tracking.
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
                                        <th className="py-3 px-4">Applicants & Submissions</th>
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
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewJobApplicants(j)}
                                                        className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/60 hover:border-purple-500 text-purple-200 hover:bg-purple-900/80 text-xs font-bold flex items-center gap-2 transition-all group"
                                                        title="Click to view all applicants for this job"
                                                    >
                                                        <Users className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                                                        <span>{j.applications?.length || 0} Applicants</span>
                                                        <ArrowUpRight className="w-3 h-3 text-purple-400 opacity-60 group-hover:opacity-100" />
                                                    </button>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => handleViewJobApplicants(j)}
                                                            className="h-7 px-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1"
                                                        >
                                                            <Users className="w-3 h-3" />
                                                            Inspect
                                                        </Button>
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

            {/* Edit User & Permissions Dialog */}
            <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white text-lg font-black flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-purple-400" />
                            Edit Platform User & Permissions
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            Modify account identity, role authority, granular sub-user privileges, and password credentials.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveEditUser} className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-slate-300">Full Name</Label>
                                <Input
                                    type="text"
                                    required
                                    value={editUserForm.fullname}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, fullname: e.target.value })}
                                    className="h-10 bg-slate-950 border-slate-800 text-white text-xs mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-300">Email Address</Label>
                                <Input
                                    type="email"
                                    required
                                    value={editUserForm.email}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                                    className="h-10 bg-slate-950 border-slate-800 text-white text-xs mt-1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-slate-300">Phone Number</Label>
                                <Input
                                    type="text"
                                    value={editUserForm.phoneNumber}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, phoneNumber: e.target.value })}
                                    placeholder="+1 234 567 8900"
                                    className="h-10 bg-slate-950 border-slate-800 text-white text-xs mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-300">System Role</Label>
                                <select
                                    value={editUserForm.role}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                                    className="w-full h-10 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 mt-1"
                                >
                                    <option value="student">Candidate / Jobseeker</option>
                                    <option value="recruiter">Recruiter / Employer</option>
                                    <option value="admin">System Administrator (Root)</option>
                                </select>
                            </div>
                        </div>

                        {/* Recruiter & Sub-User Configuration Section */}
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                                    Recruitment Organization & Sub-User Role
                                </span>
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={editUserForm.isSubUser}
                                        onChange={(e) =>
                                            setEditUserForm({ ...editUserForm, isSubUser: e.target.checked })
                                        }
                                        className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Designate as Sub-User</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div>
                                    <Label className="text-[11px] text-slate-400">Department / Division</Label>
                                    <Input
                                        type="text"
                                        value={editUserForm.department}
                                        onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })}
                                        placeholder="e.g. Engineering, Talent Acquisition"
                                        className="h-9 bg-slate-900 border-slate-800 text-white text-xs mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[11px] text-slate-400">Custom Title / Sub-Role</Label>
                                    <Input
                                        type="text"
                                        value={editUserForm.subRole}
                                        onChange={(e) => setEditUserForm({ ...editUserForm, subRole: e.target.value })}
                                        placeholder="e.g. Lead Technical Interviewer"
                                        className="h-9 bg-slate-900 border-slate-800 text-white text-xs mt-1"
                                    />
                                </div>
                            </div>

                            {/* Granular Permission Flags */}
                            <div className="pt-2 border-t border-slate-800/80">
                                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                                    Sub-User Operational Permissions:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {[
                                        { key: 'canPostJobs', label: 'Post & Manage Jobs' },
                                        { key: 'canManageCompanies', label: 'Manage Companies' },
                                        { key: 'canViewAllApplicants', label: 'View All Applicants' },
                                        { key: 'canConductInterview', label: 'Conduct Interviews' },
                                        { key: 'canSubmitReport', label: 'Submit Evaluation Reports' },
                                        { key: 'canFinalizeHiringDecision', label: 'Finalize Hiring Decisions' },
                                        { key: 'canViewAllInterviews', label: 'View Interview Logs' },
                                    ].map((perm) => (
                                        <label
                                            key={perm.key}
                                            className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={Boolean(editUserForm.permissions[perm.key])}
                                                onChange={(e) =>
                                                    setEditUserForm({
                                                        ...editUserForm,
                                                        permissions: {
                                                            ...editUserForm.permissions,
                                                            [perm.key]: e.target.checked,
                                                        },
                                                    })
                                                }
                                                className="rounded border-slate-700 bg-slate-950 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="text-slate-300 text-[11px]">{perm.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Password Override */}
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs text-slate-300 flex items-center gap-1.5">
                                    <Key className="w-3.5 h-3.5 text-purple-400" />
                                    Change / Reset User Password
                                </Label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const rnd = generateRandomPassword();
                                        setEditUserForm({ ...editUserForm, newPassword: rnd });
                                        setShowEditPassword(true);
                                    }}
                                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                                >
                                    + Generate Secure Key
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showEditPassword ? 'text' : 'password'}
                                    value={editUserForm.newPassword}
                                    onChange={(e) => setEditUserForm({ ...editUserForm, newPassword: e.target.value })}
                                    placeholder="Leave blank to keep existing password untouched"
                                    className="h-10 bg-slate-900 border-slate-800 text-white text-xs pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowEditPassword(!showEditPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Setting a new password here will update both the bcrypt hash and the administrator plain-text credential audit view.
                            </p>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsEditUserOpen(false)}
                                className="text-slate-400 hover:text-white text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={savingEditUser}
                                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                            >
                                {savingEditUser ? 'Saving Changes...' : 'Save User Profile'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Quick Reset Password Dialog */}
            <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white text-lg font-black flex items-center gap-2">
                            <Key className="w-5 h-5 text-purple-400" />
                            Reset User Password
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            Directly provision a new password for{' '}
                            <span className="font-bold text-white">{resetPasswordTarget?.fullname}</span> (
                            <span className="text-purple-300">{resetPasswordTarget?.email}</span>).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveResetPassword} className="space-y-4 py-2">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label className="text-xs text-slate-300">New Password</Label>
                                <button
                                    type="button"
                                    onClick={() => setNewResetPassword(generateRandomPassword())}
                                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                                >
                                    Generate Random
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showResetPasswordVal ? 'text' : 'password'}
                                    required
                                    value={newResetPassword}
                                    onChange={(e) => setNewResetPassword(e.target.value)}
                                    placeholder="Enter new password (min 6 chars)"
                                    className="h-10 bg-slate-950 border-slate-800 text-white text-xs font-mono pr-20"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowResetPasswordVal(!showResetPasswordVal)}
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                                    >
                                        {showResetPasswordVal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyText(newResetPassword, 'Password')}
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                                    >
                                        {copiedKey === newResetPassword ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-xl text-xs text-purple-200">
                            The user can immediately log in with this new password. You will also see this updated password reflected in your Admin Credentials table.
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsResetPasswordOpen(false)}
                                className="text-slate-400 hover:text-white text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={resettingPassword}
                                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                            >
                                {resettingPassword ? 'Updating...' : 'Set New Password'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Per-Job Applicants Inspector Dialog */}
            <Dialog open={isJobApplicantsOpen} onOpenChange={setIsJobApplicantsOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-white text-lg font-black flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-400" />
                                Job Applicants Inspector
                            </DialogTitle>
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs border border-purple-500/30">
                                {jobApplicantsList.length} Total Applied
                            </span>
                        </div>
                        {selectedJobForApplicants && (
                            <div className="text-xs text-slate-300 mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap gap-x-6 gap-y-1">
                                <div>
                                    <span className="text-slate-500">Position:</span>{' '}
                                    <span className="font-bold text-white">{selectedJobForApplicants.title}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Company:</span>{' '}
                                    <span className="text-purple-300 font-semibold">
                                        {selectedJobForApplicants.company?.name || 'Independent Recruiter'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Compensation:</span>{' '}
                                    <span className="text-emerald-400 font-mono">{selectedJobForApplicants.salary} LPA</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Location:</span>{' '}
                                    <span className="text-slate-300">{selectedJobForApplicants.location || 'Remote'}</span>
                                </div>
                            </div>
                        )}
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Status Filter Tabs */}
                        <div className="flex items-center gap-2">
                            {['all', 'pending', 'accepted', 'rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setApplicantFilterStatus(status)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                                        applicantFilterStatus === status
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                                    }`}
                                >
                                    {status === 'all' ? 'All Applicants' : status}
                                </button>
                            ))}
                        </div>

                        {loadingJobApplicants ? (
                            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                                <span>Loading applicants for this job opening...</span>
                            </div>
                        ) : jobApplicantsList.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/60 rounded-2xl border border-slate-800">
                                No candidates have applied to this job posting yet.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {jobApplicantsList
                                    .filter((app) =>
                                        applicantFilterStatus === 'all'
                                            ? true
                                            : app.status?.toLowerCase() === applicantFilterStatus.toLowerCase()
                                    )
                                    .map((app) => (
                                        <div
                                            key={app._id}
                                            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 flex-shrink-0">
                                                    {app.applicant?.fullname?.charAt(0) || 'C'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-sm">
                                                        {app.applicant?.fullname || 'Candidate'}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3 text-slate-500" />
                                                            {app.applicant?.email}
                                                        </span>
                                                        {app.applicant?.phoneNumber && (
                                                            <span className="flex items-center gap-1 font-mono">
                                                                <Phone className="w-3 h-3 text-slate-500" />
                                                                {app.applicant?.phoneNumber}
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] text-slate-500">
                                                            Applied: {new Date(app.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    {/* Resume Link */}
                                                    {app.applicant?.profile?.resume && (
                                                        <div className="mt-2">
                                                            <a
                                                                href={app.applicant.profile.resume}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium underline"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                                View Resume ({app.applicant.profile.resumeOriginalName || 'Document'})
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Decision Control */}
                                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        app.status === 'accepted'
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                            : app.status === 'rejected'
                                                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                    }`}
                                                >
                                                    {app.status || 'pending'}
                                                </span>

                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateJobApplicantStatus(app._id, 'accepted')}
                                                        className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg"
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateJobApplicantStatus(app._id, 'rejected')}
                                                        className="h-7 px-2.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg"
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsJobApplicantsOpen(false)}
                            className="text-slate-400 hover:text-white text-xs"
                        >
                            Close Inspector
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminDashboard;
