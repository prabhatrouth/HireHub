import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = ['recruiter'] }) => {
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

    return (
        <>
            {children}
        </>
    );
};

export default ProtectedRoute;

