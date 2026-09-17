/**
 * Granular Permission Helpers for HireHub
 * 
 * Rules:
 * 1. Platform Admin ('admin'): Full superuser access to all features.
 * 2. Primary / Lead Recruiter ('recruiter' with !isSubUser): Full recruiter access across
 *    all companies, jobs, applicants, live interviews, and sub-user/interviewer panel management.
 * 3. Sub-User ('recruiter' with isSubUser: true): Access is STRICTLY restricted to only
 *    those options explicitly granted by the lead recruiter via user.permissions[key].
 *    - They CANNOT manage sub-users/interviewers.
 *    - They CANNOT access features where their permission is false.
 */

export const PERMISSION_KEYS = {
    CAN_VIEW_ASSIGNED_INTERVIEWS: 'canViewAssignedInterviews',
    CAN_CONDUCT_INTERVIEW: 'canConductInterview',
    CAN_SUBMIT_REPORT: 'canSubmitReport',
    CAN_VIEW_ALL_INTERVIEWS: 'canViewAllInterviews',
    CAN_POST_JOBS: 'canPostJobs',
    CAN_VIEW_ALL_APPLICANTS: 'canViewAllApplicants',
    CAN_MANAGE_COMPANIES: 'canManageCompanies',
    CAN_FINALIZE_HIRING_DECISION: 'canFinalizeHiringDecision',
};

export const PERMISSION_LABELS = {
    canViewAssignedInterviews: 'View Assigned Interviews',
    canConductInterview: 'Conduct Live Coding & Interviews',
    canSubmitReport: 'Submit Interview Feedback & Scorecards',
    canViewAllInterviews: 'View All Organization Interviews',
    canPostJobs: 'Create & Post Job Openings',
    canViewAllApplicants: 'View All Job Applicants & ATS Scores',
    canManageCompanies: 'Register & Manage Companies',
    canFinalizeHiringDecision: 'Finalize Hiring Decisions (Accept/Reject)',
};

/**
 * Check if the user has a specific permission
 */
export const hasPermission = (user, permissionKey) => {
    if (!user) return false;
    // Platform Admin has all permissions
    if (user.role === 'admin') return true;
    // Primary recruiter (not a sub-user) has all recruiter permissions
    if (user.role === 'recruiter' && !user.isSubUser) return true;
    // Sub-user has only explicitly granted permissions
    if (user.isSubUser) {
        if (!user.permissions) return false;
        return Boolean(user.permissions[permissionKey]);
    }
    return false;
};

/**
 * Sub-users can NEVER manage other sub-users/interviewers
 */
export const canManageSubUsers = (user) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.role === 'recruiter' && !user.isSubUser;
};

export const canManageCompanies = (user) => hasPermission(user, PERMISSION_KEYS.CAN_MANAGE_COMPANIES);
export const canPostJobs = (user) => hasPermission(user, PERMISSION_KEYS.CAN_POST_JOBS);
export const canViewAllApplicants = (user) => hasPermission(user, PERMISSION_KEYS.CAN_VIEW_ALL_APPLICANTS);
export const canViewAllInterviews = (user) => hasPermission(user, PERMISSION_KEYS.CAN_VIEW_ALL_INTERVIEWS);
export const canConductInterview = (user) => hasPermission(user, PERMISSION_KEYS.CAN_CONDUCT_INTERVIEW);
export const canSubmitReport = (user) => hasPermission(user, PERMISSION_KEYS.CAN_SUBMIT_REPORT);
export const canViewAssignedInterviews = (user) => hasPermission(user, PERMISSION_KEYS.CAN_VIEW_ASSIGNED_INTERVIEWS);
export const canFinalizeHiringDecision = (user) => hasPermission(user, PERMISSION_KEYS.CAN_FINALIZE_HIRING_DECISION);

/**
 * Check if user has permission to see any interview functionality
 */
export const canAccessInterviews = (user) => {
    return (
        hasPermission(user, PERMISSION_KEYS.CAN_VIEW_ASSIGNED_INTERVIEWS) ||
        hasPermission(user, PERMISSION_KEYS.CAN_CONDUCT_INTERVIEW) ||
        hasPermission(user, PERMISSION_KEYS.CAN_VIEW_ALL_INTERVIEWS)
    );
};

/**
 * Check if user has permission to access the main recruiter overview
 */
export const canAccessRecruiterOverview = (user) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'recruiter' && !user.isSubUser) return true;
    return (
        hasPermission(user, PERMISSION_KEYS.CAN_POST_JOBS) ||
        hasPermission(user, PERMISSION_KEYS.CAN_VIEW_ALL_APPLICANTS) ||
        hasPermission(user, PERMISSION_KEYS.CAN_MANAGE_COMPANIES)
    );
};

/**
 * Return list of all granted permission keys for display
 */
export const getGrantedPermissions = (user) => {
    if (!user) return [];
    if (user.role === 'admin' || (user.role === 'recruiter' && !user.isSubUser)) {
        return Object.keys(PERMISSION_LABELS);
    }
    if (user.isSubUser && user.permissions) {
        return Object.keys(user.permissions).filter((key) => user.permissions[key]);
    }
    return [];
};
