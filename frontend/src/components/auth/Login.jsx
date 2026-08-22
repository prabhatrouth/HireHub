import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setUser } from '@/redux/authSlice';
import { Loader2, Mail, Lock, Sparkles, User, Briefcase, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Footer from '../shared/Footer';

const Login = () => {
    const [input, setInput] = useState({
        email: '',
        password: '',
        role: 'student',
    });
    const [showPassword, setShowPassword] = useState(false);

    const { loading, user } = useSelector((store) => store.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        if (!input.role) {
            toast.error('Please select whether you are a Student or Recruiter');
            return;
        }

        try {
            dispatch(setLoading(true));

            const res = await axios.post(
                `${USER_API_END_POINT}/login`,
                input,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
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
                navigate(res.data.user?.role === 'recruiter' ? '/admin/portal' : '/student/portal');
                toast.success(res.data.message || 'Welcome back!');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            dispatch(setLoading(false));
        }
    };

    useEffect(() => {
        if (user) {
            navigate(user.role === 'recruiter' ? '/admin/portal' : '/');
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
            <Navbar />

            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
                <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-purple-500/5 p-6 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6A38C2] to-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-purple-500/20">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Sign in to access your HireHub AI dashboard
                        </p>
                    </div>

                    {/* Role Selector Tabs */}
                    <div className="mb-6">
                        <Label className="text-xs font-bold text-slate-600 mb-2 block">I am signing in as:</Label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
                            <button
                                type="button"
                                onClick={() => setInput({ ...input, role: 'student' })}
                                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                    input.role === 'student'
                                        ? 'bg-white text-[#6A38C2] shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                <span>Candidate</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setInput({ ...input, role: 'recruiter' })}
                                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                    input.role === 'recruiter'
                                        ? 'bg-white text-[#6A38C2] shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Briefcase className="w-4 h-4" />
                                <span>Recruiter</span>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={submitHandler} className="space-y-4">
                        {/* Email Input */}
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Work or Personal Email</Label>
                            <div className="relative mt-1.5">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <Input
                                    type="email"
                                    value={input.email}
                                    name="email"
                                    onChange={changeEventHandler}
                                    placeholder="name@company.com"
                                    required
                                    className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#6A38C2] focus:ring-[#6A38C2]/20 text-sm"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-slate-700">Password</Label>
                            </div>
                            <div className="relative mt-1.5">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={input.password}
                                    name="password"
                                    onChange={changeEventHandler}
                                    placeholder="Enter your password"
                                    required
                                    className="pl-10 pr-10 h-11 rounded-xl border-slate-200 focus:border-[#6A38C2] focus:ring-[#6A38C2]/20 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-[#6A38C2] hover:bg-[#582da5] text-white font-bold rounded-xl shadow-md shadow-purple-500/20 text-sm transition-all mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Authenticating...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-1.5">
                                    Sign In to HireHub
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>

                        {/* Footer Link */}
                        <div className="text-center pt-3 border-t border-slate-100">
                            <span className="text-xs text-slate-500">
                                Don't have an account yet?{' '}
                                <Link to="/signup" className="text-[#6A38C2] font-bold hover:underline">
                                    Create one free
                                </Link>
                            </span>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Login;
