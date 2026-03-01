"use client"

import * as React from "react"
import { 
  FileText, 
  Search, 
  MoreHorizontal,
  ArrowUpRight,
  Filter,
  Download,
  Share2,
  Trash2,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"

export default function ReportsListPage() {
  const { user } = useUser()
  const db = useFirestore()

  const reportsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "users", user.uid, "evaluations"), orderBy("createdAt", "desc"))
  }, [db, user?.uid])

  const { data: reports, isLoading } = useCollection(reportsQuery)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline text-foreground">Consensus Reports</h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Access final synthesized hiring recommendations from your AI panels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-border/60">
            <Download className="h-4 w-4" />
            Bulk Export
          </Button>
        </div>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/40 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search candidates or roles..." 
                className="pl-9 bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/50" 
              />
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/10">
                  <th className="p-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Candidate</th>
                  <th className="p-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Confidence</th>
                  <th className="p-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Date</th>
                  <th className="p-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : reports && reports.length > 0 ? (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-sm tracking-tight">{report.candidateName}</span>
                        </div>
                      </td>
                      <td className="p-6 min-w-[150px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-primary">{report.confidenceScore}%</span>
                          </div>
                          <Progress value={report.confidenceScore} className="h-1 bg-muted/40" />
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-xs font-medium text-muted-foreground">
                          {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-xs font-bold gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/reports/${report.candidateId}`}>
                              View Full Report <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-muted-foreground">
                      No consensus reports finalized yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
