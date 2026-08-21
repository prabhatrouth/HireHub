import React from 'react';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, Building2, Clock, Sparkles } from 'lucide-react';

const LatestJobCards = ({ job }) => {
    const navigate = useNavigate();

    const companyName =
        (typeof job?.company === 'object' && job?.company?.name) ||
        (typeof job?.company === 'string' && job?.company) ||
        job?.companyName ||
        'Company';

    const companyLogo =
        typeof job?.company === 'object' ? job?.company?.logo : '';

    return (
        <div
            onClick={() => navigate(`/description/${job._id}`)}
            className="group p-5 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:shadow-md hover:border-purple-200 transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
            <div>
                {/* Company Header */}
                <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10 rounded-xl border border-gray-100 bg-gray-50 shrink-0">
                        <AvatarImage src={companyLogo} alt={companyName} />
                        <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs">
                            {companyName.charAt(0) || 'C'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-[#6A38C2] transition-colors">
                            {companyName}
                        </h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="truncate">{job?.location || 'India'}</span>
                        </p>
                    </div>
                </div>

                {/* Title & Description */}
                <div className="mb-4">
                    <h3 className="font-bold text-base text-gray-900 group-hover:text-[#6A38C2] transition-colors line-clamp-1 mb-1">
                        {job?.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {job?.description}
                    </p>
                </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-gray-100">
                <Badge variant="outline" className="text-blue-700 bg-blue-50/70 border-blue-200 text-[11px] font-semibold">
                    {job?.position || 1} Positions
                </Badge>
                <Badge variant="outline" className="text-[#F83002] bg-orange-50/70 border-orange-200 text-[11px] font-semibold">
                    {job?.jobType || 'Full Time'}
                </Badge>
                <Badge variant="outline" className="text-[#6A38C2] bg-purple-50/70 border-purple-200 text-[11px] font-semibold">
                    {job?.salary ? `${job.salary} LPA` : 'Competitive'}
                </Badge>
            </div>
        </div>
    );
};

export default LatestJobCards;
