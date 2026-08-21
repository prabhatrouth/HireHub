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
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
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
        console.warn("[Gemini API] Failed to evaluate applicants with AI, using fallback:", err.message);
        return buildFallbackEvaluation();
    }
};
