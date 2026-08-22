import React, { useState } from 'react';
import Navbar from './shared/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Contact, Mail, Pen, FileText, Sparkles, CheckCircle2, User, ExternalLink } from 'lucide-react';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import AppliedJobTable from './AppliedJobTable';
import UpdateProfileDialog from './UpdateProfileDialog';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useGetAppliedJobs from '@/hooks/useGetAppliedJobs';

const Profile = () => {
    useGetAppliedJobs();
    const [open, setOpen] = useState(false);
    const { user } = useSelector((store) => store.auth);

    const skills = user?.profile?.skills || [];
    const hasResume = Boolean(user?.profile?.resume);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Profile Card */}
                <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border border-gray-100 bg-gray-50 shrink-0">
                                <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                                <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xl">
                                    {user?.fullname?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="font-extrabold text-xl sm:text-2xl text-gray-900">{user?.fullname}</h1>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-[#6A38C2] rounded-full uppercase">
                                        {user?.role}
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-lg leading-relaxed">
                                    {user?.profile?.bio || 'Passionate software developer looking for high-growth engineering roles.'}
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={() => setOpen(true)}
                            variant="outline"
                            size="sm"
                            className="text-xs font-semibold flex items-center gap-1.5 border-gray-200 self-start sm:self-auto"
                        >
                            <Pen className="w-3.5 h-3.5" />
                            Edit Profile
                        </Button>
                    </div>

                    {/* Contact details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 mt-6 border-t border-gray-100 text-xs text-gray-600">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                                <Mail className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium text-gray-800">{user?.email}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                                <Contact className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium text-gray-800">{user?.phoneNumber || 'Not provided'}</span>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="pt-5 mt-5 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2.5">
                            <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider">
                                Technical Skills & Competencies
                            </h3>
                            <span className="text-[11px] text-purple-600 font-semibold">
                                Used for AI Candidate Scoring
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {skills.length > 0 ? (
                                skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-[#6A38C2] font-semibold border border-purple-200/80"
                                    >
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-400 italic">No skills listed yet. Add skills to boost your AI match score.</span>
                            )}
                        </div>
                    </div>

                    {/* Resume */}
                    <div className="pt-5 mt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-1">
                                Resume Document
                            </h3>
                            {hasResume ? (
                                <a
                                    href={user?.profile?.resume}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50/70 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{user?.profile?.resumeOriginalName || 'View Uploaded Resume'}</span>
                                    <ExternalLink className="w-3 h-3 text-blue-400" />
                                </a>
                            ) : (
                                <p className="text-xs text-gray-400">No resume uploaded. Upload a PDF resume in Edit Profile to enable automated AI screening.</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Link to="/resume-checker">
                                <Button size="sm" variant="outline" className="text-xs font-semibold border-purple-200 text-[#6A38C2] hover:bg-purple-50 h-8">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Audit Resume ATS
                                </Button>
                            </Link>
                            <Link to="/recommended">
                                <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold h-8 shadow-xs">
                                    AI Job Matches
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Applied Jobs Section */}
                <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
                        <div>
                            <h2 className="font-bold text-base sm:text-lg text-gray-900">
                                Real-Time Application Pipeline
                            </h2>
                            <p className="text-xs text-gray-500">
                                Monitor live recruiter screening, status changes, and interview stages.
                            </p>
                        </div>
                    </div>
                    <AppliedJobTable />
                </div>
            </div>

            <UpdateProfileDialog open={open} setOpen={setOpen} />
        </div>
    );
};

export default Profile;
