"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    BrainCircuit,
    Code2,
    UserRoundCheck,
    Heart,
    ShieldCheck,
    ChevronRight,
    Loader2,
    CheckCircle2,
    Play,
    Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { aiDebateStreaming, DebateEvent } from "@/ai/flows/ai-debate-streaming-flow"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const agentColors: Record<string, string> = {
    "System": "text-muted-foreground",
    "Senior Tech Lead": "text-primary",
    "HR Specialist": "text-accent",
    "Product Manager": "text-orange-400",
    "Supervisor": "text-emerald-400",
}

type CandidateState = {
    id: string;
    candidate: any;
    events: DebateEvent[];
    isDebating: boolean;
    completed: boolean;
    result?: any;
}

function CandidateCard({ cs }: { cs: CandidateState }) {
    const { candidate, events, isDebating, completed, result } = cs;
    const latestEvent = events[events.length - 1];
    const progressPercent = events.length === 0 ? 0 : Math.min(100, (events.length / 15) * 100);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [events]);

    return (
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-lg overflow-hidden flex flex-col h-[380px]">
            <CardHeader className="bg-muted/20 pb-3 border-b border-border/40">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold">{candidate.fullName}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{candidate.role}</p>
                    </div>
                    {completed ? (
                        <Badge className={result === "HIRE" ? "bg-emerald-500/10 text-emerald-500" : result === "NO_HIRE" || result === "NO HIRE" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}>
                            {result === "Error" ? "FAILED" : result === "HIRE" ? "RECOMMEND HIRE" : "NO HIRE"}
                        </Badge>
                    ) : isDebating ? (
                        <Badge variant="outline" className="animate-pulse border-primary/20 text-primary bg-primary/5">
                            <BrainCircuit className="h-3 w-3 mr-1" /> Analyzing
                        </Badge>
                    ) : (
                        <Badge variant="outline">Waiting</Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative bg-background/50">
                {events.length === 0 && !isDebating && !completed ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground/50 text-sm">
                        Ready to launch panel
                    </div>
                ) : (
                    <ScrollArea className="h-full px-4 py-4">
                        <div className="space-y-4">
                            {events.map((event, i) => {
                                const colorClass = agentColors[event.agentName] || "text-foreground"
                                return (
                                    <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-[10px] font-bold ${colorClass}`}>{event.agentName}</span>
                                            <span className="text-[9px] text-muted-foreground">Round {event.round}</span>
                                        </div>
                                        <div className={`p-2.5 rounded-lg text-xs leading-relaxed border border-border/40 ${event.eventType === 'vote' ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}>
                                            {event.content}
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={scrollRef} className="h-2" />
                        </div>
                    </ScrollArea>
                )}
            </CardContent>

            {isDebating && (
                <div className="h-1 w-full bg-muted">
                    <div className="h-full bg-primary transition-all duration-300 ease-in-out" style={{ width: `${progressPercent}%` }} />
                </div>
            )}

            <CardFooter className="bg-muted/10 p-4 border-t border-border/40 flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">
                    {isDebating && latestEvent ? `Round ${latestEvent.round} • ${latestEvent.agentName}` : ""}
                </span>
                {completed && (
                    <Button variant="ghost" size="sm" asChild className="ml-auto font-bold text-xs h-8">
                        <Link href={`/reports/${candidate.id}`}>
                            View Full Report <ChevronRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

function BulkEvaluationContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useUser()
    const db = useFirestore()
    const { toast } = useToast()

    const idsParam = searchParams.get("ids")
    const hireCountParam = searchParams.get("hireCount")

    const ids = React.useMemo(() => idsParam ? idsParam.split(",") : [], [idsParam])

    const [candidatesState, setCandidatesState] = React.useState<Record<string, CandidateState>>({})
    const [isLoading, setIsLoading] = React.useState(true)
    const [isBulkDebating, setIsBulkDebating] = React.useState(false)
    const [bulkCompleted, setBulkCompleted] = React.useState(false)

    React.useEffect(() => {
        async function loadCandidates() {
            if (!user?.uid || !db || ids.length === 0) {
                setIsLoading(false)
                return
            }

            const states: Record<string, CandidateState> = {}
            for (const id of ids) {
                if (!id) continue;
                const cRef = doc(db, "users", user.uid, "candidates", id)
                const cSnap = await getDoc(cRef)
                if (cSnap.exists()) {
                    states[id] = {
                        id,
                        candidate: { id: cSnap.id, ...cSnap.data() },
                        events: [],
                        isDebating: false,
                        completed: false
                    }
                }
            }
            setCandidatesState(states)
            setIsLoading(false)
        }
        loadCandidates()
    }, [user?.uid, db, idsParam])

    const startBulkEvaluation = async () => {
        if (!user?.uid || !db || Object.keys(candidatesState).length === 0) return
        setIsBulkDebating(true)

        // Update local state to show debating
        const newState = { ...candidatesState }
        Object.keys(newState).forEach(id => {
            newState[id].isDebating = true;
            newState[id].events = [];
            newState[id].completed = false;
        })
        setCandidatesState(newState)

        // Execute concurrently
        const promises = Object.values(candidatesState).map(async (cs) => {
            const { id, candidate } = cs;
            const candidateRef = doc(db, "users", user.uid, "candidates", id);

            try {
                const jobsRef = collection(db, "users", user.uid, "jobDescriptions");
                const q = query(jobsRef, where("title", "==", candidate.role), limit(1));
                const jobSnap = await getDocs(q);
                const jobData = jobSnap.docs[0]?.data();

                await updateDoc(candidateRef, { status: "In Debate" })

                const debateInput = {
                    candidateName: candidate.fullName,
                    candidateId: id,
                    resumeText: candidate.resumeText || candidate.notes || "Standard professional resume content.",
                    githubUrl: candidate.githubUrl || undefined,
                    portfolioData: candidate.portfolioUrl ? `Personal Portfolio: ${candidate.portfolioUrl}` : "Portfolio evidence derived from resume and projects.",
                    interviewTranscript: candidate.hasAudio
                        ? `[Audio Interview Transcription]: Candidate discusses their approach.`
                        : "Recruiter notes indicate strong communication.",
                    jobTitle: candidate.role,
                    jobDescription: jobData?.descriptionText || "Senior role requiring high autonomy.",
                    jobSkills: jobData?.skills || [],
                };

                const result = await aiDebateStreaming(debateInput);

                // Simulate streaming for this specific candidate
                for (let i = 0; i < result.debateTranscript.length; i++) {
                    const event = result.debateTranscript[i];
                    const isRoundChange = i > 0 && event.round !== result.debateTranscript[i - 1].round;
                    const delay = isRoundChange ? 1500 : 800; // slightly faster for bulk

                    await new Promise(resolve => setTimeout(resolve, delay))
                    setCandidatesState(prev => {
                        const current = prev[id];
                        return {
                            ...prev,
                            [id]: {
                                ...current,
                                events: [...current.events, event]
                            }
                        }
                    })
                }

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

                await updateDoc(candidateRef, { status: "Evaluated", evaluationId: evalId })

                setCandidatesState(prev => ({
                    ...prev,
                    [id]: {
                        ...prev[id],
                        isDebating: false,
                        completed: true,
                        result: result.finalRecommendation
                    }
                }))
            } catch (error) {
                console.error(`Evaluation failed for ${candidate.fullName}`, error)
                setCandidatesState(prev => ({
                    ...prev,
                    [id]: { ...prev[id], isDebating: false, completed: true, result: "Error" }
                }))
            }
        });

        await Promise.all(promises);
        setIsBulkDebating(false)
        setBulkCompleted(true)
        toast({ title: "Bulk Evaluation Completed", description: "All candidates have been evaluated." })
    }

    if (isLoading) {
        return <div className="h-full flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    const candidateList = Object.values(candidatesState)

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 uppercase tracking-tighter font-bold px-3">
                            Target Hires: <Users className="h-3 w-3 ml-1 mr-1" /> {hireCountParam || "?"}
                        </Badge>
                        <h2 className="text-3xl font-bold tracking-tight font-headline">Bulk AI Panel Evaluation</h2>
                    </div>
                    <p className="text-muted-foreground">Evaluating {candidateList.length} candidates concurrently.</p>
                </div>
                <div className="flex items-center gap-3">
                    {bulkCompleted && (
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6" onClick={() => router.push(`/candidates`)}>
                            Return to Pipeline <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    )}
                    {!isBulkDebating && !bulkCompleted && candidateList.length > 0 && (
                        <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold px-8" onClick={startBulkEvaluation}>
                            Start Bulk Panel <Play className="ml-2 h-4 w-4 fill-current" />
                        </Button>
                    )}
                    {isBulkDebating && (
                        <Button disabled variant="outline" className="gap-3 border-primary/20 bg-primary/5">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="animate-pulse">Deliberating for {candidateList.length} candidates...</span>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidateList.map((cs) => (
                    <CandidateCard key={cs.id} cs={cs} />
                ))}
            </div>
        </div>
    )
}

export default function BulkEvaluationPage() {
    return (
        <React.Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading Bulk Evaluation...</div>}>
            <BulkEvaluationContent />
        </React.Suspense>
    )
}
