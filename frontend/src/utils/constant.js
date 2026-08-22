const rawBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    "";

const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export const USER_API_END_POINT = `${API_BASE_URL}/api/v1/user`;
export const JOB_API_END_POINT = `${API_BASE_URL}/api/v1/job`;
export const APPLICATION_API_END_POINT = `${API_BASE_URL}/api/v1/application`;
export const COMPANY_API_END_POINT = `${API_BASE_URL}/api/v1/company`;
export const AI_API_END_POINT = `${API_BASE_URL}/api/v1/ai`;
export const INTERVIEW_API_END_POINT = `${API_BASE_URL}/api/v1/interview`;
