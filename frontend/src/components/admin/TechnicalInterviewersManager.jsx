import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
    Users,
    UserPlus,
    Briefcase,
    Building2,
    Mail,
    Phone,
    Trash2,
    Sparkles,
    Check,
    Plus,
    Copy,
    Code,
    Cpu,
    Calendar,
    Layers,
    Shield,
    Key,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Sliders,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';

const PRESET_ROLES = [
    'Technical Interviewer',
    'Senior Backend Architect',
    'Senior Frontend Architect',
    'Fullstack Tech Lead',
    'Engineering Manager',
    'DevOps & Cloud Specialist',
    'System Design Specialist',
    'HR & Behavioral Specialist',
];

const PRESET_DEPARTMENTS = [
    'Engineering Core',
    'Cloud & Infrastructure',
    'Web & Mobile Platform',
    'Product Engineering',
    'Security & Reliability',
    'People & Talent Operations',
];

const TechnicalInterviewersManager = ({ onSelectInterviewer, isSelectionMode = false }) => {
    const [subUsers, setSubUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [credentialsModal, setCredentialsModal] = useState(null);

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: 'Demo@123',
        role: 'Technical Interviewer',
        department: 'Engineering Core',
        specialty: 'React, TypeScript, System Architecture',
        phone: '',
        permissions: {
            canViewAssignedInterviews: true,
            canConductInterview: true,
            canSubmitReport: true,
            canViewAllInterviews: false,
            canPostJobs: false,
            canViewAllApplicants: false,
            canManageCompanies: false,
            canFinalizeHiringDecision: false,
        },
    });

    const fetchSubUsers = async () => {
        setLoading(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.get(`${INTERVIEW_API_END_POINT}/sub-users`);
            if (res.data?.success) {
                setSubUsers(res.data.subUsers || []);
            }
        } catch (error) {
            console.error('Fetch sub-users error:', error);
            toast.error('Could not load technical interviewers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubUsers();
    }, []);

    const togglePermission = (permKey) => {
        setForm((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [permKey]: !prev.permissions[permKey],
            },
        }));
    };

    const handleAddInterviewer = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email) {
            toast.error('Please provide name and work email for the interviewer.');
            return;
        }

        setSubmitting(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(`${INTERVIEW_API_END_POINT}/sub-users`, {
                name: form.name,
                email: form.email,
                password: form.password || 'Demo@123',
                role: form.role,
                department: form.department,
                specialty: form.specialty.split(',').map((s) => s.trim()).filter(Boolean),
                phone: form.phone,
                permissions: form.permissions,
            });

            if (res.data?.success) {
                toast.success(res.data.message || 'Technical interviewer added successfully!');
                setSubUsers(res.data.subUsers || []);
                setIsAddOpen(false);
                setCredentialsModal({
                    name: form.name,
                    email: form.email,
                    password: form.password || 'Demo@123',
                    role: form.role,
                    permissions: form.permissions,
                });
                setForm({
                    name: '',
                    email: '',
                    password: 'Demo@123',
                    role: 'Technical Interviewer',
                    department: 'Engineering Core',
                    specialty: 'React, TypeScript, System Architecture',
                    phone: '',
                    permissions: {
                        canViewAssignedInterviews: true,
                        canConductInterview: true,
                        canSubmitReport: true,
                        canViewAllInterviews: false,
                        canPostJobs: false,
                        canViewAllApplicants: false,
                        canManageCompanies: false,
                        canFinalizeHiringDecision: false,
                    },
                });
                if (onSelectInterviewer && res.data.newSubUser) {
                    onSelectInterviewer(res.data.newSubUser);
                }
            }
        } catch (error) {
            console.error('Add sub-user error:', error);
            toast.error(error.response?.data?.message || 'Failed to add technical interviewer.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteInterviewer = async (subUserId, name) => {
        if (!confirm(`Are you sure you want to remove ${name} from your technical interview panel?`)) {
            return;
        }

        try {
            axios.defaults.withCredentials = true;
            const res = await axios.delete(`${INTERVIEW_API_END_POINT}/sub-users/${subUserId}`);
            if (res.data?.success) {
                toast.success('Technical interviewer removed.');
                setSubUsers(res.data.subUsers || []);
            }
        } catch (error) {
            console.error('Delete sub-user error:', error);
            toast.error(error.response?.data?.message || 'Failed to remove interviewer.');
        }
    };

    const copyText = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard!`);
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-[#6A38C2] text-xs font-bold uppercase tracking-wider mb-2">
                        <Shield className="w-3.5 h-3.5" />
                        Recruiter Sub-Users & Delegated Roles
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        Technical Interviewers & Hiring Team
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                        Create accounts for technical panelist teammates with granular access permissions. Sub-users can log in directly, view only assigned interviews on their dashboard, conduct live code reviews, and submit evaluation reports for your final review.
                    </p>
                </div>

                <Button
                    onClick={() => setIsAddOpen(true)}
                    className="bg-[#6A38C2] hover:bg-[#582da5] text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 gap-1.5 shrink-0 rounded-xl h-10 px-4"
                >
                    <UserPlus className="w-4 h-4" />
                    Create Technical Sub-User
                </Button>
            </div>

            {/* Quick explanation banner */}
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50/40 to-slate-50 border border-purple-100 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-xs space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm">How Recruiter Sub-User Delegation Works:</h4>
                        <p className="text-slate-600 leading-relaxed">
                            1. <strong>Schedule & Assign:</strong> Assign interviews to specific technical members.<br />
                            2. <strong>Sub-User Login:</strong> Teammates log in using their credentials and access their assigned interviews dashboard.<br />
                            3. <strong>Submit Report:</strong> Once the interview finishes, the panelist submits their technical scorecard to you.<br />
                            4. <strong>Inspection & Finalization:</strong> You can join live anytime for quality inspection and make the final hiring decision.
                        </p>
                    </div>
                </div>
            </div>

            {/* Sub-users Grid */}
            {loading ? (
                <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
                    <Sparkles className="w-7 h-7 text-[#6A38C2] animate-spin mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Loading interview panel team...</p>
                </div>
            ) : subUsers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900">No Technical Interviewers Added Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                        Add colleagues and domain experts so you can delegate live technical rounds and code reviews effortlessly.
                    </p>
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        size="sm"
                        className="bg-[#6A38C2] hover:bg-[#582da5] text-white text-xs font-bold rounded-xl px-4"
                    >
                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                        Create First Team Member
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subUsers.map((interviewer) => {
                        const perms = interviewer.permissions || {
                            canViewAssignedInterviews: true,
                            canConductInterview: true,
                            canSubmitReport: true,
                        };

                        return (
                            <div
                                key={interviewer._id || interviewer.email}
                                className="bg-white rounded-2xl border border-slate-200/80 hover:border-purple-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-11 w-11 rounded-xl border border-purple-100 bg-purple-50 text-[#6A38C2] font-bold text-sm">
                                                <AvatarFallback>
                                                    {interviewer.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm">{interviewer.name}</h3>
                                                <p className="text-xs text-purple-700 font-semibold">{interviewer.role}</p>
                                                <span className="text-[11px] text-slate-500">{interviewer.department}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteInterviewer(interviewer._id, interviewer.name)}
                                            className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Remove interviewer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Contact & Credentials info */}
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600 mb-3">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 truncate">
                                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate">{interviewer.email}</span>
                                            </span>
                                            <button
                                                onClick={() => copyText(interviewer.email, 'Email')}
                                                className="text-purple-600 hover:text-purple-800 text-[10px] font-bold hover:underline shrink-0 ml-1"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                                            <span className="flex items-center gap-1">
                                                <Key className="w-3 h-3 text-purple-500" />
                                                Login: <span className="font-mono font-semibold text-slate-700">Demo@123</span>
                                            </span>
                                            <Badge variant="outline" className="text-[10px] bg-white text-purple-700 border-purple-200">
                                                Sub-User Account
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Specialty tags */}
                                    {interviewer.specialty && interviewer.specialty.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                                Evaluation Domains
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {interviewer.specialty.map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Permissions checklist */}
                                    <div className="pt-2 border-t border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                            Assigned Permissions
                                        </p>
                                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                                <Check className="w-3 h-3 text-emerald-600" /> Assigned Dashboard
                                            </span>
                                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                                <Check className="w-3 h-3 text-emerald-600" /> Live Coding
                                            </span>
                                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                                <Check className="w-3 h-3 text-emerald-600" /> Submit Scorecard
                                            </span>
                                            <span className={`flex items-center gap-1 font-medium ${perms.canPostJobs ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                {perms.canPostJobs ? <Check className="w-3 h-3 text-emerald-600" /> : <Shield className="w-3 h-3" />}
                                                {perms.canPostJobs ? 'Post Jobs' : 'Restricted Admin'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {isSelectionMode && onSelectInterviewer && (
                                    <Button
                                        onClick={() => onSelectInterviewer(interviewer)}
                                        className="w-full mt-4 bg-purple-50 hover:bg-purple-100 text-[#6A38C2] font-bold text-xs rounded-xl"
                                        size="sm"
                                    >
                                        Select as Panelist
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Sub-User Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-lg rounded-3xl border-slate-200 p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#6A38C2] flex items-center justify-center font-bold mb-2">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-xl font-black text-slate-900">
                            Add Technical Interviewer / Sub-User
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Create a delegated team member account. They will be able to log in with this email and password, see only their assigned interviews, and submit reports to you.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddInterviewer} className="space-y-4 py-2">
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Full Name *</Label>
                            <Input
                                placeholder="e.g. Maya Chen"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                className="mt-1 h-10 rounded-xl border-slate-200 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Work Email (Login ID) *</Label>
                                <Input
                                    type="email"
                                    placeholder="maya.chen@eng.company.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                    className="mt-1 h-10 rounded-xl border-slate-200 text-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700">Initial Password</Label>
                                <div className="relative mt-1">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Demo@123"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="h-10 rounded-xl border-slate-200 text-sm pr-9"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Role / Title</Label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="w-full mt-1 h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                >
                                    {PRESET_ROLES.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700">Department</Label>
                                <select
                                    value={form.department}
                                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                                    className="w-full mt-1 h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                >
                                    {PRESET_DEPARTMENTS.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Technical Expertise / Specialty</Label>
                            <Input
                                placeholder="e.g. Distributed Systems, Kubernetes, Go, Kafka"
                                value={form.specialty}
                                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                                className="mt-1 h-10 rounded-xl border-slate-200 text-sm"
                            />
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Separate areas with commas</span>
                        </div>

                        {/* Granular Permissions Box */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                                    Granted Permissions & Scope
                                </Label>
                                <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                    Recruiter-Controlled
                                </span>
                            </div>

                            <div className="space-y-2 text-xs">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.permissions.canViewAssignedInterviews}
                                        onChange={() => togglePermission('canViewAssignedInterviews')}
                                        className="rounded text-[#6A38C2] focus:ring-purple-500 h-4 w-4"
                                    />
                                    <span className="text-slate-700 font-medium">Access Assigned Interviews Dashboard</span>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.permissions.canConductInterview}
                                        onChange={() => togglePermission('canConductInterview')}
                                        className="rounded text-[#6A38C2] focus:ring-purple-500 h-4 w-4"
                                    />
                                    <span className="text-slate-700 font-medium">Conduct Live Video & Code Evaluation</span>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.permissions.canSubmitReport}
                                        onChange={() => togglePermission('canSubmitReport')}
                                        className="rounded text-[#6A38C2] focus:ring-purple-500 h-4 w-4"
                                    />
                                    <span className="text-slate-700 font-medium">Submit Technical Scorecard to Recruiter</span>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer text-slate-500">
                                    <input
                                        type="checkbox"
                                        checked={form.permissions.canPostJobs}
                                        onChange={() => togglePermission('canPostJobs')}
                                        className="rounded text-[#6A38C2] focus:ring-purple-500 h-4 w-4"
                                    />
                                    <span>Allow Posting New Job Listings</span>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer text-slate-500">
                                    <input
                                        type="checkbox"
                                        checked={form.permissions.canFinalizeHiringDecision}
                                        onChange={() => togglePermission('canFinalizeHiringDecision')}
                                        className="rounded text-[#6A38C2] focus:ring-purple-500 h-4 w-4"
                                    />
                                    <span>Allow Finalizing Hiring Decisions (Unchecked: Recruiter thinks final)</span>
                                </label>
                            </div>
                        </div>

                        <DialogFooter className="pt-3 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddOpen(false)}
                                className="rounded-xl text-xs h-10"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-[#6A38C2] hover:bg-[#582da5] text-white font-bold rounded-xl text-xs h-10 px-5"
                            >
                                {submitting ? 'Creating Sub-User...' : 'Add to Interview Panel'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Post-Creation Credentials Modal */}
            <Dialog open={Boolean(credentialsModal)} onOpenChange={() => setCredentialsModal(null)}>
                <DialogContent className="max-w-md rounded-3xl border-emerald-200 bg-white p-6 shadow-2xl">
                    <DialogHeader>
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-2">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-xl font-black text-slate-900">
                            Sub-User Created Successfully!
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Share these login credentials with your technical teammate so they can log in and attend assigned interviews.
                        </DialogDescription>
                    </DialogHeader>

                    {credentialsModal && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase">Teammate Name:</span>
                                <p className="font-bold text-slate-900 text-sm">{credentialsModal.name}</p>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase">Role / Title:</span>
                                <p className="font-semibold text-purple-700">{credentialsModal.role}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-200">
                                <span className="text-[11px] font-bold text-slate-400 uppercase">Login Email:</span>
                                <div className="flex items-center justify-between mt-0.5">
                                    <span className="font-mono font-bold text-slate-800">{credentialsModal.email}</span>
                                    <button
                                        onClick={() => copyText(credentialsModal.email, 'Email')}
                                        className="text-purple-600 font-bold hover:underline"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase">Login Password:</span>
                                <div className="flex items-center justify-between mt-0.5">
                                    <span className="font-mono font-bold text-slate-800">{credentialsModal.password}</span>
                                    <button
                                        onClick={() => copyText(credentialsModal.password, 'Password')}
                                        className="text-purple-600 font-bold hover:underline"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                            <div className="p-2.5 bg-purple-50 text-[#6A38C2] rounded-xl text-[11px] font-medium">
                                💡 To log in: Go to Login, select <strong>Recruiter</strong>, and enter these credentials.
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            onClick={() => setCredentialsModal(null)}
                            className="w-full bg-[#6A38C2] hover:bg-[#582da5] text-white font-bold rounded-xl text-xs h-10"
                        >
                            Got It, Back to Panel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TechnicalInterviewersManager;
