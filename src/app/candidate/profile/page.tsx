"use client"

import * as React from "react"
import {
  FileText,
  Upload,
  Loader2,
  FileCheck,
  Save,
  User,
  Github,
  BarChart
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { parseResume } from "@/ai/flows/parse-resume-flow"
import { motion, type Variants } from "framer-motion"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
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

export default function CandidateProfile() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [profileData, setProfileData] = React.useState<any>(null)

  const [fullName, setFullName] = React.useState("")
  const [githubUrl, setGithubUrl] = React.useState("")
  const [targetRole, setTargetRole] = React.useState("")
  const [academicStream, setAcademicStream] = React.useState("")
  const [academicYear, setAcademicYear] = React.useState("")
  const [bio, setBio] = React.useState("")
  const [resumeFileName, setResumeFileName] = React.useState("")
  const [skills, setSkills] = React.useState<string[]>([])

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isUserLoading || !user || !db) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const data = snap.data()
          setProfileData(data)
          setFullName(data.displayName || data.fullName || "")
          setGithubUrl(data.githubUrl || "")
          setTargetRole(data.targetRole || "")
          setAcademicStream(data.academicStream || "")
          setAcademicYear(data.academicYear || "")
          setBio(data.bio || data.notes || "")
          setResumeFileName(data.resumeFileName || "")
          setSkills(data.skills || [])
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user, isUserLoading, db])

  const handleSaveProfile = async () => {
    if (!user || !db) return
    setIsSaving(true)
    try {
      const docRef = doc(db, "users", user.uid)
      await updateDoc(docRef, {
        displayName: fullName,
        fullName: fullName,
        githubUrl,
        targetRole,
        academicStream,
        academicYear,
        bio,
      })
      toast({ title: "Profile Saved", description: "Your details have been updated." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message || "Failed to save profile." })
    } finally {
      setIsSaving(false)
    }
  }

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !db) return

    setIsUploading(true)
    setResumeFileName(file.name)
    try {
      const dataUri = await fileToDataUri(file)
      const result = await parseResume({ pdfDataUri: dataUri })

      if (result.success) {
        const docRef = doc(db, "users", user.uid)
        await updateDoc(docRef, {
          resumeText: result.extractedText,
          skills: result.skills || [],
          projects: result.projects || [],
          resumeFileName: file.name,
          hasResume: true,
          status: "Parsed"
        })
        setSkills(result.skills || [])
        toast({ title: "Resume Analyzed", description: "Your skills and experience were successfully extracted." })
      } else {
        throw new Error(result.error || "Failed to parse resume")
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Analysis Failed", description: error.message })
      setResumeFileName(profileData?.resumeFileName || "")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  if (isUserLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
          <span className="text-xs text-muted-foreground">Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-4xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground/95">My Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your details and AI-parsed resume context.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main form */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <div className="liquid-glass glass-indigo rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.04]">
              <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Basic Information
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white/[0.03] border-white/[0.06] focus:border-primary/40 focus:ring-1 focus:ring-primary/20 h-10 text-sm transition-all duration-200" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="targetRole" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Target Role</Label>
                  <Input id="targetRole" placeholder="e.g. Senior Frontend Engineer" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="bg-white/[0.03] border-white/[0.06] focus:border-primary/40 focus:ring-1 focus:ring-primary/20 h-10 text-sm transition-all duration-200" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="stream" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Academic Stream</Label>
                  <Input id="stream" placeholder="e.g. Computer Science" value={academicStream} onChange={(e) => setAcademicStream(e.target.value)} className="bg-white/[0.03] border-white/[0.06] focus:border-primary/40 focus:ring-1 focus:ring-primary/20 h-10 text-sm transition-all duration-200" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="year" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Academic Year</Label>
                  <Input id="year" placeholder="e.g. Final Year" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="bg-white/[0.03] border-white/[0.06] focus:border-primary/40 focus:ring-1 focus:ring-primary/20 h-10 text-sm transition-all duration-200" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="githubUrl" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">GitHub URL</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <Input id="githubUrl" placeholder="https://github.com/yourusername" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="pl-9 bg-white/[0.03] border-white/[0.06] focus:border-primary/40 focus:ring-1 focus:ring-primary/20 h-10 text-sm transition-all duration-200" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Short Bio</Label>
                <Textarea id="bio" placeholder="Tell us a little about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[100px] bg-white/[0.03] border-white/[0.06] focus:border-primary/40 focus:ring-1 focus:ring-primary/20 text-sm resize-none transition-all duration-200" />
              </div>

              <div className="pt-2">
                <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-primary/90 hover:bg-primary text-primary-foreground font-medium h-9 px-5 text-xs rounded-lg transition-all duration-200 hover:shadow-[0_0_20px_-4px_hsl(var(--primary)_/_0.35)]">
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />} Save Profile
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Resume sidebar */}
        <motion.div variants={itemVariants} id="upload-resume">
          <div className="liquid-glass glass-emerald rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.04]">
              <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" /> Resume
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">Upload PDF to extract skills automatically.</p>
            </div>
            <div className="p-5">
              <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`w-full flex items-center justify-center flex-col gap-2.5 p-6 rounded-xl border border-dashed transition-all duration-300 ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${resumeFileName
                  ? "bg-primary/[0.04] border-primary/20 text-primary"
                  : "bg-white/[0.02] border-white/[0.08] text-muted-foreground hover:border-primary/25 hover:bg-white/[0.04]"
                }`}
              >
                {isUploading ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : resumeFileName ? (
                  <FileCheck className="h-7 w-7" />
                ) : (
                  <Upload className="h-7 w-7 opacity-60" />
                )}
                <div className="text-center">
                  <span className="text-xs font-medium block">{isUploading ? "Analyzing…" : resumeFileName || "Upload PDF"}</span>
                  {!resumeFileName && !isUploading && <span className="text-[10px] opacity-50 mt-0.5 block">Click to browse</span>}
                </div>
              </div>

              {skills && skills.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60 mb-2.5">Extracted Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill, idx) => (
                      <span key={idx} className="bg-white/[0.04] px-2 py-0.5 rounded-md text-[11px] font-medium text-foreground/70 border border-white/[0.06]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
