import React from 'react';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, Building2, Clock, Sparkles, ArrowUpRight, DollarSign } from 'lucide-react';

const LatestJobCards = ({ job }) => {
    const navigate = useNavigate();

    const companyName =
        (typeof job?.company === 'object' && job?.company?.name) ||
        (typeof job?.company === 'string' && job?.company) ||
        job?.companyName ||
        'Verified Company';

    const companyLogo =
        typeof job?.company === 'object' ? job?.company?.logo : '';

    return (
        <div
            onClick={() => navigate(`/description/${job._id}`)}
            className="group p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-300 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
        >
            {/* Top accent hover glow bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
                {/* Company Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-11 w-11 rounded-xl border border-slate-200 bg-slate-50 shrink-0 group-hover:scale-105 transition-transform">
                            <AvatarImage src={companyLogo} alt={companyName} className="object-cover" />
                            <AvatarFallback className="bg-purple-100 text-purple-700 font-extrabold text-sm rounded-xl">
                                {companyName.charAt(0) || 'C'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-800 truncate group-hover:text-[#6A38C2] transition-colors">
                                {companyName}
                            </h4>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{job?.location || 'India / Remote'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-purple-50 flex items-center justify-center text-slate-400 group-hover:text-[#6A38C2] transition-colors shrink-0">
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                </div>

                {/* Title & Description */}
                <div className="mb-5">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-[#6A38C2] transition-colors line-clamp-1 mb-1.5">
                        {job?.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                        {job?.description}
                    </p>
                </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-3.5 border-t border-slate-100">
                <Badge variant="outline" className="text-blue-700 bg-blue-50/80 border-blue-200 text-[11px] font-bold rounded-lg px-2.5 py-0.5">
                    {job?.position || 1} {job?.position > 1 ? 'Openings' : 'Opening'}
                </Badge>
                <Badge variant="outline" className="text-rose-700 bg-rose-50/80 border-rose-200 text-[11px] font-bold rounded-lg px-2.5 py-0.5">
                    {job?.jobType || 'Full Time'}
                </Badge>
                <Badge variant="outline" className="text-[#6A38C2] bg-purple-50/80 border-purple-200 text-[11px] font-bold rounded-lg px-2.5 py-0.5 flex items-center gap-0.5">
                    <span>{job?.salary ? `${job.salary} LPA` : 'Competitive'}</span>
                </Badge>
            </div>
        </div>
    );
};

export default LatestJobCards;

