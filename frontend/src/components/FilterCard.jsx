import React, { useEffect, useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useDispatch } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import { Button } from './ui/button';
import { RotateCcw, Filter, MapPin, Briefcase, DollarSign } from 'lucide-react';

const filterData = [
    {
        filterType: "Location",
        icon: MapPin,
        array: ["Delhi NCR", "Bangalore", "Hyderabad", "Pune", "Mumbai", "Remote"]
    },
    {
        filterType: "Role / Industry",
        icon: Briefcase,
        array: ["Frontend Developer", "Backend Developer", "FullStack Developer", "Data Scientist", "DevOps Engineer"]
    },
    {
        filterType: "Salary Range",
        icon: DollarSign,
        array: ["0-40k", "42-1lakh", "1lakh to 5lakh", "5lakh+"]
    },
];

const FilterCard = ({ onApply }) => {
    const [selectedValue, setSelectedValue] = useState('');
    const dispatch = useDispatch();

    const changeHandler = (value) => {
        setSelectedValue(value);
        if (onApply) onApply();
    };

    const clearFilter = () => {
        setSelectedValue('');
        dispatch(setSearchedQuery(''));
        if (onApply) onApply();
    };

    useEffect(() => {
        if (selectedValue) {
            dispatch(setSearchedQuery(selectedValue));
        }
    }, [selectedValue, dispatch]);

    return (
        <div className="w-full bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#6A38C2]" />
                    Filter Jobs
                </h3>
                {selectedValue && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilter}
                        className="text-xs text-rose-600 hover:bg-rose-50 h-7 px-2.5 rounded-lg flex items-center gap-1 font-semibold"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </Button>
                )}
            </div>

            <RadioGroup value={selectedValue} onValueChange={changeHandler} className="space-y-6">
                {filterData.map((data, index) => {
                    const Icon = data.icon;
                    return (
                        <div key={index} className="space-y-2.5">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-500 uppercase tracking-wider">
                                <Icon className="w-3.5 h-3.5 text-slate-400" />
                                <span>{data.filterType}</span>
                            </div>
                            <div className="space-y-1.5 pt-0.5">
                                {data.array.map((item, idx) => {
                                    const itemId = `filter-${index}-${idx}`;
                                    const isSelected = selectedValue === item;
                                    return (
                                        <div
                                            key={itemId}
                                            className={`flex items-center space-x-2.5 py-1.5 px-2.5 rounded-xl transition-colors cursor-pointer ${
                                                isSelected ? 'bg-purple-50 text-[#6A38C2] font-bold' : 'hover:bg-slate-50 text-slate-700'
                                            }`}
                                            onClick={() => changeHandler(item)}
                                        >
                                            <RadioGroupItem value={item} id={itemId} className="text-[#6A38C2] border-slate-300" />
                                            <Label
                                                htmlFor={itemId}
                                                className="text-xs sm:text-sm cursor-pointer font-medium leading-none select-none flex-1"
                                            >
                                                {item}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </RadioGroup>
        </div>
    );
};

export default FilterCard;

