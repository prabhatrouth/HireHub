import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import CompaniesTable from './CompaniesTable';
import { useNavigate } from 'react-router-dom';
import useGetAllCompanies from '@/hooks/useGetAllCompanies';
import { useDispatch } from 'react-redux';
import { setSearchCompanyByText } from '@/redux/companySlice';
import { Building2, PlusCircle, Search } from 'lucide-react';

const Companies = () => {
    useGetAllCompanies();
    const [input, setInput] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setSearchCompanyByText(input));
    }, [input, dispatch]);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-[#6A38C2]" />
                            Registered Companies
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            Manage company profiles, branding, and post job listings
                        </p>
                    </div>

                    <Button
                        onClick={() => navigate('/admin/companies/create')}
                        className="bg-[#6A38C2] hover:bg-[#582da5] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Register Company
                    </Button>
                </div>

                {/* Filter / Search Bar */}
                <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs mb-6 flex items-center justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            className="pl-9 text-sm h-9 bg-gray-50/50 border-gray-200"
                            placeholder="Filter company name..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs overflow-hidden">
                    <CompaniesTable />
                </div>
            </div>
        </div>
    );
};

export default Companies;
