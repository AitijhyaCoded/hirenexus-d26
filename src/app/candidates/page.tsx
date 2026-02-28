"use client"

import * as React from "react"
import { 
  Plus, 
  Search, 
  FileText, 
  Github, 
  Mic, 
  MoreHorizontal,
  ExternalLink,
  Play,
  Upload,
  Loader2,
  FileCheck,
  Trash2,
  Edit2,
  StickyNote,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, addDoc, serverTimestamp, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { parseResume } from "@/ai/flows/parse-resume-flow"

const candidateFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.string().min(1, "Please select a role"),
  githubUrl: z.string().url("Invalid GitHub URL").or(z.literal("")),
  notes: z.string().optional(),
  resumeFile: z.any().optional(),
  audioFile: z.any().optional(),
})

type CandidateFormValues = z.infer<typeof candidateFormSchema>

export default function CandidatesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = React.useState(false)
  
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedCandidate, setSelectedCandidate] = React.useState<any>(null)
  const [noteText, setNoteText] = React.useState("")

  const resumeInputRef = React.useRef<HTMLInputElement>(null)
  const audioInputRef = React.useRef<HTMLInputElement>(null)
  const editResumeInputRef = React.useRef<HTMLInputElement>(null)

  const candidatesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "users", user.uid, "candidates"), orderBy("createdAt", "desc"))
  }, [db, user?.uid])

  const jobsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return collection(db, "users", user.uid, "jobDescriptions")
  }, [db, user?.uid])

  const { data: candidates, isLoading: isCandidatesLoading } = useCollection(candidatesQuery)
  const { data: jobs } = useCollection(jobsQuery)

  const addForm = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      role: "",
      githubUrl: "",
      notes: "",
    },
  })

  const editForm = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
  })

  const addResumeFile = addForm.watch("resumeFile")
  const addAudioFile = addForm.watch("audioFile")
  const editResumeFile = editForm.watch("resumeFile")

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const onSubmitAdd = async (values: CandidateFormValues) => {
    if (!user?.uid || !db) return
    if (!values.resumeFile) {
        toast({ variant: "destructive", title: "Missing File", description: "Resume is mandatory for new candidates." })
        return
    }

    setIsSubmitting(true)
    try {
      // 1. Parse Resume with Gemini
      let resumeText = ""
      let parsingError = ""
      let status = "New"

      try {
        const dataUri = await fileToDataUri(values.resumeFile)
        const result = await parseResume({ pdfDataUri: dataUri })
        
        if (result.success) {
          resumeText = result.extractedText
          status = "Parsed"
        } else {
          parsingError = result.error || "Unknown parsing error"
          status = "Parsing Failed"
        }
      } catch (err: any) {
        parsingError = err.message
        status = "Parsing Error"
      }

      // 2. Save to Firestore
      await addDoc(collection(db, "users", user.uid, "candidates"), {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || "",
        role: values.role,
        githubUrl: values.githubUrl || "",
        notes: values.notes || "",
        resumeText: resumeText,
        parsingError: parsingError,
        hasResume: !!values.resumeFile,
        hasAudio: !!values.audioFile,
        resumeFileName: values.resumeFile?.name || "",
        audioFileName: values.audioFile?.name || "",
        userId: user.uid,
        status: status,
        createdAt: serverTimestamp(),
      })
      
      toast({ title: "Candidate Added", description: `${values.fullName} has been added and resume parsed.` })
      setIsAddDialogOpen(false)
      addForm.reset()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add candidate." })
    } finally { setIsSubmitting(false) }
  }

  const onEditClick = (candidate: any) => {
    setSelectedCandidate(candidate)
    editForm.reset({
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      role: candidate.role,
      githubUrl: candidate.githubUrl,
      notes: candidate.notes,
    })
    setIsEditDialogOpen(true)
  }

  const onSubmitEdit = async (values: CandidateFormValues) => {
    if (!user?.uid || !db || !selectedCandidate) return

    setIsSubmitting(true)
    try {
      const candidateRef = doc(db, "users", user.uid, "candidates", selectedCandidate.id)
      const updates: any = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || "",
        role: values.role,
        githubUrl: values.githubUrl || "",
        notes: values.notes || "",
      }

      if (values.resumeFile) {
        const dataUri = await fileToDataUri(values.resumeFile)
        const result = await parseResume({ pdfDataUri: dataUri })
        if (result.success) {
          updates.resumeText = result.extractedText
          updates.status = "Parsed"
        }
        updates.hasResume = true
        updates.resumeFileName = values.resumeFile.name
      }

      await updateDoc(candidateRef, updates)
      
      toast({ title: "Profile Updated", description: "Candidate information has been saved." })
      setIsEditDialogOpen(false)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: "Failed to update profile." })
    } finally { setIsSubmitting(false) }
  }

  const onNoteClick = (candidate: any) => {
    setSelectedCandidate(candidate)
    setNoteText(candidate.notes || "")
    setIsNoteDialogOpen(true)
  }

  const onSaveNote = async () => {
    if (!user?.uid || !db || !selectedCandidate) return
    setIsSubmitting(true)
    try {
      const candidateRef = doc(db, "users", user.uid, "candidates", selectedCandidate.id)
      await updateDoc(candidateRef, { notes: noteText })
      toast({ title: "Note Saved", description: "Candidate notes updated." })
      setIsNoteDialogOpen(false)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save note." })
    } finally { setIsSubmitting(false) }
  }

  const onDeleteCandidate = async (candidate: any) => {
    if (!user?.uid || !db) return
    if (!confirm(`Are you sure you want to remove ${candidate.fullName} from the pipeline?`)) return

    try {
      await deleteDoc(doc(db, "users", user.uid, "candidates", candidate.id))
      toast({ title: "Candidate Removed", description: "The profile has been deleted." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: "Failed to delete candidate." })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, form: any, field: "resumeFile" | "audioFile") => {
    const file = e.target.files?.[0]
    if (file) {
      form.setValue(field, file, { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Candidate Pipeline</h2>
          <p className="text-muted-foreground">Manage your applicants and initiate multi-modal AI screening.</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold">
              <Plus className="h-4 w-4" />
              Add Candidate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] border-border/40 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
            <form onSubmit={addForm.handleSubmit(onSubmitAdd)}>
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Upload Candidate</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Add a new candidate with their materials for real-time AI parsing and evaluation.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-xs font-bold">Full Name *</Label>
                        <Input id="fullName" placeholder="Sarah Chen" className="bg-muted/20 border-border/40" {...addForm.register("fullName")} />
                        {addForm.formState.errors.fullName && <p className="text-[10px] text-destructive font-bold">{addForm.formState.errors.fullName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold">Email *</Label>
                        <Input id="email" type="email" placeholder="sarah@example.com" className="bg-muted/20 border-border/40" {...addForm.register("email")} />
                        {addForm.formState.errors.email && <p className="text-[10px] text-destructive font-bold">{addForm.formState.errors.email.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-bold">Phone</Label>
                        <Input id="phone" placeholder="+1 555-0101" className="bg-muted/20 border-border/40" {...addForm.register("phone")} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold">Role Applied For *</Label>
                        <Select onValueChange={(val) => {
                          const job = jobs?.find(j => j.id === val);
                          if (job) addForm.setValue("role", job.title, { shouldValidate: true });
                        }}>
                          <SelectTrigger className="bg-muted/20 border-border/40">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobs?.map((job) => (
                              <SelectItem key={job.id} value={job.id}>
                                {job.title} <span className="text-[10px] opacity-50 ml-1">({job.department})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {addForm.formState.errors.role && <p className="text-[10px] text-destructive font-bold">{addForm.formState.errors.role.message}</p>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">Candidate Materials</h4>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Resume (PDF) *</Label>
                        <input type="file" accept=".pdf" className="hidden" ref={resumeInputRef} onChange={(e) => handleFileChange(e, addForm, "resumeFile")} />
                        <div onClick={() => resumeInputRef.current?.click()} className={`w-full flex items-center gap-3 p-4 rounded-xl border border-dashed transition-all cursor-pointer ${addResumeFile ? "bg-primary/10 border-primary text-primary" : "bg-muted/10 border-border/60 text-muted-foreground hover:border-muted-foreground/40"}`}>
                          {addResumeFile ? <FileCheck className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                          <span className="text-sm font-bold">{addResumeFile ? addResumeFile.name : "Click to upload resume (PDF)"}</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">AI will automatically extract skills and experience from your PDF.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Voice Interview Recording</Label>
                        <input type="file" accept=".mp3,.wav" className="hidden" ref={audioInputRef} onChange={(e) => handleFileChange(e, addForm, "audioFile")} />
                        <div onClick={() => audioInputRef.current?.click()} className={`w-full flex items-center gap-3 p-4 rounded-xl border border-dashed transition-all cursor-pointer ${addAudioFile ? "bg-orange-400/10 border-orange-400 text-orange-400" : "bg-muted/10 border-border/60 text-muted-foreground hover:border-muted-foreground/40"}`}>
                          <Mic className="h-5 w-5" />
                          <span className="text-sm font-bold">{addAudioFile ? addAudioFile.name : "Click to upload audio (MP3/WAV)"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="githubUrl" className="text-xs font-bold">GitHub Profile URL</Label>
                        <div className="relative">
                          <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="githubUrl" placeholder="https://github.com/username" className="pl-10 bg-muted/20 border-border/40" {...addForm.register("githubUrl")} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-xs font-bold">Additional Notes</Label>
                    <Textarea id="notes" placeholder="Any additional context..." className="min-h-[100px] bg-muted/20 border-border/40" {...addForm.register("notes")} />
                  </div>
                </div>
              </div>
              <DialogFooter className="p-6 bg-muted/20 border-t border-border/40 gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="font-bold border border-border/40">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20 gap-2">
                  {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Parsing Resume...</> : <><Upload className="h-4 w-4" /> Add Candidate</>}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog, Note Dialog remains same... */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] border-border/40 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)}>
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Edit Candidate Profile</DialogTitle>
                <DialogDescription className="text-muted-foreground">Modify candidate details or update materials.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Full Name *</Label>
                    <Input className="bg-muted/20 border-border/40" {...editForm.register("fullName")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Email *</Label>
                    <Input className="bg-muted/20 border-border/40" {...editForm.register("email")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Phone</Label>
                    <Input className="bg-muted/20 border-border/40" {...editForm.register("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Role *</Label>
                    <Select defaultValue={jobs?.find(j => j.title === selectedCandidate?.role)?.id} onValueChange={(val) => {
                      const job = jobs?.find(j => j.id === val);
                      if (job) editForm.setValue("role", job.title);
                    }}>
                      <SelectTrigger className="bg-muted/20 border-border/40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {jobs?.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title} <span className="text-[10px] opacity-50 ml-1">({job.department})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                   <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Update Resume (PDF) - Triggers Re-Parsing</Label>
                    <input type="file" accept=".pdf" className="hidden" ref={editResumeInputRef} onChange={(e) => handleFileChange(e, editForm, "resumeFile")} />
                    <div onClick={() => editResumeInputRef.current?.click()} className={`w-full flex items-center gap-3 p-4 rounded-xl border border-dashed transition-all cursor-pointer ${editResumeFile ? "bg-primary/10 border-primary text-primary" : "bg-muted/10 border-border/60 text-muted-foreground"}`}>
                      {editResumeFile ? <FileCheck className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      <span className="text-sm font-bold">{editResumeFile ? editResumeFile.name : "Click to replace resume"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 bg-muted/20 border-t border-border/40 gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="font-bold border border-border/40">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20 gap-2">
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : <><Upload className="h-4 w-4" /> Save Changes</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/40 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Internal Notes: {selectedCandidate?.fullName}</DialogTitle>
            <DialogDescription>Add private context or observations for the hiring panel.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              value={noteText} 
              onChange={(e) => setNoteText(e.target.value)} 
              placeholder="Enter notes here..." 
              className="min-h-[200px] bg-muted/20 border-border/40" 
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={onSaveNote} disabled={isSubmitting} className="font-bold">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/40 flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, role, or skill..." 
                className="pl-9 bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/50" 
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Candidate</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Target Role</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Materials</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isCandidatesLoading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">Syncing pipeline...</p>
                    </td>
                  </tr>
                ) : candidates && candidates.length > 0 ? (
                  candidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                            {candidate.fullName.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{candidate.fullName}</span>
                            <span className="text-[11px] text-muted-foreground">{candidate.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium">{candidate.role}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {candidate.hasResume && (
                            <div className={`p-1.5 rounded-md transition-colors ${candidate.resumeText ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"}`} title={candidate.resumeFileName || "Resume PDF"}>
                              <FileText className="h-3.5 w-3.5" />
                            </div>
                          )}
                          {candidate.githubUrl && (
                            <div className="p-1.5 rounded-md bg-muted/60 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors" title="GitHub Profile">
                              <Github className="h-3.5 w-3.5" />
                            </div>
                          )}
                          {candidate.hasAudio && (
                            <div className="p-1.5 rounded-md bg-muted/60 text-muted-foreground hover:text-orange-400 hover:bg-orange-400/10 transition-colors" title={candidate.audioFileName || "Voice Interview"}>
                              <Mic className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge className={
                            candidate.status === "In Debate" 
                              ? "bg-primary/10 text-primary border-primary/20 animate-pulse" 
                              : candidate.status === "Evaluated"
                              ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                              : candidate.status === "Parsed"
                              ? "bg-blue-400/10 text-blue-400 border-blue-400/20"
                              : candidate.status === "Parsing Failed"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-muted text-muted-foreground border-border/40"
                          }>
                            {candidate.status}
                          </Badge>
                          {candidate.status === "Parsing Failed" && (
                            <AlertCircle className="h-3.5 w-3.5 text-destructive" title={candidate.parsingError} />
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {candidate.status === "Evaluated" ? (
                            <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-xs font-semibold gap-1.5 text-primary">
                              <Link href={`/reports/${candidate.id}`}>
                                View Report <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              asChild 
                              disabled={!candidate.resumeText}
                              className={`h-8 px-3 text-xs font-semibold gap-1.5 ${candidate.resumeText ? 'text-foreground hover:text-primary' : 'text-muted-foreground cursor-not-allowed'}`}
                            >
                              <Link href={candidate.resumeText ? `/evaluate/${candidate.id}` : "#"}>
                                Launch AI Panel <Play className="h-3 w-3 fill-current" />
                              </Link>
                            </Button>
                          )}
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2" onClick={() => onEditClick(candidate)}>
                                <Edit2 className="h-4 w-4" /> Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2" onClick={() => onNoteClick(candidate)}>
                                <StickyNote className="h-4 w-4" /> Add Note
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive font-bold gap-2" onClick={() => onDeleteCandidate(candidate)}>
                                <Trash2 className="h-4 w-4" /> Delete Candidate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      No candidates found. Click "Add Candidate" to get started.
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



// "use client"

// import * as React from "react"
// import { 
//   Plus, 
//   Search, 
//   FileText, 
//   Github, 
//   Mic, 
//   MoreHorizontal,
//   ExternalLink,
//   Play,
//   Upload,
//   Loader2,
//   FileCheck,
//   Trash2,
//   Edit2,
//   StickyNote
// } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import Link from "next/link"
// import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
// import { collection, addDoc, serverTimestamp, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import * as z from "zod"
// import { useToast } from "@/hooks/use-toast"

// const candidateFormSchema = z.object({
//   fullName: z.string().min(2, "Full name is required"),
//   email: z.string().email("Invalid email address"),
//   phone: z.string().optional(),
//   role: z.string().min(1, "Please select a role"),
//   githubUrl: z.string().url("Invalid GitHub URL").or(z.literal("")),
//   notes: z.string().optional(),
//   resumeFile: z.any().optional(),
//   audioFile: z.any().optional(),
// })

// type CandidateFormValues = z.infer<typeof candidateFormSchema>

// export default function CandidatesPage() {
//   const { user } = useUser()
//   const db = useFirestore()
//   const { toast } = useToast()
  
//   const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
//   const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
//   const [isNoteDialogOpen, setIsNoteDialogOpen] = React.useState(false)
  
//   const [isSubmitting, setIsSubmitting] = React.useState(false)
//   const [selectedCandidate, setSelectedCandidate] = React.useState<any>(null)
//   const [noteText, setNoteText] = React.useState("")

//   const resumeInputRef = React.useRef<HTMLInputElement>(null)
//   const audioInputRef = React.useRef<HTMLInputElement>(null)
//   const editResumeInputRef = React.useRef<HTMLInputElement>(null)

//   const candidatesQuery = useMemoFirebase(() => {
//     if (!db || !user?.uid) return null
//     return query(collection(db, "users", user.uid, "candidates"), orderBy("createdAt", "desc"))
//   }, [db, user?.uid])

//   const jobsQuery = useMemoFirebase(() => {
//     if (!db || !user?.uid) return null
//     return collection(db, "users", user.uid, "jobDescriptions")
//   }, [db, user?.uid])

//   const { data: candidates, isLoading: isCandidatesLoading } = useCollection(candidatesQuery)
//   const { data: jobs } = useCollection(jobsQuery)

//   const addForm = useForm<CandidateFormValues>({
//     resolver: zodResolver(candidateFormSchema),
//     defaultValues: {
//       fullName: "",
//       email: "",
//       phone: "",
//       role: "",
//       githubUrl: "",
//       notes: "",
//     },
//   })

//   const editForm = useForm<CandidateFormValues>({
//     resolver: zodResolver(candidateFormSchema),
//   })

//   const addResumeFile = addForm.watch("resumeFile")
//   const addAudioFile = addForm.watch("audioFile")
//   const editResumeFile = editForm.watch("resumeFile")

//   const onSubmitAdd = async (values: CandidateFormValues) => {
//     if (!user?.uid || !db) return
//     if (!values.resumeFile) {
//         toast({ variant: "destructive", title: "Missing File", description: "Resume is mandatory for new candidates." })
//         return
//     }

//     setIsSubmitting(true)
//     try {
//       await addDoc(collection(db, "users", user.uid, "candidates"), {
//         fullName: values.fullName,
//         email: values.email,
//         phone: values.phone || "",
//         role: values.role,
//         githubUrl: values.githubUrl || "",
//         notes: values.notes || "",
//         hasResume: !!values.resumeFile,
//         hasAudio: !!values.audioFile,
//         resumeFileName: values.resumeFile?.name || "",
//         audioFileName: values.audioFile?.name || "",
//         userId: user.uid,
//         status: "New",
//         createdAt: serverTimestamp(),
//       })
      
//       toast({ title: "Candidate Added", description: `${values.fullName} has been added.` })
//       setIsAddDialogOpen(false)
//       addForm.reset()
//     } catch (error: any) {
//       toast({ variant: "destructive", title: "Error", description: "Failed to add candidate." })
//     } finally { setIsSubmitting(false) }
//   }

//   const onEditClick = (candidate: any) => {
//     setSelectedCandidate(candidate)
//     editForm.reset({
//       fullName: candidate.fullName,
//       email: candidate.email,
//       phone: candidate.phone,
//       role: candidate.role,
//       githubUrl: candidate.githubUrl,
//       notes: candidate.notes,
//     })
//     setIsEditDialogOpen(true)
//   }

//   const onSubmitEdit = async (values: CandidateFormValues) => {
//     if (!user?.uid || !db || !selectedCandidate) return

//     setIsSubmitting(true)
//     try {
//       const candidateRef = doc(db, "users", user.uid, "candidates", selectedCandidate.id)
//       const updates: any = {
//         fullName: values.fullName,
//         email: values.email,
//         phone: values.phone || "",
//         role: values.role,
//         githubUrl: values.githubUrl || "",
//         notes: values.notes || "",
//       }

//       if (values.resumeFile) {
//         updates.hasResume = true
//         updates.resumeFileName = values.resumeFile.name
//       }

//       await updateDoc(candidateRef, updates)
      
//       toast({ title: "Profile Updated", description: "Candidate information has been saved." })
//       setIsEditDialogOpen(false)
//     } catch (error: any) {
//       toast({ variant: "destructive", title: "Update Failed", description: "Failed to update profile." })
//     } finally { setIsSubmitting(false) }
//   }

//   const onNoteClick = (candidate: any) => {
//     setSelectedCandidate(candidate)
//     setNoteText(candidate.notes || "")
//     setIsNoteDialogOpen(true)
//   }

//   const onSaveNote = async () => {
//     if (!user?.uid || !db || !selectedCandidate) return
//     setIsSubmitting(true)
//     try {
//       const candidateRef = doc(db, "users", user.uid, "candidates", selectedCandidate.id)
//       await updateDoc(candidateRef, { notes: noteText })
//       toast({ title: "Note Saved", description: "Candidate notes updated." })
//       setIsNoteDialogOpen(false)
//     } catch (error: any) {
//       toast({ variant: "destructive", title: "Error", description: "Failed to save note." })
//     } finally { setIsSubmitting(false) }
//   }

//   const onDeleteCandidate = async (candidate: any) => {
//     if (!user?.uid || !db) return
//     if (!confirm(`Are you sure you want to remove ${candidate.fullName} from the pipeline?`)) return

//     try {
//       await deleteDoc(doc(db, "users", user.uid, "candidates", candidate.id))
//       toast({ title: "Candidate Removed", description: "The profile has been deleted." })
//     } catch (error: any) {
//       toast({ variant: "destructive", title: "Delete Failed", description: "Failed to delete candidate." })
//     }
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, form: any, field: "resumeFile" | "audioFile") => {
//     const file = e.target.files?.[0]
//     if (file) {
//       form.setValue(field, file, { shouldValidate: true })
//     }
//   }

//   return (
//     <div className="space-y-6 max-w-7xl mx-auto">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-3xl font-bold tracking-tight font-headline">Candidate Pipeline</h2>
//           <p className="text-muted-foreground">Manage your applicants and initiate multi-modal AI screening.</p>
//         </div>
        
//         <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
//           <DialogTrigger asChild>
//             <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold">
//               <Plus className="h-4 w-4" />
//               Add Candidate
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="sm:max-w-[600px] border-border/40 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
//             <form onSubmit={addForm.handleSubmit(onSubmitAdd)}>
//               <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
//                 <DialogHeader>
//                   <DialogTitle className="text-2xl font-bold">Upload Candidate</DialogTitle>
//                   <DialogDescription className="text-muted-foreground">
//                     Add a new candidate with their materials for AI evaluation.
//                   </DialogDescription>
//                 </DialogHeader>

//                 <div className="space-y-6">
//                   <div>
//                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">Personal Information</h4>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="space-y-2">
//                         <Label htmlFor="fullName" className="text-xs font-bold">Full Name *</Label>
//                         <Input id="fullName" placeholder="Sarah Chen" className="bg-muted/20 border-border/40" {...addForm.register("fullName")} />
//                         {addForm.formState.errors.fullName && <p className="text-[10px] text-destructive font-bold">{addForm.formState.errors.fullName.message}</p>}
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="email" className="text-xs font-bold">Email *</Label>
//                         <Input id="email" type="email" placeholder="sarah@example.com" className="bg-muted/20 border-border/40" {...addForm.register("email")} />
//                         {addForm.formState.errors.email && <p className="text-[10px] text-destructive font-bold">{addForm.formState.errors.email.message}</p>}
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="phone" className="text-xs font-bold">Phone</Label>
//                         <Input id="phone" placeholder="+1 555-0101" className="bg-muted/20 border-border/40" {...addForm.register("phone")} />
//                       </div>
//                       <div className="space-y-2">
//                         <Label className="text-xs font-bold">Role Applied For *</Label>
//                         <Select onValueChange={(val) => {
//                           const job = jobs?.find(j => j.id === val);
//                           if (job) addForm.setValue("role", job.title, { shouldValidate: true });
//                         }}>
//                           <SelectTrigger className="bg-muted/20 border-border/40">
//                             <SelectValue placeholder="Select a role" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {jobs?.map((job) => (
//                               <SelectItem key={job.id} value={job.id}>
//                                 {job.title} <span className="text-[10px] opacity-50 ml-1">({job.department})</span>
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         {addForm.formState.errors.role && <p className="text-[10px] text-destructive font-bold">{addForm.formState.errors.role.message}</p>}
//                       </div>
//                     </div>
//                   </div>

//                   <div>
//                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">Candidate Materials</h4>
//                     <div className="space-y-4">
//                       <div className="space-y-1.5">
//                         <Label className="text-xs font-bold">Resume (PDF) *</Label>
//                         <input type="file" accept=".pdf" className="hidden" ref={resumeInputRef} onChange={(e) => handleFileChange(e, addForm, "resumeFile")} />
//                         <div onClick={() => resumeInputRef.current?.click()} className={`w-full flex items-center gap-3 p-4 rounded-xl border border-dashed transition-all cursor-pointer ${addResumeFile ? "bg-primary/10 border-primary text-primary" : "bg-muted/10 border-border/60 text-muted-foreground hover:border-muted-foreground/40"}`}>
//                           {addResumeFile ? <FileCheck className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
//                           <span className="text-sm font-bold">{addResumeFile ? addResumeFile.name : "Click to upload resume (PDF)"}</span>
//                         </div>
//                       </div>
//                       <div className="space-y-1.5">
//                         <Label className="text-xs font-bold">Voice Interview Recording</Label>
//                         <input type="file" accept=".mp3,.wav" className="hidden" ref={audioInputRef} onChange={(e) => handleFileChange(e, addForm, "audioFile")} />
//                         <div onClick={() => audioInputRef.current?.click()} className={`w-full flex items-center gap-3 p-4 rounded-xl border border-dashed transition-all cursor-pointer ${addAudioFile ? "bg-orange-400/10 border-orange-400 text-orange-400" : "bg-muted/10 border-border/60 text-muted-foreground hover:border-muted-foreground/40"}`}>
//                           <Mic className="h-5 w-5" />
//                           <span className="text-sm font-bold">{addAudioFile ? addAudioFile.name : "Click to upload audio (MP3/WAV)"}</span>
//                         </div>
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="githubUrl" className="text-xs font-bold">GitHub Profile URL</Label>
//                         <div className="relative">
//                           <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                           <Input id="githubUrl" placeholder="https://github.com/username" className="pl-10 bg-muted/20 border-border/40" {...addForm.register("githubUrl")} />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="notes" className="text-xs font-bold">Additional Notes</Label>
//                     <Textarea id="notes" placeholder="Any additional context..." className="min-h-[100px] bg-muted/20 border-border/40" {...addForm.register("notes")} />
//                   </div>
//                 </div>
//               </div>
//               <DialogFooter className="p-6 bg-muted/20 border-t border-border/40 gap-3">
//                 <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="font-bold border border-border/40">Cancel</Button>
//                 <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20 gap-2">
//                   {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Add Candidate
//                 </Button>
//               </DialogFooter>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//         <DialogContent className="sm:max-w-[600px] border-border/40 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
//           <form onSubmit={editForm.handleSubmit(onSubmitEdit)}>
//             <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle className="text-2xl font-bold">Edit Candidate Profile</DialogTitle>
//                 <DialogDescription className="text-muted-foreground">Modify candidate details or update materials.</DialogDescription>
//               </DialogHeader>
//               <div className="space-y-6">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <Label className="text-xs font-bold">Full Name *</Label>
//                     <Input className="bg-muted/20 border-border/40" {...editForm.register("fullName")} />
//                   </div>
//                   <div className="space-y-2">
//                     <Label className="text-xs font-bold">Email *</Label>
//                     <Input className="bg-muted/20 border-border/40" {...editForm.register("email")} />
//                   </div>
//                   <div className="space-y-2">
//                     <Label className="text-xs font-bold">Phone</Label>
//                     <Input className="bg-muted/20 border-border/40" {...editForm.register("phone")} />
//                   </div>
//                   <div className="space-y-2">
//                     <Label className="text-xs font-bold">Role *</Label>
//                     <Select defaultValue={jobs?.find(j => j.title === selectedCandidate?.role)?.id} onValueChange={(val) => {
//                       const job = jobs?.find(j => j.id === val);
//                       if (job) editForm.setValue("role", job.title);
//                     }}>
//                       <SelectTrigger className="bg-muted/20 border-border/40"><SelectValue /></SelectTrigger>
//                       <SelectContent>
//                         {jobs?.map((job) => (
//                           <SelectItem key={job.id} value={job.id}>
//                             {job.title} <span className="text-[10px] opacity-50 ml-1">({job.department})</span>
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>
//                 <div className="space-y-4">
//                    <div className="space-y-1.5">
//                     <Label className="text-xs font-bold">Update Resume (Optional)</Label>
//                     <input type="file" accept=".pdf" className="hidden" ref={editResumeInputRef} onChange={(e) => handleFileChange(e, editForm, "resumeFile")} />
//                     <div onClick={() => editResumeInputRef.current?.click()} className={`w-full flex items-center gap-3 p-4 rounded-xl border border-dashed transition-all cursor-pointer ${editResumeFile ? "bg-primary/10 border-primary text-primary" : "bg-muted/10 border-border/60 text-muted-foreground"}`}>
//                       {editResumeFile ? <FileCheck className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
//                       <span className="text-sm font-bold">{editResumeFile ? editResumeFile.name : "Click to replace resume"}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <DialogFooter className="p-6 bg-muted/20 border-t border-border/40 gap-3">
//               <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="font-bold border border-border/40">Cancel</Button>
//               <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground font-bold px-8 shadow-lg shadow-primary/20 gap-2">
//                 {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Save Changes
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
//         <DialogContent className="sm:max-w-[500px] border-border/40 bg-card/95 backdrop-blur-xl">
//           <DialogHeader>
//             <DialogTitle>Internal Notes: {selectedCandidate?.fullName}</DialogTitle>
//             <DialogDescription>Add private context or observations for the hiring panel.</DialogDescription>
//           </DialogHeader>
//           <div className="py-4">
//             <Textarea 
//               value={noteText} 
//               onChange={(e) => setNoteText(e.target.value)} 
//               placeholder="Enter notes here..." 
//               className="min-h-[200px] bg-muted/20 border-border/40" 
//             />
//           </div>
//           <DialogFooter>
//             <Button variant="ghost" onClick={() => setIsNoteDialogOpen(false)}>Cancel</Button>
//             <Button onClick={onSaveNote} disabled={isSubmitting} className="font-bold">
//               {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Note
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
//         <CardContent className="p-0">
//           <div className="p-4 border-b border-border/40 flex flex-wrap items-center justify-between gap-4">
//             <div className="relative w-full max-w-md">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input 
//                 placeholder="Search by name, role, or skill..." 
//                 className="pl-9 bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/50" 
//               />
//             </div>
//           </div>
          
//           <div className="overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="border-b border-border/40 bg-muted/20">
//                   <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Candidate</th>
//                   <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Target Role</th>
//                   <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Materials</th>
//                   <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</th>
//                   <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-right">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border/20">
//                 {isCandidatesLoading ? (
//                   <tr>
//                     <td colSpan={5} className="p-12 text-center">
//                       <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
//                       <p className="text-muted-foreground font-medium">Syncing pipeline...</p>
//                     </td>
//                   </tr>
//                 ) : candidates && candidates.length > 0 ? (
//                   candidates.map((candidate) => (
//                     <tr key={candidate.id} className="hover:bg-muted/30 transition-colors group">
//                       <td className="p-4">
//                         <div className="flex items-center gap-3">
//                           <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
//                             {candidate.fullName.split(' ').map((n: string) => n[0]).join('')}
//                           </div>
//                           <div className="flex flex-col">
//                             <span className="font-semibold text-sm">{candidate.fullName}</span>
//                             <span className="text-[11px] text-muted-foreground">{candidate.email}</span>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="p-4">
//                         <span className="text-sm font-medium">{candidate.role}</span>
//                       </td>
//                       <td className="p-4">
//                         <div className="flex items-center gap-2">
//                           {candidate.hasResume && (
//                             <div className="p-1.5 rounded-md bg-muted/60 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title={candidate.resumeFileName || "Resume PDF"}>
//                               <FileText className="h-3.5 w-3.5" />
//                             </div>
//                           )}
//                           {candidate.githubUrl && (
//                             <div className="p-1.5 rounded-md bg-muted/60 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors" title="GitHub Profile">
//                               <Github className="h-3.5 w-3.5" />
//                             </div>
//                           )}
//                           {candidate.hasAudio && (
//                             <div className="p-1.5 rounded-md bg-muted/60 text-muted-foreground hover:text-orange-400 hover:bg-orange-400/10 transition-colors" title={candidate.audioFileName || "Voice Interview"}>
//                               <Mic className="h-3.5 w-3.5" />
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="p-4">
//                         <Badge className={
//                           candidate.status === "In Debate" 
//                             ? "bg-primary/10 text-primary border-primary/20 animate-pulse" 
//                             : candidate.status === "Evaluated"
//                             ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
//                             : "bg-muted text-muted-foreground border-border/40"
//                         }>
//                           {candidate.status}
//                         </Badge>
//                       </td>
//                       <td className="p-4 text-right">
//                         <div className="flex items-center justify-end gap-2">
//                           {candidate.status === "Evaluated" ? (
//                             <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-xs font-semibold gap-1.5 text-primary">
//                               <Link href={`/reports/${candidate.id}`}>
//                                 View Report <ExternalLink className="h-3 w-3" />
//                               </Link>
//                             </Button>
//                           ) : (
//                             <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-xs font-semibold gap-1.5 text-foreground hover:text-primary">
//                               <Link href={`/evaluate/${candidate.id}`}>
//                                 Launch AI Panel <Play className="h-3 w-3 fill-current" />
//                               </Link>
//                             </Button>
//                           )}
//                           <DropdownMenu modal={false}>
//                             <DropdownMenuTrigger asChild>
//                               <Button variant="ghost" size="icon" className="h-8 w-8">
//                                 <MoreHorizontal className="h-4 w-4" />
//                               </Button>
//                             </DropdownMenuTrigger>
//                             <DropdownMenuContent align="end" className="w-48">
//                               <DropdownMenuLabel>Actions</DropdownMenuLabel>
//                               <DropdownMenuSeparator />
//                               <DropdownMenuItem className="gap-2" onClick={() => onEditClick(candidate)}>
//                                 <Edit2 className="h-4 w-4" /> Edit Profile
//                               </DropdownMenuItem>
//                               <DropdownMenuItem className="gap-2" onClick={() => onNoteClick(candidate)}>
//                                 <StickyNote className="h-4 w-4" /> Add Note
//                               </DropdownMenuItem>
//                               <DropdownMenuSeparator />
//                               <DropdownMenuItem className="text-destructive font-bold gap-2" onClick={() => onDeleteCandidate(candidate)}>
//                                 <Trash2 className="h-4 w-4" /> Delete Candidate
//                               </DropdownMenuItem>
//                             </DropdownMenuContent>
//                           </DropdownMenu>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={5} className="p-12 text-center text-muted-foreground">
//                       No candidates found. Click "Add Candidate" to get started.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }


