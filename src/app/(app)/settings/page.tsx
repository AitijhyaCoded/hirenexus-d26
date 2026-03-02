"use client"

import * as React from "react"
import { useUser, useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Settings as SettingsIcon, ShieldCheck, Mail, User as UserIcon } from "lucide-react"

export default function SettingsPage() {
    const { user, isLoading } = useUser()
    const auth = useAuth()
    const router = useRouter()

    const handleSignOut = async () => {
        try {
            if (auth) {
                await signOut(auth)
                router.push("/login")
            }
        } catch (error) {
            console.error("Failed to sign out", error)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <SettingsIcon className="h-8 w-8 animate-spin" />
                    <p>Loading settings...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                Please sign in to view settings.
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                    <SettingsIcon className="h-8 w-8 text-primary" />
                    System Settings
                </h2>
                <p className="text-muted-foreground mt-2">
                    Manage your account profile and application preferences.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-lg overflow-hidden flex flex-col">
                    <CardHeader className="bg-muted/20 pb-4 border-b border-border/40">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-primary" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>Your personal account details</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-6 space-y-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-24 w-24 border-4 border-background ring-2 ring-primary/20 shadow-xl">
                                <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/150/150`} />
                                <AvatarFallback className="bg-primary/20 text-primary font-bold text-2xl">
                                    {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold tracking-tight">{user.displayName || "Administrator"}</h3>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    <span>{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-primary mt-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="font-semibold text-xs uppercase tracking-widest">Admin Privileges</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/10 p-6 border-t border-border/40">
                        <p className="text-sm text-muted-foreground">
                            To update your profile, please contact support or your organization administrator.
                        </p>
                    </CardFooter>
                </Card>

                <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-lg overflow-hidden flex flex-col">
                    <CardHeader className="bg-muted/20 pb-4 border-b border-border/40">
                        <CardTitle className="text-xl flex items-center gap-2 text-destructive">
                            <LogOut className="h-5 w-5" />
                            Account Actions
                        </CardTitle>
                        <CardDescription>Manage your current session</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-6">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Signing out will end your current session. You will need to authenticate again to access HireNexus dashboard, evaluations, and reports.
                            </p>
                            <div className="pt-4">
                                <Button
                                    variant="destructive"
                                    size="lg"
                                    onClick={handleSignOut}
                                    className="w-full sm:w-auto gap-2 font-bold shadow-lg shadow-destructive/20 hover:shadow-destructive/40 transition-all font-headline"
                                >
                                    <LogOut className="h-5 w-5" />
                                    Sign Out of HireNexus
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
