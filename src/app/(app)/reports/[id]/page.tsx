"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  BrainCircuit, 
  ChevronLeft, 
  FileText, 
  Quote, 
  ShieldCheck, 
  Target,
  ThumbsDown,
  ThumbsUp,
  AlertTriangle,
  Share2,
  History,
  Code2,
  Heart,
  UserRoundCheck,
  ChevronRight,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function ReportDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [overrideNote, setOverrideNote] = React.useState("")

  const evalRef = useMemoFirebase(() => {
    if (!db || !user?.uid || !id) return null
    return doc(db, "users", user.uid, "evaluations", `eval-${id}`)
  }, [db, user?.uid, id])

  const { data: report, isLoading } = useDoc(evalRef)

  const handleDecision = async (type: 'approve' | 'reject' | 'override') => {
    if (!db || !user?.uid || !id) return
    
    try {
      await updateDoc(doc(db, "users", user.uid, "candidates", id as string), {
        finalDecision: type,
        decisionNote: overrideNote,
        decisionAt: new Date()
      })

      toast({
        title: "Decision Recorded",
        description: `Recommendation has been ${type === 'approve' ? 'accepted' : type === 'reject' ? 'rejected' : 'overridden'}.`,
      })
      router.push('/reports')
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save decision.",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading consensus report...</p>
      </div>
    )
  }

  if (!report) return <div className="p-12 text-center">Report not found for this candidate.</div>

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground -ml-2" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
            Back to pipeline
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-bold tracking-tight font-headline">{report.candidateName}</h2>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 font-bold">
                Synthesized Consensus
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2 text-lg">Consensus Report • Role Analysis Complete</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-border/60">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button className="bg-primary text-white font-bold px-8 shadow-lg shadow-primary/20">
            Send to Hiring Manager
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-muted/10 pb-6 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Consensus Findings
                </CardTitle>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1">AI Confidence</p>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-black text-primary font-code">{report.confidenceScore}%</p>
                      <Progress value={report.confidenceScore} className="w-24 h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose prose-invert max-w-none text-foreground/90 leading-relaxed text-lg italic border-l-4 border-primary/20 pl-6">
                "{report.recommendation}"
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="bg-muted/40 p-1 w-full justify-start h-auto border border-border/40 mb-6">
              <TabsTrigger value="transcript" className="px-6 py-2.5 data-[state=active]:bg-card text-xs font-bold uppercase tracking-widest gap-2">
                <BrainCircuit className="h-3.5 w-3.5" />
                Debate Transcript
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transcript" className="mt-0">
              <div className="space-y-4">
                {report.transcript?.map((event: any, i: number) => (
                  <div key={i} className="flex gap-4 p-5 rounded-xl bg-card/30 border border-white/5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-primary">{event.agentName}</span>
                        <Badge variant="outline" className="text-[8px] h-3">{event.eventType}</Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90">{event.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border-border/40 bg-card/40 overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/10">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-5 w-5 text-accent" />
                Recruiter Verdict
              </CardTitle>
              <CardDescription>Review findings and submit your final decision.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col gap-4">
                <Button 
                  className="w-full justify-between h-14 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold group"
                  onClick={() => handleDecision('approve')}
                >
                  <div className="flex items-center gap-3">
                    <ThumbsUp className="h-5 w-5" />
                    Accept Consensus
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-14 border-destructive/30 hover:bg-destructive/10 text-destructive font-bold group"
                  onClick={() => handleDecision('reject')}
                >
                  <div className="flex items-center gap-3">
                    <ThumbsDown className="h-5 w-5" />
                    Reject Recommendation
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                </Button>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Decision Context</span>
                </div>
                <Textarea 
                  placeholder="Add notes about your decision..."
                  className="min-h-[120px] bg-muted/30 border-border/40 focus:ring-primary/40 text-sm"
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
