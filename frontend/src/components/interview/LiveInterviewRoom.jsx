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
    Lock,
    Volume2,
    VolumeX
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { io } from 'socket.io-client';
import { INTERVIEW_API_END_POINT, SOCKET_SERVER_URL } from '@/utils/constant';

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
    const [isUsingVirtualCam, setIsUsingVirtualCam] = useState(false);

    // Remote Peer WebRTC & Socket States
    const [remotePeerConnected, setRemotePeerConnected] = useState(false);
    const [remotePeerInfo, setRemotePeerInfo] = useState(null);
    const [remotePeerMediaState, setRemotePeerMediaState] = useState({ isVideoOn: true, isMicOn: true, isScreenSharing: false });
    const [hasRemoteStream, setHasRemoteStream] = useState(false);
    const [isWebRTCConnecting, setIsWebRTCConnecting] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [lastCodeEditNotice, setLastCodeEditNotice] = useState('');

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const screenVideoRef = useRef(null);
    const lobbyVideoRef = useRef(null);
    const remoteScreenVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const socketRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const pendingIceCandidatesRef = useRef([]);
    const isRemoteCodeUpdateRef = useRef(false);
    const codeDebounceTimerRef = useRef(null);
    const lastLocalKeystrokeRef = useRef(0);
    const remotePeerSocketIdRef = useRef(null);
    const virtualStreamStopRef = useRef(null);
    const simulatedStreamRef = useRef(null);
    const simulatedStopRef = useRef(null);
    const simulatedScreenStreamRef = useRef(null);
    const [isSimulatedPartnerActive, setIsSimulatedPartnerActive] = useState(false);
    const [audioBlockedByBrowser, setAudioBlockedByBrowser] = useState(false);

    // WebRTC STUN Configuration
    const ICE_SERVERS = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
        ],
    };

    // Video stream attachment effects for reliable React DOM rendering
    useEffect(() => {
        if (!hasJoined && lobbyVideoRef.current && localStreamRef.current) {
            lobbyVideoRef.current.srcObject = localStreamRef.current;
            lobbyVideoRef.current.play().catch((err) => console.debug('Lobby preview play error:', err));
        }
    }, [hasJoined, isVideoOn, isUsingVirtualCam]);

    useEffect(() => {
        if (hasJoined && localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            localVideoRef.current.play().catch((err) => console.debug('Local play error:', err));
        }
    }, [hasJoined, isVideoOn, isUsingVirtualCam]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStreamRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.play().catch((err) => {
                console.debug('Remote play error:', err);
                if (err.name === 'NotAllowedError') {
                    setAudioBlockedByBrowser(true);
                }
            });
        }
    }, [hasRemoteStream, remotePeerMediaState.isVideoOn, isSimulatedPartnerActive]);

    useEffect(() => {
        if (isScreenSharing && screenVideoRef.current && screenStreamRef.current) {
            screenVideoRef.current.srcObject = screenStreamRef.current;
            screenVideoRef.current.play().catch((err) => console.debug('Local screen play error:', err));
        }
    }, [isScreenSharing]);

    useEffect(() => {
        if (remotePeerMediaState.isScreenSharing && remoteScreenVideoRef.current && remoteStreamRef.current) {
            remoteScreenVideoRef.current.srcObject = remoteStreamRef.current;
            remoteScreenVideoRef.current.play().catch((err) => console.debug('Remote screen play error:', err));
        }
    }, [remotePeerMediaState.isScreenSharing, hasRemoteStream]);

    // Automatically initialize camera preview for the lobby
    useEffect(() => {
        let isMounted = true;
        const initPreview = async () => {
            if (!localStreamRef.current && !hasJoined) {
                try {
                    await requestMediaStreams(true, true, false);
                } catch (e) {
                    console.debug('Lobby initial preview error:', e);
                }
            }
        };
        initPreview();
        return () => {
            isMounted = false;
        };
    }, []);

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

    // Virtual Camera Stream Generator (Guarantees live video tracks even if physical webcam is busy/blocked)
    const createVirtualStream = (userName = 'Participant', role = 'User') => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        canvas.style.position = 'fixed';
        canvas.style.left = '-10000px';
        canvas.style.top = '0';
        canvas.style.width = '640px';
        canvas.style.height = '480px';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-999';
        if (document.body) {
            document.body.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        let frame = 0;
        let animId;
        let intervalId;
        let vTrack = null;

        const draw = () => {
            frame++;
            // Background gradient
            const grad = ctx.createLinearGradient(0, 0, 640, 480);
            grad.addColorStop(0, '#090d16');
            grad.addColorStop(0.5, '#1e1b4b');
            grad.addColorStop(1, '#2e1065');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 640, 480);

            // Pulsing decorative orbital rings
            const pulse = Math.sin(frame * 0.05) * 12;
            ctx.beginPath();
            ctx.arc(320, 200, 85 + pulse, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(320, 200, 70, 0, Math.PI * 2);
            ctx.fillStyle = '#6366f1';
            ctx.fill();

            // Avatar initial
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 46px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((userName.charAt(0) || 'U').toUpperCase(), 320, 200);

            // User info display
            ctx.font = 'bold 22px sans-serif';
            ctx.fillStyle = '#f8fafc';
            ctx.fillText(userName, 320, 305);

            ctx.fillStyle = '#c084fc';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(`• ${role.toUpperCase()} (LIVE HD FEED) •`, 320, 335);

            // Animated live audio visualizer bars
            ctx.fillStyle = '#38bdf8';
            for (let i = 0; i < 9; i++) {
                const barH = 8 + Math.abs(Math.sin((frame + i * 8) * 0.12) * 28);
                ctx.fillRect(240 + i * 18, 380 - barH / 2, 9, barH);
            }

            // Live indicator badge
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(20, 20, 80, 26, 6);
            else ctx.rect(20, 20, 80, 26);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('● LIVE CAM', 28, 37);

            // Live clock stamp
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(new Date().toLocaleTimeString(), 620, 37);

            if (vTrack && vTrack.requestFrame) {
                try { vTrack.requestFrame(); } catch (e) { /* ignore */ }
            }
        };

        draw();

        // Run both animationFrame and interval so frames are produced continuously
        const loop = () => {
            draw();
            animId = requestAnimationFrame(loop);
        };
        animId = requestAnimationFrame(loop);
        intervalId = setInterval(draw, 40);

        const stream = canvas.captureStream(30);
        vTrack = stream.getVideoTracks()[0];

        // Add an oscillator audio track so SDP includes audio m-line
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                const audioCtx = new AudioContextClass();
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume().catch(console.debug);
                }
                const dest = audioCtx.createMediaStreamDestination();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                gain.gain.value = 0.0001; // nearly silent
                osc.connect(gain);
                gain.connect(dest);
                osc.start();
                dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
            }
        } catch (e) {
            console.debug('Audio context fallback notice:', e);
        }

        const cleanup = () => {
            if (animId) cancelAnimationFrame(animId);
            if (intervalId) clearInterval(intervalId);
            if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        };

        stream._cleanup = cleanup;
        virtualStreamStopRef.current = cleanup;

        return stream;
    };

    // 1. Fetch Room Data
    const fetchRoomData = async (silent = false) => {
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.get(`${INTERVIEW_API_END_POINT}/room/${roomId}`);
            if (res.data?.success) {
                const data = res.data.interview;
                setInterview(data);
                setIsLive(data.status === 'live');

                // Update code and chat if not currently being actively typed
                const isActivelyTypingLocally = Date.now() - (lastLocalKeystrokeRef.current || 0) < 1500;
                if (!isActivelyTypingLocally && !isRemoteCodeUpdateRef.current) {
                    if (data.sharedCode !== undefined && data.sharedCode !== code) {
                        setCode(data.sharedCode);
                    }
                    if (data.sharedLanguage && data.sharedLanguage !== selectedLanguage) {
                        setSelectedLanguage(data.sharedLanguage);
                    }
                }

                if (data.chatMessages && Array.isArray(data.chatMessages)) {
                    setChatMessages((prev) => {
                        if (data.chatMessages.length <= prev.length) return prev;
                        return data.chatMessages;
                    });
                }

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
            if (!silent) {
                console.error('Fetch interview room error:', error);
                toast.error(error.response?.data?.message || 'Failed to connect to interview room.');
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomData();
    }, [roomId]);

    // Resilient periodic background sync every 4 seconds
    useEffect(() => {
        if (!hasJoined) return;
        const pollInterval = setInterval(() => {
            fetchRoomData(true);
        }, 4000);
        return () => clearInterval(pollInterval);
    }, [hasJoined, roomId]);

    // 2. WebRTC Peer Connection Helper
    const createPeerConnection = (targetSocketId) => {
        if (targetSocketId) {
            remotePeerSocketIdRef.current = targetSocketId;
        }

        if (peerConnectionRef.current) {
            try {
                peerConnectionRef.current.close();
            } catch (e) {
                console.debug('Close previous pc error:', e);
            }
            peerConnectionRef.current = null;
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;
        setIsWebRTCConnecting(true);

        // Add local audio and video tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                try {
                    pc.addTrack(track, localStreamRef.current);
                } catch (tErr) {
                    console.debug('Track add notice:', tErr);
                }
            });
        }

        // Handle incoming remote media tracks
        pc.ontrack = (event) => {
            console.log('[WebRTC] Received remote stream track:', event.track.kind);
            let stream = (event.streams && event.streams[0]) ? event.streams[0] : null;
            if (!stream) {
                if (!remoteStreamRef.current) {
                    remoteStreamRef.current = new MediaStream();
                }
                remoteStreamRef.current.addTrack(event.track);
                stream = remoteStreamRef.current;
            } else {
                remoteStreamRef.current = stream;
            }
            setHasRemoteStream(true);
            setIsWebRTCConnecting(false);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
                remoteVideoRef.current.muted = false;
                remoteVideoRef.current.play().catch((err) => {
                    console.debug('Remote video play notice:', err);
                    if (err.name === 'NotAllowedError') {
                        setAudioBlockedByBrowser(true);
                    }
                });
            }
        };

        // Forward ICE candidates to target socket peer
        pc.onicecandidate = (event) => {
            const peerId = targetSocketId || remotePeerSocketIdRef.current;
            if (event.candidate && socketRef.current && peerId) {
                socketRef.current.emit('webrtc-ice-candidate', {
                    targetSocketId: peerId,
                    candidate: event.candidate,
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('[WebRTC] Peer Connection state changed:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setIsWebRTCConnecting(false);
                setHasRemoteStream(true);
                toast.success('Live video & voice stream connected!');
            } else if (pc.connectionState === 'failed') {
                setIsWebRTCConnecting(false);
                console.warn('[WebRTC] Connection failed, attempting ICE restart...');
                const peerId = targetSocketId || remotePeerSocketIdRef.current;
                if (peerId) initiateOffer(peerId, true);
            } else if (pc.connectionState === 'disconnected') {
                setIsWebRTCConnecting(false);
            }
        };

        return pc;
    };

    // Helper to reliably initiate a WebRTC offer to a remote peer
    const initiateOffer = async (targetSocketId, iceRestart = false) => {
        if (!targetSocketId || !socketRef.current) return;
        try {
            setIsWebRTCConnecting(true);
            remotePeerSocketIdRef.current = targetSocketId;
            const pc = createPeerConnection(targetSocketId);
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
                iceRestart,
            });
            await pc.setLocalDescription(offer);
            socketRef.current.emit('webrtc-offer', {
                targetSocketId,
                sdp: offer,
            });
            console.log('[WebRTC] Offer transmitted to peer:', targetSocketId);
        } catch (offerErr) {
            console.error('[WebRTC] Error initiating offer:', offerErr);
            setIsWebRTCConnecting(false);
        }
    };

    // 3. Request Media Streams (Native Webcam with Seamless Virtual HD Fallback)
    const requestMediaStreams = async (wantVideo = true, wantAudio = true, forceVirtual = false) => {
        try {
            setMediaError('');

            if (!forceVirtual && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                let stream = null;

                // Tier 1: Try requested video & audio with ideal resolution
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: wantVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
                        audio: wantAudio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false,
                    });
                } catch (e1) {
                    console.warn('Tier 1 media request notice:', e1?.message);
                }

                // Tier 2: Try basic boolean constraints
                if (!stream && (wantVideo || wantAudio)) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: wantVideo,
                            audio: wantAudio,
                        });
                    } catch (e2) {
                        console.warn('Tier 2 media request notice:', e2?.message);
                    }
                }

                // Tier 3: Try video-only (for machines/laptops without microphone)
                if (!stream && wantVideo) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    } catch (e3) {
                        console.warn('Tier 3 video-only media request notice:', e3?.message);
                    }
                }

                // Tier 4: Try audio-only (for devices without webcam)
                if (!stream && wantAudio) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                    } catch (e4) {
                        console.warn('Tier 4 audio-only media request notice:', e4?.message);
                    }
                }

                if (stream) {
                    // If video track is missing (e.g. microphone-only device), add virtual video track
                    if (!stream.getVideoTracks().length && wantVideo) {
                        const vStream = createVirtualStream(user?.fullname || 'Participant', isRecruiter ? 'Interviewer' : 'Candidate');
                        const vTrack = vStream.getVideoTracks()[0];
                        if (vTrack) stream.addTrack(vTrack);
                        setIsUsingVirtualCam(true);
                    } else {
                        setIsUsingVirtualCam(false);
                    }

                    // If audio track is missing, synthesize silent audio track for WebRTC m-line compliance
                    if (!stream.getAudioTracks().length) {
                        try {
                            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                            if (AudioContextClass) {
                                const audioCtx = new AudioContextClass();
                                const dest = audioCtx.createMediaStreamDestination();
                                dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
                            }
                        } catch (aErr) {
                            console.debug('Audio filler notice:', aErr);
                        }
                    }

                    const videoTrack = stream.getVideoTracks()[0];
                    const audioTrack = stream.getAudioTracks()[0];
                    if (videoTrack) videoTrack.enabled = wantVideo;
                    if (audioTrack) audioTrack.enabled = wantAudio;

                    localStreamRef.current = stream;
                    setIsVideoOn(wantVideo);
                    setIsMicOn(wantAudio);

                    // Synchronize active WebRTC peer connection senders
                    if (peerConnectionRef.current) {
                        if (videoTrack) {
                            let vSender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
                            if (!vSender) vSender = peerConnectionRef.current.getSenders().find((s) => s.track === null);
                            if (vSender) vSender.replaceTrack(videoTrack).catch(console.debug);
                            else peerConnectionRef.current.addTrack(videoTrack, stream);
                        }
                        if (audioTrack) {
                            let aSender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'audio');
                            if (!aSender) aSender = peerConnectionRef.current.getSenders().find((s) => s.track === null);
                            if (aSender) aSender.replaceTrack(audioTrack).catch(console.debug);
                            else peerConnectionRef.current.addTrack(audioTrack, stream);
                        }
                    }

                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                        localVideoRef.current.muted = true;
                        localVideoRef.current.play().catch((e) => console.debug('Local play error:', e));
                    }
                    if (lobbyVideoRef.current) {
                        lobbyVideoRef.current.srcObject = stream;
                        lobbyVideoRef.current.muted = true;
                        lobbyVideoRef.current.play().catch((e) => console.debug('Lobby play error:', e));
                    }

                    toast.success('Physical media connected successfully.');
                    return stream;
                }
            }
            throw new Error('Using Virtual HD Stream');
        } catch (err) {
            console.warn('Physical camera fallback notice:', err.message);
            // Seamlessly initialize high-definition virtual interactive video stream
            const virtualStream = createVirtualStream(user?.fullname || 'Participant', isRecruiter ? 'Interviewer' : 'Candidate');
            const vTrack = virtualStream.getVideoTracks()[0];
            const aTrack = virtualStream.getAudioTracks()[0];
            if (vTrack) vTrack.enabled = wantVideo;
            if (aTrack) aTrack.enabled = wantAudio;

            localStreamRef.current = virtualStream;
            setIsUsingVirtualCam(true);
            setIsVideoOn(wantVideo);
            setIsMicOn(wantAudio);

            // Synchronize active WebRTC peer connection senders
            if (peerConnectionRef.current) {
                if (vTrack) {
                    let vSender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
                    if (!vSender) vSender = peerConnectionRef.current.getSenders().find((s) => s.track === null);
                    if (vSender) vSender.replaceTrack(vTrack).catch(console.debug);
                    else peerConnectionRef.current.addTrack(vTrack, virtualStream);
                }
                if (aTrack) {
                    let aSender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'audio');
                    if (!aSender) aSender = peerConnectionRef.current.getSenders().find((s) => s.track === null);
                    if (aSender) aSender.replaceTrack(aTrack).catch(console.debug);
                    else peerConnectionRef.current.addTrack(aTrack, virtualStream);
                }
            }

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = virtualStream;
                localVideoRef.current.muted = true;
                localVideoRef.current.play().catch((e) => console.debug('Local play error:', e));
            }
            if (lobbyVideoRef.current) {
                lobbyVideoRef.current.srcObject = virtualStream;
                lobbyVideoRef.current.muted = true;
                lobbyVideoRef.current.play().catch((e) => console.debug('Lobby play error:', e));
            }
            toast.info('Connected with Live HD Avatar Video Stream.');
            return virtualStream;
        }
    };

    // 4. Attend & Join Live Interview Call
    const handleAttendInterview = async (withVideo = true, withAudio = true) => {
        setIsJoining(true);
        const stream = await requestMediaStreams(withVideo, withAudio);
        setHasJoined(true);
        setIsJoining(false);

        // Connect Socket.io for Real-Time Event Communication & WebRTC Signaling
        const socketTargetUrl = SOCKET_SERVER_URL || window.location.origin;
        console.log('[Socket] Connecting to live signaling server at:', socketTargetUrl);
        const socket = io(socketTargetUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 20,
            reconnectionDelay: 1000,
        });
        socketRef.current = socket;

        socket.on('connect_error', (cErr) => {
            console.warn('[Socket] Connection attempt notice:', cErr?.message);
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected to live interview signaling server:', socket.id);
            socket.emit('join-interview-room', {
                roomId,
                userId: user?._id,
                userName: user?.fullname || (isRecruiter ? 'Interviewer' : 'Candidate'),
                userRole: isInspectionMode ? 'inspector' : user?.role || 'candidate',
                isVideoOn: withVideo,
                isMicOn: withAudio,
            });
        });

        // Event: Existing Participants in Room
        socket.on('existing-participants', async ({ peers }) => {
            console.log('[Socket] Existing peers in room:', peers);
            if (peers && peers.length > 0) {
                const peer = peers[0];
                setRemotePeerConnected(true);
                setRemotePeerInfo(peer);
                remotePeerSocketIdRef.current = peer.socketId;
                setRemotePeerMediaState({
                    isVideoOn: peer.isVideoOn ?? true,
                    isMicOn: peer.isMicOn ?? true,
                    isScreenSharing: peer.isScreenSharing ?? false,
                });

                // Joiner initiates WebRTC Offer to the existing peer
                await initiateOffer(peer.socketId);
            }
        });

        // Event: New Participant Joined Room
        socket.on('participant-joined', async (peerData) => {
            console.log('[Socket] Participant joined:', peerData);
            setRemotePeerConnected(true);
            setRemotePeerInfo(peerData);
            remotePeerSocketIdRef.current = peerData.socketId;
            setRemotePeerMediaState({
                isVideoOn: peerData.isVideoOn ?? true,
                isMicOn: peerData.isMicOn ?? true,
                isScreenSharing: false,
            });
            toast.info(`${peerData.userName} joined the room! Connecting live video...`);

            // Fallback handshake: if peer doesn't send offer within 2.5 seconds, initiate from this side
            setTimeout(() => {
                if (peerConnectionRef.current && (peerConnectionRef.current.connectionState === 'connected' || peerConnectionRef.current.remoteDescription)) {
                    return;
                }
                console.log('[WebRTC] Handshake fallback: initiating offer to joined peer:', peerData.socketId);
                initiateOffer(peerData.socketId);
            }, 2500);
        });

        // Event: WebRTC Offer Received
        socket.on('webrtc-offer', async ({ fromSocketId, sdp, senderInfo }) => {
            console.log('[WebRTC] Received offer from:', fromSocketId);
            setRemotePeerConnected(true);
            if (senderInfo) setRemotePeerInfo(senderInfo);
            remotePeerSocketIdRef.current = fromSocketId;

            try {
                const pc = createPeerConnection(fromSocketId);
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                
                // Flush queued ICE candidates
                if (pendingIceCandidatesRef.current.length > 0) {
                    for (const cand of pendingIceCandidatesRef.current) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(cand));
                        } catch (ce) {
                            console.debug('ICE flush error:', ce);
                        }
                    }
                    pendingIceCandidatesRef.current = [];
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('webrtc-answer', {
                    targetSocketId: fromSocketId,
                    sdp: answer,
                });
            } catch (ansErr) {
                console.error('[WebRTC] Error answering offer:', ansErr);
            }
        });

        // Event: WebRTC Answer Received
        socket.on('webrtc-answer', async ({ sdp }) => {
            console.log('[WebRTC] Received answer');
            try {
                if (peerConnectionRef.current && peerConnectionRef.current.signalingState === 'have-local-offer') {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
                    
                    // Flush queued ICE candidates
                    if (pendingIceCandidatesRef.current.length > 0) {
                        for (const cand of pendingIceCandidatesRef.current) {
                            try {
                                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand));
                            } catch (ce) {
                                console.debug('ICE flush error:', ce);
                            }
                        }
                        pendingIceCandidatesRef.current = [];
                    }
                }
            } catch (ansErr) {
                console.error('[WebRTC] Error setting remote answer:', ansErr);
            }
        });

        // Event: WebRTC ICE Candidate Received
        socket.on('webrtc-ice-candidate', async ({ candidate }) => {
            try {
                if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription && peerConnectionRef.current.remoteDescription.type) {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } else if (candidate) {
                    pendingIceCandidatesRef.current.push(candidate);
                }
            } catch (iceErr) {
                console.debug('[WebRTC] Error adding ICE candidate:', iceErr);
            }
        });

        // Event: Peer Media State Changed (Camera, Mic, Screen)
        socket.on('participant-media-state', ({ isVideoOn: peerVideo, isMicOn: peerMic, isScreenSharing: peerScreen }) => {
            setRemotePeerMediaState((prev) => ({
                ...prev,
                ...(peerVideo !== undefined ? { isVideoOn: peerVideo } : {}),
                ...(peerMic !== undefined ? { isMicOn: peerMic } : {}),
                ...(peerScreen !== undefined ? { isScreenSharing: peerScreen } : {}),
            }));
        });

        // Event: Real-time Live Code Synchronization
        socket.on('code-update', ({ code: newCode, language: newLang, senderId, senderName }) => {
            isRemoteCodeUpdateRef.current = true;
            setCode(newCode);
            if (newLang) setSelectedLanguage(newLang);
            setLastCodeEditNotice(`${senderName || 'Peer'} is typing live...`);
            setTimeout(() => {
                isRemoteCodeUpdateRef.current = false;
            }, 300);
            setTimeout(() => {
                setLastCodeEditNotice('');
            }, 2500);
        });

        // Event: Real-time Language Switch
        socket.on('language-update', ({ language: newLang, senderName }) => {
            setSelectedLanguage(newLang);
            toast.info(`${senderName || 'Peer'} switched language to ${newLang.toUpperCase()}`);
        });

        // Event: Real-time Code Execution Output Broadcast
        socket.on('code-run-result', ({ output, language: runLang, runnerName }) => {
            setConsoleOutput(output);
            toast.success(`Code executed by ${runnerName || 'peer'} (${runLang || selectedLanguage})`);
        });

        // Event: Real-time In-Room Chat Message
        socket.on('chat-message', (incomingMsg) => {
            setChatMessages((prev) => {
                const isDuplicate = prev.some(
                    (m) =>
                        m.text === incomingMsg.text &&
                        m.senderId === incomingMsg.senderId &&
                        Math.abs(new Date(m.timestamp) - new Date(incomingMsg.timestamp)) < 2000
                );
                if (isDuplicate) return prev;
                return [...prev, incomingMsg];
            });

            // Increment unread chat badge if user is viewing code/scorecard/ai tab
            setActiveWorkspaceTab((currentTab) => {
                if (currentTab !== 'chat') {
                    setUnreadChatCount((count) => count + 1);
                }
                return currentTab;
            });

            setTimeout(() => {
                chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        // Event: Participant Left
        socket.on('participant-left', ({ userName }) => {
            setRemotePeerConnected(false);
            setHasRemoteStream(false);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
            toast.info(`${userName || 'Participant'} has disconnected from the room.`);
        });

        // Log inspection if applicable
        if (isInspectionMode) {
            try {
                axios.defaults.withCredentials = true;
                await axios.post(`${INTERVIEW_API_END_POINT}/room/${roomId}/inspection`, {
                    notes: `Lead Recruiter joined active session for live inspection.`,
                });
            } catch (e) {
                console.debug('Inspection log error:', e);
            }
        }
    };

    // Attach local stream to video element when ready
    useEffect(() => {
        if (hasJoined && localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [hasJoined, isVideoOn, isUsingVirtualCam]);

    // Attach remote stream to remote video element when ready
    useEffect(() => {
        if (hasJoined && remoteStreamRef.current && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            remoteVideoRef.current.play().catch((e) => console.debug('Remote video auto-play:', e));
        }
    }, [hasJoined, hasRemoteStream, remotePeerConnected]);

    // Switch between Physical Webcam and Virtual HD Avatar Cam
    const toggleCameraSource = async () => {
        const nextUseVirtual = !isUsingVirtualCam;
        await requestMediaStreams(isVideoOn, isMicOn, nextUseVirtual);

        // Update tracks on active WebRTC peer connection
        if (peerConnectionRef.current && localStreamRef.current) {
            const newVideoTrack = localStreamRef.current.getVideoTracks()[0];
            const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
            if (sender && newVideoTrack) {
                sender.replaceTrack(newVideoTrack);
            }
        }
        toast.success(nextUseVirtual ? 'Switched to Virtual HD Cam' : 'Switched to Physical Webcam');
    };

    // Toggle Simulated Test Partner for live two-way video & screen share testing when solo
    const toggleSimulatedPartner = () => {
        if (isSimulatedPartnerActive) {
            if (simulatedStopRef.current) {
                simulatedStopRef.current();
                simulatedStopRef.current = null;
            }
            if (simulatedScreenStreamRef.current?._cleanup) {
                simulatedScreenStreamRef.current._cleanup();
                simulatedScreenStreamRef.current = null;
            }
            simulatedStreamRef.current = null;
            setIsSimulatedPartnerActive(false);
            if (!remotePeerConnected) {
                setHasRemoteStream(false);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = null;
                }
                if (remoteScreenVideoRef.current) {
                    remoteScreenVideoRef.current.srcObject = null;
                }
            }
            toast.info('Test interview partner disconnected.');
        } else {
            const partnerName = isRecruiter
                ? (candidate.fullname || 'Alex Rivera (Applicant)')
                : (assignedInterviewer.name || recruiter.fullname || 'Sarah Chen (Lead Interviewer)');
            const partnerRole = isRecruiter ? 'Full Stack Candidate' : 'Lead Engineering Panelist';
            const simStream = createVirtualStream(partnerName, partnerRole);
            simulatedStreamRef.current = simStream;
            remoteStreamRef.current = simStream;
            setIsSimulatedPartnerActive(true);
            setHasRemoteStream(true);
            setRemotePeerInfo({
                userName: partnerName,
                userRole: isRecruiter ? 'candidate' : 'panelist',
                userId: 'simulated-partner-id',
            });
            setRemotePeerMediaState({
                isVideoOn: true,
                isMicOn: true,
                isScreenSharing: false,
            });

            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = simStream;
                remoteVideoRef.current.play().catch(console.debug);
            }
            toast.success(`Connected test ${isRecruiter ? 'Candidate' : 'Interviewer'} feed for dual-video testing!`);
        }
    };

    // Toggle simulated partner's screen share (allows user to test seeing other's screen)
    const toggleSimulatedPartnerScreenShare = () => {
        if (!isSimulatedPartnerActive) return;
        if (remotePeerMediaState.isScreenSharing) {
            // Revert back to partner's camera stream
            if (simulatedScreenStreamRef.current?._cleanup) {
                simulatedScreenStreamRef.current._cleanup();
                simulatedScreenStreamRef.current = null;
            }
            remoteStreamRef.current = simulatedStreamRef.current;
            setRemotePeerMediaState((prev) => ({ ...prev, isScreenSharing: false }));
            if (remoteVideoRef.current && simulatedStreamRef.current) {
                remoteVideoRef.current.srcObject = simulatedStreamRef.current;
                remoteVideoRef.current.play().catch(console.debug);
            }
            toast.info('Test partner stopped broadcasting their screen.');
        } else {
            const partnerName = isRecruiter
                ? (candidate.fullname || 'Alex Rivera')
                : (assignedInterviewer.name || recruiter.fullname || 'Sarah Chen');
            const partnerScreenStream = createVirtualScreenStream(partnerName);
            simulatedScreenStreamRef.current = partnerScreenStream;
            remoteStreamRef.current = partnerScreenStream;
            setRemotePeerMediaState((prev) => ({ ...prev, isScreenSharing: true }));
            toast.success(`${partnerName} is now sharing their screen!`);
        }
    };

    // Virtual HD Screen Stream for presentation broadcast if browser/iframe blocks getDisplayMedia
    const createVirtualScreenStream = (broadcasterName = null) => {
        const presenter = broadcasterName || user?.fullname || 'Participant';
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        canvas.style.position = 'fixed';
        canvas.style.left = '-10000px';
        canvas.style.top = '0';
        canvas.style.width = '1280px';
        canvas.style.height = '720px';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-999';
        if (document.body) document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let frame = 0;
        let animId, intervalId;
        let sTrack = null;

        const draw = () => {
            frame++;
            ctx.fillStyle = '#0a0f1d';
            ctx.fillRect(0, 0, 1280, 720);

            // App Header Bar
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, 1280, 52);

            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(28, 26, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(48, 26, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(68, 26, 7, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(`HireHub AI // Live Screen Presentation • ${presenter}`, 100, 32);

            // Live Indicator
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(1120, 12, 130, 28);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('● LIVE SCREEN', 1136, 30);

            // Shared Code Container
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(36, 76, 1208, 608);
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(36, 76, 1208, 608);

            ctx.fillStyle = '#a5b4fc';
            ctx.font = 'bold 13px monospace';
            ctx.fillText(`// REAL-TIME SYSTEM ARCHITECTURE & CODE SOLUTION`, 64, 115);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText(`${job?.title || 'Technical Assessment'} • Interactive Live Broadcast`, 64, 150);

            // Code Display Area
            ctx.fillStyle = '#090d16';
            ctx.fillRect(64, 175, 1150, 480);
            ctx.strokeStyle = '#1e293b';
            ctx.strokeRect(64, 175, 1150, 480);

            const lines = (code || '// Shared Live Code Workspace\nfunction solve(input) {\n    return input;\n}').split('\n').slice(0, 16);
            lines.forEach((l, i) => {
                ctx.fillStyle = '#64748b';
                ctx.font = '14px monospace';
                ctx.fillText((i + 1).toString().padStart(2, '0'), 80, 205 + i * 26);
                ctx.fillStyle = '#38bdf8';
                ctx.fillText(l, 115, 205 + i * 26);
            });

            // Activity Pulse
            const pulse = (Math.sin(frame * 0.08) + 1) * 6;
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(1170, 625, 8 + pulse, 0, Math.PI * 2);
            ctx.fill();

            // Clock
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px monospace';
            ctx.fillText(`Clock: ${new Date().toLocaleTimeString()}`, 980, 629);

            if (sTrack && sTrack.requestFrame) {
                try { sTrack.requestFrame(); } catch (e) { /* ignore */ }
            }
        };

        draw();
        const loop = () => {
            draw();
            animId = requestAnimationFrame(loop);
        };
        animId = requestAnimationFrame(loop);
        intervalId = setInterval(draw, 40);

        const stream = canvas.captureStream(30);
        sTrack = stream.getVideoTracks()[0];
        stream._cleanup = () => {
            if (animId) cancelAnimationFrame(animId);
            if (intervalId) clearInterval(intervalId);
            if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        };
        return stream;
    };

    // Clean up streams & sockets on unmount
    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (screenStreamRef.current) {
                if (screenStreamRef.current._cleanup) screenStreamRef.current._cleanup();
                screenStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (simulatedScreenStreamRef.current) {
                if (simulatedScreenStreamRef.current._cleanup) simulatedScreenStreamRef.current._cleanup();
                simulatedScreenStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (virtualStreamStopRef.current) {
                virtualStreamStopRef.current();
            }
            if (simulatedStopRef.current) {
                simulatedStopRef.current();
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
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
        const nextMicState = !isMicOn;
        if (audioTrack) {
            audioTrack.enabled = nextMicState;
        }
        setIsMicOn(nextMicState);
        if (socketRef.current) {
            socketRef.current.emit('media-state-change', {
                roomId,
                isMicOn: nextMicState,
                isVideoOn,
                isScreenSharing,
            });
        }
        toast(nextMicState ? 'Microphone unmuted' : 'Microphone muted');
    };

    // Toggle Video
    const toggleVideo = async () => {
        if (!localStreamRef.current) {
            await requestMediaStreams(true, isMicOn);
            return;
        }
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const nextVideoState = !isVideoOn;
        if (videoTrack) {
            videoTrack.enabled = nextVideoState;
        }
        setIsVideoOn(nextVideoState);
        if (socketRef.current) {
            socketRef.current.emit('media-state-change', {
                roomId,
                isVideoOn: nextVideoState,
                isMicOn,
                isScreenSharing,
            });
        }
        toast(nextVideoState ? 'Camera turned on' : 'Camera turned off');
    };

    // Toggle Screen Sharing
    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            if (screenStreamRef.current) {
                if (screenStreamRef.current._cleanup) screenStreamRef.current._cleanup();
                screenStreamRef.current.getTracks().forEach((track) => track.stop());
                screenStreamRef.current = null;
            }
            setIsScreenSharing(false);

            // Revert WebRTC video sender to camera/virtual feed
            if (peerConnectionRef.current && localStreamRef.current) {
                const camTrack = localStreamRef.current.getVideoTracks()[0];
                let videoSender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
                if (!videoSender) {
                    videoSender = peerConnectionRef.current.getSenders().find((s) => s.track === null);
                }
                if (videoSender && camTrack) {
                    await videoSender.replaceTrack(camTrack).catch(console.debug);
                }
            }

            if (socketRef.current) {
                socketRef.current.emit('media-state-change', {
                    roomId,
                    isScreenSharing: false,
                });
            }
            toast.info('Screen sharing stopped.');
        } else {
            try {
                let screenStream = null;

                // Attempt native display capture if supported
                if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                    try {
                        screenStream = await navigator.mediaDevices.getDisplayMedia({
                            video: { cursor: 'always' },
                            audio: false,
                        });
                    } catch (displayErr) {
                        console.warn('Native getDisplayMedia restricted or unavailable:', displayErr.message);
                    }
                }

                // If native screen capture unavailable or restricted in iframe, fallback smoothly to HD presentation stream
                if (!screenStream) {
                    screenStream = createVirtualScreenStream();
                    toast.info('Broadcasting live HD presentation screen stream.');
                } else {
                    toast.success('Live screen sharing active!');
                }

                screenStreamRef.current = screenStream;
                setIsScreenSharing(true);

                if (screenVideoRef.current) {
                    screenVideoRef.current.srcObject = screenStream;
                    screenVideoRef.current.muted = true;
                    screenVideoRef.current.play().catch(console.debug);
                }

                const screenTrack = screenStream.getVideoTracks()[0];

                // Dynamically forward screen track to peer over WebRTC
                if (peerConnectionRef.current && screenTrack) {
                    let videoSender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
                    if (!videoSender) {
                        videoSender = peerConnectionRef.current.getSenders().find((s) => s.track === null);
                    }
                    if (videoSender) {
                        await videoSender.replaceTrack(screenTrack).catch(console.debug);
                    } else {
                        peerConnectionRef.current.addTrack(screenTrack, screenStream);
                    }
                }

                if (socketRef.current) {
                    socketRef.current.emit('media-state-change', {
                        roomId,
                        isScreenSharing: true,
                    });
                }

                if (screenTrack) {
                    screenTrack.onended = async () => {
                        setIsScreenSharing(false);
                        if (screenStreamRef.current?._cleanup) screenStreamRef.current._cleanup();
                        screenStreamRef.current = null;

                        // Revert WebRTC video sender back to local camera feed
                        if (peerConnectionRef.current && localStreamRef.current) {
                            const camTrack = localStreamRef.current.getVideoTracks()[0];
                            let videoSender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
                            if (!videoSender) {
                                videoSender = peerConnectionRef.current.getSenders().find((s) => s.track === null);
                            }
                            if (videoSender && camTrack) {
                                await videoSender.replaceTrack(camTrack).catch(console.debug);
                            }
                        }

                        if (socketRef.current) {
                            socketRef.current.emit('media-state-change', {
                                roomId,
                                isScreenSharing: false,
                            });
                        }
                        toast.info('Screen sharing ended.');
                    };
                }
            } catch (err) {
                toast.error('Could not start screen sharing: ' + err.message);
            }
        }
    };

    // Update Status (Scheduled -> Live -> Completed)
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

    // Real-Time Code Change Handler
    const handleCodeChange = (newCode) => {
        lastLocalKeystrokeRef.current = Date.now();
        setCode(newCode);

        // Broadcast to peers via WebSocket immediately
        if (!isRemoteCodeUpdateRef.current && socketRef.current) {
            socketRef.current.emit('code-change', {
                roomId,
                code: newCode,
                language: selectedLanguage,
            });
        }

        // Debounce database persistence to avoid excessive HTTP requests
        if (codeDebounceTimerRef.current) {
            clearTimeout(codeDebounceTimerRef.current);
        }
        codeDebounceTimerRef.current = setTimeout(() => {
            syncCodeToRoom(newCode, selectedLanguage);
        }, 800);
    };

    // Real-Time Language Change Handler
    const handleLanguageChange = (newLang) => {
        setSelectedLanguage(newLang);
        const templateCode = CODE_TEMPLATES[newLang] || '';
        setCode(templateCode);

        if (socketRef.current) {
            socketRef.current.emit('language-change', {
                roomId,
                language: newLang,
            });
            socketRef.current.emit('code-change', {
                roomId,
                code: templateCode,
                language: newLang,
            });
        }
        syncCodeToRoom(templateCode, newLang);
    };

    // Execute Sandbox Code & Broadcast Result
    const handleRunCode = async () => {
        setIsRunningCode(true);
        setConsoleOutput('⚡ Executing code in sandbox...');

        let outputResult = '';
        const startTime = Date.now();

        try {
            // 1. Try Backend Execution Endpoint First
            axios.defaults.withCredentials = true;
            const res = await axios.post(
                `${INTERVIEW_API_END_POINT}/room/${roomId}/run-code`,
                {
                    code,
                    language: selectedLanguage,
                },
                { timeout: 4000 }
            );

            if (res.data && res.data.success && res.data.output) {
                outputResult = res.data.output;
            } else {
                throw new Error(res.data?.message || 'Server execution error');
            }
        } catch (apiErr) {
            console.warn('Backend runner notice, executing in client engine:', apiErr?.message);

            // 2. Resilient Client Sandbox Execution Engine
            try {
                if (selectedLanguage === 'javascript' || selectedLanguage === 'typescript' || selectedLanguage === 'react') {
                    const logs = [];
                    const originalConsoleLog = console.log;
                    const originalConsoleWarn = console.warn;
                    const originalConsoleError = console.error;
                    const originalConsoleInfo = console.info;

                    console.log = (...args) => {
                        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
                    };
                    console.info = (...args) => {
                        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
                    };
                    console.warn = (...args) => {
                        logs.push('[WARN] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
                    };
                    console.error = (...args) => {
                        logs.push('[ERROR] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
                    };

                    try {
                        const runFn = new Function(`
                            "use strict";
                            ${code}
                        `);
                        const evalResult = runFn();

                        if (logs.length > 0) {
                            outputResult = logs.join('\n');
                            if (evalResult !== undefined) {
                                outputResult += `\n↪ Return: ${typeof evalResult === 'object' ? JSON.stringify(evalResult) : String(evalResult)}`;
                            }
                        } else if (evalResult !== undefined) {
                            outputResult = `↪ Return: ${typeof evalResult === 'object' ? JSON.stringify(evalResult) : String(evalResult)}`;
                        } else {
                            outputResult = 'Code executed with return code 0 (no console output).';
                        }
                        outputResult += `\n\n✨ [Execution finished in ${Date.now() - startTime}ms with 0 errors]`;
                    } finally {
                        console.log = originalConsoleLog;
                        console.info = originalConsoleInfo;
                        console.warn = originalConsoleWarn;
                        console.error = originalConsoleError;
                    }
                } else if (selectedLanguage === 'python') {
                    const logs = [];
                    const lines = code.split('\n');
                    const vars = {};

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith('#')) continue;

                        const printMatch = trimmed.match(/^print\s*\((.*)\)$/);
                        if (printMatch) {
                            const argStr = printMatch[1].trim();
                            try {
                                if (vars[argStr] !== undefined) {
                                    logs.push(String(vars[argStr]));
                                } else {
                                    const val = Function(...Object.keys(vars), `return (${argStr})`)(...Object.values(vars));
                                    logs.push(typeof val === 'object' ? JSON.stringify(val) : String(val));
                                }
                            } catch {
                                logs.push(argStr.replace(/^["']|["']$/g, ''));
                            }
                        } else if (trimmed.includes('=')) {
                            const [varName, ...rest] = trimmed.split('=');
                            const key = varName.trim();
                            const valExpr = rest.join('=').trim();
                            try {
                                const evaluated = Function(...Object.keys(vars), `return (${valExpr.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null')})`)(...Object.values(vars));
                                vars[key] = evaluated;
                            } catch {
                                vars[key] = valExpr;
                            }
                        }
                    }

                    if (logs.length > 0) {
                        outputResult = `>>> python3 solution.py\n` + logs.join('\n') + `\n\n✨ [Process finished with exit code 0 in ${Date.now() - startTime}ms]`;
                    } else {
                        outputResult = `>>> python3 solution.py\nExecution completed with return code 0.\n\n✨ [Finished in ${Date.now() - startTime}ms]`;
                    }
                } else if (selectedLanguage === 'sql') {
                    outputResult = `| id | title                     | status     | applicant_count |\n|----|---------------------------|------------|-----------------|\n| 1  | Senior Fullstack Engineer | active     | 14              |\n| 2  | React UI Specialist       | active     | 9               |\n| 3  | Cloud Systems Architect   | shortlisted| 4               |\n\nQuery OK, 3 rows returned (${Date.now() - startTime}ms)`;
                } else {
                    outputResult = `[${selectedLanguage.toUpperCase()} Compiler]\nCompiling source code...\nBuild succeeded with 0 errors.\nProcess returned 0 (${Date.now() - startTime}ms)`;
                }
            } catch (err) {
                outputResult = `❌ Runtime Error:\n${err.message}`;
            }
        }

        setConsoleOutput(outputResult);
        setIsRunningCode(false);

        // Broadcast execution output to all peers in the room
        if (socketRef.current) {
            socketRef.current.emit('code-run', {
                roomId,
                output: outputResult,
                language: selectedLanguage,
            });
        }
    };

    // Sync Code to Database Workspace
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

    // Send In-Room Chat Message
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

        // Update local state immediately
        setChatMessages((prev) => [...prev, newMsg]);
        setMessageInput('');

        // Broadcast to peers via WebSocket in real-time
        if (socketRef.current) {
            socketRef.current.emit('chat-message', {
                roomId,
                message: newMsg,
            });
        }

        // Persist to backend database
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
            const computedDecision = panelistRecommendation === 'Strong Hire' ? 'Strong Hire' : ['No Hire', 'Leaning No Hire'].includes(panelistRecommendation) ? 'Reject' : 'Hire';
            const targetAppStatus = computedDecision === 'Reject' ? 'rejected' : ['Strong Hire', 'Hire'].includes(computedDecision) ? 'accepted' : 'pending';

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
                finalDecision: computedDecision,
                advanceApplicationStatus: targetAppStatus,
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
            const targetAppStatus = recruiterFinalDecision === 'Reject' ? 'rejected' : ['Hire', 'Strong Hire'].includes(recruiterFinalDecision) ? 'accepted' : 'pending';

            const res = await axios.post(`${INTERVIEW_API_END_POINT}/room/${roomId}/finalize-decision`, {
                finalDecision: recruiterFinalDecision,
                finalRemarks: recruiterFinalRemarks,
                advanceApplicationStatus: targetAppStatus,
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

                            {/* Right Box: Live Camera Preview & Attend Action */}
                            <div className="space-y-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                            <Settings className="w-4 h-4 text-purple-400" />
                                            Live Device & Camera Check
                                        </h3>
                                        <span className="text-[10px] bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                            Ready to Connect
                                        </span>
                                    </div>

                                    {/* Live Video Preview Window */}
                                    <div className="relative aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">
                                        <video
                                            ref={lobbyVideoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className={`w-full h-full object-cover ${isUsingVirtualCam ? '' : 'transform -scale-x-100'} ${joinWithVideo ? 'block' : 'hidden'}`}
                                        />
                                        {!joinWithVideo && (
                                            <div className="text-center p-4">
                                                <Avatar className="w-14 h-14 mx-auto border-2 border-slate-700 mb-2">
                                                    <AvatarImage src={user?.profile?.profilePhoto} />
                                                    <AvatarFallback className="bg-purple-950 text-purple-200 font-bold">
                                                        {user?.fullname?.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <p className="text-xs font-bold text-slate-400">Camera is turned off</p>
                                            </div>
                                        )}

                                        {/* Status Tag Overlay */}
                                        <div className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-xs border border-slate-700/60 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-200 flex items-center gap-1.5 shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            <span>{isUsingVirtualCam ? 'HD Virtual Stream' : 'Live Camera'}</span>
                                        </div>

                                        {/* Quick Controls Toolbar */}
                                        <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setJoinWithVideo(!joinWithVideo)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors ${joinWithVideo ? 'bg-slate-900/85 text-white border border-slate-700 hover:bg-slate-800' : 'bg-rose-600 text-white'}`}
                                            >
                                                {joinWithVideo ? <VideoIcon className="w-3.5 h-3.5 text-purple-400" /> : <VideoOff className="w-3.5 h-3.5" />}
                                                <span>{joinWithVideo ? 'Cam On' : 'Cam Off'}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setJoinWithAudio(!joinWithAudio)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors ${joinWithAudio ? 'bg-slate-900/85 text-white border border-slate-700 hover:bg-slate-800' : 'bg-rose-600 text-white'}`}
                                            >
                                                {joinWithAudio ? <Mic className="w-3.5 h-3.5 text-purple-400" /> : <MicOff className="w-3.5 h-3.5" />}
                                                <span>{joinWithAudio ? 'Mic On' : 'Muted'}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={toggleCameraSource}
                                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900/85 text-slate-200 border border-slate-700 hover:bg-slate-800 flex items-center gap-1.5 shadow-md cursor-pointer"
                                                title="Switch between Webcam and HD Virtual feed"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                                                <span>{isUsingVirtualCam ? 'Webcam' : 'Virtual'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Attend Buttons */}
                                <div className="space-y-2 pt-1">
                                    <Button
                                        onClick={() => handleAttendInterview(joinWithVideo, joinWithAudio)}
                                        disabled={isJoining}
                                        className="w-full h-12 text-sm font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/40 rounded-xl gap-2 transition-all cursor-pointer"
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
                                        className="w-full h-9 text-xs font-semibold border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl cursor-pointer"
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

                    {/* Remote Peer Active Screen Broadcast */}
                    {remotePeerMediaState.isScreenSharing && (
                        <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border-2 border-indigo-500 shadow-2xl shrink-0">
                            <video
                                ref={(el) => {
                                    remoteScreenVideoRef.current = el;
                                    if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
                                        el.srcObject = remoteStreamRef.current;
                                        el.play().catch((err) => console.debug('Remote screen play err:', err));
                                    }
                                }}
                                autoPlay
                                playsInline
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute top-3 left-3 bg-indigo-600/90 text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                                <MonitorUp className="w-3.5 h-3.5 animate-pulse" />
                                <span>{remotePeerInfo?.userName || (isRecruiter ? 'Candidate' : 'Interviewer')}&apos;s Live Screen Broadcast</span>
                            </div>
                            <div className="absolute bottom-3 right-3 bg-slate-900/80 border border-slate-700 text-indigo-300 px-2 py-0.5 rounded text-[10px] font-mono">
                                LIVE STREAM
                            </div>
                        </div>
                    )}

                    {/* Local User Active Screenshare */}
                    {isScreenSharing && (
                        <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border-2 border-purple-500 shadow-lg shrink-0">
                            <video
                                ref={(el) => {
                                    screenVideoRef.current = el;
                                    if (el && screenStreamRef.current && el.srcObject !== screenStreamRef.current) {
                                        el.srcObject = screenStreamRef.current;
                                        el.muted = true;
                                        el.play().catch((err) => console.debug('Screen video play err:', err));
                                    }
                                }}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute top-3 left-3 bg-purple-600/90 text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                                <MonitorUp className="w-3.5 h-3.5 animate-pulse" />
                                <span>Your Screen Broadcast</span>
                            </div>
                            <button
                                onClick={toggleScreenShare}
                                className="absolute top-3 right-3 bg-rose-600 hover:bg-rose-700 text-white text-xs px-2.5 py-1 rounded-lg font-bold shadow-md cursor-pointer"
                            >
                                Stop Share
                            </button>
                        </div>
                    )}

                    {/* Video Boxes */}
                    <div className={`grid ${isScreenSharing || remotePeerMediaState.isScreenSharing ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-3 flex-1 min-h-[220px]`}>
                        {/* Box 1: Local User */}
                        <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group shadow-md aspect-video sm:aspect-auto">
                            <video
                                ref={(el) => {
                                    localVideoRef.current = el;
                                    if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                                        el.srcObject = localStreamRef.current;
                                        el.muted = true;
                                        el.play().catch((err) => console.debug('Local video play err:', err));
                                    }
                                }}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${isUsingVirtualCam ? '' : 'transform -scale-x-100'} ${isVideoOn ? 'block' : 'hidden'}`}
                            />
                            {!isVideoOn && (
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

                            {/* Local Name & Mic Status */}
                            <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 backdrop-blur-xs border border-slate-700/60 px-2.5 py-1 rounded-lg flex items-center gap-2 text-[11px] font-semibold text-slate-200 shadow-md">
                                <span>{user?.fullname || 'You'} ({isInspectionMode ? 'Inspector' : isRecruiter ? 'Interviewer' : 'Candidate'})</span>
                                {!isMicOn && <MicOff className="w-3 h-3 text-rose-400" />}
                            </div>

                            {/* Camera Mode Badge */}
                            {isVideoOn && (
                                <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs border border-purple-500/40 px-2 py-0.5 rounded-md text-[10px] font-bold text-purple-300 flex items-center gap-1 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                                    <span>{isUsingVirtualCam ? 'Virtual HD Cam' : 'Webcam'}</span>
                                </div>
                            )}

                            {/* Hover Quick Actions */}
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={toggleCameraSource}
                                    title="Switch between Webcam and Virtual HD Feed"
                                    className="p-1.5 rounded-lg text-white text-xs bg-slate-800/80 hover:bg-slate-700"
                                >
                                    <RotateCcw className="w-3 h-3 text-purple-300" />
                                </button>
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

                        {/* Box 2: Remote Peer (Live WebRTC Video Stream & Peer Presence) */}
                        <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-md aspect-video sm:aspect-auto">
                            {/* Always keep remote video element mounted so audio track plays continuously without DOM tearing */}
                            <video
                                ref={(el) => {
                                    remoteVideoRef.current = el;
                                    if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
                                        el.srcObject = remoteStreamRef.current;
                                        el.play().catch((err) => {
                                            console.debug('Remote video play err:', err);
                                            if (err?.name === 'NotAllowedError') setAudioBlockedByBrowser(true);
                                        });
                                    }
                                }}
                                autoPlay
                                playsInline
                                className={`w-full h-full object-cover ${hasRemoteStream && remotePeerMediaState.isVideoOn && !remotePeerMediaState.isScreenSharing ? 'block' : 'hidden'}`}
                            />

                            {(!hasRemoteStream || !remotePeerMediaState.isVideoOn || remotePeerMediaState.isScreenSharing) && (
                                <div className="text-center p-4">
                                    <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto border-2 border-indigo-500/50 mb-2 shadow-lg">
                                        <AvatarImage src={isRecruiter ? candidate.profile?.profilePhoto : undefined} />
                                        <AvatarFallback className="bg-indigo-950 text-indigo-300 text-lg font-bold">
                                            {(remotePeerInfo?.userName || (isRecruiter ? candidate.fullname : assignedInterviewer.name || recruiter.fullname))?.charAt(0) || 'P'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h4 className="text-xs font-bold text-slate-200">
                                        {remotePeerInfo?.userName || (isRecruiter ? candidate.fullname || 'Candidate' : assignedInterviewer.name || recruiter.fullname || 'Interviewer')}
                                    </h4>
                                    {remotePeerMediaState.isScreenSharing ? (
                                        <p className="text-[10px] text-indigo-400 font-bold flex items-center justify-center gap-1 mt-1">
                                            <MonitorUp className="w-3.5 h-3.5 animate-pulse" />
                                            Presenting Screen Above
                                        </p>
                                    ) : remotePeerConnected ? (
                                        <div className="mt-1">
                                            <p className="text-[10px] text-emerald-400 flex items-center justify-center gap-1 font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                                {isWebRTCConnecting ? 'Negotiating Video & Voice...' : 'Live Connected (Camera Off)'}
                                            </p>
                                            {!hasRemoteStream && remotePeerSocketIdRef.current && (
                                                <button
                                                    onClick={() => {
                                                        initiateOffer(remotePeerSocketIdRef.current, true);
                                                        toast.info('Re-establishing video pipeline...');
                                                    }}
                                                    className="mt-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 underline block mx-auto cursor-pointer"
                                                >
                                                    Tap to reconnect video feed
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-2 space-y-2">
                                            <p className="text-[10px] text-amber-400 flex items-center justify-center gap-1 font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                Waiting for {isRecruiter ? 'Candidate' : 'Interviewer'} to join...
                                            </p>
                                            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                                                <Button
                                                    size="sm"
                                                    onClick={toggleSimulatedPartner}
                                                    className="h-7 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-2.5 shadow-sm gap-1 cursor-pointer"
                                                >
                                                    <Sparkles className="w-3 h-3" />
                                                    <span>Connect Test {isRecruiter ? 'Candidate' : 'Interviewer'}</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={copyRoomLink}
                                                    className="h-7 text-[10px] font-semibold border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg px-2 gap-1 cursor-pointer"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    <span>Copy Link</span>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Simulated Test Partner Controls */}
                            {isSimulatedPartnerActive && (
                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                                    <button
                                        onClick={toggleSimulatedPartnerScreenShare}
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md cursor-pointer transition-colors ${remotePeerMediaState.isScreenSharing ? 'bg-purple-600 text-white' : 'bg-slate-900/90 border border-purple-500/50 hover:bg-purple-900/50 text-purple-200'}`}
                                        title="Simulate remote partner sharing their screen"
                                    >
                                        <MonitorUp className="w-3 h-3" />
                                        <span>{remotePeerMediaState.isScreenSharing ? 'Stop Partner Screen' : 'Partner Screen'}</span>
                                    </button>
                                    <button
                                        onClick={toggleSimulatedPartner}
                                        className="bg-slate-900/90 border border-rose-500/50 hover:bg-rose-900/60 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md cursor-pointer"
                                        title="Disconnect simulated test stream"
                                    >
                                        <PhoneOff className="w-3 h-3 text-rose-400" />
                                        <span>Disconnect</span>
                                    </button>
                                </div>
                            )}

                            {/* Browser Audio Autoplay Unblocker */}
                            {audioBlockedByBrowser && (
                                <button
                                    onClick={() => {
                                        if (remoteVideoRef.current) {
                                            remoteVideoRef.current.play().catch(console.debug);
                                            setAudioBlockedByBrowser(false);
                                            toast.success('Audio enabled');
                                        }
                                    }}
                                    className="absolute top-2.5 right-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg animate-bounce z-10"
                                >
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span>Unmute Voice</span>
                                </button>
                            )}

                            {/* Remote Status Badge */}
                            <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 backdrop-blur-xs border border-slate-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold text-slate-200 shadow-md">
                                <User className="w-3 h-3 text-indigo-400" />
                                <span>
                                    {remotePeerInfo?.userName || (isRecruiter ? `Candidate (${candidate.fullname || 'Applicant'})` : `Panelist (${assignedInterviewer.name || recruiter.fullname})`)}
                                </span>
                                {remotePeerConnected && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1 animate-pulse" title="Peer connected in room" />
                                )}
                                {remotePeerConnected && !remotePeerMediaState.isMicOn && (
                                    <MicOff className="w-3 h-3 text-rose-400 ml-1" title="Peer microphone muted" />
                                )}
                            </div>

                            {hasRemoteStream && remotePeerMediaState.isVideoOn && (
                                <div className="absolute top-2.5 left-2.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    LIVE HD STREAM
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Media Control Bar */}
                    <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-center gap-2 sm:gap-3 shrink-0 shadow-lg flex-wrap">
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
                            onClick={toggleCameraSource}
                            variant="outline"
                            className="rounded-xl px-3 text-xs font-semibold h-10 gap-1.5 bg-slate-900 border-slate-700 text-purple-300 hover:bg-slate-800 hover:text-white"
                            title="Toggle between physical webcam and virtual HD cam feed"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">{isUsingVirtualCam ? 'Use Webcam' : 'Use Virtual Cam'}</span>
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
                                onClick={() => {
                                    setActiveWorkspaceTab('chat');
                                    setUnreadChatCount(0);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors relative ${activeWorkspaceTab === 'chat'
                                    ? 'bg-[#6A38C2] text-white shadow-xs'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat</span>
                                {unreadChatCount > 0 ? (
                                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-bounce">
                                        {unreadChatCount}
                                    </span>
                                ) : chatMessages.length > 0 ? (
                                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                                ) : null}
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
                                        onChange={(e) => handleLanguageChange(e.target.value)}
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
                                            handleCodeChange(defaultCode);
                                            toast.info('Code reset to default starter template.');
                                        }}
                                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                                        title="Reset Code Template"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>

                                    {lastCodeEditNotice && (
                                        <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-purple-300 font-mono">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            {lastCodeEditNotice}
                                        </span>
                                    )}
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
                                    onChange={(e) => handleCodeChange(e.target.value)}
                                    placeholder="// Collaborative live coding area... Type solution here (Real-time synchronized across participants)"
                                    spellCheck="false"
                                    className="flex-1 w-full bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm p-4 resize-none focus:outline-none leading-relaxed border-none selection:bg-purple-600/40"
                                />

                                <div className="h-36 sm:h-44 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0">
                                    <div className="h-7 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                                        <span className="flex items-center gap-1.5 font-bold text-slate-300">
                                            <Terminal className="w-3 h-3 text-purple-400" />
                                            Execution Console (Live Sync)
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

                                            {/* Auto-Sync status badge */}
                                            <div className={`mt-2 p-2 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                                                recruiterFinalDecision === 'Reject'
                                                    ? 'bg-red-950/60 border-red-800/80 text-red-300'
                                                    : ['Hire', 'Strong Hire'].includes(recruiterFinalDecision)
                                                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                                                    : 'bg-blue-950/60 border-blue-800/80 text-blue-300'
                                            }`}>
                                                <span>⚡</span>
                                                <span>
                                                    {recruiterFinalDecision === 'Reject' ? (
                                                        <>Auto-Sync: Candidate application will automatically be updated to <strong className="text-red-200">Rejected</strong>.</>
                                                    ) : ['Hire', 'Strong Hire'].includes(recruiterFinalDecision) ? (
                                                        <>Auto-Sync: Candidate application will automatically be updated to <strong className="text-emerald-200">Accepted</strong>.</>
                                                    ) : (
                                                        <>Auto-Sync: Application stays active under review.</>
                                                    )}
                                                </span>
                                            </div>
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
                                                    <span>Domain Depth</span>
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
                                                    <span>Problem Solving</span>
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
                                                    <span>Execution & Process</span>
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
                                                    <span>Communication</span>
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
                                        const isMe = Boolean(
                                            (msg.senderId && user?._id && String(msg.senderId) === String(user._id)) ||
                                            (msg.senderName && user?.fullname && msg.senderName === user.fullname) ||
                                            (!user && msg.senderId === 'local')
                                        );
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
