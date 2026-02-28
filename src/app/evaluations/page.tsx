
"use client"

import * as React from "react"
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  ArrowUpRight,
  Filter,
  Loader2,
  Briefcase,
  History,
  Archive
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

function ScoreCircle({ score }: { score: number }) {
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const getColor = (s: number) => {
    if (s >= 80) return "stroke-emerald-400"
    if (s >= 60) return "stroke-orange-400"
    return "stroke-destructive"
  }
  return (
    <div className="relative h-10 w-10 flex items-center justify-center">
      <svg className="h-full w-full -rotate-90">
        <circle cx="20" cy="20" r={radius} className="stroke-muted fill-none" strokeWidth="3" />
        <circle cx="20" cy="20" r={radius} className={`fill-none transition-all duration-1000 ease-out ${getColor(score)}`} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[10px] font-bold">{score}</span>
    </div>
  )
}

export default function EvaluationsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isAssignRoleOpen, setIsAssignRoleOpen] = React.useState(false)
  const [selectedEval, setSelectedEval] = React.useState<any>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [newRole, setNewRole] = React.useState("")

  const evalsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "users", user.uid, "evaluations"), orderBy("createdAt", "desc"))
  }, [db, user?.uid])

  const jobsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "users", user.uid, "jobDescriptions"), orderBy("title"))
  }, [db, user?.uid])

  const { data: evaluations, isLoading } = useCollection(evalsQuery)
  const { data: jobs } = useCollection(jobsQuery)

  const onAssignRoleClick = (evalItem: any) => {
    setSelectedEval(evalItem)
    setNewRole("")
    setIsAssignRoleOpen(true)
  }

  const handleAssignRole = async () => {
    if (!db || !user?.uid || !selectedEval || !newRole) return

    setIsSubmitting(true)
    try {
      // Find the job title for the selected role ID
      const job = jobs?.find(j => j.id === newRole);
      if (!job) return;

      // Update the candidate's target role
      const candidateRef = doc(db, "users", user.uid, "candidates", selectedEval.candidateId)
      await updateDoc(candidateRef, { role: job.title })
      
      toast({ title: "Role Assigned", description: `Candidate target role updated to ${job.title}.` })
      setIsAssignRoleOpen(false)
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update role." })
    } finally { setIsSubmitting(false) }
  }

  const handleArchiveEval = async (evalItem: any) => {
    if (!db || !user?.uid) return
    if (!confirm("Are you sure you want to archive this evaluation?")) return

    try {
      await deleteDoc(doc(db, "users", user.uid, "evaluations", evalItem.id))
      toast({ title: "Evaluation Archived", description: "Result has been removed from view." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to archive evaluation." })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Evaluations</h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">{evaluations?.length || 0} total evaluations</p>
        </div>
        <Button asChild className="gap-2 bg-primary text-primary-foreground font-bold px-6">
          <Link href="/candidates"><Plus className="h-4 w-4" /> New Evaluation</Link>
        </Button>
      </div>

      <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
        <DialogContent className="border-border/40 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Assign Job Role</DialogTitle>
            <DialogDescription>Retarget {selectedEval?.candidateName} for a different open position.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Select New Position</Label>
              <Select onValueChange={setNewRole}>
                <SelectTrigger className="bg-muted/20 border-border/40">
                  <SelectValue placeholder="Choose a job profile" />
                </SelectTrigger>
                <SelectContent>
                  {jobs?.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} <span className="text-[10px] opacity-50 ml-1">({job.department})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAssignRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignRole} disabled={isSubmitting || !newRole} className="font-bold">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/40 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search candidates..." className="pl-9 bg-muted/40 border-none" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/10">
                  <th className="p-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Candidate</th>
                  <th className="p-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">Score</th>
                  <th className="p-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">Recommendation</th>
                  <th className="p-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Started</th>
                  <th className="p-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></td></tr>
                ) : evaluations && evaluations.length > 0 ? (
                  evaluations.map((evalItem) => (
                    <tr key={evalItem.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="p-6"><span className="font-bold text-sm tracking-tight">{evalItem.candidateName}</span></td>
                      <td className="p-6"><div className="flex justify-center"><ScoreCircle score={evalItem.confidenceScore} /></div></td>
                      <td className="p-6 text-center"><span className="text-[11px] font-black uppercase tracking-wider text-primary">{evalItem.recommendation?.substring(0, 30)}...</span></td>
                      <td className="p-6"><span className="text-sm font-medium text-muted-foreground">{evalItem.createdAt?.toDate ? evalItem.createdAt.toDate().toLocaleDateString() : '—'}</span></td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/reports/${evalItem.candidateId}`}><ArrowUpRight className="h-4 w-4" /></Link>
                          </Button>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>AI Panel Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/reports/${evalItem.candidateId}`} className="flex items-center gap-2">
                                  <ArrowUpRight className="h-4 w-4" /> View Full Report
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2" onClick={() => onAssignRoleClick(evalItem)}>
                                <Briefcase className="h-4 w-4" /> Assign Job Role
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <History className="h-4 w-4" /> Re-run Deliberation
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive gap-2" onClick={() => handleArchiveEval(evalItem)}>
                                <Archive className="h-4 w-4" /> Archive Result
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No evaluations found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}