import React, { useState } from 'react';
import { Button } from './ui/button';
import { Bookmark, MapPin, Building2, Clock, Sparkles } from 'lucide-react';
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
        return `${days} days ago`;
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
        'Company';

    const companyLogo =
        typeof job?.company === 'object' ? job?.company?.logo : '';

    return (
        <div
            onClick={() => navigate(`/description/${job?._id}`)}
            className="group p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:shadow-md hover:border-purple-200 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full"
        >
            <div>
                {/* Header: Date & Bookmark */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {daysAgoFunction(job?.createdAt)}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSave}
                        className={`h-8 w-8 rounded-full transition-colors ${
                            saved ? 'text-[#6A38C2] bg-purple-50' : 'text-gray-400 hover:text-gray-700'
                        }`}
                        aria-label="Bookmark job"
                    >
                        <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                    </Button>
                </div>

                {/* Company & Location Info */}
                <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-11 w-11 rounded-xl border border-gray-100 bg-gray-50 shrink-0">
                        <AvatarImage src={companyLogo} alt={companyName} />
                        <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-sm">
                            {companyName.charAt(0) || 'C'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-[#6A38C2] transition-colors">
                            {companyName}
                        </h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="truncate">{job?.location || 'Remote'}</span>
                        </p>
                    </div>
                </div>

                {/* Job Title & Short Description */}
                <div className="mb-4">
                    <h3 className="font-bold text-base text-gray-900 group-hover:text-[#6A38C2] transition-colors line-clamp-1 mb-1">
                        {job?.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {job?.description || 'Explore this career opportunity with a leading tech organization.'}
                    </p>
                </div>

                {/* Key Badges (Positions, JobType, Salary) */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <Badge variant="outline" className="text-blue-700 bg-blue-50/70 border-blue-200 text-[11px] font-semibold">
                        {job?.position || 1} {job?.position === 1 ? 'Open Role' : 'Open Roles'}
                    </Badge>
                    <Badge variant="outline" className="text-[#F83002] bg-orange-50/70 border-orange-200 text-[11px] font-semibold">
                        {job?.jobType || 'Full Time'}
                    </Badge>
                    <Badge variant="outline" className="text-[#6A38C2] bg-purple-50/70 border-purple-200 text-[11px] font-semibold">
                        {job?.salary ? `${job.salary} LPA` : 'Competitive'}
                    </Badge>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-2">
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/description/${job?._id}`);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs font-semibold h-8 border-gray-200 hover:bg-gray-50"
                >
                    View Details
                </Button>
                <Button
                    onClick={handleSave}
                    size="sm"
                    className={`flex-1 text-xs font-semibold h-8 transition-colors ${
                        saved ? 'bg-purple-100 text-[#6A38C2] hover:bg-purple-200' : 'bg-[#6A38C2] hover:bg-[#582da5] text-white'
                    }`}
                >
                    {saved ? 'Saved' : 'Save Job'}
                </Button>
            </div>
        </div>
    );
};

export default Job;
