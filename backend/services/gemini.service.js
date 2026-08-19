const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_CHARACTERS = 12000;

const recommendationSchema = {
    type: "object",
    properties: {
        recommendations: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    jobId: { type: "string" },
                    matchScore: { type: "integer" },
                    reason: { type: "string" },
                    matchingSkills: { type: "array", items: { type: "string" } },
                    missingSkills: { type: "array", items: { type: "string" } }
                },
                required: ["jobId", "matchScore", "reason", "matchingSkills", "missingSkills"]
            }
        }
    },
    required: ["recommendations"]
};

const cleanText = (value, maxLength = 12000) => String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);

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
    const profileText = cleanText([profile.fullname, profile.bio, ...(profile.skills || []), profile.resumeText].join(" ")).toLowerCase();
    const jobTerms = [job.title, ...(job.requirements || []), job.description].join(" ").toLowerCase().match(/[a-z0-9+#.]{2,}/g) || [];
    return [...new Set(jobTerms)].reduce((score, term) => score + (profileText.includes(term) ? 1 : 0), 0);
};

export const rankJobsWithAI = async ({ profile, resumeText, jobs }) => {
    if (!process.env.GEMINI_API_KEY) {
        const error = new Error("GEMINI_API_KEY is not configured on the server.");
        error.statusCode = 503;
        throw error;
    }

    const candidateJobs = jobs.map((job) => ({
        jobId: String(job._id), title: job.title, company: job.company?.name || "", location: job.location,
        jobType: job.jobType, experienceLevel: job.experienceLevel, description: cleanText(job.description, 1600),
        requirements: (job.requirements || []).map((item) => cleanText(item, 160))
    }));
    const student = { fullname: profile.fullname, bio: cleanText(profile.bio, 2000), skills: profile.skills || [], resumeText: cleanText(resumeText, MAX_RESUME_CHARACTERS) };
    const prompt = `You rank existing job candidates for a student. Return at most 10 recommendations. You must use only jobId values supplied in CANDIDATE_JOBS. Never invent a job, requirement, credential, or skill. Scores are integers from 0 to 100. Reasons must be concise and grounded in the provided student data and job requirements. matchingSkills are skills demonstrably present in the student data; missingSkills are job requirements not evidenced in the student data.\n\nSTUDENT_DATA:\n${JSON.stringify(student)}\n\nCANDIDATE_JOBS:\n${JSON.stringify(candidateJobs)}`;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", responseSchema: recommendationSchema, temperature: 0.2 }
        })
    });

    if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        const error = new Error(details.error?.message || "Gemini could not generate recommendations.");
        error.statusCode = response.status === 429 ? 503 : response.status;
        throw error;
    }

    const result = await response.json();
    const outputText = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
    try {
        return JSON.parse(outputText).recommendations || [];
    } catch {
        const error = new Error("Gemini returned an unreadable recommendation response.");
        error.statusCode = 502;
        throw error;
    }
};
