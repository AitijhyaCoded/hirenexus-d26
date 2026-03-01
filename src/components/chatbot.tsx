"use client"

import React, { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { generateSupportResponse, ChatMessage } from "@/app/actions/chat"

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "model",
            content: "Hi! I'm the HireNexus AI assistant. How can I help you learn about our multi-agent evaluation platform today?"
        }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMsg = input.trim()
        setInput("")

        // Add user message to UI
        const updatedMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }]
        setMessages(updatedMessages)
        setIsLoading(true)

        try {
            // Create history payload from all but the newest message
            const history = updatedMessages.slice(0, -1)
            const res = await generateSupportResponse(history, userMsg)

            if (res.success && res.response) {
                setMessages(prev => [...prev, { role: "model", content: res.response }])
            } else {
                setMessages(prev => [...prev, { role: "model", content: res.error || "An error occurred." }])
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "model", content: "Sorry, I encountered an error connecting to our servers." }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-primary/90 transition-all duration-300 z-50"
                >
                    <MessageSquare className="h-6 w-6" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[360px] h-[500px] bg-card border border-border/40 shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">

                    {/* Header */}
                    <div className="h-16 bg-primary/10 border-b border-primary/20 flex items-center justify-between px-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                                <Bot className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-tight text-foreground">Hiru AI</h3>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Online</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10"
                    >
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                {msg.role === "model" && (
                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <Bot className="h-4 w-4 text-primary" />
                                    </div>
                                )}

                                <div
                                    className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                        : "bg-muted text-foreground rounded-tl-sm border border-border/40"
                                        }`}
                                >
                                    {msg.content}
                                </div>

                                {msg.role === "user" && (
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-primary animate-pulse" />
                                </div>
                                <div className="px-4 py-3 rounded-2xl bg-muted rounded-tl-sm border border-border/40 flex items-center gap-1.5">
                                    <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                                    <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                    <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-card border-t border-border/40 shrink-0">
                        <form onSubmit={handleSubmit} className="relative flex items-center">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about HireNexus..."
                                className="pr-10 bg-muted/40 border-border/60 focus-visible:ring-primary/40 rounded-full h-10"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isLoading || !input.trim()}
                                className="absolute right-1 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 ml-px" />}
                            </Button>
                        </form>
                    </div>

                </div>
            )}
        </>
    )
}
