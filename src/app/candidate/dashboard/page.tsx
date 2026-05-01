"use client"

import * as React from "react"
import {
  FileText,
  Video,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
  Sparkles,
  Target,
  ChevronRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
}

export default function CandidateDashboard() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [profileData, setProfileData] = React.useState<any>(null)
  const [isProfileLoading, setIsProfileLoading] = React.useState(true)

  React.useEffect(() => {
    if (isUserLoading || !user || !db) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          setProfileData(snap.data())
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user, isUserLoading, db])

  const hasResume = profileData?.hasResume || false;
  const hasAnalysis = !!profileData?.lastAnalysis;
  const consensusScore = profileData?.lastAnalysis?.consensus?.overallScore;
  const targetRole = profileData?.lastAnalysis?.targetRole || profileData?.targetRole || "Target Role";

  const metrics = [
    {
      title: "Profile Completion",
      value: hasAnalysis ? "100%" : hasResume ? "80%" : "60%",
      change: hasAnalysis ? "Ready for jobs" : "Upload resume to improve",
      icon: FileText,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      glassClass: "glass-indigo"
    },
    {
      title: "Consensus Score",
      value: consensusScore ? `${consensusScore}/100` : "—",
      change: hasAnalysis ? `${targetRole}` : "Run analysis to view",
      icon: TrendingUp,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      glassClass: "glass-violet"
    },
    {
      title: "Mock Interviews",
      value: "0",
      change: "Practice recommended",
      icon: Video,
      color: "text-sky-400",
      bgColor: "bg-sky-400/10",
      glassClass: "glass-sky"
    },
  ]

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
          <span className="text-xs text-muted-foreground">Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground/95">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Candidate'}
          </h2>
          <p className="text-sm text-muted-foreground">Your personal hub for matching with top tech roles.</p>
        </div>
        <Button asChild size="sm" className="h-9 px-4 bg-primary/90 hover:bg-primary text-primary-foreground font-medium text-xs rounded-lg transition-all duration-200 hover:shadow-[0_0_20px_-4px_hsl(var(--primary)_/_0.4)]">
          <Link href="/candidate/profile">Upload Resume</Link>
        </Button>
      </motion.div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric, i) => (
          <motion.div key={metric.title} variants={itemVariants}>
            <div className={`liquid-glass rounded-xl p-5 group cursor-default ${metric.glassClass}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary/40 transition-colors duration-500" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground/95">{metric.value}</h3>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{metric.title}</p>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.04]">
                <div className="h-1 w-1 rounded-full bg-emerald-400/60" />
                <span className="text-[11px] text-muted-foreground/70">{metric.change}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Action Items */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="liquid-glass glass-emerald rounded-xl overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold text-foreground/90">Action Items</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Tasks to improve your hiring chances.</p>
            </div>
            <div className="px-3 pb-3 space-y-0.5">
              <Link href="/candidate/profile" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-all duration-200 group/item">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center group-hover/item:bg-primary/12 transition-colors duration-200">
                    <FileText className="h-4 w-4 text-primary/80" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-foreground/85">Upload your Resume</span>
                    <span className="text-[11px] text-muted-foreground/70">Let AI analyze your skills</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasResume ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/10">Completed</span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400/80 border border-amber-500/10">Pending</span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover/item:text-muted-foreground/60 group-hover/item:translate-x-0.5 transition-all duration-200" />
                </div>
              </Link>

              <Link href="/candidate/mock-interview" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-all duration-200 group/item">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-sky-400/8 flex items-center justify-center group-hover/item:bg-sky-400/12 transition-colors duration-200">
                    <Video className="h-4 w-4 text-sky-400/80" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-foreground/85">Try a Mock Interview</span>
                    <span className="text-[11px] text-muted-foreground/70">Practice with AI interviewers</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400/80 border border-sky-500/10">Recommended</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover/item:text-muted-foreground/60 group-hover/item:translate-x-0.5 transition-all duration-200" />
                </div>
              </Link>

              <Link href="/candidate/resume-analysis" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-all duration-200 group/item">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-violet-400/8 flex items-center justify-center group-hover/item:bg-violet-400/12 transition-colors duration-200">
                    <Target className="h-4 w-4 text-violet-400/80" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-foreground/85">Run AI Resume Panel</span>
                    <span className="text-[11px] text-muted-foreground/70">5 agents debate your resume fit</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasAnalysis ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400/80 border border-violet-500/10">Completed</span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-400/10 text-violet-400/80 border border-violet-400/10">New</span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover/item:text-muted-foreground/60 group-hover/item:translate-x-0.5 transition-all duration-200" />
                </div>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Status Timeline */}
        <motion.div variants={itemVariants}>
          <div className="liquid-glass glass-indigo rounded-xl p-5 h-full">
            <h3 className="text-sm font-semibold text-foreground/90">Your Status</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-6">Pipeline readiness</p>
            <div className="space-y-5">
              {[
                { label: "Profile Created", done: true, color: "text-blue-400", bgColor: "bg-blue-500/15" },
                { label: "Resume Uploaded", done: hasResume, color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
                { label: "AI Screening", done: hasAnalysis, color: "text-violet-400", bgColor: "bg-violet-500/15" },
              ].map((act, i) => (
                <div key={i} className="flex gap-3.5 items-start relative pb-0 last:pb-0">
                  {i !== 2 && <div className="absolute left-[9px] top-[24px] bottom-[-20px] w-px bg-white/[0.06]" />}
                  <div className={`h-[18px] w-[18px] rounded-full shrink-0 z-10 flex items-center justify-center mt-0.5 ${act.done ? `${act.bgColor} ring-1 ring-white/10` : 'bg-white/[0.04] ring-1 ring-white/[0.08]'}`}>
                    {act.done ? (
                      <CheckCircle2 className={`h-2.5 w-2.5 ${act.color}`} />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className={`text-[13px] font-medium ${act.done ? 'text-foreground/85' : 'text-muted-foreground/60'}`}>
                      {act.label}
                    </p>
                    {act.done && <span className={`text-[10px] ${act.color}/60 opacity-80`}>Completed</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
