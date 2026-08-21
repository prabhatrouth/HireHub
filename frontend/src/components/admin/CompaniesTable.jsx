import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Edit2, MoreHorizontal, Building2, ExternalLink } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const CompaniesTable = () => {
    const { companies, searchCompanyByText } = useSelector((store) => store.company);
    const [filterCompany, setFilterCompany] = useState(companies || []);
    const navigate = useNavigate();

    useEffect(() => {
        const filtered = (companies || []).filter((company) => {
            if (!searchCompanyByText) return true;
            return company?.name?.toLowerCase().includes(searchCompanyByText.toLowerCase());
        });
        setFilterCompany(filtered);
    }, [companies, searchCompanyByText]);

    if (!filterCompany || filterCompany.length === 0) {
        return (
            <div className="p-12 text-center">
                <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-800 text-sm">No companies registered</h4>
                <p className="text-xs text-gray-500 mt-1">Register a company profile to begin posting job listings.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableCaption className="pb-3 text-xs text-gray-500">
                    A list of your registered company workspaces and hiring entities
                </TableCaption>
                <TableHeader className="bg-gray-50/80">
                    <TableRow className="border-b border-gray-200">
                        <TableHead className="font-semibold text-gray-700 text-xs py-3.5 pl-4">Company</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs py-3.5">Location</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs py-3.5">Registration Date</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs text-right py-3.5 pr-4">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filterCompany.map((company) => (
                        <TableRow key={company._id} className="hover:bg-purple-50/20 border-b border-gray-100 transition-colors">
                            {/* Company Avatar & Name */}
                            <TableCell className="py-3 pl-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 rounded-lg border border-gray-100 bg-gray-50 shrink-0">
                                        <AvatarImage src={company.logo} alt={company.name} />
                                        <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs">
                                            {company.name?.charAt(0) || 'C'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-xs">{company.name}</h4>
                                        {company.website && (
                                            <a
                                                href={company.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                                            >
                                                <span>Website</span>
                                                <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </TableCell>

                            {/* Location */}
                            <TableCell className="py-3 text-xs text-gray-600">
                                {company.location || 'India'}
                            </TableCell>

                            {/* Date */}
                            <TableCell className="py-3 text-xs text-gray-500">
                                {company.createdAt ? String(company.createdAt).split('T')[0] : 'Recent'}
                            </TableCell>

                            {/* Action */}
                            <TableCell className="py-3 text-right pr-4">
                                <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/admin/companies/${company._id}`)}
                                        className="h-7 text-xs font-semibold border-gray-200 hover:bg-gray-50"
                                    >
                                        <Edit2 className="w-3 h-3 mr-1" />
                                        Edit
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default CompaniesTable;
