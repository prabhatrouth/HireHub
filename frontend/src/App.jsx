import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Navbar from './components/shared/Navbar'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Home from './components/Home'
import Jobs from './components/Jobs'
import Browse from './components/Browse'
import Profile from './components/Profile'
import JobDescription from './components/JobDescription'
import RecommendedJobs from './components/RecommendedJobs'
import ResumeChecker from './components/ResumeChecker'
import StudentPortal from './components/StudentPortal'
import Companies from './components/admin/Companies'
import CompanyCreate from './components/admin/CompanyCreate'
import CompanySetup from './components/admin/CompanySetup'
import AdminJobs from "./components/admin/AdminJobs";
import PostJob from './components/admin/PostJob'
import Applicants from './components/admin/Applicants'
import RecruiterPortal from './components/admin/RecruiterPortal'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AdminLogin from './components/admin/AdminLogin'
import AdminDashboard from './components/admin/AdminDashboard'
import SessionExpiryTracker from './components/shared/SessionExpiryTracker'
import InterviewAlertBanner from './components/shared/InterviewAlertBanner'
import LiveInterviewRoom from './components/interview/LiveInterviewRoom'

const RootLayout = () => {
  return (
    <>
      <InterviewAlertBanner />
      <SessionExpiryTracker />
      <Outlet />
    </>
  );
};

const appRouter = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/login',
        element: <Login />
      },
      {
        path: '/signup',
        element: <Signup />
      },
      {
        path: "/jobs",
        element: <Jobs />
      },
      {
        path: "/recommended",
        element: <RecommendedJobs />
      },
      {
        path: "/resume-checker",
        element: <ResumeChecker />
      },
      {
        path: "/student/portal",
        element: <ProtectedRoute allowedRoles={['student', 'recruiter']}><StudentPortal /></ProtectedRoute>
      },
      {
        path: "/description/:id",
        element: <JobDescription />
      },
      {
        path: "/browse",
        element: <Browse />
      },
      {
        path: "/profile",
        element: <ProtectedRoute allowedRoles={['student', 'recruiter']}><Profile /></ProtectedRoute>
      },
      // recruiter / admin routes
      {
        path: "/admin/login",
        element: <AdminLogin />
      },
      {
        path: "/admin/dashboard",
        element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
      },
      {
        path: "/admin/portal",
        element: <ProtectedRoute allowedRoles={['recruiter']}><RecruiterPortal /></ProtectedRoute>
      },
      {
        path: "/admin/companies",
        element: <ProtectedRoute allowedRoles={['recruiter']} requiredPermission="canManageCompanies"><Companies /></ProtectedRoute>
      },
      {
        path: "/admin/companies/create",
        element: <ProtectedRoute allowedRoles={['recruiter']} requiredPermission="canManageCompanies"><CompanyCreate /></ProtectedRoute>
      },
      {
        path: "/admin/companies/:id",
        element: <ProtectedRoute allowedRoles={['recruiter']} requiredPermission="canManageCompanies"><CompanySetup /></ProtectedRoute>
      },
      {
        path: "/admin/jobs",
        element: <ProtectedRoute allowedRoles={['recruiter']} requiredAnyPermissions={['canPostJobs', 'canViewAllApplicants']}><AdminJobs /></ProtectedRoute>
      },
      {
        path: "/admin/jobs/create",
        element: <ProtectedRoute allowedRoles={['recruiter']} requiredPermission="canPostJobs"><PostJob /></ProtectedRoute>
      },
      {
        path: "/admin/jobs/:id/applicants",
        element: <ProtectedRoute allowedRoles={['recruiter']} requiredPermission="canViewAllApplicants"><Applicants /></ProtectedRoute>
      },
      {
        path: "/interview/room/:roomId",
        element: <ProtectedRoute allowedRoles={['recruiter', 'student']}><LiveInterviewRoom /></ProtectedRoute>
      },
    ]
  }
])

function App() {
  return (
    <div>
      <RouterProvider router={appRouter} />
    </div>
  )
}

export default App

