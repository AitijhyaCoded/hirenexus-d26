"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  ShieldCheck,
  BrainCircuit,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Candidates", href: "/candidates", icon: Users },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Evaluations", href: "/evaluations", icon: BrainCircuit },
  { name: "Reports", href: "/reports", icon: BarChart3 },
]

const systemItems = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Compliance", href: "/compliance", icon: ShieldCheck },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-border/40 bg-card/30" collapsible="icon">
      <SidebarHeader className="p-4 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-3 w-full">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <BrainCircuit className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tighter font-headline group-data-[state=collapsed]:hidden overflow-hidden whitespace-nowrap">
            HireNexus
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2 group-data-[state=collapsed]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-1.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.name}
                      className={`w-full justify-start gap-4 px-3 py-6 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? "bg-primary/15 text-primary shadow-[0_0_15px_rgba(70,136,238,0.1)]" 
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <Link href={item.href}>
                        <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                        <span className="font-bold tracking-tight">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto mb-4">
          <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2 group-data-[state=collapsed]:hidden">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-1.5">
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.name}
                    className="w-full justify-start gap-4 px-3 py-6 rounded-xl text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all duration-300"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span className="font-bold tracking-tight">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}