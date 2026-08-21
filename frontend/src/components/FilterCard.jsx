import React, { useEffect, useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useDispatch } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import { Button } from './ui/button';
import { RotateCcw, Filter } from 'lucide-react';

const filterData = [
    {
        filterType: "Location",
        array: ["Delhi NCR", "Bangalore", "Hyderabad", "Pune", "Mumbai", "Remote"]
    },
    {
        filterType: "Role / Industry",
        array: ["Frontend Developer", "Backend Developer", "FullStack Developer", "Data Scientist", "DevOps Engineer"]
    },
    {
        filterType: "Salary Range",
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
        <div className="w-full bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#6A38C2]" />
                    Filter Jobs
                </h3>
                {selectedValue && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilter}
                        className="text-xs text-rose-600 hover:bg-rose-50 h-7 px-2 flex items-center gap-1"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Clear
                    </Button>
                )}
            </div>

            <RadioGroup value={selectedValue} onValueChange={changeHandler} className="space-y-5">
                {filterData.map((data, index) => (
                    <div key={index} className="space-y-2">
                        <h4 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">
                            {data.filterType}
                        </h4>
                        <div className="space-y-1.5 pt-1">
                            {data.array.map((item, idx) => {
                                const itemId = `filter-${index}-${idx}`;
                                return (
                                    <div key={itemId} className="flex items-center space-x-2.5 py-0.5">
                                        <RadioGroupItem value={item} id={itemId} className="text-[#6A38C2] border-gray-300" />
                                        <Label
                                            htmlFor={itemId}
                                            className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 cursor-pointer font-medium"
                                        >
                                            {item}
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </RadioGroup>
        </div>
    );
};

export default FilterCard;
