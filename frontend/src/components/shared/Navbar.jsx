import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
    LogOut,
    User2,
    Menu,
    X,
    Sparkles,
    Briefcase,
    Building2,
    Compass,
    Home as HomeIcon,
    PlusCircle,
    FileCheck2,
    Video,
    ChevronDown,
    Layers,
    Bot
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';
import { setUser } from '@/redux/authSlice';
import { toast } from 'sonner';

const Navbar = () => {
    const { user } = useSelector((store) => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const logoutHandler = async () => {
        try {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('hirehub_last_activity');
            localStorage.removeItem('token');
            localStorage.removeItem('persist:root');
            axios.defaults.withCredentials = true;
            const res = await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
            dispatch(setUser(null));
            navigate('/');
            toast.success(res.data?.message || 'Logged out successfully');
        } catch (error) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('hirehub_last_activity');
            localStorage.removeItem('token');
            localStorage.removeItem('persist:root');
            dispatch(setUser(null));
            navigate('/');
            console.error(error);
            toast.error(error.response?.data?.message || 'Logged out');
        }
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-18">
                    {/* Brand Logo */}
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6A38C2] via-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div className="flex items-center tracking-tight font-extrabold text-xl sm:text-2xl text-slate-900">
                                <span>Hire</span>
                                <span className="text-[#F83002]">Hub</span>
                                <span className="ml-1.5 inline-flex items-center gap-1 bg-gradient-to-r from-[#6A38C2] to-indigo-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-xs">
                                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                                    AI
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                        {user && user.role === 'recruiter' ? (
                            <>
                                <Link
                                    to="/admin/portal"
                                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                                        isActive('/admin/portal') && !location.search.includes('tab=interviews')
                                            ? 'bg-purple-50 text-[#6A38C2]'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-[#6A38C2]" />
                                    Recruiter Hub
                                </Link>
                                <Link
                                    to="/admin/portal?tab=interviews"
                                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                                        location.search.includes('tab=interviews')
                                            ? 'bg-rose-50 text-rose-700 font-bold'
                                            : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/50'
                                    }`}
                                >
                                    <Video className="w-3.5 h-3.5 text-rose-500" />
                                    Live Interviews
                                </Link>
                                <Link
                                    to="/admin/companies"
                                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                                        isActive('/admin/companies')
                                            ? 'bg-purple-50 text-[#6A38C2]'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <Building2 className="w-3.5 h-3.5" />
                                    Companies
                                </Link>
                                <Link
                                    to="/admin/jobs"
                                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                                        isActive('/admin/jobs') && !isActive('/admin/jobs/create')
                                            ? 'bg-purple-50 text-[#6A38C2]'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <Briefcase className="w-3.5 h-3.5" />
                                    Jobs & Applicants
                                </Link>
                                <Link
                                    to="/admin/jobs/create"
                                    className="ml-2 text-xs bg-[#6A38C2] hover:bg-[#582da5] text-white font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shadow-purple-500/20 hover:shadow-md transition-all"
                                >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    Post Job
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/"
                                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                                        isActive('/') && location.pathname === '/'
                                            ? 'bg-purple-50 text-[#6A38C2]'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    Home
                                </Link>
                                <Link
                                    to="/jobs"
                                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                                        isActive('/jobs')
                                            ? 'bg-purple-50 text-[#6A38C2]'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    Find Jobs
                                </Link>
                                <Link
                                    to="/recommended"
                                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                                        isActive('/recommended')
                                            ? 'bg-purple-50 text-[#6A38C2]'
                                            : 'text-slate-600 hover:text-[#6A38C2] hover:bg-purple-50/50'
                                    }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                    AI Matches
                                </Link>
                                <Link
                                    to="/resume-checker"
                                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                                        isActive('/resume-checker')
                                            ? 'bg-purple-50 text-[#6A38C2]'
                                            : 'text-slate-600 hover:text-[#6A38C2] hover:bg-purple-50/50'
                                    }`}
                                >
                                    <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
                                    ATS Resume
                                </Link>
                                <Link
                                    to="/student/portal?tab=my-interviews"
                                    className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50/80 border border-rose-200/80 hover:bg-rose-100/80 transition-all flex items-center gap-1.5"
                                >
                                    <Video className="w-3.5 h-3.5 text-rose-600" />
                                    Interviews
                                </Link>
                                <Link
                                    to="/student/portal"
                                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                                        isActive('/student/portal') && !location.search.includes('tab=my-interviews')
                                            ? 'bg-purple-50 text-[#6A38C2]'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    Career Hub
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Right Side: Auth / Profile */}
                    <div className="hidden md:flex items-center gap-3">
                        {!user ? (
                            <div className="flex items-center gap-2.5">
                                <Link to="/login">
                                    <Button variant="ghost" size="sm" className="font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs sm:text-sm px-4">
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582da5] text-white font-semibold rounded-xl text-xs sm:text-sm px-4 shadow-sm shadow-purple-500/20 hover:shadow-md transition-all">
                                        Sign Up
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-100/80 transition-all border border-slate-200/80 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#6A38C2]/20">
                                        <Avatar className="h-8 w-8 rounded-xl border border-purple-200/80">
                                            <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                                            <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs rounded-xl">
                                                {user?.fullname?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-left hidden lg:block pr-1">
                                            <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">{user?.fullname}</p>
                                            <p className="text-[10px] text-slate-500 capitalize font-medium">{user?.role}</p>
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 p-4 rounded-2xl border-slate-200/90 shadow-xl" align="end">
                                    <div>
                                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                            <Avatar className="h-10 w-10 rounded-xl border border-purple-100">
                                                <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                                                <AvatarFallback className="bg-purple-100 text-purple-700 font-bold rounded-xl">
                                                    {user?.fullname?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-sm text-slate-900 truncate">{user?.fullname}</h4>
                                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-purple-50 text-[#6A38C2] font-bold rounded-full capitalize">
                                                    {user?.role} Account
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 space-y-1">
                                            {user.role === 'recruiter' ? (
                                                <>
                                                    <Link
                                                        to="/admin/portal"
                                                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#6A38C2] rounded-xl transition-colors"
                                                    >
                                                        <Sparkles className="w-4 h-4 text-purple-600" />
                                                        <span>Recruiter Command Hub</span>
                                                    </Link>
                                                    <Link
                                                        to="/admin/portal?tab=interviews"
                                                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors"
                                                    >
                                                        <Video className="w-4 h-4 text-rose-500" />
                                                        <span>Live Video Interviews</span>
                                                    </Link>
                                                    <Link
                                                        to="/admin/jobs/create"
                                                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#6A38C2] rounded-xl transition-colors"
                                                    >
                                                        <PlusCircle className="w-4 h-4 text-purple-600" />
                                                        <span>Post New Role</span>
                                                    </Link>
                                                </>
                                            ) : (
                                                <>
                                                    <Link
                                                        to="/student/portal"
                                                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#6A38C2] rounded-xl transition-colors"
                                                    >
                                                        <Sparkles className="w-4 h-4 text-purple-600" />
                                                        <span>Student Career Hub</span>
                                                    </Link>
                                                    <Link
                                                        to="/resume-checker"
                                                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#6A38C2] rounded-xl transition-colors"
                                                    >
                                                        <FileCheck2 className="w-4 h-4 text-purple-600" />
                                                        <span>ATS Resume Checker</span>
                                                    </Link>
                                                    <Link
                                                        to="/profile"
                                                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#6A38C2] rounded-xl transition-colors"
                                                    >
                                                        <User2 className="w-4 h-4 text-slate-500" />
                                                        <span>View & Edit Profile</span>
                                                    </Link>
                                                </>
                                            )}

                                            <button
                                                onClick={logoutHandler}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                                            >
                                                <LogOut className="w-4 h-4 text-rose-500" />
                                                <span>Log Out</span>
                                            </button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>

                    {/* Mobile Hamburger Button */}
                    <div className="flex md:hidden items-center gap-2">
                        {user && (
                            <Avatar className="h-8 w-8 rounded-xl border border-purple-200">
                                <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                                <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs rounded-xl">
                                    {user?.fullname?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-1.5 text-slate-700 rounded-xl"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1">
                        {user && user.role === 'recruiter' ? (
                            <>
                                <Link
                                    to="/admin/portal"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                                        isActive('/admin/portal') && !location.search.includes('tab=interviews') ? 'bg-purple-50 text-[#6A38C2]' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <Sparkles className="w-4 h-4 text-[#6A38C2]" />
                                    <span>Recruiter Command Hub</span>
                                </Link>
                                <Link
                                    to="/admin/portal?tab=interviews"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50/70"
                                >
                                    <Video className="w-4 h-4 text-rose-500" />
                                    <span>Live Video Interviews</span>
                                </Link>
                                <Link
                                    to="/admin/companies"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                                        isActive('/admin/companies') ? 'bg-purple-50 text-[#6A38C2]' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <Building2 className="w-4 h-4 text-[#6A38C2]" />
                                    <span>Manage Companies</span>
                                </Link>
                                <Link
                                    to="/admin/jobs"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                                        isActive('/admin/jobs') ? 'bg-purple-50 text-[#6A38C2]' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <Briefcase className="w-4 h-4 text-[#6A38C2]" />
                                    <span>Jobs & AI Applicants</span>
                                </Link>
                                <Link
                                    to="/admin/jobs/create"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-[#6A38C2] text-white shadow-xs"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    <span>Post a New Job</span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                                        isActive('/') && location.pathname === '/' ? 'bg-purple-50 text-[#6A38C2]' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <HomeIcon className="w-4 h-4" />
                                    <span>Home</span>
                                </Link>
                                <Link
                                    to="/jobs"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                                        isActive('/jobs') ? 'bg-purple-50 text-[#6A38C2]' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <Briefcase className="w-4 h-4" />
                                    <span>Explore Jobs</span>
                                </Link>
                                <Link
                                    to="/recommended"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                                        isActive('/recommended') ? 'bg-purple-50 text-[#6A38C2]' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    <span>AI Job Matches</span>
                                </Link>
                                <Link
                                    to="/resume-checker"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                                        isActive('/resume-checker') ? 'bg-purple-50 text-[#6A38C2]' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <FileCheck2 className="w-4 h-4 text-purple-600" />
                                    <span>ATS Resume Checker</span>
                                </Link>
                                <Link
                                    to="/student/portal?tab=my-interviews"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50"
                                >
                                    <Video className="w-4 h-4 text-rose-600" />
                                    <span>Live Video Interviews</span>
                                </Link>
                                <Link
                                    to="/student/portal"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                                        isActive('/student/portal') ? 'bg-purple-50 text-[#6A38C2]' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    <span>Student Career Hub</span>
                                </Link>
                                {user && (
                                    <Link
                                        to="/profile"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                                            isActive('/profile') ? 'bg-purple-50 text-[#6A38C2]' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <User2 className="w-4 h-4" />
                                        <span>Candidate Profile</span>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                        {!user ? (
                            <div className="grid grid-cols-2 gap-2">
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full text-xs font-semibold rounded-xl h-10">
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                                    <Button className="w-full text-xs bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold rounded-xl h-10 shadow-xs">
                                        Sign Up
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                                    <div className="min-w-0 flex-1 mr-2">
                                        <p className="text-xs font-bold text-slate-900 truncate">{user.fullname}</p>
                                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-[#6A38C2] rounded-full capitalize shrink-0">
                                        {user.role}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        logoutHandler();
                                    }}
                                    className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center justify-center gap-1.5 rounded-xl h-10"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;

