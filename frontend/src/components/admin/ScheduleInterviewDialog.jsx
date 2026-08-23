import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
    Calendar,
    Clock,
    Video,
    Sparkles,
    Check,
    Copy,
    ExternalLink,
    Briefcase,
    Building2,
    Users,
    UserPlus,
    FileCode,
    MessageSquare,
    ArrowRight,
    UserCheck,
    ChevronRight,
    Layers,
    Shield
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';
import { useNavigate } from 'react-router-dom';

const ROUND_TYPES = [
    { value: 'Initial Screening', label: 'Initial Screening & Background Review', duration: 30, icon: Users },
    { value: 'Domain Competency', label: 'Domain Competency & Subject Matter Evaluation', duration: 45, icon: Briefcase },
    { value: 'Case Study & Scenario', label: 'Case Study, Scenario & Strategy Assessment', duration: 60, icon: Sparkles },
    { value: 'Portfolio & Presentation', label: 'Portfolio, Project & Presentation Review', duration: 45, icon: Layers },
    { value: 'Sales & Client Simulation', label: 'Sales Pitch & Client Negotiation Simulation', duration: 45, icon: MessageSquare },
    { value: 'Live Technical & Problem Solving', label: 'Live Technical & Analytical Problem Solving', duration: 60, icon: FileCode },
    { value: 'Behavioral & Cultural Fit', label: 'Behavioral & Cultural Alignment (STAR)', duration: 45, icon: MessageSquare },
    { value: 'Final Executive Round', label: 'Final Executive / Stakeholder Round', duration: 45, icon: Video },
];

const NEXT_ROUND_SUGGESTIONS = {
    'Initial Screening': 'Domain Competency',
    'Domain Competency': 'Case Study & Scenario',
    'Case Study & Scenario': 'Behavioral & Cultural Fit',
    'Portfolio & Presentation': 'Final Executive Round',
    'Sales & Client Simulation': 'Behavioral & Cultural Fit',
    'Live Technical & Problem Solving': 'Final Executive Round',
    'Behavioral & Cultural Fit': 'Final Executive Round',
    'Final Executive Round': 'Domain Competency',
};

const ScheduleInterviewDialog = ({
    isOpen,
    onOpenChange,
    applicantData,
    jobData,
    onSuccess,
}) => {
    const navigate = useNavigate();
    const applicant = applicantData?.applicant || {};
    const profile = applicant.profile || {};
    const jobId = jobData?._id || applicantData?.job?._id || applicantData?.job;
    const applicationId = applicantData?._id;

    // Tomorrow as default date in YYYY-MM-DD
    const getTomorrowDate = (offsetDays = 1) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split('T')[0];
    };

    const [interviewDate, setInterviewDate] = useState(getTomorrowDate(1));
    const [interviewTime, setInterviewTime] = useState('14:00');
    const [durationMinutes, setDurationMinutes] = useState(45);
    const [roundType, setRoundType] = useState('Technical Round');
    const [notes, setNotes] = useState(
        'Please have a stable internet connection, camera enabled, and be prepared for live coding and discussion on recent projects.'
    );
    const [loading, setLoading] = useState(false);
    const [scheduledResult, setScheduledResult] = useState(null);

    // Interviewer delegation state
    const [interviewerType, setInterviewerType] = useState('recruiter'); // 'recruiter' | 'assigned_panelist'
    const [subUsers, setSubUsers] = useState([]);
    const [selectedSubUserId, setSelectedSubUserId] = useState('');
    const [isAddingNewSubUser, setIsAddingNewSubUser] = useState(false);
    const [newSubUserForm, setNewSubUserForm] = useState({
        name: '',
        email: '',
        password: 'Demo@123',
        role: 'Technical Interviewer',
        department: 'Engineering Core',
    });

    // Fetch recruiter's technical sub-users/interviewers
    useEffect(() => {
        if (isOpen) {
            const fetchSubUsers = async () => {
                try {
                    axios.defaults.withCredentials = true;
                    const res = await axios.get(`${INTERVIEW_API_END_POINT}/sub-users`);
                    if (res.data?.success && Array.isArray(res.data.subUsers)) {
                        setSubUsers(res.data.subUsers);
                        setSelectedSubUserId((prev) => (prev ? prev : res.data.subUsers[0]?._id || ''));
                    }
                } catch (err) {
                    console.warn('Could not fetch sub-users:', err);
                }
            };
            fetchSubUsers();
        }
    }, [isOpen]);

    const handleCreateInlineSubUser = async (e) => {
        e.preventDefault();
        if (!newSubUserForm.name || !newSubUserForm.email) {
            toast.error('Name and work email are required.');
            return;
        }

        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(`${INTERVIEW_API_END_POINT}/sub-users`, {
                name: newSubUserForm.name,
                email: newSubUserForm.email,
                password: newSubUserForm.password || 'Demo@123',
                role: newSubUserForm.role,
                department: newSubUserForm.department,
            });

            if (res.data?.success) {
                toast.success(`Added ${newSubUserForm.name} (${newSubUserForm.role}) with login password!`);
                const updatedList = res.data.subUsers || [];
                setSubUsers(updatedList);
                if (res.data.newSubUser) {
                    setSelectedSubUserId(res.data.newSubUser._id);
                }
                setIsAddingNewSubUser(false);
                setNewSubUserForm({
                    name: '',
                    email: '',
                    password: 'Demo@123',
                    role: 'Technical Interviewer',
                    department: 'Engineering Core',
                });
            }
        } catch (error) {
            console.error('Add inline sub-user error:', error);
            toast.error(error.response?.data?.message || 'Failed to add technical interviewer.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!jobId || !applicant._id) {
            toast.error('Missing Job or Applicant information.');
            return;
        }

        if (!interviewDate || !interviewTime) {
            toast.error('Please select both date and time for the interview.');
            return;
        }

        let assignedInterviewerPayload = {};
        if (interviewerType === 'assigned_panelist') {
            const foundInterviewer = subUsers.find((u) => u._id === selectedSubUserId);
            if (!foundInterviewer) {
                toast.error('Please select or add a technical interviewer from your panel.');
                return;
            }
            assignedInterviewerPayload = {
                name: foundInterviewer.name,
                email: foundInterviewer.email,
                role: foundInterviewer.role,
                department: foundInterviewer.department,
                subUserId: foundInterviewer._id,
            };
        }

        setLoading(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(`${INTERVIEW_API_END_POINT}/schedule`, {
                jobId,
                candidateId: applicant._id,
                applicationId,
                interviewDate,
                interviewTime,
                durationMinutes: Number(durationMinutes),
                roundType,
                notes,
                interviewerType,
                assignedInterviewer: assignedInterviewerPayload,
            });

            if (res.data?.success) {
                toast.success(res.data.message || `Interview scheduled successfully with ${applicant.fullname || 'candidate'}!`);
                setScheduledResult(res.data.interview);
                if (onSuccess) onSuccess(res.data.interview);
            }
        } catch (error) {
            console.error('Schedule interview error:', error);
            toast.error(error.response?.data?.message || 'Failed to schedule interview.');
        } finally {
            setLoading(false);
        }
    };

    const copyMeetingLink = (roomId) => {
        const url = `${window.location.origin}/interview/room/${roomId}`;
        navigator.clipboard.writeText(url);
        toast.success('Interview meeting link copied to clipboard!');
    };

    const handleClose = () => {
        setScheduledResult(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                handleClose();
            }
        }}>
            <DialogContent className="max-w-xl bg-white p-6 sm:p-7 rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-[#6A38C2]">
                        <Video className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            Interactive Video Interviewing & Delegation
                        </span>
                    </div>
                    <DialogTitle className="text-lg sm:text-xl font-extrabold text-gray-900 mt-1">
                        {scheduledResult ? 'Interview Scheduled Successfully' : 'Schedule Live Interview'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500">
                        {scheduledResult 
                            ? 'Interview room has been created. The session is assigned and visible on the interviewer dashboard.' 
                            : 'Set up in-browser video calls with live collaborative coding, AI rubrics, and technical interviewer delegation.'}
                    </DialogDescription>
                </DialogHeader>

                {scheduledResult ? (
                    // Clean, finalized success confirmation screen (No auto-reopen/looping)
                    <div className="py-3 space-y-4 animate-in fade-in duration-200">
                        <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                                <Check className="w-6 h-6" />
                            </div>
                            <h4 className="text-base font-bold text-emerald-950">
                                Interview Successfully Scheduled!
                            </h4>
                            <p className="text-xs text-emerald-800 mt-1">
                                An in-browser interview room is ready for{' '}
                                <span className="font-bold">{applicant.fullname}</span>.
                            </p>
                        </div>

                        {/* Meeting Details Box */}
                        <div className="p-4 bg-gray-50/90 border border-gray-200 rounded-xl space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-gray-200/80">
                                <span className="text-gray-500">Candidate:</span>
                                <span className="font-bold text-gray-900">
                                    {applicant.fullname} ({applicant.email})
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/80">
                                <span className="text-gray-500">Job Position:</span>
                                <span className="font-bold text-gray-900">{jobData?.title || 'Open Position'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/80">
                                <span className="text-gray-500">Date & Time:</span>
                                <span className="font-bold text-[#6A38C2]">
                                    {scheduledResult.interviewDate} at {scheduledResult.interviewTime} (
                                    {scheduledResult.durationMinutes} mins)
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/80">
                                <span className="text-gray-500">Round Type:</span>
                                <span className="font-bold text-gray-800">{scheduledResult.roundType}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Assigned Evaluator:</span>
                                <span className="font-bold text-gray-900">
                                    {scheduledResult.interviewerType === 'assigned_panelist' &&
                                    scheduledResult.assignedInterviewer?.name
                                        ? `${scheduledResult.assignedInterviewer.name} (${scheduledResult.assignedInterviewer.role || 'Panelist'})`
                                        : 'Myself (Lead Recruiter)'}
                                </span>
                            </div>
                        </div>

                        {/* Room Link & Action Buttons */}
                        <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-purple-900">Live Meeting Room URL:</p>
                                <p className="text-xs font-mono text-[#6A38C2] truncate">
                                    {window.location.origin}/interview/room/{scheduledResult.roomId}
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyMeetingLink(scheduledResult.roomId)}
                                className="border-purple-200 text-[#6A38C2] hover:bg-purple-100 text-xs font-semibold h-8 shrink-0"
                            >
                                <Copy className="w-3.5 h-3.5 mr-1" />
                                Copy Link
                            </Button>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <Button 
                                variant="outline" 
                                onClick={handleClose} 
                                className="text-xs border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
                            >
                                Done & Close
                            </Button>
                            <Button
                                onClick={() => {
                                    const rId = scheduledResult.roomId;
                                    handleClose();
                                    navigate(`/interview/room/${rId}`);
                                }}
                                className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold shadow-xs"
                            >
                                <Video className="w-3.5 h-3.5 mr-1.5" />
                                Open Room Now
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Schedule Form View
                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        {/* Candidate Summary Mini-Card */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50/80 border border-gray-200/80 rounded-xl">
                            <Avatar className="h-10 w-10 border border-gray-200">
                                <AvatarImage src={profile.profilePhoto} />
                                <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs">
                                    {applicant.fullname?.charAt(0) || 'C'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                                    {applicant.fullname}
                                </h4>
                                <p className="text-[11px] text-gray-500 truncate">{applicant.email}</p>
                            </div>
                            <Badge variant="outline" className="bg-purple-50 text-[#6A38C2] border-purple-200 text-[11px] shrink-0">
                                {jobData?.title || 'Job Candidate'}
                            </Badge>
                        </div>

                        {/* Interview Host / Delegation (Who conducts interview?) */}
                        <div className="p-3.5 bg-purple-50/40 border border-purple-100 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5 text-[#6A38C2]" />
                                    Who will conduct this interview?
                                </Label>
                                <span className="text-[11px] text-purple-700 font-medium">Recruiter Delegation</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div
                                    onClick={() => setInterviewerType('recruiter')}
                                    className={`p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-bold flex items-center gap-2 ${
                                        interviewerType === 'recruiter'
                                            ? 'bg-white border-[#6A38C2] text-[#6A38C2] ring-1 ring-[#6A38C2] shadow-2xs'
                                            : 'bg-gray-50/80 border-gray-200 text-gray-600 hover:bg-white'
                                    }`}
                                >
                                    <div className={`w-3 h-3 rounded-full border ${interviewerType === 'recruiter' ? 'border-[#6A38C2] bg-[#6A38C2]' : 'border-gray-400'}`} />
                                    <span>Myself (Lead Recruiter)</span>
                                </div>

                                <div
                                    onClick={() => setInterviewerType('assigned_panelist')}
                                    className={`p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-bold flex items-center gap-2 ${
                                        interviewerType === 'assigned_panelist'
                                            ? 'bg-white border-[#6A38C2] text-[#6A38C2] ring-1 ring-[#6A38C2] shadow-2xs'
                                            : 'bg-gray-50/80 border-gray-200 text-gray-600 hover:bg-white'
                                    }`}
                                >
                                    <div className={`w-3 h-3 rounded-full border ${interviewerType === 'assigned_panelist' ? 'border-[#6A38C2] bg-[#6A38C2]' : 'border-gray-400'}`} />
                                    <span>Technical Interviewer / Sub-User</span>
                                </div>
                            </div>

                            {/* Sub-user Selection dropdown & Quick Add */}
                            {interviewerType === 'assigned_panelist' && (
                                <div className="pt-2 border-t border-purple-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-gray-700">
                                            Select Assigned Technical Panelist:
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingNewSubUser(!isAddingNewSubUser)}
                                            className="text-[11px] font-bold text-[#6A38C2] hover:underline inline-flex items-center gap-1"
                                        >
                                            <UserPlus className="w-3 h-3" />
                                            {isAddingNewSubUser ? 'Cancel' : '+ Add New Interviewer'}
                                        </button>
                                    </div>

                                    {isAddingNewSubUser ? (
                                        <div className="p-3 bg-white border border-purple-200 rounded-xl space-y-2.5 shadow-xs">
                                            <p className="text-[11px] font-bold text-gray-900 flex items-center justify-between">
                                                <span>Quick Add Interviewer Member</span>
                                                <span className="text-[10px] text-purple-600 font-normal">Sets direct login password</span>
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">Full Name</label>
                                                    <Input
                                                        placeholder="e.g. Alex Rivera"
                                                        value={newSubUserForm.name}
                                                        onChange={(e) => setNewSubUserForm({ ...newSubUserForm, name: e.target.value })}
                                                        className="text-xs h-8 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">Work Email</label>
                                                    <Input
                                                        type="email"
                                                        placeholder="alex@company.com"
                                                        value={newSubUserForm.email}
                                                        onChange={(e) => setNewSubUserForm({ ...newSubUserForm, email: e.target.value })}
                                                        className="text-xs h-8 rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">Interviewer Role</label>
                                                    <select
                                                        value={newSubUserForm.role}
                                                        onChange={(e) => setNewSubUserForm({ ...newSubUserForm, role: e.target.value })}
                                                        className="w-full text-xs rounded-lg h-8 border border-gray-200 bg-white px-2 text-gray-900"
                                                    >
                                                        <option value="Technical Interviewer">Technical Interviewer</option>
                                                        <option value="Senior Backend Engineer">Senior Backend Engineer</option>
                                                        <option value="Senior Frontend Engineer">Senior Frontend Engineer</option>
                                                        <option value="System Design Specialist">System Design Specialist</option>
                                                        <option value="Engineering Manager">Engineering Manager</option>
                                                        <option value="HR / Culture Interviewer">HR / Culture Interviewer</option>
                                                        <option value="Domain Subject Matter Expert">Domain Subject Matter Expert</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">Login Password</label>
                                                    <Input
                                                        type="text"
                                                        placeholder="Set Password (e.g. Demo@123)"
                                                        value={newSubUserForm.password}
                                                        onChange={(e) => setNewSubUserForm({ ...newSubUserForm, password: e.target.value })}
                                                        className="text-xs h-8 rounded-lg font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-2 pt-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setIsAddingNewSubUser(false)}
                                                    className="text-xs h-7 px-2 text-gray-500"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleCreateInlineSubUser}
                                                    className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs h-7 px-3 font-semibold"
                                                >
                                                    Create & Assign
                                                </Button>
                                            </div>
                                        </div>
                                    ) : subUsers.length === 0 ? (
                                        <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl text-center space-y-2">
                                            <p className="text-xs text-amber-900 font-medium">
                                                You haven't created any sub-user panelists yet.
                                            </p>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => setIsAddingNewSubUser(true)}
                                                className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs h-8 px-3 font-semibold rounded-lg shadow-xs"
                                            >
                                                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                                Add First Technical Interviewer
                                            </Button>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedSubUserId}
                                            onChange={(e) => setSelectedSubUserId(e.target.value)}
                                            className="w-full text-xs rounded-xl h-9 border border-gray-200 bg-white px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            {subUsers.map((su) => (
                                                <option key={su._id} value={su._id}>
                                                    {su.name} — {su.role} ({su.department || 'Engineering'})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Round Selection */}
                        <div>
                            <Label className="text-xs font-bold text-gray-700 block mb-1.5">
                                Select Interview Round
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {ROUND_TYPES.map((round) => {
                                    const Icon = round.icon;
                                    const isSelected = roundType === round.value;
                                    return (
                                        <div
                                            key={round.value}
                                            onClick={() => {
                                                setRoundType(round.value);
                                                setDurationMinutes(round.duration);
                                            }}
                                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                                                isSelected
                                                    ? 'bg-purple-50/80 border-[#6A38C2] ring-1 ring-[#6A38C2]'
                                                    : 'bg-white border-gray-200 hover:border-purple-200 hover:bg-purple-50/20'
                                            }`}
                                        >
                                            <div
                                                className={`p-1.5 rounded-lg shrink-0 ${
                                                    isSelected ? 'bg-[#6A38C2] text-white' : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                                                    {round.value}
                                                </p>
                                                <p className="text-[11px] text-gray-500">{round.duration} minutes</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date, Time & Duration Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <Label htmlFor="interviewDate" className="text-xs font-semibold text-gray-700 block mb-1">
                                    Interview Date
                                </Label>
                                <Input
                                    id="interviewDate"
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={interviewDate}
                                    onChange={(e) => setInterviewDate(e.target.value)}
                                    required
                                    className="text-xs rounded-xl h-9 border-gray-200"
                                />
                            </div>

                            <div>
                                <Label htmlFor="interviewTime" className="text-xs font-semibold text-gray-700 block mb-1">
                                    Start Time
                                </Label>
                                <Input
                                    id="interviewTime"
                                    type="time"
                                    value={interviewTime}
                                    onChange={(e) => setInterviewTime(e.target.value)}
                                    required
                                    className="text-xs rounded-xl h-9 border-gray-200"
                                />
                            </div>

                            <div>
                                <Label htmlFor="duration" className="text-xs font-semibold text-gray-700 block mb-1">
                                    Duration
                                </Label>
                                <select
                                    id="duration"
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                    className="w-full text-xs rounded-xl h-9 border border-gray-200 bg-white px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value={15}>15 mins</option>
                                    <option value={30}>30 mins</option>
                                    <option value={45}>45 mins</option>
                                    <option value={60}>60 mins</option>
                                    <option value={90}>90 mins</option>
                                </select>
                            </div>
                        </div>

                        {/* Agenda / Instructions Notes */}
                        <div>
                            <Label htmlFor="notes" className="text-xs font-semibold text-gray-700 block mb-1">
                                Candidate Instructions & Agenda Notes
                            </Label>
                            <textarea
                                id="notes"
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add specific technical topics, live coding prep instructions, or meeting agenda..."
                                className="w-full text-xs bg-gray-50/50 border border-gray-200 rounded-xl p-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <DialogFooter className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={loading}
                                className="text-xs border-gray-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold shadow-xs"
                            >
                                {loading ? (
                                    <>
                                        <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                        Scheduling Call...
                                    </>
                                ) : (
                                    <>
                                        <Video className="w-3.5 h-3.5 mr-1.5" />
                                        Confirm & Schedule Interview
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ScheduleInterviewDialog;
