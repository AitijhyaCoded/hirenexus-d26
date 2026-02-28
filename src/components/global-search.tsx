"use client"

import * as React from "react"
import { Search, FileText, Users, Briefcase, BrainCircuit, ArrowRight, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const mockData = [
  { id: "cand-1", title: "Alex Rivera", type: "Candidate", category: "candidates", icon: Users },
  { id: "cand-2", title: "Sarah Chen", type: "Candidate", category: "candidates", icon: Users },
  { id: "job-1", title: "Senior Full-Stack Engineer", type: "Job", category: "jobs", icon: Briefcase },
  { id: "job-2", title: "ML Engineer", type: "Job", category: "jobs", icon: Briefcase },
  { id: "eval-1", title: "Evaluation: Alex Rivera", type: "Evaluation", category: "evaluate", icon: BrainCircuit },
  { id: "rep-1", title: "Report: Sarah Chen", type: "Report", category: "reports", icon: FileText },
]

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const router = useRouter()

  const filteredResults = React.useMemo(() => {
    if (!query || query.length < 2) return []
    return mockData.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase())
    )
  }, [query])

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        const input = document.getElementById("global-search-input")
        input?.focus()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <div className="relative w-full max-w-xl group">
      <Popover open={open && query.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
            <Input
              id="global-search-input"
              type="text"
              placeholder="Search (⌘+K)"
              className="w-full bg-muted/30 border-border/40 rounded-xl pl-10 pr-12 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-muted/50 transition-all placeholder:text-muted-foreground/60 h-11"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => {
                if (query.length > 0) setOpen(true)
              }}
            />
            {query && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-muted"
                onClick={() => {
                  setQuery("")
                  setOpen(false)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {!query && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 select-none pointer-events-none">
                <kbd className="h-5 px-1.5 rounded border border-border/40 bg-muted/60 text-[10px] font-bold flex items-center justify-center">⌘</kbd>
                <kbd className="h-5 px-1.5 rounded border border-border/40 bg-muted/60 text-[10px] font-bold flex items-center justify-center">K</kbd>
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl mt-2 overflow-hidden" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ScrollArea className="max-h-[350px]">
            {filteredResults.length > 0 ? (
              <div className="p-2 space-y-1">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Results</div>
                {filteredResults.map((result) => {
                  const Icon = result.icon
                  return (
                    <button
                      key={`${result.category}-${result.id}`}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-primary/5 transition-all text-left group/item border border-transparent hover:border-primary/10"
                      onClick={() => {
                        router.push(`/${result.category}/${result.id}`)
                        setOpen(false)
                        setQuery("")
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted/50 group-hover/item:bg-primary/20 group-hover/item:text-primary transition-colors flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors">{result.title}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{result.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="opacity-0 group-hover/item:opacity-100 text-[9px] uppercase tracking-tighter px-1.5 h-4 border-primary/20 text-primary transition-opacity">Go to Page</Badge>
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : query.length < 2 ? (
              <div className="p-6 text-center space-y-2">
                 <p className="text-xs text-muted-foreground">Type at least 2 characters to start searching...</p>
              </div>
            ) : (
              <div className="p-10 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                  <Search className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm font-bold">No results found</p>
                  <p className="text-xs text-muted-foreground mt-1">We couldn't find any results for "{query}"</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  )
}