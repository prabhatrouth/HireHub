import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Loader2,
  RefreshCw,
  MapPin,
  Building2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BriefcaseBusiness,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AI_API_END_POINT } from "@/utils/constant";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const RecommendedJobs = ({ embedded = false }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const loadRecommendations = useCallback(
    async (showToast = false) => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(
          `${AI_API_END_POINT}/recommendations`,
          {
            withCredentials: true,
          }
        );

        setRecommendations(res.data.recommendations || []);

        if (showToast) {
          toast.success("Recommendations refreshed.");
        }
      } catch (requestError) {
        const message =
          requestError.response?.data?.message ||
          "Unable to load AI recommendations right now.";

        setError(message);

        if (showToast) {
          toast.error(message);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return (
    <section
      className={`${
        embedded ? "mt-10" : "max-w-5xl mx-auto my-8"
      }`}
    >
      {/* Main Container */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

        {/* Header */}
        <div className="border-b border-gray-100 bg-gradient-to-r from-violet-50 via-white to-blue-50 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md">
                <Sparkles className="h-6 w-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                    Recommended Jobs
                  </h1>

                  <Badge className="border-0 bg-violet-100 text-violet-700 hover:bg-violet-100">
                    AI Powered
                  </Badge>
                </div>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                  Discover opportunities matched with your profile,
                  skills, and resume.
                </p>
              </div>
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              onClick={() => loadRecommendations(true)}
              disabled={loading}
              className="w-full shrink-0 border-gray-200 bg-white shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 sm:w-auto"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}

              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
                <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
              </div>

              <h3 className="font-semibold text-gray-900">
                Finding relevant jobs
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Our AI is matching jobs with your profile...
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  !
                </div>

                <div>
                  <h3 className="font-semibold text-red-800">
                    Unable to load recommendations
                  </h3>

                  <p className="mt-1 text-sm text-red-700">
                    {error}
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadRecommendations(true)}
                    className="mt-3 border-red-200 bg-white text-red-700 hover:bg-red-100"
                  >
                    Try again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading &&
            !error &&
            recommendations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                  <BriefcaseBusiness className="h-8 w-8 text-gray-400" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  No recommendations yet
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                  Add more skills to your profile or upload your resume
                  to get better job recommendations.
                </p>

                <Button
                  onClick={() => loadRecommendations(true)}
                  className="mt-5 bg-violet-600 hover:bg-violet-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Find Jobs
                </Button>
              </div>
            )}

          {/* Recommendations */}
          {!loading &&
            !error &&
            recommendations.length > 0 && (
              <div className="grid gap-5 lg:grid-cols-2">
                {recommendations.map((item) => (
                  <div
                    key={item.jobId}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"
                  >
                    {/* Top Accent */}
                    <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-violet-600 to-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />

                    {/* Job Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">

                        {/* Company Icon */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                          <Building2 className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                            {item.job?.title || "Job Position"}
                          </h2>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {item.job?.company?.name ||
                                "Company"}
                            </span>

                            {item.job?.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {item.job.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Match Score */}
                      <div className="shrink-0">
                        <div className="flex flex-col items-center rounded-xl bg-emerald-50 px-3 py-2">
                          <span className="text-lg font-bold text-emerald-600">
                            {item.matchScore}%
                          </span>

                          <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                            Match
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Match Progress */}
                    <div className="mt-5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          Profile match
                        </span>

                        <span className="text-xs font-semibold text-gray-700">
                          {item.matchScore}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all"
                          style={{
                            width: `${Math.min(
                              Math.max(item.matchScore || 0, 0),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* AI Reason */}
                    {item.reason && (
                      <div className="mt-5 rounded-xl bg-violet-50/70 p-4">
                        <div className="mb-1.5 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-violet-600" />

                          <span className="text-xs font-bold uppercase tracking-wide text-violet-700">
                            Why this job?
                          </span>
                        </div>

                        <p className="text-sm leading-6 text-gray-600">
                          {item.reason}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    <div className="mt-5 space-y-4">

                      {/* Matching Skills */}
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />

                          <span className="text-sm font-semibold text-gray-800">
                            Matching skills
                          </span>
                        </div>

                        {item.matchingSkills?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {item.matchingSkills.map(
                              (skill, index) => (
                                <span
                                  key={index}
                                  className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                                >
                                  {skill}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Profile match
                          </p>
                        )}
                      </div>

                      {/* Missing Skills */}
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-600">
                            +
                          </span>

                          <span className="text-sm font-semibold text-gray-800">
                            Skills to build
                          </span>
                        </div>

                        {item.missingSkills?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {item.missingSkills.map(
                              (skill, index) => (
                                <span
                                  key={index}
                                  className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700"
                                >
                                  {skill}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            None identified
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <Button
                        className="w-full bg-gray-900 transition-all hover:bg-violet-600"
                        onClick={() =>
                          navigate(
                            `/description/${item.jobId}`
                          )
                        }
                      >
                        View Job
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </section>
  );
};

export default RecommendedJobs;