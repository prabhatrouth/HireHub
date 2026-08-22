import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Video, Clock, ArrowRight, X, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import axios from 'axios';
import { INTERVIEW_API_END_POINT } from '@/utils/constant';

const InterviewAlertBanner = () => {
    const { user } = useSelector((store) => store.auth);
    const navigate = useNavigate();
    const location = useLocation();
    const [liveInterviews, setLiveInterviews] = useState([]);
    const [dismissed, setDismissed] = useState(false);

    const checkInterviews = async () => {
        if (!user) return;
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.get(`${INTERVIEW_API_END_POINT}/my-interviews`);
            if (res.data?.success) {
                const all = res.data.interviews || [];
                const todayStr = new Date().toISOString().split('T')[0];

                // Filter for live or scheduled for today
                const active = all.filter(
                    (i) => i.status === 'live' || (i.status === 'scheduled' && i.interviewDate === todayStr)
                );
                setLiveInterviews(active);
            }
        } catch (e) {
            // silent check
        }
    };

    useEffect(() => {
        if (user) {
            checkInterviews();
            const interval = setInterval(checkInterviews, 20000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Don't show inside the interview room itself or when dismissed/empty
    if (location.pathname.startsWith('/interview/room/')) {
        return null;
    }

    if (!user || dismissed || liveInterviews.length === 0) {
        return null;
    }

    const currentInterview = liveInterviews[0];
    const isLive = currentInterview.status === 'live';
    const isRecruiter = user.role === 'recruiter';

    return (
        <div
            className={`w-full text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs z-50 sticky top-0 transition-colors ${
                isLive
                    ? 'bg-gradient-to-r from-rose-600 via-purple-700 to-indigo-700 animate-pulse'
                    : 'bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900'
            }`}
        >
            <div className="flex items-center gap-2.5 max-w-4xl truncate">
                <div className={`p-1.5 rounded-full ${isLive ? 'bg-white text-rose-600' : 'bg-purple-500/30 text-purple-200'}`}>
                    <Video className="w-4 h-4" />
                </div>
                <div className="truncate">
                    <span className="font-extrabold uppercase tracking-wide">
                        {isLive ? '🔴 Live Interview In Progress: ' : '🔔 Upcoming Interview Today: '}
                    </span>
                    <span className="font-semibold text-purple-100">
                        {currentInterview.job?.title || 'Technical Interview'}
                    </span>
                    <span className="text-purple-200 hidden sm:inline ml-1">
                        ({currentInterview.roundType} at {currentInterview.interviewTime})
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <Button
                    size="sm"
                    onClick={() => navigate(`/interview/room/${currentInterview.roomId}`)}
                    className={`h-7 px-3 text-xs font-extrabold shadow-sm gap-1 ${
                        isLive
                            ? 'bg-white text-rose-700 hover:bg-rose-50'
                            : 'bg-[#6A38C2] hover:bg-[#582ea8] text-white border border-purple-400'
                    }`}
                >
                    <Video className="w-3 h-3" />
                    <span>{isLive ? 'JOIN LIVE CALL NOW' : 'Enter Meeting Room'}</span>
                    <ArrowRight className="w-3 h-3" />
                </Button>

                <button
                    onClick={() => setDismissed(true)}
                    className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                    title="Dismiss Banner"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default InterviewAlertBanner;
