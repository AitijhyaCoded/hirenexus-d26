"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  BrainCircuit, 
  Code2, 
  UserRoundCheck, 
  Heart, 
  ShieldCheck, 
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Vote
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { aiDebateStreaming, DebateEvent } from "@/ai/flows/ai-debate-streaming-flow"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

const agentIcons: Record<string, any> = {
  "System": ShieldCheck,
  "Senior Tech Lead": Code2,
  "HR Specialist": Heart,
  "Product Manager": UserRoundCheck,
  "Supervisor": BrainCircuit,
}

const agentColors: Record<string, string> = {
  "System": "text-muted-foreground",
  "Senior Tech Lead": "text-primary",
  "HR Specialist": "text-accent",
  "Product Manager": "text-orange-400",
  "Supervisor": "text-emerald-400",
}

export default function EvaluationPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [events, setEvents] = React.useState<DebateEvent[]>([])
  const [isDebating, setIsDebating] = React.useState(false)
  const [completed, setCompleted] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const candidateRef = useMemoFirebase(() => {
    if (!db || !user?.uid || !id) return null
    return doc(db, "users", user.uid, "candidates", id as string)
  }, [db, user?.uid, id])

  const { data: candidate, isLoading: isCandLoading } = useDoc(candidateRef)

  const startEvaluation = async () => {
    if (!candidate || !user?.uid || !db) return
    
    setIsDebating(true)
    setEvents([])
    setCompleted(false)

    try {
      // 1. Fetch Job Description for context
      const jobsRef = collection(db, "users", user.uid, "jobDescriptions");
      const q = query(jobsRef, where("title", "==", candidate.role), limit(1));
      const jobSnap = await getDocs(q);
      const jobData = jobSnap.docs[0]?.data();

      // Update candidate status to indicate evaluation is starting
      await updateDoc(candidateRef!, { status: "In Debate" })

      // 2. Prepare detailed data for the debate engine
      const debateInput = {
        candidateName: candidate.fullName,
        candidateId: id as string,
        resumeText: candidate.notes || "Standard professional resume content.",
        githubUrl: candidate.githubUrl || undefined,
        portfolioData: candidate.portfolioUrl ? `Personal Portfolio: ${candidate.portfolioUrl}` : "Portfolio evidence derived from resume and projects.",
        interviewTranscript: candidate.hasAudio 
          ? `[Audio Interview Transcription]: Candidate discusses their architectural approach, conflict resolution strategies, and interest in the ${candidate.role} role. They highlight their proficiency in relevant tech stacks.` 
          : "Recruiter notes indicate strong communication and clear technical explanations.",
        jobTitle: candidate.role,
        jobDescription: jobData?.descriptionText || "Senior role requiring high autonomy and technical leadership.",
        jobSkills: jobData?.skills || [],
      };

      // 3. Trigger Genkit Debate Flow
      const result = await aiDebateStreaming(debateInput);

      // 4. Simulate streaming events for the UI experience
      for (let i = 0; i < result.debateTranscript.length; i++) {
        const event = result.debateTranscript[i];
        // Round changes get a slightly longer pause for dramatic effect
        const isRoundChange = i > 0 && event.round !== result.debateTranscript[i-1].round;
        const delay = isRoundChange ? 2500 : 1500;
        
        await new Promise(resolve => setTimeout(resolve, delay))
        setEvents(prev => [...prev, event])
      }
      
      // 5. Save final result to evaluations collection
      const evalId = `eval-${id}`
      await setDoc(doc(db, "users", user.uid, "evaluations", evalId), {
        id: evalId,
        userId: user.uid,
        candidateId: id,
        candidateName: candidate.fullName,
        recommendation: result.finalRecommendation,
        confidenceScore: result.confidenceScore,
        transcript: result.debateTranscript,
        createdAt: serverTimestamp(),
      })

      // 6. Update candidate final status
      await updateDoc(candidateRef!, { status: "Evaluated", evaluationId: evalId })
      
      setCompleted(true)
      toast({
        title: "Consensus Reached",
        description: "The AI panel has concluded its deliberation.",
      })
    } catch (error) {
      console.error("Evaluation failed", error)
      toast({
        variant: "destructive",
        title: "Evaluation System Error",
        description: "The AI panel was unable to convene. Please check your data sources.",
      })
    } finally {
      setIsDebating(false)
    }
  }

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [events])

  if (isCandLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!candidate) return <div className="p-12 text-center">Candidate profile not found.</div>

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-9rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 uppercase tracking-tighter font-bold px-3">
              Case: {candidate.fullName}
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight font-headline">AI Deliberation Panel</h2>
          </div>
          <p className="text-muted-foreground">Expert agents analyzing Resume, GitHub, and Transcripts for the {candidate.role} role.</p>
        </div>
        <div className="flex items-center gap-3">
          {completed && (
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 shadow-lg shadow-emerald-500/20" onClick={() => router.push(`/reports/${id}`)}>
              Review Final Consensus <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
          {!isDebating && !completed && (
            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold px-8" onClick={startEvaluation}>
              Launch AI Panel
            </Button>
          )}
          {isDebating && (
            <Button disabled variant="outline" className="gap-3 border-primary/20 bg-primary/5">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="animate-pulse">Panel is Deliberating...</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
          <Card className="flex-1 border-border/40 bg-card/20 backdrop-blur-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4 flex flex-row items-center justify-between shrink-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Live Consensus Transcript
              </CardTitle>
              {isDebating && <Badge variant="secondary" className="bg-primary/10 text-primary border-none animate-pulse">Analysis in Progress</Badge>}
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 relative">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {events.length === 0 && !isDebating && (
                    <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="p-5 rounded-2xl bg-muted/30 border border-border/40">
                        <BrainCircuit className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                      <div className="max-w-sm">
                        <h3 className="text-lg font-bold">Ready for Deliberation</h3>
                        <p className="text-muted-foreground text-sm mt-1">The panel will conduct a 3-round debate analyzing all candidate materials to reach a hiring recommendation.</p>
                      </div>
                    </div>
                  )}

                  {events.map((event, i) => {
                    const Icon = agentIcons[event.agentName] || ShieldCheck
                    const colorClass = agentColors[event.agentName] || "text-foreground"
                    
                    return (
                      <div key={i} className="flex gap-4 group animate-in slide-in-from-bottom-3 fade-in duration-700">
                        <div className={`shrink-0 h-11 w-11 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center ${colorClass} shadow-inner`}>
                          {event.eventType === 'vote' ? <Vote className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm tracking-tight ${colorClass}`}>{event.agentName}</span>
                              <Badge variant="outline" className="text-[9px] uppercase tracking-widest px-2 h-5 font-bold border-border/60 bg-muted/30">
                                Round {event.round} • {event.eventType}
                              </Badge>
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <div className={`p-4 rounded-2xl border border-border/40 text-sm leading-relaxed shadow-sm ${event.eventType === 'vote' ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' : 'bg-card/40'}`}>
                            {event.content}
                          </div>
                          {event.citedSource && (
                            <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-xl border border-border/40 group-hover:border-primary/20 transition-all duration-300">
                              <p className="text-[11px] font-medium text-foreground/70 italic">
                                <span className="text-primary font-bold mr-1.5 uppercase tracking-tighter">Evidence Source:</span>
                                {event.citedSource}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={scrollRef} className="h-4" />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 overflow-hidden">
          <Card className="border-border/40 bg-card/40 shrink-0 shadow-lg">
            <CardHeader className="pb-3 border-b border-border/40 mb-3 px-4 pt-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Panel Presence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              {[
                { name: "Senior Tech Lead", icon: Code2, color: "text-primary" },
                { name: "Product Manager", icon: UserRoundCheck, color: "text-orange-400" },
                { name: "HR Specialist", icon: Heart, color: "text-accent" },
              ].map((agent) => {
                const isActive = events.some(e => e.agentName === agent.name);
                const isVoting = events.some(e => e.agentName === agent.name && e.eventType === 'vote');
                return (
                  <div key={agent.name} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-transparent hover:border-border/40 transition-colors">
                    <div className="flex items-center gap-2">
                      <agent.icon className={`h-3.5 w-3.5 ${agent.color}`} />
                      <span className="text-xs font-bold">{agent.name.split(' ').pop()}</span>
                    </div>
                    <Badge variant="outline" className={`text-[9px] px-1.5 h-5 border-none ${isVoting ? "text-emerald-400 font-black" : isActive ? "animate-pulse text-primary font-bold" : "text-muted-foreground/40"}`}>
                      {isVoting ? "CONSENSUS" : isActive ? "ANALYZING" : "WAITING"}
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/40 flex-1 overflow-hidden flex flex-col shadow-lg">
            <CardHeader className="pb-3 border-b border-border/40 mb-3 px-4 pt-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Protocol Engine</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-5 px-4 pb-4">
              <div className="space-y-6">
                {[
                  { label: "Round 1: Initial Findings", desc: "Agents state initial takes based on primary data sources.", round: 1 },
                  { label: "Round 2: Cross-Examination", desc: "Roles challenge conflicting data and missing context.", round: 2 },
                  { label: "Round 3: Final Recommendation", desc: "Binding Hire/No-Hire votes with evidence justification.", round: 3 },
                ].map((step, i) => {
                  const isDone = events.some(e => e.round > step.round) || completed;
                  const isCurrent = events.some(e => e.round === step.round) && !isDone;
                  return (
                    <div key={i} className="flex gap-3 relative">
                      {i !== 2 && <div className={`absolute left-[11px] top-[26px] bottom-[-24px] w-px ${isDone ? "bg-emerald-500/40" : "bg-border/40"}`} />}
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                        isDone ? "bg-emerald-500 border-emerald-400/20 text-white" : 
                        isCurrent ? "bg-primary border-primary/20 animate-pulse text-white shadow-lg shadow-primary/20" : "bg-muted border-border/60 text-muted-foreground"
                      }`}>
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{i+1}</span>}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-[11px] font-bold ${!isCurrent && !isDone ? "text-muted-foreground/60" : "text-foreground"}`}>{step.label}</span>
                        <span className="text-[9px] text-muted-foreground/50 leading-tight">{step.desc}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
