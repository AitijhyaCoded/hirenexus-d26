"use client"

import * as React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Mic,
  MicOff,
  PhoneOff,
  User,
  Settings,
  BrainCircuit,
  Loader2,
  ChevronLeft
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GeminiLiveClient } from "@/lib/gemini-live-api"
import { useAudioStream } from "@/hooks/use-audio-stream"
import { personas } from "@/ai/personas"

export default function MockInterviewSession() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const personaId = searchParams.get("persona") || "tech-lead"
  const toughnessId = searchParams.get("toughness") || "medium"

  const persona = useMemo(() => (personas as any[]).find(p => p.id === personaId) || personas[0], [personaId])

  const toughnessModifier = useMemo(() => {
    switch (toughnessId) {
      case 'easy':
        return "BEHAVIOR: Be exceptionally patient, supportive and encouraging. If the candidate struggles, provide subtle hints or rephrase the question to be simpler. Maintain a low-pressure environment.";
      case 'hard':
        return "BEHAVIOR: Be critical and skeptical. Challenge their assumptions. Ask deep follow-up questions about edge cases, performance, and trade-offs. Do not accept vague answers.";
      case 'stress':
        return "BEHAVIOR: Create a high-pressure environment. Display high urgency. Frequently interrupt to ask for 'even better' solutions or alternative approaches. Simulate a disorganized or demanding stakeholder.";
      default:
        return "BEHAVIOR: Maintain a balanced, professional, and standard interview pressure.";
    }
  }, [toughnessId])

  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [isError, setIsError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [transcript, setTranscript] = useState<string[]>([])
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)

  const { startRecording, stopRecording, isRecording, playAudioChunk, stopPlayout } = useAudioStream()
  const clientRef = useRef<GeminiLiveClient | null>(null)

  const handleJoin = async () => {
    console.log("Join button clicked")
    setIsError(null)
    setIsConnecting(true)
    try {
      // 1. Initialize Gemini Live Client
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY
      if (!apiKey) throw new Error("Google API Key not found.")

      const client = new GeminiLiveClient(apiKey)
      clientRef.current = client

      // 2. Setup Callbacks
      client.onAudioData = (base64) => {
        setIsAiSpeaking(true)
        playAudioChunk(base64)
      }

      client.onTextData = (text) => {
        setTranscript(prev => [...prev.slice(-3), `AI: ${text}`])
      }

      // 3. Connect with Dynamic Instruction
      console.log(`Connecting as ${persona.name} (${toughnessId})...`)
      await client.connect({
        systemInstruction: `${persona.systemInstruction}\n\n${toughnessModifier}`,
        generationConfig: {
          temperature: toughnessId === 'easy' ? 0.9 : 0.6, // Higher temperature for 'easy' (more creative/supportive), lower for 'hard' (more precise)
        }
      })

      setIsJoined(true)
      setIsConnecting(false)

      client.onSetupComplete = () => {
        console.log("Gemini Setup Complete!")
        setIsConnected(true)
        client.sendText("Hello! I am ready to start the interview.")
      }

      client.onerror = (err: any) => {
        console.error("Gemini Live Error Callback:", err)
        const errorMsg = typeof err === 'string' ? err : (err.message || "Connection failed")
        setIsError(`Live API Error: ${errorMsg}.`)
        setIsJoined(false)
        setIsConnected(false)
        setIsConnecting(false)
      }

      // 4. Start Audio Streaming
      console.log("Starting audio recording...")
      await startRecording(
        (chunk: ArrayBuffer) => {
          if (!isMuted && client.isConnected()) {
            const base64 = window.btoa(
              new Uint8Array(chunk).reduce((data, byte) => data + String.fromCharCode(byte), '')
            )
            client.sendAudio(base64)
          }
        }
      )

    } catch (err: any) {
      console.error("Critical handleJoin Error:", err)
      setIsError(err.message || "WebSocket handshake failed. Check console.")
      setIsConnecting(false)
    }
  }

  // Monitor AI speaking state via audio context if possible, or just timeout
  useEffect(() => {
    if (isAiSpeaking) {
      const timer = setTimeout(() => setIsAiSpeaking(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isAiSpeaking])

  useEffect(() => {
    return () => {
      stopRecording()
      stopPlayout()
      clientRef.current?.disconnect()
    }
  }, [stopRecording, stopPlayout])

  const handleEndCall = () => {
    clientRef.current?.disconnect()
    router.push("/candidate/mock-interview")
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-5xl mx-auto p-4 gap-6 relative">
      <AnimatePresence>
        {!isJoined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md pb-20"
          >
            <Card className="w-full max-w-md glass-panel p-8 text-center space-y-6 border-primary/20 bg-primary/5">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Mic className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-headline">Ready to Begin?</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Please grant microphone access to start your mock interview with <strong>{persona.name}</strong>.
                  </p>
                </div>
              </div>

              {isError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  {isError}
                </div>
              )}

              <Button
                size="lg"
                className="w-full font-bold h-12 text-md gap-2 shadow-xl shadow-primary/20"
                onClick={handleJoin}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connecting to Gemini...
                  </>
                ) : (
                  "Join Interview Session"
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-40">
                Secure & Private • Real-time Gemini AI
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-primary/20 text-primary animate-pulse">
            <span className="h-2 w-2 rounded-full bg-primary mr-2" />
            Live Session
          </Badge>
          <Settings className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Main Agent View */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-full">
          <Card className="flex-1 glass-panel relative overflow-hidden flex flex-col items-center justify-center border-primary/10">
            <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-${persona.avatarColor.split('-')[1]}-900/10`} />

            <AnimatePresence mode="wait">
              <motion.div
                key={persona.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 flex flex-col items-center gap-6"
              >
                <div className={`h-48 w-48 rounded-full ${persona.avatarColor} flex items-center justify-center border-4 border-white/10 shadow-2xl relative`}>
                  {isAiSpeaking && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-primary/50"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                  <User className="h-24 w-24 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold font-headline">{persona.name}</h3>
                  <p className="text-primary font-medium">{persona.role}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Audio Visualization - Simplified */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-1 h-12">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-primary/40 rounded-full"
                  animate={{
                    height: isAiSpeaking ? [12, Math.random() * 40 + 12, 12] : 4
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    delay: i * 0.05
                  }}
                />
              ))}
            </div>
          </Card>

          {/* Controls Dashboard */}
          <div className="h-32 flex gap-3">
             <Card className="w-32 glass-panel flex flex-col items-center justify-center border-white/5 bg-white/5 shrink-0">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center relative">
                    {!isMuted && isRecording && (
                        <motion.div 
                             className="absolute -inset-1 rounded-full border border-orange-400/50"
                             animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                             transition={{ repeat: Infinity, duration: 1 }}
                        />
                    )}
                    <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-[10px] mt-2 font-bold uppercase tracking-tight opacity-40">You</span>
             </Card>

            <div className="flex-1 flex gap-3">
              <Button 
                variant={isMuted ? "destructive" : "outline"} 
                className={`flex-1 h-full rounded-2xl flex flex-col gap-2 transition-all duration-300 ${!isMuted ? 'border-primary/20 hover:bg-primary/5 bg-white/5' : ''}`}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                <span className="text-[10px] font-bold uppercase tracking-wider">{isMuted ? "Unmute" : "Mute"}</span>
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 h-full rounded-2xl flex flex-col gap-2 shadow-lg shadow-destructive/20"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-6 w-6" />
                <span className="text-[10px] font-bold uppercase tracking-wider">End</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="flex flex-col gap-6">
          <Card className="glass-panel border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <BrainCircuit className="h-5 w-5" />
                <span className="font-bold">Interview Focus</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {persona.description}
              </p>
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-60">Status</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    {isConnected ? "Connected" : "Connecting..."}
                    {isConnected ? <div className="h-1 w-1 rounded-full bg-emerald-400" /> : <Loader2 className="h-3 w-3 animate-spin" />}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-60">Latency</span>
                  <span className="text-emerald-400">Sub-second</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card className="glass-panel border-white/10 flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">Live Transcript</span>
              <Badge variant="outline" className="text-[9px] h-4 bg-primary/5 border-primary/10 px-1.5 py-0">Real-time</Badge>
            </div>
            <CardContent className="p-4 flex-1 overflow-y-auto space-y-3 scrollbar-hide">
              {transcript.map((line, i) => (
                <div key={i} className={`p-2 rounded-lg text-xs ${line.startsWith('AI:') ? 'bg-white/5 border border-white/5' : 'bg-primary/5 border border-primary/10'}`}>
                  <span className="font-bold opacity-40 mr-2">{line.split(':')[0]}:</span>
                  <span className="opacity-80">{line.split(':').slice(1).join(':')}</span>
                </div>
              ))}
              {transcript.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 gap-2 py-8">
                  <BrainCircuit className="h-6 w-6" />
                  <p className="text-[10px] italic text-center">Conversation will appear here...</p>
                </div>
              )}
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  )
}
