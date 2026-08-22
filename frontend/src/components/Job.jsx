import React, { useState } from 'react';
import { Button } from './ui/button';
import { Bookmark, MapPin, Building2, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Job = ({ job }) => {
    const navigate = useNavigate();
    const [saved, setSaved] = useState(false);

    const daysAgoFunction = (mongodbTime) => {
        if (!mongodbTime) return 'Recently';
        const createdAt = new Date(mongodbTime);
        const currentTime = new Date();
        const timeDifference = currentTime - createdAt;
        const days = Math.floor(timeDifference / (1000 * 24 * 60 * 60));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        return `${days}d ago`;
    };

    const handleSave = (e) => {
        e.stopPropagation();
        setSaved(!saved);
        toast.success(saved ? 'Removed from saved jobs' : 'Job saved to your bookmarks!');
    };

    const companyName =
        (typeof job?.company === 'object' && job?.company?.name) ||
        (typeof job?.company === 'string' && job?.company) ||
        job?.companyName ||
        'Verified Company';

    const companyLogo =
        typeof job?.company === 'object' ? job?.company?.logo : '';

    return (
        <div
            onClick={() => navigate(`/description/${job?._id}`)}
            className="group p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-300 transition-all duration-300 cursor-pointer flex flex-col justify-between h-full relative"
        >
            <div>
                {/* Header: Date & Bookmark */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {daysAgoFunction(job?.createdAt)}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSave}
                        className={`h-8 w-8 rounded-full transition-all ${
                            saved ? 'text-[#6A38C2] bg-purple-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        aria-label="Bookmark job"
                    >
                        <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                    </Button>
                </div>

                {/* Company & Location Info */}
                <div className="flex items-center gap-3 mb-3.5">
                    <Avatar className="h-11 w-11 rounded-xl border border-slate-200 bg-slate-50 shrink-0 group-hover:scale-105 transition-transform">
                        <AvatarImage src={companyLogo} alt={companyName} className="object-cover" />
                        <AvatarFallback className="bg-purple-100 text-purple-700 font-extrabold text-sm rounded-xl">
                            {companyName.charAt(0) || 'C'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-800 truncate group-hover:text-[#6A38C2] transition-colors">
                            {companyName}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{job?.location || 'Remote / Hybrid'}</span>
                        </p>
                    </div>
                </div>

                {/* Job Title & Short Description */}
                <div className="mb-4">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-[#6A38C2] transition-colors line-clamp-1 mb-1">
                        {job?.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                        {job?.description || 'Explore this career opportunity with a high-growth tech team.'}
                    </p>
                </div>

                {/* Key Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <Badge variant="outline" className="text-blue-700 bg-blue-50/80 border-blue-200 text-[11px] font-bold rounded-lg px-2.5 py-0.5">
                        {job?.position || 1} {job?.position > 1 ? 'Positions' : 'Position'}
                    </Badge>
                    <Badge variant="outline" className="text-rose-700 bg-rose-50/80 border-rose-200 text-[11px] font-bold rounded-lg px-2.5 py-0.5">
                        {job?.jobType || 'Full Time'}
                    </Badge>
                    <Badge variant="outline" className="text-[#6A38C2] bg-purple-50/80 border-purple-200 text-[11px] font-bold rounded-lg px-2.5 py-0.5">
                        {job?.salary ? `${job.salary} LPA` : 'Competitive'}
                    </Badge>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-3.5 border-t border-slate-100 mt-2">
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/description/${job?._id}`);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs font-bold h-9 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                    View Details
                </Button>
                <Button
                    onClick={handleSave}
                    size="sm"
                    className={`flex-1 text-xs font-bold h-9 rounded-xl transition-all shadow-xs ${
                        saved ? 'bg-purple-100 text-[#6A38C2] hover:bg-purple-200' : 'bg-[#6A38C2] hover:bg-[#582da5] text-white shadow-purple-500/20'
                    }`}
                >
                    {saved ? 'Saved' : 'Save Job'}
                </Button>
            </div>
        </div>
    );
};

export default Job;

