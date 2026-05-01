"use client"

import * as React from "react"
import { motion, type Variants } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, FileText, BarChart, History, Calendar, Trash2, ChevronRight, Sparkles } from "lucide-react"
import { MultiAgentDebate } from "@/components/multi-agent-debate"
import { AILoadingTerminal } from "@/components/ai-loading-terminal"
import { fetchGithubProfile } from "@/ai/flows/fetch-github-profile-flow"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
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

export default function ResumeAnalysisDashboard() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = React.useState(true)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [profileData, setProfileData] = React.useState<any>(null)
  const [analysisHistory, setAnalysisHistory] = React.useState<any[]>([])
  const [selectedHistoryIndex, setSelectedHistoryIndex] = React.useState(0)
  const [analysisData, setAnalysisData] = React.useState<any>(null)
  const [isTerminalComplete, setIsTerminalComplete] = React.useState(false)
  const [isDataReady, setIsDataReady] = React.useState(false)
  const [pendingAnalysisEntry, setPendingAnalysisEntry] = React.useState<any>(null)

  const [localTargetRole, setLocalTargetRole] = React.useState("")
  const [localExperience, setLocalExperience] = React.useState("")
  const [localLinkedin, setLocalLinkedin] = React.useState("")
  const [localGithub, setLocalGithub] = React.useState("")

  const handleTerminalComplete = React.useCallback(() => {
    setIsTerminalComplete(true)
  }, [])

  React.useEffect(() => {
    if (isUserLoading || !user || !db) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const data = snap.data()
          setProfileData(data)
          if (!localTargetRole && data.targetRole) setLocalTargetRole(data.targetRole)
          if (!localGithub && data.githubUrl) setLocalGithub(data.githubUrl)
          
          let history = data.analysisHistory || []
          
          // Migration from old lastAnalysis if exists and history is empty
          if (history.length === 0 && data.lastAnalysis) {
            history = [{
              id: "legacy",
              timestamp: Date.now(),
              targetRole: data.targetRole || "Software Engineer",
              analysisData: data.lastAnalysis,
              context: { experience: data.experience || "" }
            }]
            await updateDoc(docRef, { analysisHistory: history })
          }
          
          setAnalysisHistory(history)
          if (history.length > 0) {
            setAnalysisData(history[0].analysisData)
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user, isUserLoading, db])

  const runComprehensiveAnalysis = async () => {
    if (!profileData?.resumeText) {
      toast({ variant: "destructive", title: "Missing Resume", description: "Please upload your resume in the Profile page first." })
      return
    }

    setIsAnalyzing(true)
    setIsTerminalComplete(false)
    setIsDataReady(false)
    setPendingAnalysisEntry(null)

    try {
      let githubData = "No GitHub URL provided"
      if (localGithub) {
        githubData = await fetchGithubProfile(localGithub)
      }

      const fullContext = `Target Role: ${localTargetRole || "Software Engineer"}
Experience Level: ${localExperience || "Not specified"}
LinkedIn: ${localLinkedin || "Not provided"}

The candidate wants to be evaluated for the above position.`

      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileData.resumeText,
          jobDescription: fullContext,
          githubData
        })
      })

      const data = await res.json()
      if (data.success) {
         const newAnalysisEntry = {
           id: crypto.randomUUID(),
           timestamp: Date.now(),
           targetRole: localTargetRole || "Software Engineer",
           analysisData: data.data,
           context: {
             experience: localExperience,
             linkedin: localLinkedin,
             github: localGithub
           }
         };
         
         setPendingAnalysisEntry(newAnalysisEntry)
         setIsDataReady(true)
      } else {
         throw new Error(data.error)
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Analysis Failed", description: e.message || "Failed to analyze" })
      setIsAnalyzing(false)
    }
  }

  React.useEffect(() => {
    const finalizeAnalysis = async () => {
      if (isAnalyzing && isDataReady && isTerminalComplete && pendingAnalysisEntry) {
        const updatedHistory = [pendingAnalysisEntry, ...analysisHistory].slice(0, 2);
        setAnalysisHistory(updatedHistory);
        setAnalysisData(pendingAnalysisEntry.analysisData);
        setSelectedHistoryIndex(0);
        
        toast({ title: "Analysis Complete", description: "The agent panel has reached a consensus." })
        
        // Reset states
        setIsAnalyzing(false);
        setIsDataReady(false);
        setIsTerminalComplete(false);
        setPendingAnalysisEntry(null);

        if(user && db) {
          try {
            const docRef = doc(db, "users", user.uid)
            await updateDoc(docRef, { 
              analysisHistory: updatedHistory,
              lastAnalysis: {
                ...pendingAnalysisEntry.analysisData,
                targetRole: pendingAnalysisEntry.targetRole,
                timestamp: pendingAnalysisEntry.timestamp
              },
              targetRole: localTargetRole 
            })
          } catch (error) {
            console.error("Error updating firestore:", error)
          }
        }
      }
    }
    
    finalizeAnalysis()
  }, [isAnalyzing, isDataReady, isTerminalComplete, pendingAnalysisEntry, user, db, localTargetRole, analysisHistory, toast])

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground/95 flex items-center gap-2.5">
          <Users className="h-6 w-6 text-primary/70" /> AI Resume Panel
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Simulate an interview panel evaluating your resume.</p>
      </motion.div>

      {!profileData?.hasResume ? (
        <motion.div variants={itemVariants}>
          <div className="liquid-glass rounded-xl border-amber-500/10 p-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto">
              <FileText className="h-7 w-7 text-amber-400/80" />
            </div>
            <h3 className="text-lg font-semibold text-foreground/90">Resume Required</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Upload and parse a resume before our AI panel can deliberate on it.</p>
            <Button asChild className="bg-amber-500/90 hover:bg-amber-500 font-medium text-white h-9 px-5 text-xs rounded-lg">
              <Link href="/candidate/profile">Go to Profile</Link>
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <div className="liquid-glass-elevated rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.04]">
              <h3 className="text-sm font-semibold text-foreground/90">Configure Analysis Parameters</h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                5 specialized AI personas (Tech Lead, HR, PM, EM, CTO) will review your extracted skills.
              </p>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Target Job Role</Label>
                  <Input id="role" placeholder="e.g. Senior Fullstack Engineer" value={localTargetRole} onChange={e => setLocalTargetRole(e.target.value)} className="bg-white/[0.03] border-white/[0.06] focus:border-primary/40 h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="experience" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Experience Level</Label>
                  <Input id="experience" placeholder="e.g. 5 Years, Mid-Level" value={localExperience} onChange={e => setLocalExperience(e.target.value)} className="bg-white/[0.03] border-white/[0.06] focus:border-primary/40 h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="linkedin" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">LinkedIn URL (Optional)</Label>
                  <Input id="linkedin" placeholder="https://linkedin.com/in/..." value={localLinkedin} onChange={e => setLocalLinkedin(e.target.value)} className="bg-white/[0.03] border-white/[0.06] focus:border-primary/40 h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="github" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">GitHub URL (Optional)</Label>
                  <Input id="github" placeholder="https://github.com/..." value={localGithub} onChange={e => setLocalGithub(e.target.value)} className="bg-white/[0.03] border-white/[0.06] focus:border-primary/40 h-10 text-sm" />
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.04] flex justify-end">
                <Button 
                  onClick={runComprehensiveAnalysis} 
                  disabled={isAnalyzing}
                  className="h-11 px-6 bg-primary/90 hover:bg-primary text-primary-foreground font-medium text-sm rounded-lg transition-all duration-300 hover:shadow-[0_0_30px_-6px_hsl(var(--primary)_/_0.4)] w-full md:w-auto gap-2"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isAnalyzing ? "Panel is Deliberating…" : analysisData ? "Re-Run Analysis" : "Start Live Deliberation"}
                </Button>
              </div>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <AILoadingTerminal onComplete={handleTerminalComplete} />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {analysisData && !isAnalyzing && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 mt-8 items-start" id="hiring-panel-evaluation">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            key={`analysis-${selectedHistoryIndex}`}
          >
            <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground/95">Hiring Panel Evaluation</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing results for <span className="text-primary font-medium">{analysisHistory[selectedHistoryIndex]?.targetRole}</span>
                </p>
              </div>
              {selectedHistoryIndex > 0 && (
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400/80 border border-amber-500/10 w-fit">
                  Historical View
                </span>
              )}
            </div>
            <MultiAgentDebate data={analysisData} historyIndex={selectedHistoryIndex} />
          </motion.div>

          {/* History Sidebar */}
          <aside className="space-y-4 xl:sticky xl:top-8">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60">
              <History className="h-3.5 w-3.5" /> Analysis History
            </div>
            <div className="space-y-2">
              {analysisHistory.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedHistoryIndex(idx);
                    setAnalysisData(item.analysisData);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 relative group overflow-hidden ${
                    selectedHistoryIndex === idx
                      ? 'liquid-glass-elevated border-primary/15'
                      : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04]'
                  }`}
                >
                  {selectedHistoryIndex === idx && (
                    <motion.div 
                      layoutId="active-history"
                      className="absolute inset-y-0 left-0 w-[2px] bg-primary rounded-full"
                    />
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${selectedHistoryIndex === idx ? 'text-primary/80' : 'text-muted-foreground/50'}`}>
                      {idx === 0 ? 'Latest' : 'Previous'}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" /> 
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className={`font-medium text-sm leading-tight transition-colors ${selectedHistoryIndex === idx ? 'text-foreground/90' : 'text-muted-foreground/70'}`}>
                    {item.targetRole}
                  </h4>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
                    <span className="text-[10px] text-muted-foreground/50">Consensus Reached</span>
                  </div>
                </button>
              ))}
              
              {analysisHistory.length < 2 && (
                <div className="p-5 rounded-xl border border-dashed border-white/[0.06] text-center space-y-2">
                  <p className="text-[10px] text-muted-foreground/40">Run another analysis to fill history (Max 2)</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </motion.div>
  )
}
