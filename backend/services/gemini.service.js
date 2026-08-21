import { GoogleGenAI } from "@google/genai";

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

    // Heuristic fallback builder
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
            const scoreRatio = reqs.length > 0 ? matchingSkills.length / reqs.length : 0.5;
            const matchScore = Math.min(98, Math.max(45, Math.round(scoreRatio * 100)));

            return {
                jobId: job.jobId,
                matchScore,
                reason: matchingSkills.length > 0
                    ? `Matches profile skills: ${matchingSkills.join(", ")} for ${job.title} position.`
                    : `Good career opportunity matching background in ${job.location || "tech"}.`,
                matchingSkills: matchingSkills.length > 0 ? matchingSkills : ["General background"],
                missingSkills,
            };
        }).sort((a, b) => b.matchScore - a.matchScore);
    };

    if (!process.env.GEMINI_API_KEY) {
        return buildFallbackRecommendations();
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You rank existing job candidates for a student. Return at most 10 recommendations in JSON format.
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
