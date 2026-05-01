"use client"

import * as React from "react"
import {
  Video,
  Mic,
  BrainCircuit,
  Settings,
  ArrowRight,
  Play,
  User,
  ShieldAlert,
  Zap,
  Coffee,
  Frown
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { useRouter } from "next/navigation"
import { personas } from "@/ai/personas"
import { Badge } from "@/components/ui/badge"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 }
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

export default function CandidateMockInterview() {
  const router = useRouter()
  const [selectedPersonaId, setSelectedPersonaId] = React.useState("tech-lead")
  const [toughness, setToughness] = React.useState("medium")

  const selectedPersona = personas.find(p => p.id === selectedPersonaId) || personas[0]

  const toughnessLevels = [
    { id: "easy", label: "Easy", icon: <Coffee className="h-3 w-3" />, activeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15" },
    { id: "medium", label: "Medium", icon: <Zap className="h-3 w-3" />, activeClass: "text-sky-400 bg-sky-500/10 border-sky-500/15" },
    { id: "hard", label: "Hard", icon: <ShieldAlert className="h-3 w-3" />, activeClass: "text-amber-400 bg-amber-500/10 border-amber-500/15" },
    { id: "stress", label: "Stress", icon: <Frown className="h-3 w-3" />, activeClass: "text-rose-400 bg-rose-500/10 border-rose-500/15" }
  ]

  const handleStartSession = () => {
    router.push(`/candidate/mock-interview/session?persona=${selectedPersonaId}&toughness=${toughness}`)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-6xl mx-auto pb-12"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground/95">Mock Interviews</h2>
          <p className="text-sm text-muted-foreground mt-1">Practice with real-time AI interviewers. Choose your challenge.</p>
        </div>
        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-primary/8 text-primary/70 border border-primary/10 w-fit flex items-center gap-1.5">
          <Zap className="h-3 w-3" /> Gemini Powered
        </span>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Persona Selection Grid */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" /> Select Your Interviewer
            </h3>
            <span className="text-[10px] text-muted-foreground/50 font-medium">{personas.length} Available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {personas.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedPersonaId(p.id)}
              >
                <div className={`cursor-pointer transition-all duration-300 rounded-xl border overflow-hidden ${selectedPersonaId === p.id
                  ? "liquid-glass-elevated border-primary/15"
                  : "bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="p-4 flex gap-3.5">
                    <div className={`h-10 w-10 rounded-lg ${p.avatarColor} flex items-center justify-center shrink-0`}>
                      <User className="h-5 w-5 text-white/90" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground/90 truncate">{p.name}</span>
                        {selectedPersonaId === p.id && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-primary/15 text-primary/80"
                          >
                            Selected
                          </motion.span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-foreground/60">{p.role}</p>
                      <p className="text-[11px] text-muted-foreground/60 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Configuration & Start */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="liquid-glass-elevated rounded-xl p-5 flex flex-col gap-6">
            {/* Difficulty Selector */}
            <div className="space-y-3 text-center">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-foreground/90">Interview Difficulty</h3>
                <p className="text-[11px] text-muted-foreground/60">Adjusts AI follow-up strictness</p>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {toughnessLevels.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setToughness(lvl.id)}
                    className={`h-10 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-all duration-200 ${toughness === lvl.id
                      ? lvl.activeClass
                      : "bg-white/[0.02] border-white/[0.05] text-muted-foreground/50 hover:bg-white/[0.04] hover:text-muted-foreground"
                      }`}
                  >
                    {lvl.icon}
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/[0.04]" />

            {/* Selection Summary */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPersonaId}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg ${selectedPersona.avatarColor} flex items-center justify-center shrink-0`}>
                    <User className="h-4 w-4 text-white/90" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">Session With</span>
                    <span className="text-sm font-medium text-foreground/90 truncate">{selectedPersona.name}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground/50 leading-relaxed border-l-2 border-white/[0.06] pl-2.5">
                  "{selectedPersona.systemInstruction.substring(0, 100)}…"
                </p>
              </motion.div>
            </AnimatePresence>

            <Button
              onClick={handleStartSession}
              className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-medium h-12 text-sm gap-2.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_-6px_hsl(var(--primary)_/_0.4)]"
            >
              <Play className="h-4 w-4 fill-current" /> Start Interview
            </Button>

            <div className="flex items-center justify-center gap-5 text-[10px] text-muted-foreground/30 font-medium">
              <div className="flex items-center gap-1.5"><Mic className="h-3 w-3" /> Audio</div>
              <div className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> Live</div>
              <div className="flex items-center gap-1.5"><BrainCircuit className="h-3 w-3" /> 24kHz</div>
            </div>
          </div>

          <div className="liquid-glass-subtle rounded-xl p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-white/[0.04]">
                <ShieldAlert className="h-3.5 w-3.5 text-primary/60" />
              </div>
              <div>
                <h4 className="text-[11px] font-medium text-foreground/70">Privacy Note</h4>
                <p className="text-[10px] text-muted-foreground/50">Audio is processed in real-time and not stored.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
