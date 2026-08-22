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
import { setLoading } from '@/redux/authSlice';
import { Loader2, Mail, Lock, User, Phone, Sparkles, Briefcase, Eye, EyeOff, ArrowRight, Upload, CheckCircle2 } from 'lucide-react';
import Footer from '../shared/Footer';

const Signup = () => {
    const [input, setInput] = useState({
        fullname: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'student',
        file: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const { loading, user } = useSelector((store) => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const changeFileHandler = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setInput({ ...input, file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        if (!input.role) {
            toast.error('Please select your role');
            return;
        }

        const formData = new FormData();
        formData.append('fullname', input.fullname);
        formData.append('email', input.email);
        formData.append('phoneNumber', input.phoneNumber);
        formData.append('password', input.password);
        formData.append('role', input.role);

        if (input.file) {
            formData.append('file', input.file);
        }

        try {
            dispatch(setLoading(true));

            const res = await axios.post(`${USER_API_END_POINT}/register`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });

            if (res.data.success) {
                navigate('/login');
                toast.success(res.data.message || 'Account created successfully! Please sign in.');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Registration failed. Please check your details.');
        } finally {
            dispatch(setLoading(false));
        }
    };

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
            <Navbar />

            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
                <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-purple-500/5 p-6 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6A38C2] to-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-purple-500/20">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Join thousands of candidates & top hiring companies
                        </p>
                    </div>

                    {/* Role Selector Tabs */}
                    <div className="mb-6">
                        <Label className="text-xs font-bold text-slate-600 mb-2 block">I am joining as:</Label>
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
                                <span>Candidate / Job Seeker</span>
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
                                <span>Recruiter / Employer</span>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={submitHandler} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Full Name</Label>
                            <div className="relative mt-1.5">
                                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <Input
                                    type="text"
                                    value={input.fullname}
                                    name="fullname"
                                    onChange={changeEventHandler}
                                    placeholder="e.g. Alex Johnson"
                                    required
                                    className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#6A38C2] focus:ring-[#6A38C2]/20 text-sm"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Email Address</Label>
                            <div className="relative mt-1.5">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <Input
                                    type="email"
                                    value={input.email}
                                    name="email"
                                    onChange={changeEventHandler}
                                    placeholder="name@example.com"
                                    required
                                    className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#6A38C2] focus:ring-[#6A38C2]/20 text-sm"
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Phone Number (10 Digits)</Label>
                            <div className="relative mt-1.5">
                                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <Input
                                    type="tel"
                                    value={input.phoneNumber}
                                    name="phoneNumber"
                                    onChange={changeEventHandler}
                                    placeholder="9876543210"
                                    required
                                    pattern="[0-9]{10}"
                                    title="Please enter a valid 10-digit phone number"
                                    className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#6A38C2] focus:ring-[#6A38C2]/20 text-sm"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Password</Label>
                            <div className="relative mt-1.5">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={input.password}
                                    name="password"
                                    onChange={changeEventHandler}
                                    placeholder="Create a strong password"
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

                        {/* Profile Picture Upload */}
                        <div className="pt-1">
                            <Label className="text-xs font-bold text-slate-700 block mb-1.5">Profile Photo (Optional)</Label>
                            <div className="flex items-center gap-3">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-200"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input
                                        accept="image/*"
                                        type="file"
                                        onChange={changeFileHandler}
                                        className="cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-[#6A38C2] hover:file:bg-purple-100 text-xs text-slate-600 border-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Signup Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-[#6A38C2] hover:bg-[#582da5] text-white font-bold rounded-xl shadow-md shadow-purple-500/20 text-sm transition-all mt-3"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating Account...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-1.5">
                                    Create Free Account
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>

                        {/* Footer Link */}
                        <div className="text-center pt-3 border-t border-slate-100">
                            <span className="text-xs text-slate-500">
                                Already have an account?{' '}
                                <Link to="/login" className="text-[#6A38C2] font-bold hover:underline">
                                    Sign In
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

export default Signup;
