"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    BrainCircuit,
    ArrowRight,
    Users,
    ShieldCheck,
    Zap,
    TrendingUp,
    MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/firebase"

export default function LandingPage() {
    const { user, isUserLoading } = useUser()
    const router = useRouter()

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <BrainCircuit className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold font-headline tracking-tighter">HireNexus</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {isUserLoading ? (
                            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
                        ) : user ? (
                            <Button asChild variant="default" className="bg-primary text-primary-foreground font-semibold">
                                <Link href="/dashboard">
                                    Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" className="hidden sm:flex font-medium">
                                    <Link href="/login">Sign In</Link>
                                </Button>
                                <Button asChild className="bg-primary text-primary-foreground font-semibold">
                                    <Link href="/login">Get Started</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <Badge className="mb-6 mx-auto bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 w-fit px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full">
                        <Zap className="h-3.5 w-3.5 fill-current" />
                        The Future of Recruitment
                    </Badge>

                    <h1 className="text-5xl md:text-7xl font-black font-headline tracking-tighter max-w-4xl mx-auto leading-[1.1]">
                        Multi-Agent AI for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Bias-Free</span> Evaluation.
                    </h1>

                    <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                        HireNexus brings together a panel of specialized AI agents to autonomously evaluate candidates, reduce human bias, and uncover top talent with unprecedented accuracy.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="h-14 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-2xl shadow-primary/20 w-full sm:w-auto">
                            <Link href={user ? "/dashboard" : "/login"}>
                                Start Evaluating Now <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base font-bold border-border/60 hover:bg-muted/50 w-full sm:w-auto">
                            <Link href="#features">
                                How It Works
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-card/30 border-y border-border/40 relative">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold font-headline tracking-tight">An Intelligent Panel at Your Fingertips</h2>
                        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                            Our unique multi-agent architecture ensures every candidate receives a fair, comprehensive, and multidimensional evaluation.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <FeatureCard
                            icon={Users}
                            title="Collaborative Agents"
                            description="A recruiter agent, a technical expert, and a diversity advocate debate the merits of every profile."
                        />
                        <FeatureCard
                            icon={MessageSquare}
                            title="Transparent Debates"
                            description="Don't just get a score. Watch the AI agents deliberate and read their reasoning in real-time."
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Bias Mitigation"
                            description="Built-in systemic checks ensure fair decisions that strictly evaluate objective skills and experience."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5" />
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-4xl md:text-5xl font-black font-headline tracking-tighter mb-6">
                        Ready to upgrade your hiring pipeline?
                    </h2>
                    <Button asChild size="lg" className="h-14 px-10 text-base bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20">
                        <Link href={user ? "/dashboard" : "/login"}>
                            Build Your First Panel
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-border/40 text-center text-muted-foreground">
                <p className="text-sm font-medium">© {new Date().getFullYear()} HireNexus. Built with Next.js, Firebase, and Genkit.</p>
            </footer>
        </div>
    )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={className}>
            {children}
        </div>
    )
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="bg-background/50 backdrop-blur-sm border border-border/40 p-8 rounded-3xl hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 group">
            <div className="h-14 w-14 bg-muted rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                <Icon className="h-7 w-7 text-foreground group-hover:text-primary transition-colors duration-300" />
            </div>
            <h3 className="text-2xl font-bold mb-3 font-headline">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    )
}
