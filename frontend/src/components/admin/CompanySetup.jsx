import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { ArrowLeft, Loader2, Building2, Upload } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import useGetCompanyById from '@/hooks/useGetCompanyById';

const CompanySetup = () => {
    const params = useParams();
    useGetCompanyById(params.id);
    const [input, setInput] = useState({
        name: "",
        description: "",
        website: "",
        location: "",
        file: null
    });
    const { singleCompany } = useSelector(store => store.company);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const changeFileHandler = (e) => {
        const file = e.target.files?.[0];
        setInput({ ...input, file });
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", input.name);
        formData.append("description", input.description);
        formData.append("website", input.website);
        formData.append("location", input.location);
        if (input.file) {
            formData.append("file", input.file);
        }
        try {
            setLoading(true);
            axios.defaults.withCredentials = true;
            const res = await axios.put(`${COMPANY_API_END_POINT}/update/${params.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });
            if (res.data?.success) {
                toast.success(res.data.message || "Company updated successfully");
                navigate("/admin/companies");
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update company");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (singleCompany) {
            setInput({
                name: singleCompany.name || "",
                description: singleCompany.description || "",
                website: singleCompany.website || "",
                location: singleCompany.location || "",
                file: null
            });
        }
    }, [singleCompany]);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button
                        onClick={() => navigate("/admin/companies")}
                        variant="outline"
                        size="sm"
                        className="rounded-full h-8 w-8 p-0"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-[#6A38C2]" />
                            Update Company Profile
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            Customize branding and location details
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs">
                    <form onSubmit={submitHandler} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Company Name</Label>
                                <Input
                                    type="text"
                                    name="name"
                                    value={input.name}
                                    onChange={changeEventHandler}
                                    required
                                    className="mt-1 text-sm bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold text-gray-700">Website URL</Label>
                                <Input
                                    type="text"
                                    name="website"
                                    value={input.website}
                                    onChange={changeEventHandler}
                                    placeholder="https://example.com"
                                    className="mt-1 text-sm bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label className="text-xs font-semibold text-gray-700">Location</Label>
                                <Input
                                    type="text"
                                    name="location"
                                    value={input.location}
                                    onChange={changeEventHandler}
                                    placeholder="e.g. Bangalore, India"
                                    className="mt-1 text-sm bg-gray-50/50 border-gray-200"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label className="text-xs font-semibold text-gray-700">Company Description</Label>
                                <textarea
                                    name="description"
                                    value={input.description}
                                    onChange={changeEventHandler}
                                    rows={3}
                                    placeholder="What does your company do and what is your mission?"
                                    className="mt-1 w-full rounded-md border border-gray-200 bg-gray-50/50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#6A38C2] focus:border-[#6A38C2]"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label className="text-xs font-semibold text-gray-700">Company Logo</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={changeFileHandler}
                                    className="mt-1 text-sm bg-gray-50/50 border-gray-200 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-[#6A38C2] hover:file:bg-purple-100 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#6A38C2] hover:bg-[#582da5] text-white font-bold h-11 text-sm shadow-xs"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    'Update Company Details'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompanySetup;
