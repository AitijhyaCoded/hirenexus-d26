"use client"

import * as React from "react"
import { motion, type Variants } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Loader2, Github, GitCommit, GitPullRequest, Code2, AlertCircle, Sparkles, Zap, ArrowUpCircle, RefreshCw, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
}

// Chart colors that match the teal palette
const chartTeal = "hsl(172, 66%, 50%)"
const chartTealFaded = "hsl(172, 50%, 40%)"

export default function CandidateGithubDashboard() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = React.useState(true)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [githubUrl, setGithubUrl] = React.useState("")
  const [targetRole, setTargetRole] = React.useState("")
  const [academicStream, setAcademicStream] = React.useState("")
  const [academicYear, setAcademicYear] = React.useState("")
  const [analysisData, setAnalysisData] = React.useState<any>(null)

  // Project roadmap role selector state
  const [roadmapRole, setRoadmapRole] = React.useState("")
  const [previousRoles, setPreviousRoles] = React.useState<string[]>([])
  const [isRegeneratingProjects, setIsRegeneratingProjects] = React.useState(false)
  const [customProjectRecs, setCustomProjectRecs] = React.useState<any[] | null>(null)
  const [activeRoadmapRole, setActiveRoadmapRole] = React.useState("")

  React.useEffect(() => {
    if (isUserLoading || !user || !db) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const data = snap.data()
          setGithubUrl(data.githubUrl || "")
          setTargetRole(data.targetRole || "")
          setAcademicStream(data.academicStream || "")
          setAcademicYear(data.academicYear || "")
          if (data.githubAnalysis) {
            setAnalysisData(data.githubAnalysis)
          }

          // Collect unique previous roles from analysisHistory
          const history = data.analysisHistory || []
          const roles = history
            .map((entry: any) => entry.targetRole)
            .filter((role: string) => !!role)
          const uniqueRoles = Array.from(new Set([data.targetRole, ...roles].filter(Boolean))) as string[]
          setPreviousRoles(uniqueRoles)
          setRoadmapRole(data.targetRole || "")
          setActiveRoadmapRole(data.targetRole || "")
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user, isUserLoading, db])

  const analyzeProfile = async () => {
    if (!githubUrl) {
      toast({ variant: "destructive", title: "Wait", description: "Please enter a GitHub URL first" })
      return
    }

    setIsAnalyzing(true)
    try {
      const res = await fetch("/api/analyze-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          githubUrl,
          targetRole,
          stream: academicStream,
          year: academicYear
        })
      })
      const data = await res.json()
      if (data.success) {
        setAnalysisData(data.data)
        setCustomProjectRecs(null) // Reset custom recs on new full analysis
        setActiveRoadmapRole(targetRole || "")
        toast({ title: "Analysis Complete", description: "Your GitHub profile has been parsed." })
        
        if (user && db) {
          await updateDoc(doc(db, "users", user.uid), { 
            githubUrl,
            githubAnalysis: data.data 
          })
        }
      } else {
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Analysis Failed", description: e.message || "Something went wrong." })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const regenerateProjects = async () => {
    if (!githubUrl || !roadmapRole) {
      toast({ variant: "destructive", title: "Missing Info", description: "Please enter a role and ensure GitHub URL is set." })
      return
    }

    setIsRegeneratingProjects(true)
    try {
      const res = await fetch("/api/regenerate-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUrl,
          targetRole: roadmapRole,
          stream: academicStream,
          year: academicYear
        })
      })
      const data = await res.json()
      if (data.success) {
        setCustomProjectRecs(data.projectRecommendations)
        setActiveRoadmapRole(roadmapRole)
        toast({ title: "Projects Updated", description: `Roadmap regenerated for "${roadmapRole}".` })
      } else {
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Regeneration Failed", description: e.message || "Something went wrong." })
    } finally {
      setIsRegeneratingProjects(false)
    }
  }

  if (isUserLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
          <span className="text-xs text-muted-foreground">Loading…</span>
        </div>
      </div>
    )
  }

  const tooltipStyle = {
    backgroundColor: "hsl(225, 20%, 8%)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "10px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    padding: "8px 12px",
    fontSize: "12px"
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground/95 flex items-center gap-2.5">
          <Github className="h-6 w-6 text-foreground/60" /> GitHub Intelligence
        </h2>
        <p className="text-sm text-muted-foreground mt-1">AI-powered analytics and evaluation of your code portfolio.</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="liquid-glass-elevated rounded-xl p-5">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="space-y-1.5 flex-grow">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">GitHub Profile URL</label>
              <Input 
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourusername"
                className="bg-white/[0.03] border-white/[0.06] focus:border-primary/40 h-11 text-sm"
              />
            </div>
            <Button 
              onClick={analyzeProfile} 
              disabled={isAnalyzing}
              className="h-11 px-6 bg-primary/90 hover:bg-primary text-primary-foreground font-medium text-sm rounded-lg transition-all duration-300 hover:shadow-[0_0_24px_-4px_hsl(var(--primary)_/_0.4)] w-full md:w-auto gap-2"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitPullRequest className="h-4 w-4" />}
              {isAnalyzing ? "Extracting…" : analysisData ? "Re-Analyze" : "Analyze Profile"}
            </Button>
          </div>
        </div>
      </motion.div>

      {analysisData && analysisData.data && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6" id="github-analysis">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={itemVariants} className="liquid-glass glass-emerald rounded-xl p-5">
              <div className="flex justify-between items-center">
                <div className="p-2 bg-emerald-500/10 rounded-lg"><Code2 className="h-4 w-4 text-emerald-400" /></div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-foreground/95">{analysisData.rawReposCount}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Repositories Analyzed</p>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="liquid-glass glass-sky rounded-xl p-5">
              <div className="flex justify-between items-center">
                <div className="p-2 bg-sky-500/10 rounded-lg"><GitCommit className="h-4 w-4 text-sky-400" /></div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-foreground/95">{analysisData.rawContributions}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Yearly Contributions</p>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="liquid-glass glass-violet rounded-xl p-5 md:col-span-2">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-0.5"><Sparkles className="h-4 w-4 text-primary" /></div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground/80 mb-1">AI Summary</h4>
                  <p className="text-sm text-foreground/70 leading-relaxed">{analysisData.data.summary}</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Tech Breadth */}
            <motion.div variants={itemVariants} className="liquid-glass glass-indigo rounded-xl lg:col-span-2 overflow-hidden">
              <div className="p-5 border-b border-white/[0.04]">
                <h3 className="text-sm font-semibold text-foreground/90">Technology Imprint</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Dominant languages across all repositories.</p>
              </div>
              <div className="p-5 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysisData.data.techBreadth} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="language" stroke="rgba(255,255,255,0.3)" tick={{fill: "rgba(255,255,255,0.5)", fontSize: 11}} />
                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: "rgba(255,255,255,0.5)", fontSize: 11}} />
                    <RechartsTooltip contentStyle={tooltipStyle} itemStyle={{ color: "#fff" }} />
                    <Bar dataKey="percentage" fill={chartTeal} radius={[4, 4, 0, 0]} name="Usage %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Complexity Radar */}
            <motion.div variants={itemVariants} className="liquid-glass glass-sky rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/[0.04]">
                <h3 className="text-sm font-semibold text-foreground/90">Engineering Depth</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Structural competency evaluation.</p>
              </div>
              <div className="p-5 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analysisData.data.complexityAssessment}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} stroke="rgba(255,255,255,0.04)" />
                    <Radar name="Score" dataKey="score" stroke={chartTeal} fill={chartTeal} fillOpacity={0.2} />
                    <RechartsTooltip contentStyle={tooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Contribution Velocity */}
          <motion.div variants={itemVariants} className="liquid-glass glass-emerald rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.04]">
              <h3 className="text-sm font-semibold text-foreground/90">Contribution Velocity</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Monthly commit volume over the last 12 months.</p>
            </div>
            <div className="p-5 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analysisData.data.commitConsistency} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartTeal} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chartTeal} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" tick={{fill: "rgba(255,255,255,0.5)", fontSize: 11}} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: "rgba(255,255,255,0.5)", fontSize: 11}} />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="commits" stroke={chartTeal} fillOpacity={1} fill="url(#colorCommits)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          {/* Top Repos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysisData.data.topRepositories.map((repo: any, i: number) => (
              <motion.div key={i} variants={itemVariants} className={`liquid-glass rounded-xl p-5 space-y-3 hover:border-primary/15 transition-all duration-300 ${
                i % 3 === 0 ? "glass-sky" : i % 3 === 1 ? "glass-indigo" : "glass-violet"
              }`}>
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-muted-foreground/50" />
                  <h4 className="font-semibold text-sm text-foreground/90">{repo.name}</h4>
                </div>
                <p className="text-xs text-foreground/60 leading-relaxed">{repo.description}</p>
                <div className="pt-3 border-t border-white/[0.04]">
                  <p className="text-[10px] font-medium text-primary/60 uppercase tracking-wider mb-1">Notable Feature</p>
                  <p className="text-[11px] text-muted-foreground/60">{repo.notableFeature}</p>
                </div>
                <span className="inline-block px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] font-medium text-muted-foreground border border-white/[0.05]">
                  {repo.role}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Project Recommendations */}
          <div className="space-y-5 pt-8 border-t border-white/[0.04]" id="project-recommendations">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground/95 tracking-tight">AI-Powered Project Roadmap</h3>
                <p className="text-xs text-muted-foreground">
                  Strategic projects to level up your portfolio for <span className="text-primary font-medium">{activeRoadmapRole || targetRole || "your target role"}</span>.
                </p>
              </div>
            </div>

            {/* Role Selector */}
            <motion.div variants={itemVariants} className="liquid-glass-elevated glass-indigo rounded-xl p-5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Customize Roadmap Target Role</p>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="space-y-1.5 flex-grow">
                  <label className="text-[11px] text-muted-foreground/60">Type a job role</label>
                  <Input
                    value={roadmapRole}
                    onChange={(e) => setRoadmapRole(e.target.value)}
                    placeholder="e.g. DevOps Engineer, ML Engineer…"
                    className="bg-white/[0.03] border-white/[0.06] focus:border-primary/40 h-10 text-sm"
                  />
                </div>

                {previousRoles.length > 0 && (
                  <div className="space-y-1.5 w-full sm:w-[220px] shrink-0">
                    <label className="text-[11px] text-muted-foreground/60">or select from previous</label>
                    <Select
                      value={roadmapRole}
                      onValueChange={(val) => setRoadmapRole(val)}
                    >
                      <SelectTrigger className="bg-white/[0.03] border-white/[0.06] h-10 text-sm focus:ring-primary/20">
                        <SelectValue placeholder="Previous roles…" />
                      </SelectTrigger>
                      <SelectContent className="bg-[hsl(225,20%,8%)] border-white/[0.08]">
                        {previousRoles.map((role) => (
                          <SelectItem key={role} value={role} className="text-sm focus:bg-white/[0.06]">
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={regenerateProjects}
                  disabled={isRegeneratingProjects || !roadmapRole}
                  className="h-10 px-5 bg-primary/90 hover:bg-primary text-primary-foreground font-medium text-sm rounded-lg transition-all duration-300 hover:shadow-[0_0_24px_-4px_hsl(var(--primary)_/_0.4)] w-full sm:w-auto gap-2 shrink-0"
                >
                  {isRegeneratingProjects ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isRegeneratingProjects ? "Generating…" : "Regenerate"}
                </Button>
              </div>
            </motion.div>

            {/* Loading overlay for project cards */}
            {isRegeneratingProjects && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <div className="relative">
                  <div className="h-14 w-14 rounded-full border-2 border-primary/15 border-t-primary/60 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary/60 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-foreground/80">Regenerating projects for "{roadmapRole}"</p>
                  <p className="text-[11px] text-muted-foreground/50">Groq models are crafting personalized recommendations…</p>
                </div>
              </motion.div>
            )}

            {!isRegeneratingProjects && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
                {(customProjectRecs || analysisData.data.projectRecommendations)?.map((rec: any, idx: number) => (
                  <motion.div key={`${activeRoadmapRole}-${idx}`} variants={itemVariants} initial="hidden" animate="visible" className={`liquid-glass rounded-xl overflow-hidden group hover:border-primary/15 transition-all duration-300 ${
                    idx % 2 === 0 ? "glass-violet" : "glass-sky"
                  }`}>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-semibold text-foreground/90 group-hover:text-primary/90 transition-colors">{rec.title}</h4>
                            {rec.isLevelUp && (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/10">
                                Level Up
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.04] text-muted-foreground/60 border border-white/[0.05]">
                            {rec.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/8 border border-primary/10 shrink-0">
                          <ArrowUpCircle className="h-3 w-3 text-primary/60" />
                          <span className="text-[9px] font-medium text-primary/60">NEXT</span>
                        </div>
                      </div>

                      <p className="text-sm text-foreground/65 leading-relaxed">{rec.description}</p>

                      <div className="space-y-2">
                        <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider flex items-center gap-1.5">
                          <Code2 className="h-3 w-3" /> Stack
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.techStack.map((tech: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] font-medium text-foreground/55 border border-white/[0.05]">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-primary/[0.04] border border-primary/[0.06] text-[11px]">
                        <span className="font-medium text-primary/70 block mb-0.5">Why This Matters</span>
                        <p className="text-muted-foreground/50 leading-relaxed">{rec.whyRelevance}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
