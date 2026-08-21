import React, { useCallback, useEffect, useState } from "react";
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
  TrendingUp,
  Bookmark,
  SlidersHorizontal,
  FileCheck2,
  Search,
  ExternalLink
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AI_API_END_POINT } from "@/utils/constant";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Navbar from "./shared/Navbar";
import Footer from "./shared/Footer";
import { useSelector } from "react-redux";

const RecommendedJobs = ({ embedded = false }) => {
  const { user } = useSelector((store) => store.auth);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [minMatchFilter, setMinMatchFilter] = useState(0);

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
          toast.success("AI match recommendations refreshed.");
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

  const filteredRecs = recommendations.filter((item) => {
    const title = item.job?.title?.toLowerCase() || "";
    const company = item.job?.company?.name?.toLowerCase() || "";
    const loc = item.job?.location?.toLowerCase() || "";
    const match = item.matchScore >= minMatchFilter;
    const searchMatch = !searchFilter.trim() || 
      title.includes(searchFilter.toLowerCase()) ||
      company.includes(searchFilter.toLowerCase()) ||
      loc.includes(searchFilter.toLowerCase());
    return match && searchMatch;
  });

  const content = (
    <section className={embedded ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
      {/* Guest Mode Info Card if user is not logged in */}
      {!user && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#6A38C2] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-gray-900">
                  Guest Preview (Sample Industry Skill Matches)
                </h4>
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-[10px] font-bold border-0">
                  Guest Mode
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1 max-w-xl leading-relaxed">
                You are currently viewing live sample job matches based on standard tech stacks. Log in as a Candidate to compute 100% personalized match scores against your specific resume and profile!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/login">
              <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold px-4 shadow-xs">
                Log In for Custom Scores
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-semibold">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Header Container */}
      <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-xs mb-8">
        <div className="border-b border-gray-100 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 px-6 py-8 sm:px-8 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-purple-200 border border-white/10 shadow-sm">
                <Sparkles className="h-6 w-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    AI Job Matchmaker
                  </h1>
                  <Badge className="border-0 bg-purple-500/30 text-purple-200 hover:bg-purple-500/40 text-xs font-semibold">
                    Live Compatibility Engine
                  </Badge>
                </div>

                <p className="mt-1 max-w-2xl text-xs sm:text-sm text-purple-200 leading-relaxed">
                  {user ? (
                    <>Opportunities specifically evaluated and ranked against your profile skills (<span className="text-white font-semibold">{user?.profile?.skills?.join(', ') || 'General Skills'}</span>) and background.</>
                  ) : (
                    <>Opportunities evaluated based on industry tech standards. Sign in as a candidate for personalized candidate ranking.</>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/resume-checker">
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-semibold"
                >
                  <FileCheck2 className="mr-1.5 h-3.5 w-3.5 text-purple-300" />
                  ATS Resume Audit
                </Button>
              </Link>
              <Button
                onClick={() => loadRecommendations(true)}
                disabled={loading}
                className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold border border-purple-400/30 shadow-xs"
              >
                {loading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                )}
                {loading ? "Matching..." : "Refresh Matches"}
              </Button>
            </div>
          </div>

          {/* Quick Filters Toolbar */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-purple-300 pointer-events-none" />
              <Input
                placeholder="Filter matches by title, company, or location..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-purple-300/70 text-xs rounded-xl h-9"
              />
            </div>
            <div className="sm:col-span-4 flex items-center justify-end gap-2">
              <span className="text-xs font-semibold text-purple-200 whitespace-nowrap">Min Match:</span>
              <select
                value={minMatchFilter}
                onChange={(e) => setMinMatchFilter(Number(e.target.value))}
                className="bg-white/10 border border-white/20 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
              >
                <option value={0} className="text-gray-900">All Matches (0%+)</option>
                <option value={60} className="text-gray-900">Good Match (60%+)</option>
                <option value={75} className="text-gray-900">Strong Match (75%+)</option>
                <option value={85} className="text-gray-900">Top Match (85%+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#6A38C2]">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">
                Analyzing Live Job Pool with AI...
              </h3>
              <p className="mt-1 text-xs text-gray-500 max-w-sm text-center">
                Comparing candidate skills against current job postings to compute tailored match scores.
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
              <h3 className="font-bold text-rose-900 text-base">
                Could Not Load Recommendations
              </h3>
              <p className="mt-1 text-xs text-rose-700 max-w-md mx-auto">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadRecommendations(true)}
                className="mt-4 border-rose-200 bg-white text-rose-700 hover:bg-rose-100 text-xs font-semibold"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredRecs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-[#6A38C2]">
                <BriefcaseBusiness className="h-8 w-8 text-[#6A38C2]" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {searchFilter || minMatchFilter > 0 ? "No matches fit your filter criteria" : "No recommendations available yet"}
              </h3>
              <p className="mt-1 max-w-md text-xs text-gray-500 leading-relaxed">
                {searchFilter || minMatchFilter > 0
                  ? "Try adjusting your search keyword or clearing the minimum match percentage filter."
                  : "Add technical skills to your candidate profile or scan your resume to get instant recommendations."}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Link to="/profile">
                  <Button size="sm" className="bg-[#6A38C2] hover:bg-[#582ea8] text-white text-xs font-semibold">
                    Update Profile Skills
                  </Button>
                </Link>
                {(searchFilter || minMatchFilter > 0) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchFilter("");
                      setMinMatchFilter(0);
                    }}
                    className="text-xs"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Recommendations Grid */}
          {!loading && !error && filteredRecs.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredRecs.map((item) => (
                <div
                  key={item.jobId}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#6A38C2] border border-purple-100 font-bold">
                          {item.job?.company?.logo ? (
                            <img src={item.job.company.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Building2 className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-base font-bold text-gray-900 group-hover:text-[#6A38C2] transition-colors">
                            {item.job?.title || "Position Title"}
                          </h2>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                            <span className="font-medium text-gray-700">
                              {item.job?.company?.name || "Company"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.job?.location || "Remote"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div className="shrink-0">
                        <div className="flex flex-col items-center rounded-xl bg-purple-50 px-3 py-1.5 border border-purple-100">
                          <span className="text-base font-extrabold text-[#6A38C2]">
                            {item.matchScore}%
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700">
                            Match
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Match Reason */}
                    {item.reason && (
                      <div className="mb-4 rounded-xl bg-purple-50/70 border border-purple-100 p-3">
                        <div className="mb-1 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-[#6A38C2]" />
                          <span className="text-[10px] font-bold uppercase tracking-wide text-purple-800">
                            AI Matching Reason
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-700">
                          {item.reason}
                        </p>
                      </div>
                    )}

                    {/* Matching Skills */}
                    <div className="space-y-2 mb-4">
                      {item.matchingSkills?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Your Matching Skills:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.matchingSkills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.missingSkills?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800 mb-1">
                            Skills to Highlight / Learn:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.missingSkills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                              >
                                + {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer CTA */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-gray-900">
                      {item.job?.salary ? `${item.job.salary} LPA` : "Competitive"}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/description/${item.jobId}`)}
                      className="bg-gray-900 hover:bg-[#6A38C2] text-white text-xs font-semibold transition-colors gap-1.5"
                    >
                      View & Apply
                      <ArrowRight className="h-3.5 w-3.5" />
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

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      <div>
        <Navbar />
        {content}
      </div>
      <Footer />
    </div>
  );
};

export default RecommendedJobs;
