import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { hasPermission, canManageSubUsers, PERMISSION_LABELS, getGrantedPermissions } from "@/utils/permissions";
import { ShieldAlert, Lock, ArrowRight, CheckCircle2, Video } from "lucide-react";
import { Button } from "../ui/button";

const ProtectedRoute = ({
    children,
    allowedRoles = ['recruiter'],
    requiredPermission = null,
    requiredAnyPermissions = null,
}) => {
    const { user } = useSelector(store => store.auth);
    const navigate = useNavigate();
    const location = useLocation();

    const allowedRolesKey = allowedRoles.join(',');

    useEffect(() => {
        const isAdminRequired = allowedRoles.length === 1 && allowedRoles.includes('admin');

        if (!user) {
            // If trying to access admin dashboard, redirect to secret /admin/login
            if (isAdminRequired || location.pathname.startsWith('/admin/dashboard')) {
                navigate("/admin/login", { state: { from: location.pathname + location.search } });
            } else {
                navigate("/login", { state: { from: location.pathname + location.search } });
            }
            return;
        }

        // Platform Administrator has universal access to ALL features and facilities
        if (user.role === 'admin') {
            return;
        }

        // Non-admin trying to access admin-only route
        if (isAdminRequired) {
            navigate("/admin/login");
            return;
        }

        // Standard role validation for student / recruiter
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            if (user.role === 'student') {
                navigate("/student/portal");
            } else {
                navigate("/");
            }
        }
    }, [user, navigate, location.pathname, location.search, allowedRolesKey, allowedRoles]);

    if (!user) {
        return null;
    }

    // Platform administrator has full bypass to all facilities
    if (user.role === 'admin') {
        return <>{children}</>;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return null;
    }

    // Sub-User granular permission checks
    if (user.role === 'recruiter' && user.isSubUser) {
        // Special case: sub-users cannot manage sub-users
        if (requiredPermission === 'canManageSubUsers' && !canManageSubUsers(user)) {
            return <RestrictedAccessView user={user} requiredFeature="Sub-Users & Panel Management" />;
        }

        if (requiredPermission && !hasPermission(user, requiredPermission)) {
            const featureName = PERMISSION_LABELS[requiredPermission] || requiredPermission;
            return <RestrictedAccessView user={user} requiredFeature={featureName} />;
        }

        if (requiredAnyPermissions && Array.isArray(requiredAnyPermissions) && requiredAnyPermissions.length > 0) {
            const hasAny = requiredAnyPermissions.some(perm => hasPermission(user, perm));
            if (!hasAny) {
                const names = requiredAnyPermissions.map(p => PERMISSION_LABELS[p] || p).join(' or ');
                return <RestrictedAccessView user={user} requiredFeature={names} />;
            }
        }
    }

    return (
        <>
            {children}
        </>
    );
};

const RestrictedAccessView = ({ user, requiredFeature }) => {
    const granted = getGrantedPermissions(user);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
            <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-sm">
                    <ShieldAlert className="w-8 h-8" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    Sub-User Restricted Facility
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Access Not Granted by Lead Recruiter
                </h2>

                <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                    Your panel account <span className="font-semibold text-slate-800">({user?.email})</span> only has access to options explicitly allowed by your lead recruiter.
                </p>

                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-left mb-6 text-xs text-amber-900">
                    <p className="font-semibold mb-1 flex items-center gap-1.5 text-amber-800">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        Requires Permission:
                    </p>
                    <p className="font-medium text-slate-700">{requiredFeature}</p>
                </div>

                {granted.length > 0 && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 text-left mb-6">
                        <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                            Options Allowed for Your Account:
                        </p>
                        <div className="space-y-1.5">
                            {granted.map((permKey) => (
                                <div key={permKey} className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>{PERMISSION_LABELS[permKey] || permKey}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5">
                    <Link to="/admin/portal" className="flex-1">
                        <Button className="w-full bg-[#6A38C2] hover:bg-[#582da5] text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2">
                            <span>Go to Allowed Workspace</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    </Link>
                    <Link to="/admin/portal?tab=interviews" className="flex-1">
                        <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2">
                            <Video className="w-3.5 h-3.5 text-rose-500" />
                            <span>Live Interviews</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProtectedRoute;

