import React, { useState } from 'react';
import Navbar from './shared/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Contact, Mail, Pen, FileText, Sparkles, CheckCircle2, User, ExternalLink, Briefcase, Award } from 'lucide-react';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import AppliedJobTable from './AppliedJobTable';
import UpdateProfileDialog from './UpdateProfileDialog';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs';
import Footer from './shared/Footer';

const Profile = () => {
    useGetAppliedJobs();
    const [open, setOpen] = useState(false);
    const { user } = useSelector((store) => store.auth);
    const { allAppliedJobs } = useSelector((store) => store.job);

    const skills = user?.profile?.skills || [];
    const hasResume = Boolean(user?.profile?.resume);

    return (
        <div className="min-h-screen bg-[#FAFAFC] flex flex-col">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 w-full">
                {/* Profile Hero Card */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                    {/* Top banner accent */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#6A38C2] via-indigo-600 to-rose-500" />

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pt-2">
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-purple-200 bg-slate-50 shrink-0 shadow-md shadow-purple-500/10">
                                <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} className="object-cover" />
                                <AvatarFallback className="bg-purple-100 text-purple-700 font-black text-2xl">
                                    {user?.fullname?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                                        {user?.fullname}
                                    </h1>
                                    <span className="text-xs font-extrabold px-3 py-1 bg-purple-50 text-[#6A38C2] border border-purple-200 rounded-full uppercase tracking-wider">
                                        {user?.role}
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl leading-relaxed font-normal">
                                    {user?.profile?.bio || 'Driven professional seeking impactful engineering & product opportunities.'}
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={() => setOpen(true)}
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold flex items-center gap-1.5 border-slate-200 rounded-xl h-10 px-4 self-start sm:self-auto hover:bg-slate-50 text-slate-700"
                        >
                            <Pen className="w-3.5 h-3.5" />
                            Edit Profile
                        </Button>
                    </div>

                    {/* Contact details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 mt-6 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#6A38C2]">
                                <Mail className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-slate-800 truncate">{user?.email}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#6A38C2]">
                                <Contact className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-slate-800">{user?.phoneNumber || 'Not provided'}</span>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="pt-6 mt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-[#6A38C2]" />
                                Technical Skills & Competencies
                            </h3>
                            <span className="text-[11px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                                AI Matched
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {skills.length > 0 ? (
                                skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="text-xs px-3 py-1.5 rounded-xl bg-purple-50/80 text-[#6A38C2] font-bold border border-purple-200/80 shadow-2xs"
                                    >
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400 italic">No skills listed yet. Add skills in Edit Profile to boost your AI match score.</span>
                            )}
                        </div>
                    </div>

                    {/* Resume */}
                    <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider mb-2">
                                Active Resume Document
                            </h3>
                            {hasResume ? (
                                <a
                                    href={user?.profile?.resume}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-200 px-3.5 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
                                >
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                    <span>{user?.profile?.resumeOriginalName || 'View Uploaded PDF'}</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                                </a>
                            ) : (
                                <p className="text-xs text-slate-400">No resume uploaded. Upload a PDF resume to unlock automatic AI profile parsing.</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Link to="/resume-checker">
                                <Button size="sm" variant="outline" className="text-xs font-bold border-purple-200 text-[#6A38C2] hover:bg-purple-50 h-10 px-3.5 rounded-xl">
                                    <Sparkles className="w-3.5 h-3.5 mr-1 text-[#6A38C2]" />
                                    ATS Resume Score
                                </Button>
                            </Link>
                            <Link to="/recommended">
                                <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-bold h-10 px-3.5 rounded-xl shadow-md shadow-purple-500/20">
                                    AI Matched Jobs
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Applied Jobs Section */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-[#6A38C2] uppercase tracking-wider mb-1">
                                <Briefcase className="w-3.5 h-3.5" />
                                Track Applications
                            </div>
                            <h2 className="font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                                Real-Time Application Pipeline
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Live updates on recruiter screening, schedule confirmations, and interview milestones
                            </p>
                        </div>
                    </div>
                    <AppliedJobTable />
                </div>
            </div>

            <UpdateProfileDialog open={open} setOpen={setOpen} />
            <Footer />
        </div>
    );
};

export default Profile;

