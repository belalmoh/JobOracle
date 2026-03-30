"use client"

import { useState } from "react"
import { 
  Briefcase, 
  Plus, 
  ExternalLink, 
  Copy,
  MessageSquare,
  Trash2,
  Calendar,
  Check,
  Clock,
  XCircle,
  Mic
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Application {
  id: number
  jobTitle: string
  company: string
  location: string
  applyUrl: string
  status: "applied" | "pending" | "interview" | "rejected"
  appliedDate: string
  notes?: string
}

const statusConfig = {
  applied: { label: "Applied", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: Check },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: Clock },
  interview: { label: "Interview", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: Mic },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: XCircle },
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showAddModal, setShowAddModal] = useState(false)

  // Mock data for demo
  const demoApplications: Application[] = []

  const displayApps = statusFilter === "all" 
    ? applications.length > 0 ? applications : demoApplications
    : (applications.length > 0 ? applications : demoApplications).filter(app => app.status === statusFilter)

  const getStatusCounts = () => {
    const apps = applications.length > 0 ? applications : demoApplications
    return {
      all: apps.length,
      applied: apps.filter(a => a.status === "applied").length,
      pending: apps.filter(a => a.status === "pending").length,
      interview: apps.filter(a => a.status === "interview").length,
      rejected: apps.filter(a => a.status === "rejected").length,
    }
  }

  const counts = getStatusCounts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Applications</h1>
          <p className="text-muted-foreground">Track your job applications</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          All
          <Badge variant="secondary" className="ml-2">{counts.all}</Badge>
        </Button>
        {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(status => {
          const config = statusConfig[status]
          return (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? "" : "gap-2"}
            >
              <config.icon className="h-3 w-3" />
              {config.label}
              <Badge variant="secondary" className="ml-2">{counts[status]}</Badge>
            </Button>
          )
        })}
      </div>

      {/* Applications List */}
      {displayApps.length > 0 ? (
        <div className="space-y-3">
          {displayApps.map(app => {
            const status = statusConfig[app.status]
            return (
              <Card key={app.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{app.jobTitle}</h3>
                        <Badge className={status.color}>
                          <status.icon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{app.company}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {app.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Applied {new Date(app.appliedDate).toLocaleDateString()}
                        </span>
                      </div>
                      {app.notes && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded">{app.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      {app.applyUrl && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={app.applyUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No applications yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Start tracking your job applications to keep all your application details in one place.
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Application
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-background rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Application</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Job Title</label>
                <Input placeholder="e.g., Software Engineer" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Company</label>
                <Input placeholder="e.g., Google" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input placeholder="e.g., Remote, New York" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Apply URL</label>
                <Input placeholder="https://..." className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select defaultValue="applied">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input placeholder="Any notes..." className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowAddModal(false)}>
                Save Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
