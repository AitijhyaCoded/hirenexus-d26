
"use client"

import * as React from "react"
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Filter,
  Layers,
  Loader2,
  Edit2,
  Archive,
  UserPlus
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, addDoc, serverTimestamp, query, orderBy, doc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function JobsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedJob, setSelectedJob] = React.useState<any>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  const jobsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    // Use a simple query to avoid complex composite index requirements
    return query(
      collection(db, "users", user.uid, "jobDescriptions"), 
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid])

  const { data: allJobs, isLoading } = useCollection(jobsQuery)

  // Filter archived jobs and search query on the client side
  const activeJobs = React.useMemo(() => {
    if (!allJobs) return []
    return allJobs.filter(job => {
      const isNotArchived = job.status !== "Archived"
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           job.department.toLowerCase().includes(searchQuery.toLowerCase())
      return isNotArchived && matchesSearch
    })
  }, [allJobs, searchQuery])

  const handleAddJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user?.uid || !db) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await addDoc(collection(db, "users", user.uid, "jobDescriptions"), {
        title: formData.get("title") as string,
        department: formData.get("department") as string,
        level: formData.get("level") as string,
        skills: (formData.get("skills") as string).split(",").map(s => s.trim()),
        descriptionText: formData.get("description") as string,
        userId: user.uid,
        status: "Indexed",
        createdAt: serverTimestamp(),
      })
      
      toast({ title: "Job Created", description: "The new position has been added." })
      setIsAddDialogOpen(false)
    } catch (error: any) {
      console.error("Error creating job:", error)
      toast({ variant: "destructive", title: "Error", description: "Failed to create job. Please check permissions." })
    } finally { setIsSubmitting(false) }
  }

  const onEditClick = (job: any) => {
    setSelectedJob(job)
    setIsEditDialogOpen(true)
  }

  const handleEditJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user?.uid || !db || !selectedJob) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const jobRef = doc(db, "users", user.uid, "jobDescriptions", selectedJob.id)
      await updateDoc(jobRef, {
        title: formData.get("title") as string,
        department: formData.get("department") as string,
        level: formData.get("level") as string,
        skills: (formData.get("skills") as string).split(",").map(s => s.trim()),
        descriptionText: formData.get("description") as string,
        updatedAt: serverTimestamp(),
      })
      
      toast({ title: "Job Updated", description: "Changes have been saved." })
      setIsEditDialogOpen(false)
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Failed to save changes." })
    } finally { setIsSubmitting(false) }
  }

  const handleArchiveJob = async (job: any) => {
    if (!user?.uid || !db) return
    if (!confirm(`Are you sure you want to archive "${job.title}"?`)) return

    try {
      const jobRef = doc(db, "users", user.uid, "jobDescriptions", job.id)
      await updateDoc(jobRef, { status: "Archived" })
      toast({ title: "Job Archived", description: "Position has been moved to archive." })
    } catch (error) {
      toast({ variant: "destructive", title: "Archive Failed", description: "Failed to archive job." })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Job Descriptions</h2>
          <p className="text-muted-foreground">{activeJobs.length} active positions</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold">
              <Plus className="h-4 w-4" />
              Add Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-border/40 bg-card/95 backdrop-blur-xl">
            <form onSubmit={handleAddJob}>
              <DialogHeader>
                <DialogTitle>Create New Job Profile</DialogTitle>
                <DialogDescription>Define parameters for AI panel deliberation.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input id="title" name="title" placeholder="e.g. Senior Full-Stack Engineer" required className="bg-muted/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select name="department" defaultValue="Engineering">
                      <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="AI/ML">AI/ML</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="level">Level</Label>
                    <Select name="level" defaultValue="Senior">
                      <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Junior">Junior</SelectItem>
                        <SelectItem value="Mid">Mid</SelectItem>
                        <SelectItem value="Senior">Senior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="skills">Skills (comma separated)</Label>
                  <Input id="skills" name="skills" placeholder="React, Node.js, TypeScript" required className="bg-muted/20" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Context & Goals</Label>
                  <Textarea id="description" name="description" className="min-h-[100px] bg-muted/20" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="font-bold">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Create Position
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/40 bg-card/95 backdrop-blur-xl">
          <form onSubmit={handleEditJob}>
            <DialogHeader>
              <DialogTitle>Edit Job Profile</DialogTitle>
              <DialogDescription>Update the requirements for this position.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Job Title</Label>
                <Input id="edit-title" name="title" defaultValue={selectedJob?.title} required className="bg-muted/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-dept">Department</Label>
                  <Select name="department" defaultValue={selectedJob?.department}>
                    <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="AI/ML">AI/ML</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-level">Level</Label>
                  <Select name="level" defaultValue={selectedJob?.level}>
                    <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Mid">Mid</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-skills">Skills</Label>
                <Input id="edit-skills" name="skills" defaultValue={selectedJob?.skills?.join(", ")} required className="bg-muted/20" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-desc">Context & Goals</Label>
                <Textarea id="edit-desc" name="description" defaultValue={selectedJob?.descriptionText} className="min-h-[100px] bg-muted/20" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/40 flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search jobs..." 
                className="pl-9 bg-muted/40 border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Title</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Department</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Level</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Skills</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Created</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></td></tr>
                ) : activeJobs.length > 0 ? (
                  activeJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4"><span className="font-semibold text-sm">{job.title}</span></td>
                      <td className="p-4"><span className="text-sm text-muted-foreground">{job.department}</span></td>
                      <td className="p-4"><span className="text-sm font-medium">{job.level}</span></td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {job.skills?.slice(0, 3).map((skill: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-muted/20">{skill}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-4"><Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20">{job.status}</Badge></td>
                      <td className="p-4"><span className="text-sm text-muted-foreground">{job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString() : '—'}</span></td>
                      <td className="p-4 text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="gap-2" onClick={() => router.push('/candidates')}>
                              <UserPlus className="h-4 w-4" /> Add Candidate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Layers className="h-4 w-4" /> Re-index Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2" onClick={() => onEditClick(job)}>
                              <Edit2 className="h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive gap-2" onClick={() => handleArchiveJob(job)}>
                              <Archive className="h-4 w-4" /> Archive Position
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No active positions.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}