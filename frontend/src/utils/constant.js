const rawBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    "";

const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export const SOCKET_SERVER_URL = (() => {
    const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
    if (explicitSocketUrl) return explicitSocketUrl.replace(/\/+$/, "");

    if (API_BASE_URL) {
        try {
            if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
                const parsed = new URL(API_BASE_URL);
                return parsed.origin;
            }
        } catch (e) {
            console.warn("Could not parse API_BASE_URL for socket origin:", e);
        }
    }
    return typeof window !== "undefined" ? window.location.origin : "";
})();

export const USER_API_END_POINT = `${API_BASE_URL}/api/v1/user`;
export const JOB_API_END_POINT = `${API_BASE_URL}/api/v1/job`;
export const APPLICATION_API_END_POINT = `${API_BASE_URL}/api/v1/application`;
export const COMPANY_API_END_POINT = `${API_BASE_URL}/api/v1/company`;
export const AI_API_END_POINT = `${API_BASE_URL}/api/v1/ai`;
export const INTERVIEW_API_END_POINT = `${API_BASE_URL}/api/v1/interview`;
export const ADMIN_API_END_POINT = `${API_BASE_URL}/api/v1/admin`;
