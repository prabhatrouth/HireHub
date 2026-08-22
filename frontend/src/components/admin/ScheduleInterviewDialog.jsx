import React, { useState } from 'react';
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
    FileCode,
    MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';
import { useNavigate } from 'react-router-dom';

const ROUND_TYPES = [
    { value: 'Initial Screening', label: 'Initial Screening (Recruiter Call)', duration: 30, icon: Users },
    { value: 'Technical Round', label: 'Technical Round (Architecture & Core)', duration: 45, icon: Briefcase },
    { value: 'Live Coding & DSA', label: 'Live Coding & DSA (Interactive Code)', duration: 60, icon: FileCode },
    { value: 'System Design', label: 'System Design & High Level Infra', duration: 60, icon: Sparkles },
    { value: 'Behavioral & HR Round', label: 'Behavioral & HR Cultural Fit', duration: 45, icon: MessageSquare },
    { value: 'Final Executive Round', label: 'Final Executive / Founder Round', duration: 45, icon: Video },
];

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
    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const [interviewDate, setInterviewDate] = useState(getTomorrowDate());
    const [interviewTime, setInterviewTime] = useState('14:00');
    const [durationMinutes, setDurationMinutes] = useState(45);
    const [roundType, setRoundType] = useState('Technical Round');
    const [notes, setNotes] = useState(
        'Please have a stable internet connection, camera enabled, and be prepared for live coding and discussion on recent projects.'
    );
    const [loading, setLoading] = useState(false);
    const [scheduledResult, setScheduledResult] = useState(null);

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
            });

            if (res.data?.success) {
                toast.success(res.data.message || 'Interview scheduled successfully!');
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
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-xl bg-white p-6 sm:p-7 rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-[#6A38C2]">
                        <Video className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">In-Browser Video Interview</span>
                    </div>
                    <DialogTitle className="text-lg sm:text-xl font-extrabold text-gray-900 mt-1">
                        Schedule Live Interview
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500">
                        Schedule a real-time video interview with live screen sharing, collaborative coding, and AI rubrics.
                    </DialogDescription>
                </DialogHeader>

                {scheduledResult ? (
                    // Success View
                    <div className="py-4 space-y-4">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2.5">
                                <Check className="w-6 h-6" />
                            </div>
                            <h4 className="text-base font-bold text-emerald-950">
                                Interview Successfully Scheduled!
                            </h4>
                            <p className="text-xs text-emerald-800 mt-1">
                                An in-browser interview room has been created for <span className="font-bold">{applicant.fullname}</span>.
                            </p>
                        </div>

                        {/* Meeting Details Box */}
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-gray-200/80">
                                <span className="text-gray-500">Candidate:</span>
                                <span className="font-bold text-gray-900">{applicant.fullname} ({applicant.email})</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/80">
                                <span className="text-gray-500">Job Position:</span>
                                <span className="font-bold text-gray-900">{jobData?.title || 'Open Position'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/80">
                                <span className="text-gray-500">Date & Time:</span>
                                <span className="font-bold text-purple-700">
                                    {scheduledResult.interviewDate} at {scheduledResult.interviewTime} ({scheduledResult.durationMinutes} mins)
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Round:</span>
                                <span className="font-bold text-gray-800">{scheduledResult.roundType}</span>
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
                            <Button variant="outline" onClick={handleClose} className="text-xs border-gray-200">
                                Done & Close
                            </Button>
                            <Button
                                onClick={() => {
                                    handleClose();
                                    navigate(`/interview/room/${scheduledResult.roomId}`);
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
                                            <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-[#6A38C2] text-white' : 'bg-gray-100 text-gray-600'}`}>
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
                                rows={3}
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
                                        Confirm & Send Invite
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
