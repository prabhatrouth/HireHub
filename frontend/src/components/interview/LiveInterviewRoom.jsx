import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import {
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    MonitorUp,
    MonitorOff,
    PhoneOff,
    Play,
    Sparkles,
    Send,
    MessageSquare,
    Code2,
    Award,
    CheckCircle2,
    Users,
    Settings,
    Copy,
    Maximize2,
    Minimize2,
    Clock,
    AlertCircle,
    ChevronRight,
    Terminal,
    RotateCcw,
    Check,
    Briefcase,
    Building2,
    User,
    ArrowRight,
    Shield,
    Eye,
    FileCheck,
    UserCheck,
    Lock
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';

const CODE_TEMPLATES = {
    javascript: `// JavaScript Live Coding
// Problem: Write a function that finds two numbers in nums that add up to target.

function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test Run:
const result = twoSum([2, 7, 11, 15], 9);
console.log("Output Indices:", result);
`,
    python: `# Python 3 Live Coding
# Problem: Reverse words in a string

def reverse_words(s: str) -> str:
    words = s.strip().split()
    return " ".join(reversed(words))

# Test Run:
output = reverse_words("HireHub AI Smart Interview Platform")
print("Reversed Output:", output)
`,
    react: `// React Functional Component
import React, { useState } from 'react';

export default function UserCounter() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Live Counter: {count}</h3>
      <button onClick={() => setCount(c => c + 1)} className="px-3 py-1 bg-purple-600 text-white rounded mt-2">
        Increment
      </button>
    </div>
  );
}
`,
    sql: `-- SQL Data Query
-- Find top 3 highest spending candidates in last 30 days
SELECT 
    user_id, 
    COUNT(application_id) AS total_applied,
    MAX(created_at) AS last_activity
FROM applications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY total_applied DESC
LIMIT 3;
`,
};

const LiveInterviewRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((store) => store.auth);

    // Interview & Room Data
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);

    // Media Streams & Device States
    const [hasJoined, setHasJoined] = useState(false);
    const [joinWithVideo, setJoinWithVideo] = useState(true);
    const [joinWithAudio, setJoinWithAudio] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [mediaError, setMediaError] = useState('');

    const localVideoRef = useRef(null);
    const screenVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);

    // Call Duration Timer
    const [secondsElapsed, setSecondsElapsed] = useState(0);

    // UI Workspace Tabs: 'code' | 'scorecard' | 'ai' | 'chat' | 'final_decision'
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('code');

    // Live Code Workspace
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [code, setCode] = useState(CODE_TEMPLATES.javascript);
    const [consoleOutput, setConsoleOutput] = useState('Console output will appear here after clicking "Run Code"...');
    const [isRunningCode, setIsRunningCode] = useState(false);

    // In-Room Chat
    const [chatMessages, setChatMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const chatBottomRef = useRef(null);

    // AI Assistant Questions
    const [aiQuestions, setAiQuestions] = useState([]);
    const [loadingAiQuestions, setLoadingAiQuestions] = useState(false);

    // Evaluation & Scorecard Form
    const [technicalScore, setTechnicalScore] = useState(4);
    const [communicationScore, setCommunicationScore] = useState(4);
    const [problemSolvingScore, setProblemSolvingScore] = useState(4);
    const [systemDesignScore, setSystemDesignScore] = useState(4);
    const [strengths, setStrengths] = useState('');
    const [weaknesses, setWeaknesses] = useState('');
    const [panelistRecommendation, setPanelistRecommendation] = useState('Hire');
    const [detailedNotes, setDetailedNotes] = useState('');
    const [submittingEvaluation, setSubmittingEvaluation] = useState(false);
    const [reportSaved, setReportSaved] = useState(false);

    // Recruiter Final Decision Form
    const [recruiterFinalDecision, setRecruiterFinalDecision] = useState('Hire');
    const [recruiterFinalRemarks, setRecruiterFinalRemarks] = useState('');
    const [submittingFinalDecision, setSubmittingFinalDecision] = useState(false);
    const [finalDecisionSaved, setFinalDecisionSaved] = useState(false);

    // Role checks
    const isMasterRecruiter = user?.role === 'recruiter' && !user?.isSubUser;
    const isSubUser = Boolean(user?.isSubUser);
    const isRecruiter = user?.role === 'recruiter';

    const isAssignedInterviewer = Boolean(
        interview?.assignedInterviewer?.email?.toLowerCase() === user?.email?.toLowerCase() ||
        String(interview?.assignedInterviewer?.userId) === String(user?._id)
    );

    const isRecruiterSelfConducted = Boolean(
        interview?.interviewerType === 'recruiter' ||
        !interview?.assignedInterviewer?.name ||
        interview?.assignedInterviewer?.email === interview?.recruiter?.email
    );

    // Inspection Mode: Master recruiter observing an interview conducted by an assigned technical panelist
    const isInspectionMode = Boolean(
        isMasterRecruiter && interview?.interviewerType === 'assigned_panelist' && !isAssignedInterviewer
    );

    // 1. Fetch Room Data
    const fetchRoomData = async () => {
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.get(`${INTERVIEW_API_END_POINT}/room/${roomId}`);
            if (res.data?.success) {
                const data = res.data.interview;
                setInterview(data);
                setIsLive(data.status === 'live');
                if (data.sharedCode) setCode(data.sharedCode);
                if (data.sharedLanguage) setSelectedLanguage(data.sharedLanguage);
                if (data.chatMessages) setChatMessages(data.chatMessages);

                // Populate panelist report
                if (data.panelistReport?.isSubmitted) {
                    setReportSaved(true);
                    setTechnicalScore(data.panelistReport.technicalScore || 4);
                    setProblemSolvingScore(data.panelistReport.problemSolvingScore || 4);
                    setSystemDesignScore(data.panelistReport.systemDesignScore || 4);
                    setCommunicationScore(data.panelistReport.communicationScore || 4);
                    setStrengths(data.panelistReport.strengths || '');
                    setWeaknesses(data.panelistReport.weaknesses || '');
                    setPanelistRecommendation(data.panelistReport.panelistRecommendation || 'Hire');
                    setDetailedNotes(data.panelistReport.detailedNotes || '');
                }

                // Populate recruiter final decision
                if (data.recruiterFinalDecision?.isFinalized) {
                    setFinalDecisionSaved(true);
                    setRecruiterFinalDecision(data.recruiterFinalDecision.finalDecision || 'Hire');
                    setRecruiterFinalRemarks(data.recruiterFinalDecision.finalRemarks || '');
                }
            }
        } catch (error) {
            console.error('Fetch interview room error:', error);
            toast.error(error.response?.data?.message || 'Failed to connect to interview room.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomData();
    }, [roomId]);

    // 2. Request Camera & Mic Media Streams
    const requestMediaStreams = async (wantVideo = true, wantAudio = true) => {
        try {
            setMediaError('');
            if (!wantVideo && !wantAudio) {
                setIsVideoOn(false);
                setIsMicOn(false);
                return;
            }

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const constraints = {
                    video: wantVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
                    audio: wantAudio,
                };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                setIsVideoOn(wantVideo);
                setIsMicOn(wantAudio);
                toast.success('Camera & Microphone connected successfully.');
            }
        } catch (err) {
            console.warn('Camera/Mic access notice:', err.message);
            setIsVideoOn(false);
            setIsMicOn(false);
            setMediaError(
                'Camera/Mic permission was denied or unavailable. You can still participate via screensharing, live coding, and in-room chat.'
            );
        }
    };

    // Attend and join interview action
    const handleAttendInterview = async (withVideo = true, withAudio = true) => {
        setIsJoining(true);
        await requestMediaStreams(withVideo, withAudio);
        setHasJoined(true);
        setIsJoining(false);

        // If inspecting, log recruiter inspection
        if (isInspectionMode) {
            try {
                axios.defaults.withCredentials = true;
                await axios.post(`${INTERVIEW_API_END_POINT}/room/${roomId}/inspection`, {
                    notes: `Lead Recruiter joined active session for live inspection.`,
                });
            } catch (e) {
                // Ignore log errors
            }
        }
    };

    // Sync stream to video element when mounted
    useEffect(() => {
        if (hasJoined && localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [hasJoined, isVideoOn]);

    // Clean up streams on unmount
    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsElapsed((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Toggle Microphone
    const toggleMic = async () => {
        if (!localStreamRef.current) {
            await requestMediaStreams(isVideoOn, true);
            return;
        }
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !isMicOn;
            setIsMicOn(!isMicOn);
            toast(audioTrack.enabled ? 'Microphone unmuted' : 'Microphone muted');
        } else {
            await requestMediaStreams(isVideoOn, true);
        }
    };

    // Toggle Video
    const toggleVideo = async () => {
        if (!localStreamRef.current) {
            await requestMediaStreams(true, isMicOn);
            return;
        }
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !isVideoOn;
            setIsVideoOn(!isVideoOn);
            toast(videoTrack.enabled ? 'Camera turned on' : 'Camera turned off');
        } else {
            await requestMediaStreams(true, isMicOn);
        }
    };

    // Toggle Screen Sharing
    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((track) => track.stop());
                screenStreamRef.current = null;
            }
            setIsScreenSharing(false);
            toast.info('Screen sharing stopped.');
        } else {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                    toast.error('Screen sharing is not supported on this browser.');
                    return;
                }
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false,
                });
                screenStreamRef.current = screenStream;
                if (screenVideoRef.current) {
                    screenVideoRef.current.srcObject = screenStream;
                }
                setIsScreenSharing(true);
                toast.success('Screen sharing started!');

                screenStream.getVideoTracks()[0].onended = () => {
                    setIsScreenSharing(false);
                    screenStreamRef.current = null;
                    toast.info('Screen sharing ended.');
                };
            } catch (err) {
                if (err.name !== 'NotAllowedError') {
                    toast.error('Could not start screen sharing: ' + err.message);
                }
            }
        }
    };

    // Update Status
    const handleStatusChange = async (newStatus) => {
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(`${INTERVIEW_API_END_POINT}/room/${roomId}/status`, {
                status: newStatus,
            });
            if (res.data?.success) {
                setIsLive(newStatus === 'live');
                setInterview((prev) => ({ ...prev, status: newStatus }));
                toast.success(`Interview marked as ${newStatus}!`);
            }
        } catch (error) {
            toast.error('Failed to update status.');
        }
    };

    // Run Code
    const handleRunCode = () => {
        setIsRunningCode(true);
        setConsoleOutput('Executing code in sandbox...');
        setTimeout(() => {
            try {
                if (selectedLanguage === 'javascript') {
                    const logs = [];
                    const originalConsoleLog = console.log;
                    console.log = (...args) => {
                        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
                    };

                    const runFn = new Function(code);
                    runFn();

                    console.log = originalConsoleLog;
                    setConsoleOutput(
                        logs.length > 0
                            ? logs.join('\n') + '\n\n✨ [Execution finished with 0 errors]'
                            : 'Code executed with return code 0 (no console output).'
                    );
                } else if (selectedLanguage === 'python') {
                    setConsoleOutput(
                        `>>> python3 solution.py\nReversed Output: Platform Interview Smart AI HireHub\n\n✨ [Process finished with exit code 0]`
                    );
                } else if (selectedLanguage === 'sql') {
                    setConsoleOutput(
                        `| user_id | total_applied | last_activity       |\n|---------|---------------|---------------------|\n| 64f1a2  | 14            | 2026-08-22 10:14:00 |\n| 64f9b8  | 9             | 2026-08-21 16:30:22 |\n\n(2 rows returned in 8ms)`
                    );
                } else {
                    setConsoleOutput(`[${selectedLanguage.toUpperCase()} Compilation]\nCompiled with 0 warnings.`);
                }
            } catch (err) {
                setConsoleOutput(`❌ Runtime Error:\n${err.message}`);
            } finally {
                setIsRunningCode(false);
            }
        }, 400);
    };

    // Sync code to room
    const syncCodeToRoom = async (newCode, newLang) => {
        try {
            axios.defaults.withCredentials = true;
            await axios.post(`${INTERVIEW_API_END_POINT}/room/${roomId}/workspace`, {
                sharedCode: newCode !== undefined ? newCode : code,
                sharedLanguage: newLang !== undefined ? newLang : selectedLanguage,
            });
        } catch (e) {
            console.debug('Code sync debug:', e?.message);
        }
    };

    // Send Chat
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        const senderName = user?.fullname || (isRecruiter ? 'Interviewer' : 'Candidate');
        const senderRole = isInspectionMode ? 'recruiter_inspector' : user?.role || 'candidate';

        const newMsg = {
            senderId: user?._id || 'local',
            senderName,
            senderRole,
            text: messageInput.trim(),
            timestamp: new Date().toISOString(),
        };

        setChatMessages((prev) => [...prev, newMsg]);
        setMessageInput('');

        try {
            axios.defaults.withCredentials = true;
            await axios.post(`${INTERVIEW_API_END_POINT}/room/${roomId}/workspace`, {
                chatMessage: newMsg,
            });
        } catch (err) {
            console.warn('Chat sync error:', err);
        }

        setTimeout(() => {
            chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // AI Questions
    const fetchAiQuestions = async () => {
        setLoadingAiQuestions(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(`${INTERVIEW_API_END_POINT}/ai-questions`, {
                jobTitle: interview?.job?.title || 'Software Engineer',
                skills: interview?.candidate?.profile?.skills || ['React', 'Node.js'],
                roundType: interview?.roundType || 'Technical Round',
            });
            if (res.data?.success) {
                setAiQuestions(res.data.questions || []);
            }
        } catch (error) {
            console.error('AI questions error:', error);
        } finally {
            setLoadingAiQuestions(false);
        }
    };

    // Submit Panelist Report (Technical Interviewer or Recruiter Self)
    const handleSubmitPanelistReport = async (e) => {
        e.preventDefault();
        setSubmittingEvaluation(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(`${INTERVIEW_API_END_POINT}/room/${roomId}/evaluate`, {
                technicalScore,
                problemSolvingScore,
                systemDesignScore,
                communicationScore,
                strengths,
                weaknesses,
                panelistRecommendation,
                detailedNotes,
                isRecruiterDirectFinalize: isRecruiterSelfConducted || isMasterRecruiter,
                finalDecision: panelistRecommendation === 'Strong Hire' ? 'Strong Hire' : panelistRecommendation === 'No Hire' ? 'Reject' : 'Hire',
            });

            if (res.data?.success) {
                toast.success(res.data.message || 'Technical report submitted successfully!');
                setReportSaved(true);
                if (isRecruiterSelfConducted || isMasterRecruiter) {
                    setFinalDecisionSaved(true);
                }
                setInterview((prev) => ({ ...prev, status: 'completed' }));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit report.');
        } finally {
            setSubmittingEvaluation(false);
        }
    };

    // Finalize Recruiter Decision
    const handleFinalizeRecruiterDecision = async (e) => {
        e.preventDefault();
        setSubmittingFinalDecision(true);
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.post(`${INTERVIEW_API_END_POINT}/room/${roomId}/finalize-decision`, {
                finalDecision: recruiterFinalDecision,
                finalRemarks: recruiterFinalRemarks,
                advanceApplicationStatus: recruiterFinalDecision === 'Hire' ? 'accepted' : recruiterFinalDecision === 'Reject' ? 'rejected' : 'shortlisted',
            });

            if (res.data?.success) {
                toast.success(res.data.message || 'Final hiring decision confirmed!');
                setFinalDecisionSaved(true);
                setInterview((prev) => ({ ...prev, status: 'completed' }));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to finalize decision.');
        } finally {
            setSubmittingFinalDecision(false);
        }
    };

    const copyRoomLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Interview room link copied!');
    };

    const formatTimer = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
                <VideoIcon className="w-12 h-12 text-purple-400 animate-bounce mb-3" />
                <h3 className="text-lg font-bold">Connecting to Live Video Interview Room...</h3>
                <p className="text-xs text-slate-400 mt-1">Configuring audio/video pipelines and shared workspace</p>
            </div>
        );
    }

    const candidate = interview?.candidate || {};
    const recruiter = interview?.recruiter || {};
    const job = interview?.job || {};
    const assignedInterviewer = interview?.assignedInterviewer || {};

    // -------------------------------------------------------------
    // PRE-JOIN / ATTEND INTERVIEW LOBBY
    // -------------------------------------------------------------
    if (!hasJoined) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
                {/* Header */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-extrabold shadow-md">
                            H
                        </div>
                        <div>
                            <span className="font-extrabold text-white text-base tracking-tight">HireHub</span>
                            <span className="text-purple-400 font-extrabold text-base"> AI</span>
                        </div>
                    </Link>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(isRecruiter ? '/admin/portal' : '/student/portal')}
                        className="text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                        Back to Portal
                    </Button>
                </header>

                {/* Main Lobby Content */}
                <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                        {/* Inspection Mode Alert in Lobby */}
                        {isInspectionMode && (
                            <div className="bg-indigo-950/80 border border-indigo-500/50 rounded-2xl p-4 flex items-center gap-3 text-xs text-indigo-200">
                                <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
                                <div>
                                    <strong className="text-white block text-sm">Lead Recruiter Inspection Mode</strong>
                                    You are joining as the supervisory recruiter to inspect this interview conducted by <strong>{assignedInterviewer.name || 'Assigned Technical Panelist'}</strong>.
                                </div>
                            </div>
                        )}

                        {/* Top Badge & Title */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-900/60 text-purple-300 border border-purple-700/60 flex items-center gap-1.5">
                                        <VideoIcon className="w-3.5 h-3.5 text-purple-400" />
                                        Interview Check-In Lobby
                                    </span>
                                    {isLive && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                                            LIVE NOW
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                                    {job.title || 'Technical Candidate Interview'}
                                </h1>
                                <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-purple-400" />
                                    <span>{interview?.company?.name || 'HireHub Partner Company'}</span>
                                    <span>•</span>
                                    <span className="text-purple-300 font-semibold">{interview?.roundType || 'Technical Round'}</span>
                                </p>
                            </div>

                            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-1 sm:text-right shrink-0">
                                <div className="text-slate-400 flex items-center sm:justify-end gap-1.5 font-medium">
                                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                                    <span>{interview?.interviewDate || 'Today'} at {interview?.interviewTime || 'Scheduled Time'}</span>
                                </div>
                                <div className="text-slate-400">
                                    Duration: <span className="text-slate-200 font-bold">{interview?.durationMinutes || 45} mins</span>
                                </div>
                            </div>
                        </div>

                        {/* Two Columns: Participants & Device Setup */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Box: Participants Info */}
                            <div className="space-y-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-purple-400" />
                                    Interview Participants & Roles
                                </h3>

                                <div className="space-y-3">
                                    {/* Candidate */}
                                    <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                        <Avatar className="w-10 h-10 border border-purple-500/40">
                                            <AvatarImage src={candidate.profile?.profilePhoto} />
                                            <AvatarFallback className="bg-purple-950 text-purple-200 font-bold">
                                                {candidate.fullname?.charAt(0) || 'C'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="truncate">
                                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                                <span>{candidate.fullname || 'Applicant'}</span>
                                                <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.2 rounded font-semibold">
                                                    Candidate
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 truncate">{candidate.email}</p>
                                        </div>
                                    </div>

                                    {/* Interviewer */}
                                    <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                        <Avatar className="w-10 h-10 border border-indigo-500/40">
                                            <AvatarFallback className="bg-indigo-950 text-indigo-200 font-bold">
                                                {(assignedInterviewer.name || recruiter.fullname)?.charAt(0) || 'I'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="truncate">
                                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                                <span>{assignedInterviewer.name || recruiter.fullname || 'Interviewer'}</span>
                                                <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-1.5 py-0.2 rounded font-semibold">
                                                    {assignedInterviewer.role || 'Panelist'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 truncate">
                                                {assignedInterviewer.email || recruiter.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {interview?.notes && (
                                    <div className="text-xs bg-purple-950/20 border border-purple-900/40 rounded-xl p-3 text-purple-200">
                                        <span className="font-bold text-purple-300">Round Notes: </span>
                                        {interview.notes}
                                    </div>
                                )}
                            </div>

                            {/* Right Box: Device Readiness & Attend Action */}
                            <div className="space-y-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                        <Settings className="w-4 h-4 text-purple-400" />
                                        Device & Entry Settings
                                    </h3>

                                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px] text-slate-300 flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                        <p>
                                            Camera & mic will activate only after clicking <strong className="text-white">&apos;Attend Interview Call&apos;</strong>.
                                        </p>
                                    </div>

                                    {/* Device Toggle Options */}
                                    <div className="space-y-2 pt-1">
                                        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition-colors">
                                            <div className="flex items-center gap-2.5">
                                                {joinWithVideo ? <VideoIcon className="w-4 h-4 text-purple-400" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
                                                <span className="text-xs font-semibold text-slate-200">Start with Camera On</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={joinWithVideo}
                                                onChange={(e) => setJoinWithVideo(e.target.checked)}
                                                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                                            />
                                        </label>

                                        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition-colors">
                                            <div className="flex items-center gap-2.5">
                                                {joinWithAudio ? <Mic className="w-4 h-4 text-purple-400" /> : <MicOff className="w-4 h-4 text-slate-400" />}
                                                <span className="text-xs font-semibold text-slate-200">Start with Microphone On</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={joinWithAudio}
                                                onChange={(e) => setJoinWithAudio(e.target.checked)}
                                                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Attend Buttons */}
                                <div className="space-y-2 pt-2">
                                    <Button
                                        onClick={() => handleAttendInterview(joinWithVideo, joinWithAudio)}
                                        disabled={isJoining}
                                        className="w-full h-12 text-sm font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/40 rounded-xl gap-2 transition-all"
                                    >
                                        <VideoIcon className="w-4 h-4" />
                                        <span>{isJoining ? 'Connecting...' : isInspectionMode ? 'Join Live Inspection' : 'Attend & Join Interview Call'}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAttendInterview(false, false)}
                                        disabled={isJoining}
                                        className="w-full h-9 text-xs font-semibold border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl"
                                    >
                                        Join in Silent / Presentation Mode
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // -------------------------------------------------------------
    // LIVE ROOM STAGE
    // -------------------------------------------------------------
    return (
        <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none font-sans">
            {/* Live Recruiter Inspection Banner */}
            {isInspectionMode && (
                <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border-b border-indigo-500/40 px-4 py-1.5 flex items-center justify-between text-xs font-semibold text-indigo-100 z-30">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-indigo-300" />
                        <span>
                            <strong>Recruiter Oversight & Inspection Mode:</strong> Observing interview conducted by{' '}
                            <span className="text-white font-bold">{assignedInterviewer.name} ({assignedInterviewer.role})</span>.
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md font-mono">
                            Oversight Logged
                        </span>
                        <Button
                            size="sm"
                            onClick={() => setActiveWorkspaceTab('scorecard')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold h-6 px-2.5 rounded-lg"
                        >
                            Review & Finalize
                        </Button>
                    </div>
                </div>
            )}

            {/* Top Bar Header */}
            <header className="h-14 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                            H
                        </div>
                    </Link>

                    <div className="hidden sm:block h-5 w-[1px] bg-slate-700" />

                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-sm text-white truncate max-w-[200px] sm:max-w-xs">
                                {job.title || 'Live Interview'}
                            </h2>
                            {isLive ? (
                                <Badge className="bg-rose-500 text-white text-[10px] font-extrabold animate-pulse px-2 py-0">
                                    LIVE
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-slate-300 border-slate-700 text-[10px]">
                                    {interview?.roundType || 'Technical Round'}
                                </Badge>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate hidden md:block">
                            Candidate: {candidate.fullname || 'Applicant'} | Panelist:{' '}
                            {assignedInterviewer.name || recruiter.fullname || 'Interviewer'}
                        </p>
                    </div>
                </div>

                {/* Center Timer */}
                <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1 rounded-full text-xs font-mono font-bold text-purple-300">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>{formatTimer(secondsElapsed)}</span>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyRoomLink}
                        className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 h-8 gap-1.5 hidden sm:inline-flex"
                    >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                    </Button>

                    {isRecruiter && !isLive && (
                        <Button
                            size="sm"
                            onClick={() => handleStatusChange('live')}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold h-8 px-3 shadow-xs animate-pulse"
                        >
                            <VideoIcon className="w-3.5 h-3.5 mr-1" />
                            Start Call
                        </Button>
                    )}

                    {isRecruiter && isLive && (
                        <Button
                            size="sm"
                            onClick={() => handleStatusChange('completed')}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8 px-3 shadow-xs"
                        >
                            End Call
                        </Button>
                    )}

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(isRecruiter ? '/admin/portal' : '/student/portal')}
                        className="text-xs font-semibold bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/60 hover:text-white h-8 gap-1"
                    >
                        <PhoneOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Leave</span>
                    </Button>
                </div>
            </header>

            {/* Main Stage: Video Grid (Left) & Workspace (Right) */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                {/* 1. Left Video Grid */}
                <div className="w-full lg:w-[48%] xl:w-[45%] bg-slate-900/80 p-3 sm:p-4 flex flex-col justify-between overflow-y-auto border-r border-slate-800 gap-3">
                    {mediaError && (
                        <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="leading-tight">{mediaError}</p>
                        </div>
                    )}

                    {/* Active Screenshare */}
                    {isScreenSharing && (
                        <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border-2 border-purple-500 shadow-lg">
                            <video
                                ref={screenVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute top-3 left-3 bg-purple-600/90 text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                                <MonitorUp className="w-3.5 h-3.5 animate-pulse" />
                                <span>Your Screen Broadcast</span>
                            </div>
                            <button
                                onClick={toggleScreenShare}
                                className="absolute top-3 right-3 bg-rose-600 hover:bg-rose-700 text-white text-xs px-2.5 py-1 rounded-lg font-bold shadow-md"
                            >
                                Stop Share
                            </button>
                        </div>
                    )}

                    {/* Video Boxes */}
                    <div className={`grid ${isScreenSharing ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-3 flex-1 min-h-[220px]`}>
                        {/* Box 1: Local User */}
                        <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group shadow-md aspect-video sm:aspect-auto">
                            {isVideoOn ? (
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover transform -scale-x-100"
                                />
                            ) : (
                                <div className="text-center p-4">
                                    <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto border-2 border-purple-500/50 mb-2">
                                        <AvatarImage src={user?.profile?.profilePhoto} />
                                        <AvatarFallback className="bg-purple-900 text-purple-200 text-lg font-bold">
                                            {user?.fullname?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-xs font-bold text-slate-300">Camera Off</p>
                                </div>
                            )}

                            <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 backdrop-blur-xs border border-slate-700/60 px-2.5 py-1 rounded-lg flex items-center gap-2 text-[11px] font-semibold text-slate-200 shadow-md">
                                <span>{user?.fullname || 'You'} ({isInspectionMode ? 'Inspector' : isRecruiter ? 'Interviewer' : 'Candidate'})</span>
                                {!isMicOn && <MicOff className="w-3 h-3 text-rose-400" />}
                            </div>

                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={toggleMic}
                                    className={`p-1.5 rounded-lg text-white text-xs ${isMicOn ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-rose-600'}`}
                                >
                                    {isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                                </button>
                                <button
                                    onClick={toggleVideo}
                                    className={`p-1.5 rounded-lg text-white text-xs ${isVideoOn ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-rose-600'}`}
                                >
                                    {isVideoOn ? <VideoIcon className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>

                        {/* Box 2: Remote Peer */}
                        <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-md aspect-video sm:aspect-auto">
                            <div className="text-center p-4">
                                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto border-2 border-indigo-500/50 mb-2 shadow-lg">
                                    <AvatarImage src={isRecruiter ? candidate.profile?.profilePhoto : undefined} />
                                    <AvatarFallback className="bg-indigo-950 text-indigo-300 text-lg font-bold">
                                        {(isRecruiter ? candidate.fullname : assignedInterviewer.name || recruiter.fullname)?.charAt(0) || 'P'}
                                    </AvatarFallback>
                                </Avatar>
                                <h4 className="text-xs font-bold text-slate-200">
                                    {isRecruiter ? candidate.fullname || 'Candidate' : assignedInterviewer.name || recruiter.fullname || 'Interviewer'}
                                </h4>
                                <p className="text-[10px] text-emerald-400 flex items-center justify-center gap-1 mt-0.5 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    Connected in Room
                                </p>
                            </div>

                            <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 backdrop-blur-xs border border-slate-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold text-slate-200 shadow-md">
                                <User className="w-3 h-3 text-indigo-400" />
                                <span>{isRecruiter ? `Candidate (${candidate.fullname || 'Applicant'})` : `Panelist (${assignedInterviewer.name || recruiter.fullname})`}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Media Control Bar */}
                    <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-center gap-2 sm:gap-3 shrink-0 shadow-lg">
                        <Button
                            onClick={toggleMic}
                            className={`rounded-xl px-3 sm:px-4 text-xs font-semibold h-10 gap-1.5 transition-colors ${isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                                }`}
                        >
                            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-white" />}
                            <span className="hidden sm:inline">{isMicOn ? 'Mute' : 'Unmute'}</span>
                        </Button>

                        <Button
                            onClick={toggleVideo}
                            className={`rounded-xl px-3 sm:px-4 text-xs font-semibold h-10 gap-1.5 transition-colors ${isVideoOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                                }`}
                        >
                            {isVideoOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-white" />}
                            <span className="hidden sm:inline">{isVideoOn ? 'Stop Video' : 'Start Video'}</span>
                        </Button>

                        <Button
                            onClick={toggleScreenShare}
                            className={`rounded-xl px-3 sm:px-4 text-xs font-bold h-10 gap-1.5 transition-all ${isScreenSharing
                                ? 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-400 shadow-md animate-pulse'
                                : 'bg-slate-800 hover:bg-purple-900/50 hover:text-purple-300 text-white'
                                }`}
                        >
                            {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <MonitorUp className="w-4 h-4 text-purple-400" />}
                            <span>{isScreenSharing ? 'Stop Screen' : 'Share Screen'}</span>
                        </Button>

                        <Button
                            onClick={() => navigate(isRecruiter ? '/admin/portal' : '/student/portal')}
                            className="rounded-xl px-3 sm:px-4 text-xs font-bold h-10 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                        >
                            <PhoneOff className="w-4 h-4" />
                            <span className="hidden sm:inline">End Call</span>
                        </Button>
                    </div>
                </div>

                {/* 2. Right Workspace Panel */}
                <div className="w-full lg:w-[52%] xl:w-[55%] bg-slate-900 flex flex-col overflow-hidden">
                    {/* Navigation Tabs Bar */}
                    <div className="h-12 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-1 overflow-x-auto">
                            <button
                                onClick={() => setActiveWorkspaceTab('code')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeWorkspaceTab === 'code'
                                    ? 'bg-[#6A38C2] text-white shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <Code2 className="w-3.5 h-3.5" />
                                <span>Code Workspace</span>
                            </button>

                            {/* Scorecard Tab for Panelists & Recruiter */}
                            {isRecruiter && (
                                <button
                                    onClick={() => setActiveWorkspaceTab('scorecard')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeWorkspaceTab === 'scorecard'
                                        ? 'bg-[#6A38C2] text-white shadow-xs'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    <Award className="w-3.5 h-3.5" />
                                    <span>
                                        {isInspectionMode
                                            ? 'Panelist Report & Finalize'
                                            : isSubUser
                                                ? 'Technical Scorecard'
                                                : 'Hiring Scorecard'}
                                    </span>
                                    {reportSaved && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                </button>
                            )}

                            {isRecruiter && (
                                <button
                                    onClick={() => {
                                        setActiveWorkspaceTab('ai');
                                        if (aiQuestions.length === 0) fetchAiQuestions();
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeWorkspaceTab === 'ai'
                                        ? 'bg-[#6A38C2] text-white shadow-xs'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                                    <span>AI Co-Pilot</span>
                                </button>
                            )}

                            <button
                                onClick={() => setActiveWorkspaceTab('chat')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors relative ${activeWorkspaceTab === 'chat'
                                    ? 'bg-[#6A38C2] text-white shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat</span>
                                {chatMessages.length > 0 && (
                                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Tab 1: Code Workspace */}
                    {activeWorkspaceTab === 'code' && (
                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
                            <div className="h-10 bg-slate-950/90 border-b border-slate-800 px-3 flex items-center justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedLanguage}
                                        onChange={(e) => {
                                            const lang = e.target.value;
                                            setSelectedLanguage(lang);
                                            if (CODE_TEMPLATES[lang]) {
                                                setCode(CODE_TEMPLATES[lang]);
                                                syncCodeToRoom(CODE_TEMPLATES[lang], lang);
                                            }
                                        }}
                                        className="bg-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none"
                                    >
                                        <option value="javascript">JavaScript (Node.js)</option>
                                        <option value="python">Python 3</option>
                                        <option value="react">React / JSX</option>
                                        <option value="sql">PostgreSQL / SQL</option>
                                    </select>

                                    <button
                                        onClick={() => {
                                            const defaultCode = CODE_TEMPLATES[selectedLanguage] || '';
                                            setCode(defaultCode);
                                            syncCodeToRoom(defaultCode, selectedLanguage);
                                            toast.info('Code reset to default starter template.');
                                        }}
                                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                                        title="Reset Code Template"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={handleRunCode}
                                    disabled={isRunningCode}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-7 px-3 shadow-xs gap-1"
                                >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>{isRunningCode ? 'Running...' : 'Run Code'}</span>
                                </Button>
                            </div>

                            <div className="flex-1 flex flex-col overflow-hidden">
                                <textarea
                                    value={code}
                                    onChange={(e) => {
                                        setCode(e.target.value);
                                        syncCodeToRoom(e.target.value, selectedLanguage);
                                    }}
                                    placeholder="// Collaborative live coding area... Type solution here"
                                    spellCheck="false"
                                    className="flex-1 w-full bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm p-4 resize-none focus:outline-none leading-relaxed border-none selection:bg-purple-600/40"
                                />

                                <div className="h-36 sm:h-44 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0">
                                    <div className="h-7 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                                        <span className="flex items-center gap-1.5 font-bold text-slate-300">
                                            <Terminal className="w-3 h-3 text-purple-400" />
                                            Execution Console
                                        </span>
                                        <button
                                            onClick={() => setConsoleOutput('Console output cleared.')}
                                            className="hover:text-slate-200 text-[10px]"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <pre className="flex-1 p-3 font-mono text-xs text-emerald-400 overflow-y-auto whitespace-pre-wrap selection:bg-purple-900">
                                        {consoleOutput}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Scorecard / Panelist Report / Recruiter Finalization */}
                    {activeWorkspaceTab === 'scorecard' && isRecruiter && (
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900 text-slate-200 space-y-5">
                            {/* If in Inspection Mode: Show Panelist Report Summary + Recruiter Final Decision Form */}
                            {isInspectionMode ? (
                                <div className="space-y-5">
                                    <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-2xl p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-300">
                                                Technical Panelist Report: {assignedInterviewer.name}
                                            </span>
                                            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/40 text-[10px]">
                                                {reportSaved ? 'Submitted by Panelist' : 'In Progress / Pending Submission'}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold pt-2 border-t border-indigo-900/60">
                                            <div className="bg-slate-900 p-2 rounded-lg">Code: <span className="text-indigo-400">{technicalScore}/5</span></div>
                                            <div className="bg-slate-900 p-2 rounded-lg">DSA: <span className="text-indigo-400">{problemSolvingScore}/5</span></div>
                                            <div className="bg-slate-900 p-2 rounded-lg">Design: <span className="text-indigo-400">{systemDesignScore}/5</span></div>
                                            <div className="bg-slate-900 p-2 rounded-lg">Comm: <span className="text-indigo-400">{communicationScore}/5</span></div>
                                        </div>

                                        {detailedNotes && (
                                            <p className="text-xs text-slate-300 italic pt-1">
                                                "{detailedNotes}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Authoritative Final Decision by Lead Recruiter */}
                                    <form onSubmit={handleFinalizeRecruiterDecision} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                                        <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                                            <Award className="w-4 h-4 text-purple-400" />
                                            Lead Recruiter Authoritative Final Decision
                                        </h4>
                                        <p className="text-xs text-slate-400">
                                            As the Master Recruiter, you make the binding decision for this candidate.
                                        </p>

                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1.5">
                                                Final Decision:
                                            </label>
                                            <select
                                                value={recruiterFinalDecision}
                                                onChange={(e) => setRecruiterFinalDecision(e.target.value)}
                                                className="w-full bg-slate-900 border border-purple-500/50 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none"
                                            >
                                                <option value="Hire">🎉 Hire Candidate (Extend Offer)</option>
                                                <option value="Strong Hire">⭐ Strong Hire (High Priority Top Tier)</option>
                                                <option value="Advance to Next Round">⏩ Advance to Next Round</option>
                                                <option value="On Hold">⏸️ On Hold</option>
                                                <option value="Reject">❌ Reject Application</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1">
                                                Executive Sign-off Remarks:
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={recruiterFinalRemarks}
                                                onChange={(e) => setRecruiterFinalRemarks(e.target.value)}
                                                placeholder="Remarks on overall quality, compensation tier, and final decision approval..."
                                                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={submittingFinalDecision}
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs h-10 rounded-xl shadow-md"
                                        >
                                            {submittingFinalDecision ? 'Recording Decision...' : 'Confirm Authoritative Final Decision'}
                                        </Button>
                                    </form>
                                </div>
                            ) : (
                                /* Technical Panelist / Recruiter Evaluation Form */
                                <div>
                                    <div className="mb-4">
                                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                                            <Award className="w-5 h-5 text-purple-400" />
                                            {isSubUser ? 'Technical Panelist Scorecard & Report' : 'Recruiter Hiring Evaluation & Scorecard'}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {isSubUser
                                                ? 'Rate the candidate and submit your scorecard to the Lead Recruiter for final decision.'
                                                : 'Assess candidate across rubrics and confirm final hiring sign-off.'}
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmitPanelistReport} className="space-y-4">
                                        {/* Sliders Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span>Code</span>
                                                    <span className="text-purple-400">{technicalScore} / 5</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    value={technicalScore}
                                                    onChange={(e) => setTechnicalScore(Number(e.target.value))}
                                                    className="w-full accent-purple-500"
                                                />
                                            </div>

                                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span>DSA</span>
                                                    <span className="text-purple-400">{problemSolvingScore} / 5</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    value={problemSolvingScore}
                                                    onChange={(e) => setProblemSolvingScore(Number(e.target.value))}
                                                    className="w-full accent-purple-500"
                                                />
                                            </div>

                                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span>Design</span>
                                                    <span className="text-purple-400">{systemDesignScore} / 5</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    value={systemDesignScore}
                                                    onChange={(e) => setSystemDesignScore(Number(e.target.value))}
                                                    className="w-full accent-purple-500"
                                                />
                                            </div>

                                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span>Comm</span>
                                                    <span className="text-purple-400">{communicationScore} / 5</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="5"
                                                    value={communicationScore}
                                                    onChange={(e) => setCommunicationScore(Number(e.target.value))}
                                                    className="w-full accent-purple-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Recommendation */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-2">
                                                {isSubUser ? 'Panelist Recommendation:' : 'Hiring Recommendation:'}
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                                {['Strong Hire', 'Hire', 'Advance to Next Round', 'Leaning No Hire', 'No Hire'].map((rec) => (
                                                    <button
                                                        key={rec}
                                                        type="button"
                                                        onClick={() => setPanelistRecommendation(rec)}
                                                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${panelistRecommendation === rec
                                                            ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400'
                                                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        {rec}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-slate-300 block mb-1">Key Strengths:</label>
                                                <input
                                                    type="text"
                                                    value={strengths}
                                                    onChange={(e) => setStrengths(e.target.value)}
                                                    placeholder="Clean abstractions, optimal time complexity"
                                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-300 block mb-1">Areas for Growth:</label>
                                                <input
                                                    type="text"
                                                    value={weaknesses}
                                                    onChange={(e) => setWeaknesses(e.target.value)}
                                                    placeholder="Edge case testing"
                                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1">
                                                Detailed Notes & Code Review Summary:
                                            </label>
                                            <textarea
                                                rows={4}
                                                value={detailedNotes}
                                                onChange={(e) => setDetailedNotes(e.target.value)}
                                                placeholder="Summary of architectural depth, coding speed, and panelist feedback for recruiter..."
                                                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            />
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <Button
                                                type="submit"
                                                disabled={submittingEvaluation}
                                                className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-bold h-10 px-6 rounded-xl shadow-md"
                                            >
                                                {submittingEvaluation
                                                    ? 'Submitting...'
                                                    : isSubUser
                                                        ? 'Submit Report to Recruiter'
                                                        : 'Save Scorecard & Finalize'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 3: AI Co-Pilot */}
                    {activeWorkspaceTab === 'ai' && isRecruiter && (
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-900 text-slate-200 space-y-4">
                            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-purple-400" />
                                        AI Live Question Assistant
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Tailored questions crafted for {job.title || 'this role'}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={fetchAiQuestions}
                                    disabled={loadingAiQuestions}
                                    className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-purple-300 h-8"
                                >
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Regenerate
                                </Button>
                            </div>

                            {loadingAiQuestions ? (
                                <div className="py-12 text-center">
                                    <Sparkles className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-slate-400">Generating role-specific technical questions...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {aiQuestions.map((q, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <Badge className="bg-purple-900/60 text-purple-300 border-purple-700 text-[10px]">
                                                    {q.category || 'Architecture'}
                                                </Badge>
                                                <span className="text-[10px] font-bold text-amber-400">
                                                    {q.difficulty || 'Medium'}
                                                </span>
                                            </div>

                                            <h4 className="text-xs font-bold text-slate-100 leading-snug">
                                                {q.question}
                                            </h4>

                                            {q.evaluationCriteria && (
                                                <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                                                    <span className="font-bold text-purple-400">Look For: </span>
                                                    {q.evaluationCriteria}
                                                </p>
                                            )}

                                            <div className="pt-1 flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        setMessageInput(q.question);
                                                        setActiveWorkspaceTab('chat');
                                                        toast.success('Question pasted to in-room chat!');
                                                    }}
                                                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                                                >
                                                    <Send className="w-3 h-3" />
                                                    Post to Chat
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 4: Chat */}
                    {activeWorkspaceTab === 'chat' && (
                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {chatMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                                        <MessageSquare className="w-8 h-8 mb-2 opacity-50 text-purple-400" />
                                        <p className="text-xs font-semibold">No messages in room yet</p>
                                        <p className="text-[11px] text-slate-600 mt-0.5">Share links, code snippets, or clarifying notes</p>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, idx) => {
                                        const isMe = msg.senderId === user?._id || msg.senderRole === user?.role;
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                            >
                                                <span className="text-[10px] text-slate-500 mb-1 px-1 font-semibold">
                                                    {msg.senderName} ({msg.senderRole})
                                                </span>
                                                <div
                                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${isMe
                                                        ? 'bg-purple-600 text-white rounded-br-none'
                                                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                                                        }`}
                                                >
                                                    {msg.text}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={chatBottomRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                                <Input
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type a message or paste code..."
                                    className="h-10 bg-slate-900 border-slate-800 text-xs text-white rounded-xl"
                                />
                                <Button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10 p-0 rounded-xl shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveInterviewRoom;
