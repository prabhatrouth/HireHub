const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_CHARACTERS = 12000;

const cleanText = (value, maxLength = 12000) =>
    String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);

export const getResumeText = async (resumeUrl) => {
    if (!resumeUrl) return "";
    try {
        const response = await fetch(resumeUrl, { signal: AbortSignal.timeout(10000) });
        const contentLength = Number(response.headers.get("content-length") || 0);
        const contentType = response.headers.get("content-type") || "";
        if (!response.ok || contentLength > MAX_RESUME_BYTES || !contentType.includes("pdf")) return "";
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > MAX_RESUME_BYTES) return "";
        const { default: pdf } = await import("pdf-parse");
        return cleanText((await pdf(buffer)).text, MAX_RESUME_CHARACTERS);
    } catch {
        return "";
    }
};

export const buildCandidateScore = (profile, job) => {
    const profileText = cleanText(
        [profile.fullname, profile.bio, ...(profile.skills || []), profile.resumeText].join(" ")
    ).toLowerCase();
    const jobTerms =
        [job.title, ...(job.requirements || []), job.description]
            .join(" ")
            .toLowerCase()
            .match(/[a-z0-9+#.]{2,}/g) || [];
    return [...new Set(jobTerms)].reduce((score, term) => score + (profileText.includes(term) ? 1 : 0), 0);
};

// Safe GenAI Client Loader
const getGenAIClient = async () => {
    if (!process.env.GEMINI_API_KEY) return null;
    try {
        const genaiModule = await import("@google/genai");
        const GoogleGenAI = genaiModule.GoogleGenAI || genaiModule.default?.GoogleGenAI;
        if (!GoogleGenAI) return null;
        return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
        console.warn("[HireHub AI] Could not load @google/genai module, fallback enabled:", err.message);
        return null;
    }
};

// 1. Student Job Recommendations
export const rankJobsWithAI = async ({ profile, resumeText, jobs }) => {
    const candidateJobs = jobs.map((job) => ({
        jobId: String(job._id),
        title: job.title,
        company: job.company?.name || "",
        location: job.location,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        description: cleanText(job.description, 1600),
        requirements: (job.requirements || []).map((item) => cleanText(item, 160)),
    }));

    const student = {
        fullname: profile.fullname,
        bio: cleanText(profile.bio, 2000),
        skills: profile.skills || [],
        resumeText: cleanText(resumeText, MAX_RESUME_CHARACTERS),
    };

    const buildFallbackRecommendations = () => {
        const profileSkillsLower = new Set(
            (profile.skills || []).map((s) => String(s).toLowerCase().trim())
        );

        return candidateJobs.map((job) => {
            const reqs = job.requirements || [];
            const matchingSkills = reqs.filter((req) =>
                profileSkillsLower.has(req.toLowerCase().trim())
            );
            const missingSkills = reqs.filter(
                (req) => !profileSkillsLower.has(req.toLowerCase().trim())
            );
            const scoreRatio = reqs.length > 0 ? matchingSkills.length / reqs.length : 0.6;
            const matchScore = Math.min(98, Math.max(50, Math.round(scoreRatio * 100)));

            return {
                jobId: job.jobId,
                matchScore,
                reason: matchingSkills.length > 0
                    ? `Strong profile alignment in: ${matchingSkills.join(", ")} for ${job.title}.`
                    : `Relevant career opportunity matching technical background.`,
                matchingSkills: matchingSkills.length > 0 ? matchingSkills : ["Core Foundation"],
                missingSkills,
            };
        }).sort((a, b) => b.matchScore - a.matchScore);
    };

    const ai = await getGenAIClient();
    if (!ai) {
        return buildFallbackRecommendations();
    }

    try {
        const prompt = `You rank existing job candidates for a student. Return at most 10 recommendations in strict JSON format.
You must use only jobId values supplied in CANDIDATE_JOBS. Never invent a job, requirement, credential, or skill.
Scores are integers from 0 to 100.
Reasons must be concise and grounded in the provided student data and job requirements.
matchingSkills are skills demonstrably present in the student data; missingSkills are job requirements not evidenced in the student data.

Output format must be a JSON object:
{
  "recommendations": [
    {
      "jobId": "string",
      "matchScore": 85,
      "reason": "string",
      "matchingSkills": ["string"],
      "missingSkills": ["string"]
    }
  ]
}

STUDENT_DATA:
${JSON.stringify(student)}

CANDIDATE_JOBS:
${JSON.stringify(candidateJobs)}`;

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2,
            },
        });

        const outputText = response.text;
        const parsed = JSON.parse(outputText);
        return parsed.recommendations || buildFallbackRecommendations();
    } catch (err) {
        console.warn("[Gemini API] Failed to generate AI recommendations, using fallback:", err.message);
        return buildFallbackRecommendations();
    }
};

// 2. Recruiter Applicant Intelligence & Skill Scoring
export const evaluateApplicantsWithAI = async ({ job, applications }) => {
    const jobData = {
        title: job.title || "Job Position",
        description: cleanText(job.description, 1000),
        requirements: (job.requirements || []).map((r) => cleanText(r, 100)),
        experienceLevel: job.experienceLevel || 0,
        location: job.location || "Remote",
    };

    const applicantsData = applications.map((app) => {
        const applicant = app.applicant || {};
        const profile = applicant.profile || {};
        return {
            applicationId: String(app._id),
            applicantId: String(applicant._id || ""),
            fullname: applicant.fullname || "Applicant",
            email: applicant.email || "",
            skills: profile.skills || [],
            bio: cleanText(profile.bio, 500),
            resumeOriginalName: profile.resumeOriginalName || "",
            status: app.status || "pending",
        };
    });

    const buildFallbackEvaluation = () => {
        const jobReqsLower = (jobData.requirements || []).map((r) => r.toLowerCase().trim());
        const jobTitleWords = jobData.title.toLowerCase().split(/\s+/);

        return applicantsData.map((cand) => {
            const candSkillsLower = (cand.skills || []).map((s) => s.toLowerCase().trim());
            const candBioLower = (cand.bio || "").toLowerCase();

            const matchingSkills = (jobData.requirements || []).filter((req) => {
                const rLow = req.toLowerCase().trim();
                return candSkillsLower.some((s) => s.includes(rLow) || rLow.includes(s)) || candBioLower.includes(rLow);
            });

            const missingSkills = (jobData.requirements || []).filter(
                (req) => !matchingSkills.includes(req)
            );

            let scoreRatio = 0.5;
            if (jobData.requirements.length > 0) {
                scoreRatio = matchingSkills.length / jobData.requirements.length;
            }

            // Bonus points for bio / title overlap
            const titleMatches = jobTitleWords.filter((w) => w.length > 2 && candBioLower.includes(w)).length;
            const bonus = Math.min(15, titleMatches * 5);

            let rawScore = Math.round(scoreRatio * 85 + bonus);
            if (matchingSkills.length === 0 && cand.skills.length > 0) rawScore = 48;
            if (matchingSkills.length === 0 && cand.skills.length === 0) rawScore = 35;
            const matchScore = Math.min(98, Math.max(30, rawScore));

            let fitTier = "Moderate Match";
            if (matchScore >= 85) fitTier = "Top Match";
            else if (matchScore >= 70) fitTier = "Strong Match";
            else if (matchScore < 50) fitTier = "Developing";

            const strengths = [];
            if (matchingSkills.length > 0) {
                strengths.push(`Direct skill proficiency in ${matchingSkills.slice(0, 3).join(", ")}`);
            }
            if (cand.skills.length >= 4) {
                strengths.push(`Broad tech stack knowledge with ${cand.skills.length} listed capabilities`);
            }
            if (cand.bio) {
                strengths.push(`Relevant background profile in ${cand.bio.slice(0, 50)}...`);
            }
            if (strengths.length === 0) {
                strengths.push("Candidate profile registered with contact details");
            }

            const recommendationSummary = matchScore >= 80
                ? `Excellent fit. Demonstrates strong alignment with ${matchingSkills.length} required skill(s) for ${jobData.title}. Recommended for interview.`
                : matchScore >= 60
                ? `Good potential match. Has foundation in ${matchingSkills.join(", ") || "core technologies"}, but may need development in ${missingSkills.slice(0, 2).join(", ") || "specialized areas"}.`
                : `Developing match. Missing several primary requirements (${missingSkills.slice(0, 3).join(", ") || "core requirements"}).`;

            return {
                applicationId: cand.applicationId,
                matchScore,
                fitTier,
                matchingSkills: matchingSkills.length > 0 ? matchingSkills : (cand.skills.slice(0, 2) || []),
                missingSkills,
                strengths,
                recommendationSummary,
            };
        }).sort((a, b) => b.matchScore - a.matchScore);
    };

    const ai = await getGenAIClient();
    if (!ai) {
        return buildFallbackEvaluation();
    }

    try {
        const prompt = `You are an expert AI Technical Recruiter for HireHub AI.
Analyze each applicant against the job details and requirements.
Return a valid JSON object with the "evaluations" array.

CRITICAL INSTRUCTIONS:
- You must evaluate ONLY the provided applicationId values.
- Calculate matchScore as an integer between 0 and 100 based on genuine skill overlap, requirements match, and candidate bio.
- fitTier must be one of: "Top Match" (85-100), "Strong Match" (70-84), "Moderate Match" (50-69), "Developing" (<50).
- matchingSkills: exact requirements or related skills the candidate possesses.
- missingSkills: job requirements the candidate lacks.
- strengths: 2-3 bullet points highlighting candidate strengths.
- recommendationSummary: concise 1-2 sentence recruiter evaluation.

Output Format:
{
  "evaluations": [
    {
      "applicationId": "string",
      "matchScore": 92,
      "fitTier": "Top Match",
      "matchingSkills": ["React", "JavaScript"],
      "missingSkills": ["Docker"],
      "strengths": ["Strong frontend experience", "Active project portfolio"],
      "recommendationSummary": "Highly qualified candidate with strong React skills. Fast-track for interview."
    }
  ]
}

JOB DETAILS:
${JSON.stringify(jobData)}

APPLICANTS:
${JSON.stringify(applicantsData)}`;

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.15,
            },
        });

        const outputText = response.text;
        const parsed = JSON.parse(outputText);
        return parsed.evaluations || buildFallbackEvaluation();
    } catch (err) {
        console.warn("[HireHub AI] Failed to evaluate applicants with AI, using fallback:", err.message);
        return buildFallbackEvaluation();
    }
};

// 3. AI Cover Letter Generator for Candidates
export const generateCoverLetterWithAI = async ({ profile, job, customNote }) => {
    const candidateName = profile.fullname || "Applicant";
    const candidateSkills = (profile.skills || []).join(", ") || "Software Development, Problem Solving";
    const candidateBio = cleanText(profile.bio, 1000);
    const jobTitle = job.title || "Target Position";
    const companyName = (typeof job.company === "object" ? job.company?.name : job.company) || "Hiring Team";
    const requirements = (job.requirements || []).join(", ") || "Technical and collaborative excellence";

    const buildFallbackCoverLetter = () => {
        return `Dear Hiring Manager at ${companyName},

I am writing to express my strong interest in the ${jobTitle} position currently open at ${companyName}. With a dedicated background in ${candidateSkills} and a passion for building scalable, high-impact solutions, I am eager to contribute effectively to your engineering and product objectives.

Throughout my technical journey, I have developed a strong foundation in core competencies including ${candidateSkills}. ${candidateBio ? `As outlined in my background: "${candidateBio}". ` : ""}I have consistently focused on delivering clean, maintainable code, collaborating with cross-functional teams, and solving challenging engineering problems.

The opportunity to join ${companyName} and contribute to your team's innovative work particularly excites me. My experience aligns closely with your requirements in ${requirements}, and I am confident that my problem-solving abilities, enthusiasm, and adaptability make me a strong candidate for this role.

Thank you for your time and consideration. I welcome the opportunity to discuss how my skill set and enthusiasm can support ${companyName}'s continued growth.

Sincerely,
${candidateName}`;
    };

    const ai = await getGenAIClient();
    if (!ai) return buildFallbackCoverLetter();

    try {
        const prompt = `You are an expert AI Career Coach and Professional Resume/Cover Letter Writer for HireHub.
Write a personalized, compelling, modern, and professional cover letter for the candidate applying for this specific job.

CANDIDATE INFO:
- Name: ${candidateName}
- Skills: ${candidateSkills}
- Background/Bio: ${candidateBio}
- Custom Note/Goal: ${customNote || "Standard professional application"}

JOB INFO:
- Position Title: ${jobTitle}
- Company Name: ${companyName}
- Requirements & Skills: ${requirements}
- Role Description: ${cleanText(job.description, 800)}

GUIDELINES:
- Output ONLY the plain text cover letter ready to copy and paste.
- Keep tone professional, confident, proactive, and tailored specifically to ${companyName} and ${jobTitle}.
- Highlight matching candidate skills against the job requirements.
- Do NOT include placeholder tokens like [Your Name] or [Insert Date]; use the candidate's name (${candidateName}) and company name (${companyName}).
- Keep length to 3-4 impactful paragraphs.`;

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
            contents: prompt,
            config: {
                temperature: 0.35,
            },
        });

        return response.text?.trim() || buildFallbackCoverLetter();
    } catch (err) {
        console.warn("[HireHub AI] Cover letter generation failed, using fallback:", err.message);
        return buildFallbackCoverLetter();
    }
};

// 4. AI Smart Interview Preparation Assistant
export const generateInterviewPrepWithAI = async ({ job, profile }) => {
    const jobTitle = job.title || "Software Engineer";
    const companyName = (typeof job.company === "object" ? job.company?.name : job.company) || "Hiring Company";
    const requirements = (job.requirements || []).join(", ") || "Technical and collaborative competencies";
    const candidateSkills = (profile?.skills || []).join(", ") || "Software Development";

    const buildFallbackPrep = () => {
        return {
            roleSummary: `Strategic interview prep for ${jobTitle} at ${companyName}, focusing on ${requirements}.`,
            technicalQuestions: [
                {
                    question: `How have you applied ${requirements.split(",")[0] || "core technologies"} in production or complex project environments?`,
                    context: "Evaluates practical architectural and problem-solving depth.",
                    sampleKeyPoints: ["Discuss real project examples", "Highlight trade-offs and performance optimizations", "Mention test coverage and maintainability"],
                },
                {
                    question: `Explain how you handle scalability, state management, and edge-case error boundaries in modern applications.`,
                    context: "Tests systems design and robustness mindset.",
                    sampleKeyPoints: ["Separation of concerns", "Resilient fallback states", "Logging and monitoring practices"],
                },
                {
                    question: `Walk us through your debugging methodology when diagnosing a high-severity production issue.`,
                    context: "Assesses analytical composure and root-cause analysis.",
                    sampleKeyPoints: ["Isolating variables", "Checking logs/metrics", "Writing regression tests post-fix"],
                },
            ],
            behavioralQuestions: [
                {
                    question: `Describe a challenging technical disagreement you had with a teammate and how you resolved it.`,
                    framework: "STAR Method (Situation, Task, Action, Result)",
                    sampleKeyPoints: ["Focus on empathy and shared objectives", "Use objective data or benchmarks", "Show respect for differing viewpoints"],
                },
                {
                    question: `Tell us about a time you had to learn a new framework or technology under tight deadlines.`,
                    framework: "STAR Method",
                    sampleKeyPoints: ["Structured learning approach", "Building an MVP prototype", "Sharing knowledge with team"],
                },
            ],
            situationalQuestions: [
                {
                    scenario: `If requirements change mid-sprint right before a release for ${companyName}, how do you prioritize?`,
                    recommendation: "Communicate proactively with product owners, evaluate critical path impact, and negotiate phased delivery.",
                },
                {
                    scenario: `How do you ensure code quality when working under compressed timeline constraints?`,
                    recommendation: "Focus on automated testing, peer reviews for core logic, and documenting technical debt for future refinement.",
                },
            ],
            salaryInsights: {
                marketBenchmark: job.salary ? `${job.salary} LPA (Company Range)` : "Competitive industry standard based on experience",
                negotiationTip: `Highlight your specific proficiency in ${requirements.split(",").slice(0, 2).join(" & ")} and your track record of reliable delivery to maximize compensation discussion.`,
            },
        };
    };

    const ai = await getGenAIClient();
    if (!ai) return buildFallbackPrep();

    try {
        const prompt = `You are an expert AI Technical Interview Coach for HireHub.
Generate a structured, high-value interview preparation guide tailored specifically to this job opening.

JOB DETAILS:
- Title: ${jobTitle}
- Company: ${companyName}
- Requirements: ${requirements}
- Description: ${cleanText(job.description, 800)}
- Candidate Skills: ${candidateSkills}

Output strict JSON in the following format:
{
  "roleSummary": "1-2 sentence executive briefing on key focus areas for this interview",
  "technicalQuestions": [
    {
      "question": "string",
      "context": "string",
      "sampleKeyPoints": ["point 1", "point 2", "point 3"]
    }
  ],
  "behavioralQuestions": [
    {
      "question": "string",
      "framework": "STAR Method (Situation, Task, Action, Result)",
      "sampleKeyPoints": ["point 1", "point 2"]
    }
  ],
  "situationalQuestions": [
    {
      "scenario": "string",
      "recommendation": "string"
    }
  ],
  "salaryInsights": {
    "marketBenchmark": "string",
    "negotiationTip": "string"
  }
}
Provide exactly 3 technical questions, 2 behavioral questions, and 2 situational questions.`;

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.25,
            },
        });

        const parsed = JSON.parse(response.text);
        return parsed || buildFallbackPrep();
    } catch (err) {
        console.warn("[HireHub AI] Interview prep generation failed, using fallback:", err.message);
        return buildFallbackPrep();
    }
};

// 5. AI Candidate-to-Job Fit Analysis
export const generateJobFitAnalysisWithAI = async ({ job, profile }) => {
    const jobTitle = job.title || "Job Position";
    const companyName = (typeof job.company === "object" ? job.company?.name : job.company) || "Hiring Company";
    const jobReqs = job.requirements || [];
    const candidateSkills = profile?.skills || [];
    const candidateBio = cleanText(profile?.bio, 600);

    const buildFallbackFit = () => {
        const cSkillsLower = candidateSkills.map((s) => s.toLowerCase().trim());
        const matching = jobReqs.filter((r) => cSkillsLower.some((cs) => cs.includes(r.toLowerCase().trim()) || r.toLowerCase().trim().includes(cs)));
        const missing = jobReqs.filter((r) => !matching.includes(r));
        const scoreRatio = jobReqs.length > 0 ? matching.length / jobReqs.length : 0.65;
        const matchPercentage = Math.min(98, Math.max(45, Math.round(scoreRatio * 100)));

        return {
            matchPercentage,
            fitTier: matchPercentage >= 80 ? "High Compatibility" : matchPercentage >= 60 ? "Moderate Compatibility" : "Growth Opportunity",
            summary: `Candidate has strong foundations in ${matching.join(", ") || "core tech"}, aligning well with ${jobTitle} at ${companyName}.`,
            matchingStrengths: matching.length > 0 ? matching.map((m) => `Demonstrated capability in ${m}`) : ["Strong general problem-solving foundation", "Adaptability to modern frameworks"],
            growthAreas: missing.length > 0 ? missing.map((m) => `Skill development opportunity in ${m}`) : ["Deepening domain expertise in advanced architecture"],
            learningRoadmap: missing.slice(0, 3).map((m) => ({ skill: m, recommendation: `Review official documentation, build a proof-of-concept project demonstrating ${m}, and add it to your portfolio.` })),
            actionableTips: [
                "Tailor your resume headline to highlight matching technical competencies.",
                "Prepare 2 specific project stories illustrating real-world impact.",
                "Emphasize your willingness to quickly master adjacent toolsets.",
            ],
        };
    };

    const ai = await getGenAIClient();
    if (!ai) return buildFallbackFit();

    try {
        const prompt = `You are HireHub's AI Career Strategy Advisor.
Analyze candidate compatibility against this job opening and provide a constructive, actionable career roadmap.

JOB:
- Title: ${jobTitle}
- Company: ${companyName}
- Requirements: ${jobReqs.join(", ")}
- Description: ${cleanText(job.description, 600)}

CANDIDATE:
- Skills: ${candidateSkills.join(", ")}
- Bio: ${candidateBio}

Output strict JSON:
{
  "matchPercentage": 85,
  "fitTier": "High Compatibility",
  "summary": "1-2 sentence executive breakdown",
  "matchingStrengths": ["string", "string"],
  "growthAreas": ["string", "string"],
  "learningRoadmap": [
    { "skill": "string", "recommendation": "string" }
  ],
  "actionableTips": ["string", "string", "string"]
}`;

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2,
            },
        });

        const parsed = JSON.parse(response.text);
        return parsed || buildFallbackFit();
    } catch (err) {
        console.warn("[HireHub AI] Fit analysis failed, using fallback:", err.message);
        return buildFallbackFit();
    }
};

// 6. Recruiter AI Job Description & Requirements Generator
export const generateJobDescriptionWithAI = async ({ title, companyName, location, jobType, experience, skills }) => {
    const rawSkills = Array.isArray(skills) ? skills.join(", ") : skills || "Core technical skills";

    const buildFallbackJobDesc = () => {
        return {
            title: title || "Software Engineer",
            description: `We are looking for a skilled ${title} to join our growing team at ${companyName || "our company"}. In this role, you will design, develop, and deploy high-quality software solutions, collaborate closely with product managers and cross-functional teams, and contribute to continuous improvement in code quality and performance.\n\nKey Responsibilities:\n- Build robust, scalable, and secure features using modern technology stacks.\n- Collaborate with designers, product managers, and backend engineers to craft seamless user experiences.\n- Write clean, testable, and well-documented code adhering to industry best practices.\n- Participate in code reviews and active technical mentorship.\n- Troubleshoot, debug, and optimize application performance.`,
            requirements: [
                `${experience ? `${experience} years of` : "Proven"} experience in software development.`,
                `Strong proficiency in ${rawSkills}.`,
                "Familiarity with RESTful APIs, modern databases, and version control (Git).",
                "Strong analytical thinking, proactive communication, and problem-solving skills.",
                "Experience working in collaborative Agile or Scrum environments.",
            ],
            suggestedSalary: "Competitive (based on experience & market rate)",
            suggestedSkills: rawSkills.split(",").map((s) => s.trim()).filter(Boolean),
        };
    };

    const ai = await getGenAIClient();
    if (!ai) return buildFallbackJobDesc();

    try {
        const prompt = `You are an expert AI Technical Talent Recruiter and HR Copywriter for HireHub.
Generate an engaging, professional, and high-converting job posting for the following role:

INPUTS:
- Title: ${title}
- Company: ${companyName || "Technology Company"}
- Location: ${location || "Remote / Hybrid"}
- Job Type: ${jobType || "Full-time"}
- Experience Level: ${experience || "1-3"} years
- Key Skills: ${rawSkills}

Output strict JSON:
{
  "title": "string",
  "description": "Full multi-paragraph job description including role overview and bulleted Key Responsibilities formatted with standard newlines",
  "requirements": ["requirement 1", "requirement 2", "requirement 3", "requirement 4", "requirement 5"],
  "suggestedSalary": "string (e.g., 10-15 LPA)",
  "suggestedSkills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"]
}`;

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.3,
            },
        });

        const parsed = JSON.parse(response.text);
        return parsed || buildFallbackJobDesc();
    } catch (err) {
        console.warn("[HireHub AI] Job description generation failed, using fallback:", err.message);
        return buildFallbackJobDesc();
    }
};

