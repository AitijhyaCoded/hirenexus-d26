"use client"

import * as React from "react"
import { 
  Users, 
  BrainCircuit, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Filter,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, where, Timestamp } from "firebase/firestore"

export default function Dashboard() {
  const { user } = useUser()
  const db = useFirestore()

  const candidatesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return collection(db, "users", user.uid, "candidates")
  }, [db, user?.uid])

  const recentEvalsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    // Changed "Completed" to "Evaluated" to match the deliberation engine's output status
    return query(
      collection(db, "users", user.uid, "candidates"), 
      where("status", "in", ["Evaluated", "In Debate"]),
      orderBy("createdAt", "desc"), 
      limit(5)
    )
  }, [db, user?.uid])

  const { data: candidates, isLoading: isCandidatesLoading } = useCollection(candidatesQuery)
  const { data: recentEvals, isLoading: isEvalsLoading } = useCollection(recentEvalsQuery)

  // Derived Metrics
  const metrics = React.useMemo(() => {
    if (!candidates) return []
    
    const activeEvals = candidates.filter(c => c.status === "In Debate").length
    const pendingReviews = candidates.filter(c => c.status === "New" || c.status === "Reviewing").length
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const completedToday = candidates.filter(c => {
      // Logic now checks for "Evaluated" status
      if (c.status !== "Evaluated" || !c.createdAt) return false
      const createdAt = c.createdAt instanceof Timestamp ? c.createdAt.toDate() : new Date(c.createdAt)
      return createdAt >= today
    }).length

    return [
      {
        title: "Active Evaluations",
        value: activeEvals.toString(),
        change: "Real-time sync",
        icon: BrainCircuit,
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        title: "Pending Reviews",
        value: pendingReviews.toString(),
        change: "Awaiting panel",
        icon: Clock,
        color: "text-accent",
        bgColor: "bg-accent/10",
      },
      {
        title: "Completed Today",
        value: completedToday.toString(),
        change: "Today's yield",
        icon: CheckCircle2,
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
      },
      {
        title: "Hiring Pipeline",
        value: candidates.length.toString(),
        change: "Total database",
        icon: Users,
        color: "text-orange-400",
        bgColor: "bg-orange-400/10",
      },
    ]
  }, [candidates])

  if (isCandidatesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Recruiter Overview</h2>
          <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening with your hiring panel today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter View
          </Button>
          <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 font-medium">
            <Link href="/candidates">Add Candidate</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden group hover:border-primary/40 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${metric.bgColor}`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <Badge variant="outline" className="font-medium text-[10px] uppercase tracking-wider text-muted-foreground/60 border-none">
                  Live
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold tracking-tight">{metric.value}</h3>
                <p className="text-sm font-medium text-foreground/80 mt-1">{metric.title}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-[11px] text-muted-foreground">{metric.change}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/40 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold">Recent Pipeline Activity</CardTitle>
              <CardDescription>Latest updates from candidates in evaluation.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/10">
              <Link href="/candidates">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentEvals && recentEvals.length > 0 ? (
                recentEvals.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-all group cursor-pointer border border-transparent hover:border-border/60" 
                    onClick={() => {
                      if (item.status === 'Evaluated') {
                        window.location.href = `/reports/${item.id}`
                      } else if (item.status === 'In Debate') {
                        window.location.href = `/evaluate/${item.id}`
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                        {item.fullName.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{item.fullName}</span>
                        <span className="text-xs text-muted-foreground">{item.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <Badge className={
                        item.status === "Evaluated" 
                          ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" 
                          : item.status === "In Debate"
                          ? "bg-primary/10 text-primary border-primary/20 animate-pulse"
                          : "bg-orange-400/10 text-orange-400 border-orange-400/20"
                      }>
                        {item.status}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  {isEvalsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/40" />
                  ) : (
                    "No candidates currently in the evaluation phase."
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/40">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Protocol Status</CardTitle>
            <CardDescription>AI panel readiness across your pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { label: "New Candidates", count: candidates?.filter(c => !c.status || c.status === 'New').length || 0, color: "text-primary" },
                { label: "Active Deliberations", count: candidates?.filter(c => c.status === 'In Debate').length || 0, color: "text-accent" },
                { label: "Consensus Reached", count: candidates?.filter(c => c.status === 'Evaluated').length || 0, color: "text-emerald-400" },
              ].map((act, i) => (
                <div key={i} className="flex gap-4 items-start relative pb-6 last:pb-0">
                  {i !== 2 && <div className="absolute left-[11px] top-[28px] bottom-0 w-px bg-border/40" />}
                  <div className={`h-[22px] w-[22px] rounded-full border-2 border-background z-10 bg-muted flex items-center justify-center`}>
                    <div className={`h-2 w-2 rounded-full ${act.color.replace('text', 'bg')}`} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">
                      <span className={`font-bold ${act.color}`}>{act.count}</span> {act.label}
                    </p>
                    <span className="text-[11px] text-muted-foreground">Updated in real-time</span>
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full mt-4 text-xs font-semibold uppercase tracking-wider">
                <Link href="/evaluations">View All Evaluations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
