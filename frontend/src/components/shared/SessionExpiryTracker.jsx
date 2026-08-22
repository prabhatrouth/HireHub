import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setUser } from '@/redux/authSlice';
import { toast } from 'sonner';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';

// Inactivity timeout: 30 minutes of idle time
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
// Throttle user activity event listener writes
const ACTIVITY_THROTTLE_MS = 5000;

const SessionExpiryTracker = () => {
    const { user } = useSelector((store) => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const lastThrottleRef = useRef(0);
    const hasWarnedRef = useRef(false);

    useEffect(() => {
        // Clean up legacy localStorage persisted auth if not in active session
        const hasSessionAuth = sessionStorage.getItem('token') || sessionStorage.getItem('hirehub_last_activity');
        if (!hasSessionAuth && !user) {
            localStorage.removeItem('token');
            localStorage.removeItem('persist:root');
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            hasWarnedRef.current = false;
            return;
        }

        // Initialize last activity if not present
        if (!sessionStorage.getItem('hirehub_last_activity')) {
            sessionStorage.setItem('hirehub_last_activity', Date.now().toString());
        }

        const handleUserActivity = () => {
            const now = Date.now();
            if (now - lastThrottleRef.current > ACTIVITY_THROTTLE_MS) {
                lastThrottleRef.current = now;
                sessionStorage.setItem('hirehub_last_activity', now.toString());
            }
        };

        const performSessionLogout = async (reason = 'inactivity') => {
            try {
                // Clear state and tokens first
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('hirehub_last_activity');
                localStorage.removeItem('token');
                localStorage.removeItem('persist:root');
                dispatch(setUser(null));

                // Call backend logout endpoint in background
                try {
                    await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
                } catch (e) {
                    // Ignore backend error if already expired
                }

                const message =
                    reason === 'inactivity'
                        ? 'Your session has expired due to 30 minutes of inactivity. Please log in again.'
                        : 'Your session has ended. Please log in again to continue.';

                toast.error(message, {
                    duration: 5000,
                });

                // If user was on a protected page, navigate to login
                const currentPath = location.pathname;
                const isProtected =
                    currentPath.startsWith('/admin') ||
                    currentPath.startsWith('/profile') ||
                    currentPath.startsWith('/student');

                if (isProtected) {
                    navigate('/login');
                }
            } catch (err) {
                console.error('Session expiration handler error:', err);
            }
        };

        const checkSessionExpiry = () => {
            const lastActivityStr = sessionStorage.getItem('hirehub_last_activity');
            if (!lastActivityStr) return;

            const lastActivity = Number(lastActivityStr);
            const now = Date.now();
            const elapsed = now - lastActivity;

            if (elapsed >= INACTIVITY_TIMEOUT_MS) {
                performSessionLogout('inactivity');
            }
        };

        // Attach user activity listeners
        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach((evt) => {
            window.addEventListener(evt, handleUserActivity, { passive: true });
        });

        // Periodic check every 15 seconds
        const intervalId = setInterval(checkSessionExpiry, 15000);

        // Visibility / Focus change handler (when user switches tabs or wakes up computer after hours/days)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkSessionExpiry();
            }
        };
        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', checkSessionExpiry);

        return () => {
            activityEvents.forEach((evt) => {
                window.removeEventListener(evt, handleUserActivity);
            });
            clearInterval(intervalId);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', checkSessionExpiry);
        };
    }, [user, dispatch, navigate, location.pathname]);

    return null;
};

export default SessionExpiryTracker;
