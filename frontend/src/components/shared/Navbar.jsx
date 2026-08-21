import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { LogOut, User2, Menu, X, Sparkles, Briefcase, Building2, Compass, Home as HomeIcon, PlusCircle } from 'lucide-react';
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
            axios.defaults.withCredentials = true;
            const res = await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
            if (res.data?.success) {
                dispatch(setUser(null));
                navigate('/');
                toast.success(res.data.message || 'Logged out successfully');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Logout failed');
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand Logo */}
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-1.5 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6A38C2] to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-purple-200">
                                <Briefcase className="w-4 h-4" />
                            </div>
                            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">
                                Hire<span className="text-[#F83002]">Hub</span>
                            </span>
                            <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-[#6A38C2] to-indigo-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-xs">
                                <Sparkles className="w-2.5 h-2.5" />
                                AI
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        <ul className="flex items-center gap-6 text-sm font-medium text-gray-600">
                            {user && user.role === 'recruiter' ? (
                                <>
                                    <li>
                                        <Link
                                            to="/admin/companies"
                                            className={`transition-colors hover:text-[#6A38C2] flex items-center gap-1.5 ${
                                                isActive('/admin/companies') ? 'text-[#6A38C2] font-semibold' : ''
                                            }`}
                                        >
                                            <Building2 className="w-4 h-4" />
                                            Companies
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/admin/jobs"
                                            className={`transition-colors hover:text-[#6A38C2] flex items-center gap-1.5 ${
                                                isActive('/admin/jobs') ? 'text-[#6A38C2] font-semibold' : ''
                                            }`}
                                        >
                                            <Briefcase className="w-4 h-4" />
                                            Jobs & Applicants
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/admin/jobs/create"
                                            className="text-xs bg-purple-50 text-[#6A38C2] font-semibold px-2.5 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-100 flex items-center gap-1"
                                        >
                                            <PlusCircle className="w-3.5 h-3.5" />
                                            Post New Job
                                        </Link>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li>
                                        <Link
                                            to="/"
                                            className={`transition-colors hover:text-[#6A38C2] ${
                                                isActive('/') ? 'text-[#6A38C2] font-semibold' : ''
                                            }`}
                                        >
                                            Home
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/jobs"
                                            className={`transition-colors hover:text-[#6A38C2] ${
                                                isActive('/jobs') ? 'text-[#6A38C2] font-semibold' : ''
                                            }`}
                                        >
                                            Find Jobs
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/browse"
                                            className={`transition-colors hover:text-[#6A38C2] ${
                                                isActive('/browse') ? 'text-[#6A38C2] font-semibold' : ''
                                            }`}
                                        >
                                            Browse
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </nav>

                    {/* Right Side: Auth / Profile */}
                    <div className="hidden md:flex items-center gap-3">
                        {!user ? (
                            <div className="flex items-center gap-2.5">
                                <Link to="/login">
                                    <Button variant="ghost" size="sm" className="font-semibold text-gray-700 hover:text-gray-900">
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582da5] text-white font-semibold shadow-xs">
                                        Sign Up
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none">
                                        <Avatar className="h-9 w-9 border border-purple-200">
                                            <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                                            <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs">
                                                {user?.fullname?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-left hidden lg:block pr-1">
                                            <p className="text-xs font-semibold text-gray-800 leading-none">{user?.fullname}</p>
                                            <p className="text-[11px] text-gray-500 capitalize">{user?.role}</p>
                                        </div>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 p-4" align="end">
                                    <div>
                                        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                            <Avatar className="h-10 w-10 border border-gray-200">
                                                <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                                                <AvatarFallback className="bg-purple-100 text-purple-700 font-bold">
                                                    {user?.fullname?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-sm text-gray-900 truncate">{user?.fullname}</h4>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                                <span className="inline-block mt-0.5 text-[10px] px-2 py-0.2 bg-purple-50 text-[#6A38C2] font-semibold rounded-full capitalize">
                                                    {user?.role} Account
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 space-y-1">
                                            {user.role === 'student' && (
                                                <Link
                                                    to="/profile"
                                                    className="flex items-center gap-2.5 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-purple-50 hover:text-[#6A38C2] rounded-lg transition-colors"
                                                >
                                                    <User2 className="w-4 h-4 text-gray-500" />
                                                    <span>View & Edit Profile</span>
                                                </Link>
                                            )}

                                            <button
                                                onClick={logoutHandler}
                                                className="w-full flex items-center gap-2.5 px-2 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
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
                            <Avatar className="h-8 w-8 border border-purple-200">
                                <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                                <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs">
                                    {user?.fullname?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-1.5 text-gray-700"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1">
                        {user && user.role === 'recruiter' ? (
                            <>
                                <Link
                                    to="/admin/companies"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                                        isActive('/admin/companies') ? 'bg-purple-50 text-[#6A38C2]' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Building2 className="w-4 h-4 text-[#6A38C2]" />
                                    <span>Manage Companies</span>
                                </Link>
                                <Link
                                    to="/admin/jobs"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                                        isActive('/admin/jobs') ? 'bg-purple-50 text-[#6A38C2]' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Briefcase className="w-4 h-4 text-[#6A38C2]" />
                                    <span>Jobs & AI Applicants</span>
                                </Link>
                                <Link
                                    to="/admin/jobs/create"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold bg-purple-50 text-[#6A38C2]"
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
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                                        isActive('/') ? 'bg-purple-50 text-[#6A38C2]' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <HomeIcon className="w-4 h-4" />
                                    <span>Home</span>
                                </Link>
                                <Link
                                    to="/jobs"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                                        isActive('/jobs') ? 'bg-purple-50 text-[#6A38C2]' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Briefcase className="w-4 h-4" />
                                    <span>Explore Jobs</span>
                                </Link>
                                <Link
                                    to="/browse"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                                        isActive('/browse') ? 'bg-purple-50 text-[#6A38C2]' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Compass className="w-4 h-4" />
                                    <span>Browse Categories</span>
                                </Link>
                                {user && (
                                    <Link
                                        to="/profile"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                                            isActive('/profile') ? 'bg-purple-50 text-[#6A38C2]' : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <User2 className="w-4 h-4" />
                                        <span>Candidate Profile</span>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                        {!user ? (
                            <div className="grid grid-cols-2 gap-2">
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full text-xs font-semibold">
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                                    <Button className="w-full text-xs bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold">
                                        Sign Up
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="px-3 py-2 bg-gray-50 rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{user.fullname}</p>
                                        <p className="text-[11px] text-gray-500">{user.email}</p>
                                    </div>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-100 text-[#6A38C2] rounded-full capitalize">
                                        {user.role}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        logoutHandler();
                                    }}
                                    className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center justify-center gap-1.5"
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
