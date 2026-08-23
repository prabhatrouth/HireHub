import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = ['recruiter'] }) => {
    const { user } = useSelector(store => store.auth);
    const navigate = useNavigate();
    const location = useLocation();

    const allowedRolesKey = allowedRoles.join(',');

    useEffect(() => {
        if (!user) {
            navigate("/login", { state: { from: location.pathname + location.search } });
        } else if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
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
