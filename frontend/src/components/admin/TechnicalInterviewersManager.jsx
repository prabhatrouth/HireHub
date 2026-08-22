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
    Shield
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';

const PRESET_ROLES = [
    'Senior Frontend Engineer',
    'Staff Backend Architect',
    'Fullstack Tech Lead',
    'Engineering Manager',
    'DevOps & Infrastructure Lead',
    'System Design Specialist',
    'HR & Culture Partner'
];

const PRESET_DEPARTMENTS = [
    'Engineering Core',
    'Cloud & Infrastructure',
    'Web & Mobile Platform',
    'Product Engineering',
    'Security & Reliability',
    'People & Talent Operations'
];

const TechnicalInterviewersManager = ({ onSelectInterviewer, isSelectionMode = false }) => {
    const [subUsers, setSubUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        role: 'Senior Frontend Engineer',
        department: 'Engineering Core',
        specialty: 'React, TypeScript, System Architecture',
        phone: '',
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
                role: form.role,
                department: form.department,
                specialty: form.specialty.split(',').map((s) => s.trim()).filter(Boolean),
                phone: form.phone,
            });

            if (res.data?.success) {
                toast.success(res.data.message || 'Technical interviewer added successfully!');
                setSubUsers(res.data.subUsers || []);
                setIsAddOpen(false);
                setForm({
                    name: '',
                    email: '',
                    role: 'Senior Frontend Engineer',
                    department: 'Engineering Core',
                    specialty: 'React, TypeScript, System Architecture',
                    phone: '',
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

    const copyEmail = (email) => {
        navigator.clipboard.writeText(email);
        toast.success(`Copied ${email} to clipboard!`);
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 text-[#6A38C2] text-xs font-bold uppercase tracking-wider mb-1">
                        <Users className="w-3.5 h-3.5" />
                        Recruiter Sub-Users & Delegation
                    </div>
                    <h2 className="text-lg font-extrabold text-gray-900">
                        Technical Interviewers & Hiring Panelists
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-2xl">
                        Add senior engineers, tech leads, and hiring managers to your interview panel. When scheduling interviews, assign any teammate or conduct it yourself.
                    </p>
                </div>

                <Button
                    onClick={() => setIsAddOpen(true)}
                    className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-bold shadow-xs gap-1.5 shrink-0"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Technical Interviewer
                </Button>
            </div>

            {/* Sub-users Grid */}
            {loading ? (
                <div className="py-12 text-center bg-white rounded-2xl border border-gray-200 p-8">
                    <Sparkles className="w-7 h-7 text-[#6A38C2] animate-spin mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-600">Loading interview panel team...</p>
                </div>
            ) : subUsers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200/80 p-10 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-gray-900">No Technical Interviewers Added Yet</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-4">
                        Add colleagues and domain experts so you can delegate live technical rounds and code reviews effortlessly.
                    </p>
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        size="sm"
                        className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold"
                    >
                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                        Add First Interviewer
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subUsers.map((interviewer) => {
                        const specialties = Array.isArray(interviewer.specialty)
                            ? interviewer.specialty
                            : [];

                        return (
                            <div
                                key={interviewer._id || interviewer.email}
                                className="bg-white rounded-2xl border border-gray-200/90 hover:border-purple-200 transition-all p-4 sm:p-5 shadow-2xs flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-11 h-11 border border-purple-200 shadow-2xs">
                                                <AvatarFallback className="bg-purple-100 text-purple-800 font-extrabold text-sm">
                                                    {interviewer.name
                                                        ?.split(' ')
                                                        .map((n) => n[0])
                                                        .join('')
                                                        .slice(0, 2)
                                                        .toUpperCase() || 'IT'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-gray-900 text-sm truncate">
                                                    {interviewer.name}
                                                </h4>
                                                <Badge
                                                    variant="outline"
                                                    className="bg-purple-50 text-[#6A38C2] border-purple-200 text-[11px] font-semibold mt-0.5"
                                                >
                                                    {interviewer.role || 'Technical Interviewer'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteInterviewer(interviewer._id, interviewer.name)}
                                            className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                            title="Remove from panel"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Department & Contact */}
                                    <div className="space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span className="truncate">{interviewer.department || 'Engineering Core'}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 truncate">
                                                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="truncate">{interviewer.email}</span>
                                            </div>
                                            <button
                                                onClick={() => copyEmail(interviewer.email)}
                                                className="text-gray-400 hover:text-[#6A38C2] p-1"
                                                title="Copy email"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                        {interviewer.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span>{interviewer.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tech Specialty Badges */}
                                    {specialties.length > 0 && (
                                        <div className="pt-2">
                                            <p className="text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                                                Core Tech & Assessment Focus:
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {specialties.map((spec, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200/70"
                                                    >
                                                        {spec}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        Active Panelist
                                    </span>

                                    {isSelectionMode && onSelectInterviewer ? (
                                        <Button
                                            size="sm"
                                            onClick={() => onSelectInterviewer(interviewer)}
                                            className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs h-7 px-3"
                                        >
                                            Select Interviewer
                                        </Button>
                                    ) : (
                                        <span className="text-[11px] text-gray-400 font-medium">
                                            Ready for assignment
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Technical Interviewer Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md bg-white p-6 rounded-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-[#6A38C2]">
                            <UserPlus className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Hiring Delegation</span>
                        </div>
                        <DialogTitle className="text-lg font-extrabold text-gray-900 mt-1">
                            Add Technical Interviewer
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Register a technical colleague or panelist to conduct coding rounds, system design, or executive interviews.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddInterviewer} className="space-y-3.5 mt-2">
                        <div>
                            <Label htmlFor="name" className="text-xs font-bold text-gray-700 block mb-1">
                                Full Name <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Alex Rivera"
                                required
                                className="text-xs rounded-xl h-9 border-gray-200"
                            />
                        </div>

                        <div>
                            <Label htmlFor="email" className="text-xs font-bold text-gray-700 block mb-1">
                                Work Email Address <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="e.g. alex.rivera@company.com"
                                required
                                className="text-xs rounded-xl h-9 border-gray-200"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="role" className="text-xs font-bold text-gray-700 block mb-1">
                                    Designation / Role
                                </Label>
                                <select
                                    id="role"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="w-full text-xs rounded-xl h-9 border border-gray-200 bg-white px-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    {PRESET_ROLES.map((r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="department" className="text-xs font-bold text-gray-700 block mb-1">
                                    Department
                                </Label>
                                <select
                                    id="department"
                                    value={form.department}
                                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                                    className="w-full text-xs rounded-xl h-9 border border-gray-200 bg-white px-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    {PRESET_DEPARTMENTS.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="specialty" className="text-xs font-bold text-gray-700 block mb-1">
                                Tech Specialties & Assessment Focus (comma-separated)
                            </Label>
                            <Input
                                id="specialty"
                                value={form.specialty}
                                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                                placeholder="e.g. React, Node.js, System Design, DSA"
                                className="text-xs rounded-xl h-9 border-gray-200"
                            />
                        </div>

                        <div>
                            <Label htmlFor="phone" className="text-xs font-bold text-gray-700 block mb-1">
                                Phone Number (Optional)
                            </Label>
                            <Input
                                id="phone"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="e.g. +1 555-0192"
                                className="text-xs rounded-xl h-9 border-gray-200"
                            />
                        </div>

                        <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddOpen(false)}
                                disabled={submitting}
                                className="text-xs border-gray-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-bold shadow-xs"
                            >
                                {submitting ? 'Adding...' : 'Save Technical Interviewer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TechnicalInterviewersManager;
