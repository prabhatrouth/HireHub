import React, { useState } from 'react';
import Navbar from '../shared/Navbar';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { setSingleCompany, setCompanies } from '@/redux/companySlice';
import { Building2, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

const CompanyCreate = () => {
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const { companies } = useSelector((store) => store.company);

    const registerNewCompany = async (e) => {
        if (e) e.preventDefault();
        const trimmedName = companyName.trim();
        if (!trimmedName) {
            toast.error('Please provide a valid company name to proceed.');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(
                `${COMPANY_API_END_POINT}/register`,
                { companyName: trimmedName },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true,
                }
            );

            if (res?.data?.success) {
                const createdCompany = res.data.company;
                dispatch(setSingleCompany(createdCompany));

                // Add or update company in redux list
                const existingList = Array.isArray(companies) ? companies : [];
                const alreadyExists = existingList.some(
                    (c) => String(c._id) === String(createdCompany?._id)
                );
                if (!alreadyExists) {
                    dispatch(setCompanies([createdCompany, ...existingList]));
                }

                toast.success(res.data.message || 'Company registered successfully!');
                const companyId = createdCompany?._id;
                if (companyId) {
                    navigate(`/admin/companies/${companyId}`);
                } else {
                    navigate('/admin/companies');
                }
            } else {
                toast.error(res?.data?.message || 'Failed to register company.');
            }
        } catch (error) {
            console.error('Company creation error:', error);
            const errMsg =
                error.response?.data?.message ||
                error.message ||
                'Failed to register company. Please try again.';
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
                {/* Back Link */}
                <button
                    onClick={() => navigate('/admin/companies')}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-6 cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Companies
                </button>

                {/* Main Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-10 shadow-xs">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-[#6A38C2] border border-purple-100 shrink-0">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                                Register New Company
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Set up your hiring organization profile, branding, and career postings.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={registerNewCompany} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-xs sm:text-sm font-semibold text-slate-700">
                                Company or Organization Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="companyName"
                                type="text"
                                className="h-11 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:border-[#6A38C2] transition-all"
                                placeholder="e.g., JobHunt Technologies, Acme Corp, Microsoft"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                autoFocus
                                disabled={loading}
                            />
                            <p className="text-xs text-slate-400">
                                You can customize the logo, website, description, and location in the next step.
                            </p>
                        </div>

                        {/* Fast Examples / Suggestions */}
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-[#6A38C2]" /> Quick sample names:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {['TechNova Solutions', 'CloudScale Systems', 'Apex Digital', 'Quantum Labs'].map((sample) => (
                                    <button
                                        key={sample}
                                        type="button"
                                        onClick={() => setCompanyName(sample)}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-[#6A38C2] text-slate-600 transition-colors border border-slate-200/60"
                                    >
                                        {sample}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/admin/companies')}
                                disabled={loading}
                                className="text-xs sm:text-sm text-slate-600 border-slate-200 hover:bg-slate-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || !companyName.trim()}
                                className="bg-[#6A38C2] hover:bg-[#582da5] text-white font-semibold text-xs sm:text-sm px-6 h-10 flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Registering...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Continue to Setup</span>
                                        <CheckCircle2 className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompanyCreate;