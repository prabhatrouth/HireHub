import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setUser } from '@/redux/authSlice';
import { ADMIN_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import {
    ShieldCheck,
    Lock,
    Key,
    Database,
    Eye,
    EyeOff,
    Loader2,
    ArrowRight,
    Server,
    CheckCircle2,
    Info,
    Terminal,
} from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

const AdminLogin = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showCredentialsHelp, setShowCredentialsHelp] = useState(false);

    const { loading, user } = useSelector((store) => store.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        if (user && user.role === 'admin') {
            navigate('/admin/dashboard');
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!identifier.trim() || !password) {
            toast.error('Please enter your Admin Email / Mongo Admin ID and Password');
            return;
        }

        try {
            dispatch(setLoading(true));

            const res = await axios.post(
                `${ADMIN_API_END_POINT}/login`,
                {
                    email: identifier.trim(),
                    adminId: identifier.trim(),
                    password: password,
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true,
                }
            );

            if (res.data.success) {
                if (res.data.token) {
                    sessionStorage.setItem('token', res.data.token);
                    sessionStorage.setItem('hirehub_last_activity', Date.now().toString());
                    localStorage.removeItem('token');
                    localStorage.removeItem('persist:root');
                }
                dispatch(setUser(res.data.user));
                toast.success(res.data.message || 'Authenticated as Website Administrator');
                navigate('/admin/dashboard');
            }
        } catch (error) {
            console.error('Admin Login Error:', error);
            const msg =
                error.response?.data?.message ||
                'Authentication failed. Verify that your MongoDB admin user has role: "admin" or test with the demo credentials.';
            toast.error(msg);
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleQuickFillDemo = () => {
        setIdentifier('admin@hirehub.internal');
        setPassword('Demo@123');
        toast.info('Populated with default Demo Admin credentials.');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-lg z-10">
                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono font-medium text-slate-400 flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>SECURITY GATEWAY : ROOT ADMIN</span>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/80">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-purple-600/30">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Platform Administration
                        </h1>
                        <p className="text-sm text-slate-400 mt-2">
                            Sign in to manage MongoDB users, recruiters, jobs, companies, and platform facilities.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Admin Identifier */}
                        <div>
                            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                Admin Email or MongoDB User ID
                            </Label>
                            <div className="relative mt-2">
                                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <Input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="admin@hirehub.internal or Mongo ObjectId"
                                    required
                                    className="pl-10 h-12 rounded-xl bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-purple-500 focus:ring-purple-500/20 font-mono text-sm"
                                />
                            </div>
                        </div>

                        {/* Admin Password */}
                        <div>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Master Password
                                </Label>
                            </div>
                            <div className="relative mt-2">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your admin password"
                                    required
                                    className="pl-10 pr-10 h-12 rounded-xl bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-purple-500 focus:ring-purple-500/20 font-mono text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 text-sm transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Verifying Administrator Access...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Access Admin Command Center
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Quick Demo & MongoDB Setup Guide */}
                    <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Need instant testing credentials?</span>
                            <button
                                type="button"
                                onClick={handleQuickFillDemo}
                                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                            >
                                Quick Fill Demo Admin
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowCredentialsHelp(!showCredentialsHelp)}
                            className="w-full py-2 px-3 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-between transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <Database className="w-3.5 h-3.5 text-purple-400" />
                                How to add your Admin user in MongoDB
                            </span>
                            <span>{showCredentialsHelp ? '▲' : '▼'}</span>
                        </button>

                        {showCredentialsHelp && (
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2.5 animate-in fade-in duration-200">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    <p>
                                        <strong>In your MongoDB `users` collection:</strong> Add or update a document with:
                                    </p>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg font-mono text-[11px] text-purple-300 overflow-x-auto border border-slate-800">
                                    <pre>{`{\n  "fullname": "Your Admin Name",\n  "email": "your-admin-email@domain.com",\n  "password": "your-password-or-bcrypt-hash",\n  "role": "admin"\n}`}</pre>
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    You can enter either your admin email or the MongoDB <code className="text-purple-300">_id</code> in the identifier box above. Both bcrypt-hashed and plain passwords in MongoDB are supported.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Security Notice */}
                <div className="text-center mt-6">
                    <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-slate-500" />
                        Privileged access portal. Direct route access only.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
