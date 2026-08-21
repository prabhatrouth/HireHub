import React, { useState, useEffect, useRef } from 'react';
import Navbar from './shared/Navbar';
import Footer from './shared/Footer';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { AI_API_END_POINT } from '@/utils/constant';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
    FileCheck2,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    Zap,
    TrendingUp,
    Copy,
    Check,
    Download,
    RefreshCw,
    Loader2,
    Briefcase,
    Layers,
    Target,
    BookOpen,
    HelpCircle,
    ArrowRight,
    Upload,
    FileText,
    Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TARGET_ROLES = [
    "Full Stack Developer",
    "Frontend React Developer",
    "Backend Node.js Engineer",
    "Python / Django Engineer",
    "Java Spring Boot Developer",
    "Data Analyst / Scientist",
    "AI / Machine Learning Engineer",
    "DevOps & Cloud Engineer",
    "Mobile App Developer (React Native / Flutter)",
    "Product Manager",
    "UI / UX Designer"
];

const SAMPLE_RESUMES = {
    fullstack: `ALEX RIVERA\nFull Stack Software Engineer | alex.rivera@example.com | San Francisco, CA\n\nPROFESSIONAL SUMMARY\nFull Stack Developer with 3+ years of experience engineering high-throughput web applications using React, Node.js, Express, TypeScript, and PostgreSQL. Passionate about scalable microservices, automated CI/CD pipelines, and intuitive UI/UX.\n\nTECHNICAL SKILLS\n- Frontend: React, Redux Toolkit, Next.js, TypeScript, Tailwind CSS, HTML5, CSS3\n- Backend: Node.js, Express, RESTful APIs, GraphQL, Python\n- Databases: PostgreSQL, MongoDB, Redis\n- DevOps & Tools: Docker, AWS (S3, EC2), Git, Jest, CI/CD GitHub Actions\n\nEXPERIENCE\nSoftware Engineer | Acme Cloud Corp | 2023 - Present\n- Architected a distributed real-time dashboard in React and WebSocket reducing latency by 42% for 50,000 active daily users.\n- Designed REST and GraphQL microservices in Node.js and TypeScript handling 1.5M daily API requests with 99.98% uptime.\n- Optimized PostgreSQL database queries and added Redis caching layer, speeding up search query performance by 65%.\n\nPROJECTS\nAI E-Commerce Suite | React, Node.js, Stripe, Gemini AI\n- Built full-featured e-commerce checkout platform with automated invoice generation and dynamic product recommendations.\n- Implemented JWT authentication, role-based access control, and responsive design for mobile & desktop.`,
    frontend: `SARAH CHEN\nSenior Frontend React Engineer | sarah.chen@example.com | New York, NY\n\nPROFESSIONAL SUMMARY\nFrontend Developer specialized in modern JavaScript (ES6+), React 18, Next.js, and design systems. Track record of optimizing web core vitals and building accessible, pixel-perfect user interfaces.\n\nTECHNICAL SKILLS\n- Core: JavaScript, TypeScript, React, Next.js, Redux, HTML5, CSS3, Tailwind CSS\n- Performance: Lighthouse 98+ scores, Webpack, Vite, SSR, Lazy Loading, Memoization\n- Testing: Jest, React Testing Library, Cypress, Storybook\n\nEXPERIENCE\nFrontend Developer | FinTech Next | 2022 - Present\n- Developed reusable component design system adopted across 8 engineering teams, accelerating release cycles by 35%.\n- Refactored legacy UI components to React 18 and Tailwind CSS, improving Time-to-Interactive (TTI) by 1.8 seconds.`,
    entrylevel: `JORDAN TAYLOR\nJunior Software Developer | Computer Science Graduate | jordan.t@example.com\n\nEDUCATION\nB.S. in Computer Science | State University | GPA: 3.8/4.0 | 2024\n\nTECHNICAL SKILLS\n- Languages: JavaScript, Python, Java, SQL, C++\n- Frameworks & Libraries: React, Node.js, Express, Tailwind CSS, Bootstrap\n- Developer Tools: Git, GitHub, VS Code, Postman, MongoDB\n\nACADEMIC & PERSONAL PROJECTS\nJob Application Tracker Web App | React, Node.js, MongoDB\n- Developed full stack web app enabling students to track job applications and interview schedules.\n- Integrated user authentication with bcrypt and JWT tokens.\n\nAlgorithm Visualizer | JavaScript, HTML5 Canvas\n- Created interactive visualizer for pathfinding (Dijkstra, A*) and sorting algorithms.`
};

const ResumeChecker = () => {
    const { user } = useSelector((store) => store.auth);
    const [targetRole, setTargetRole] = useState("Full Stack Developer");
    const [customRole, setCustomRole] = useState("");
    const [resumeText, setResumeText] = useState("");
    const [uploadedFileName, setUploadedFileName] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // Bullet optimizer state
    const [rawBullet, setRawBullet] = useState("");
    const [optimizingBullet, setOptimizingBullet] = useState(false);
    const [optimizedBullets, setOptimizedBullets] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);

    // Auto populate sample or profile info
    useEffect(() => {
        if (user?.profile?.skills?.length && !resumeText) {
            const initialSummary = `Professional Background:\n- Candidate Name: ${user.fullname || 'Student'}\n- Primary Skills: ${user.profile.skills.join(', ')}\n- Bio: ${user.profile.bio || 'Passionate software developer focusing on scalable modern applications.'}\n- Projects: Built full stack applications with authentication, responsive user interfaces, and database integrations.`;
            setResumeText(initialSummary);
            if (user?.profile?.resumeOriginalName) {
                setUploadedFileName(user.profile.resumeOriginalName);
            }
        }
    }, [user, resumeText]);

    const activeRole = customRole.trim() ? customRole.trim() : targetRole;

    const handleFileUpload = (file) => {
        if (!file) return;

        const fileName = file.name || 'resume_document';
        const fileSizeKb = Math.round(file.size / 1024);

        setUploadedFileName(fileName);

        if (file.type === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                setResumeText(content);
                toast.success(`Loaded text from ${fileName} (${fileSizeKb} KB)`);
            };
            reader.readAsText(file);
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                const bytes = new Uint8Array(arrayBuffer);
                let extracted = '';
                for (let i = 0; i < bytes.length; i++) {
                    const charCode = bytes[i];
                    if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13) {
                        extracted += String.fromCharCode(charCode);
                    }
                }
                const cleaned = extracted
                    .replace(/[\r\n]+/g, '\n')
                    .replace(/\s{2,}/g, ' ')
                    .trim();

                if (cleaned.length > 80) {
                    const resumePreview = `[Extracted from uploaded ${fileName}]:\n\n${cleaned.slice(0, 4000)}`;
                    setResumeText(resumePreview);
                    toast.success(`Successfully parsed document: ${fileName}`);
                } else {
                    const candidateFallback = `Candidate Resume Document: ${fileName} (${fileSizeKb} KB)\nCandidate Name: ${user?.fullname || 'Applicant'}\nSkills: ${user?.profile?.skills?.join(', ') || 'Full Stack, React, JavaScript, Node.js'}\nBio: ${user?.profile?.bio || 'Software Engineering specialist'}`;
                    setResumeText(candidateFallback);
                    toast.success(`Attached ${fileName}. Add any key bullets below for deepest scanning.`);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const loadProfileResume = () => {
        if (!user) {
            toast.error("Please sign in to load your saved profile resume.");
            return;
        }
        const profileResumeSummary = `Candidate: ${user.fullname}\nEmail: ${user.email}\nPhone: ${user.phoneNumber || 'Not listed'}\nProfile Bio: ${user.profile?.bio || 'Software developer'}\nTechnical Skills: ${user.profile?.skills?.join(', ') || 'React, JavaScript, Node.js, SQL'}\nAttached Resume: ${user.profile?.resumeOriginalName || 'Uploaded Resume Document'}\n\nExperience Summary:\n- Developed modern full stack web applications with responsive design\n- Implemented API endpoints, database schemas, and state management`;
        setResumeText(profileResumeSummary);
        setUploadedFileName(user.profile?.resumeOriginalName || `${user.fullname}_Resume.pdf`);
        toast.success("Loaded saved profile data and resume details!");
    };

    const loadSampleResume = (type) => {
        const sample = SAMPLE_RESUMES[type];
        if (sample) {
            setResumeText(sample);
            setUploadedFileName(`Sample_${type.toUpperCase()}_Resume.txt`);
            toast.success(`Loaded sample ${type} resume template.`);
        }
    };

    const handleAnalyze = async () => {
        const textToAnalyze = resumeText.trim();
        if (!textToAnalyze && !user?.profile?.skills?.length) {
            toast.error("Please paste your resume text or ensure your profile has skills listed.");
            return;
        }

        try {
            setAnalyzing(true);
            const payload = {
                resumeText: textToAnalyze,
                targetRole: activeRole,
                skills: user?.profile?.skills || [],
                bio: user?.profile?.bio || "",
                fullname: user?.fullname || "Candidate"
            };

            const res = await axios.post(`${AI_API_END_POINT}/analyze-resume`, payload, {
                withCredentials: true
            });

            if (res.data?.success && res.data?.analysis) {
                setAnalysisResult(res.data.analysis);
                toast.success("ATS Resume Scan completed successfully!");
            } else {
                toast.error("Could not complete analysis.");
            }
        } catch (error) {
            console.error("Resume analysis failed:", error);
            toast.error(error.response?.data?.message || "Failed to analyze resume. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleOptimizeBullet = async (e) => {
        e.preventDefault();
        if (!rawBullet.trim()) {
            toast.error("Please enter a bullet point to optimize.");
            return;
        }

        try {
            setOptimizingBullet(true);
            const res = await axios.post(`${AI_API_END_POINT}/optimize-bullet`, {
                bulletText: rawBullet,
                targetRole: activeRole
            }, { withCredentials: true });

            if (res.data?.success && res.data?.result) {
                setOptimizedBullets(res.data.result);
                toast.success("Generated high-impact ATS bullet points!");
            }
        } catch (error) {
            console.error("Bullet optimization failed:", error);
            toast.error(error.response?.data?.message || "Optimization failed. Please try again.");
        } finally {
            setOptimizingBullet(false);
        }
    };

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopiedIndex(null), 2500);
    };

    const printReport = () => {
        window.print();
    };

    const getScoreColor = (score) => {
        if (score >= 85) return 'text-emerald-600 border-emerald-500 bg-emerald-50';
        if (score >= 70) return 'text-indigo-600 border-indigo-500 bg-indigo-50';
        if (score >= 50) return 'text-amber-600 border-amber-500 bg-amber-50';
        return 'text-rose-600 border-rose-500 bg-rose-50';
    };

    const getProgressBarColor = (score) => {
        if (score >= 85) return 'bg-emerald-500';
        if (score >= 70) return 'bg-indigo-600';
        if (score >= 50) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
            <div>
                <Navbar />

                {/* Hero Header */}
                <div className="bg-gradient-to-b from-purple-900 via-indigo-900 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />
                    
                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold uppercase tracking-wider mb-4">
                            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                            AI-Powered Candidate Suite
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                                    ATS Resume Checker & Optimizer
                                </h1>
                                <p className="mt-2 text-base sm:text-lg text-purple-200 max-w-2xl leading-relaxed">
                                    Simulate applicant tracking systems (ATS), discover missing industry keywords, and rewrite bullet points to land 3x more interviews.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Link to="/recommended">
                                    <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs font-semibold">
                                        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-300" />
                                        AI Job Matches
                                    </Button>
                                </Link>
                                <Link to="/student/portal">
                                    <Button className="bg-[#F83002] hover:bg-[#d92a02] text-white text-xs font-semibold shadow-md">
                                        Student Career Hub
                                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Input Configuration Column */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                    <Target className="w-5 h-5 text-[#6A38C2]" />
                                    1. Target Career Role
                                </h2>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                                            Select standard target role:
                                        </label>
                                        <select
                                            value={targetRole}
                                            onChange={(e) => setTargetRole(e.target.value)}
                                            className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            {TARGET_ROLES.map((role) => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                                            Or enter custom job role / title:
                                        </label>
                                        <Input
                                            placeholder="e.g. Senior Golang Microservices Engineer"
                                            value={customRole}
                                            onChange={(e) => setCustomRole(e.target.value)}
                                            className="text-xs sm:text-sm rounded-xl border-gray-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <FileCheck2 className="w-5 h-5 text-[#6A38C2]" />
                                        2. Resume Content
                                    </h2>
                                    {user?.profile?.resumeOriginalName && (
                                        <Badge variant="outline" className="text-[11px] bg-purple-50 text-purple-700 border-purple-200">
                                            {user.profile.resumeOriginalName}
                                        </Badge>
                                    )}
                                </div>

                                {user && (
                                    <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center justify-between gap-3">
                                        <div className="text-xs text-purple-900">
                                            <span className="font-bold">Signed in as:</span> {user.fullname}
                                            <p className="text-[11px] text-purple-700">
                                                {user.profile?.skills?.length || 0} skills in profile
                                            </p>
                                        </div>
                                        <Link to="/profile">
                                            <Button variant="ghost" size="sm" className="text-xs text-[#6A38C2] hover:bg-purple-100 font-semibold h-7">
                                                Edit Profile
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                                        Paste Resume Text, Experience, or Bio:
                                    </label>
                                    <textarea
                                        rows={10}
                                        value={resumeText}
                                        onChange={(e) => setResumeText(e.target.value)}
                                        placeholder="Paste your resume sections, work experience, project descriptions, and technical skills here for in-depth ATS parsing..."
                                        className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        Tip: Include Work Experience bullets, Project summaries, and Tech Skills for the highest accuracy.
                                    </p>
                                </div>

                                <Button
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    className="w-full bg-[#6A38C2] hover:bg-[#582ea8] text-white font-bold py-2.5 rounded-xl shadow-md transition-all gap-2"
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Scanning Resume against ATS Filters...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Run AI ATS Resume Scan
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Live AI Bullet Optimizer Tool */}
                            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs">
                                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    AI Bullet Point Rewriter
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    Turn weak descriptions into powerful, quantified Google XYZ achievements.
                                </p>

                                <form onSubmit={handleOptimizeBullet} className="space-y-3">
                                    <Input
                                        placeholder="e.g. Built frontend components with React"
                                        value={rawBullet}
                                        onChange={(e) => setRawBullet(e.target.value)}
                                        className="text-xs rounded-xl"
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={optimizingBullet}
                                        className="w-full bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl"
                                    >
                                        {optimizingBullet ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                        ) : (
                                            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                                        )}
                                        Rewrite into ATS Power Bullets
                                    </Button>
                                </form>

                                {optimizedBullets && (
                                    <div className="mt-4 space-y-2.5 pt-3 border-t border-gray-100">
                                        <p className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                                            ATS Optimized Variations:
                                        </p>
                                        {optimizedBullets.variations?.map((item, idx) => (
                                            <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl relative group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                                                        {item.type}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(item.text, idx)}
                                                        className="text-gray-500 hover:text-[#6A38C2] p-1 rounded-md transition-colors"
                                                        title="Copy bullet"
                                                    >
                                                        {copiedIndex === idx ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="text-xs font-medium text-gray-800 leading-relaxed">
                                                    • {item.text}
                                                </p>
                                                {item.impactHighlight && (
                                                    <p className="text-[10px] text-gray-500 mt-1 italic">
                                                        💡 {item.impactHighlight}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Results Column */}
                        <div className="lg:col-span-7 space-y-6">
                            {!analysisResult && !analyzing && (
                                <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center shadow-xs">
                                    <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#6A38C2] flex items-center justify-center mx-auto mb-4">
                                        <FileCheck2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        Ready for ATS Resume Audit
                                    </h3>
                                    <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 mb-6">
                                        Select your target role on the left and click "Run AI ATS Resume Scan" to see your score, keyword analysis, and actionable improvements.
                                    </p>
                                    <Button
                                        onClick={handleAnalyze}
                                        className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold px-6 py-2 rounded-xl"
                                    >
                                        <Zap className="w-4 h-4 mr-1.5" />
                                        Analyze Now
                                    </Button>
                                </div>
                            )}

                            {analyzing && (
                                <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center shadow-xs flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#6A38C2] flex items-center justify-center mb-4">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Evaluating Resume against {activeRole} ATS Criteria...
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                                        Scanning keyword density, action verbs, quantified achievements, and section formatting.
                                    </p>
                                </div>
                            )}

                            {analysisResult && !analyzing && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {/* Overall Score Card */}
                                    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-gray-100">
                                            <div className="text-center sm:text-left">
                                                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6A38C2] uppercase tracking-wider mb-1">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    ATS Compatibility Report
                                                </div>
                                                <h3 className="text-2xl font-extrabold text-gray-900">
                                                    {analysisResult.targetRole}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Grade: <span className="font-bold text-gray-900">{analysisResult.grade}</span>
                                                </p>
                                            </div>

                                            {/* Score Dial */}
                                            <div className="flex items-center gap-4">
                                                <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center font-extrabold shadow-inner ${getScoreColor(analysisResult.atsScore)}`}>
                                                    <span className="text-3xl leading-none">{analysisResult.atsScore}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">/ 100</span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={printReport}
                                                    className="text-xs font-semibold border-gray-200 gap-1.5"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Print Report
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Executive Summary */}
                                        <div className="mt-5 bg-purple-50/60 border border-purple-100 rounded-2xl p-4">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1 flex items-center gap-1.5">
                                                <BookOpen className="w-3.5 h-3.5 text-[#6A38C2]" />
                                                Executive Assessment
                                            </h4>
                                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                                                {analysisResult.summary}
                                            </p>
                                        </div>

                                        {/* 4 Pillars Breakdown */}
                                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {Object.entries(analysisResult.breakdown || {}).map(([key, item]) => (
                                                <div key={key} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-gray-800">{item.label}</span>
                                                        <span className="text-xs font-extrabold text-gray-900">{item.score}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(item.score)}`}
                                                            style={{ width: `${item.score}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[11px] text-gray-600 leading-normal">
                                                        {item.details}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Skills Analysis */}
                                    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                Identified Technical & Soft Skills ({analysisResult.detectedSkills?.length || 0})
                                            </h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {analysisResult.detectedSkills?.map((skill, idx) => (
                                                    <Badge key={idx} className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium hover:bg-emerald-100">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {analysisResult.missingKeywords?.length > 0 && (
                                            <div className="pt-4 border-t border-gray-100">
                                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
                                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                                    Recommended High-Impact Keywords to Add
                                                </h4>
                                                <p className="text-xs text-gray-500 mb-3">
                                                    Adding these keywords can significantly improve your ATS ranking for {activeRole} openings:
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {analysisResult.missingKeywords.map((kw, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                                                        >
                                                            + {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actionable Recommendations */}
                                    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
                                        <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                                            <TrendingUp className="w-5 h-5 text-[#6A38C2]" />
                                            Actionable Resume Enhancements
                                        </h4>

                                        <div className="space-y-4">
                                            {analysisResult.criticalImprovements?.map((imp, idx) => (
                                                <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                                                            {imp.section}
                                                        </span>
                                                        <span className="text-xs font-semibold text-gray-800">
                                                            {imp.issue}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-1.5 pl-1 leading-relaxed">
                                                        👉 <span className="font-semibold text-gray-900">How to fix:</span> {imp.recommendation}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sample Bullet Rewrites from Analysis */}
                                    {analysisResult.bulletOptimizations?.length > 0 && (
                                        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
                                            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                                                <Zap className="w-5 h-5 text-amber-500" />
                                                Recommended Bullet Point Upgrades
                                            </h4>
                                            <div className="space-y-4">
                                                {analysisResult.bulletOptimizations.map((item, idx) => (
                                                    <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-slate-50/60">
                                                        <div className="text-xs text-gray-500 mb-1">
                                                            <span className="font-bold text-rose-600">Before:</span> "{item.original}"
                                                        </div>
                                                        <div className="text-xs sm:text-sm font-semibold text-emerald-800 mt-2 bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 flex items-start justify-between gap-3">
                                                            <div>
                                                                <span className="font-bold text-emerald-900 block mb-0.5">Optimized for ATS:</span>
                                                                • {item.optimized}
                                                            </div>
                                                            <button
                                                                onClick={() => copyToClipboard(item.optimized, `opt-${idx}`)}
                                                                className="text-emerald-700 hover:text-emerald-900 p-1 shrink-0"
                                                                title="Copy"
                                                            >
                                                                {copiedIndex === `opt-${idx}` ? (
                                                                    <Check className="w-4 h-4 text-emerald-600" />
                                                                ) : (
                                                                    <Copy className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default ResumeChecker;
