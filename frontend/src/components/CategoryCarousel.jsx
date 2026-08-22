import React from 'react';
import {
    Code2,
    Server,
    Layers,
    BrainCircuit,
    Palette,
    Smartphone,
    Database,
    Shield,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSearchedQuery } from '@/redux/jobSlice';

const categories = [
    {
        name: 'Frontend Engineering',
        query: 'Frontend',
        icon: Code2,
        color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-200/80',
        badgeColor: 'bg-blue-50 text-blue-700',
        count: '140+ Open Roles',
    },
    {
        name: 'Backend & Cloud',
        query: 'Backend',
        icon: Server,
        color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200/80',
        badgeColor: 'bg-emerald-50 text-emerald-700',
        count: '190+ Open Roles',
    },
    {
        name: 'Full Stack Development',
        query: 'FullStack',
        icon: Layers,
        color: 'from-purple-500/10 to-pink-500/10 text-purple-600 border-purple-200/80',
        badgeColor: 'bg-purple-50 text-purple-700',
        count: '210+ Open Roles',
    },
    {
        name: 'AI & Data Science',
        query: 'AI',
        icon: BrainCircuit,
        color: 'from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200/80',
        badgeColor: 'bg-amber-50 text-amber-700',
        count: '95+ Open Roles',
    },
    {
        name: 'UI/UX & Product Design',
        query: 'Designer',
        icon: Palette,
        color: 'from-rose-500/10 to-pink-500/10 text-rose-600 border-rose-200/80',
        badgeColor: 'bg-rose-50 text-rose-700',
        count: '65+ Open Roles',
    },
    {
        name: 'Mobile App (iOS/Android)',
        query: 'Mobile',
        icon: Smartphone,
        color: 'from-cyan-500/10 to-blue-500/10 text-cyan-600 border-cyan-200/80',
        badgeColor: 'bg-cyan-50 text-cyan-700',
        count: '80+ Open Roles',
    },
];

const CategoryCarousel = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const searchJobHandler = (query) => {
        dispatch(setSearchedQuery(query));
        navigate('/browse');
    };

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#6A38C2] uppercase tracking-wider mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Explore High-Growth Domains
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Featured Tech Categories
                    </h2>
                </div>
                <button
                    onClick={() => {
                        dispatch(setSearchedQuery(''));
                        navigate('/jobs');
                    }}
                    className="text-xs sm:text-sm font-bold text-[#6A38C2] hover:text-[#582da5] flex items-center gap-1 group self-start sm:self-auto"
                >
                    <span>View all opportunities</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {categories.map((cat, index) => {
                    const IconComponent = cat.icon;
                    return (
                        <button
                            key={index}
                            onClick={() => searchJobHandler(cat.query)}
                            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 transition-all text-left flex flex-col justify-between group h-full"
                        >
                            <div>
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                    <IconComponent className="w-5 h-5" />
                                </div>
                                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#6A38C2] transition-colors line-clamp-2 leading-snug">
                                    {cat.name}
                                </h3>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.badgeColor}`}>
                                    {cat.count}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default CategoryCarousel;
