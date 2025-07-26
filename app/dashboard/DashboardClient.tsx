"use client";

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ResponsiveCalendar from "@/components/ui/ResponsiveCalendar"
import { Search, Calendar, Phone, Mail, Leaf, Eye, Users, FileText, CalendarDays, Plus } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface PatientSubmission {
  id: string
  fullName: string
  dateOfBirth: Date | undefined
  gender: string
  bloodGroup: string
  phoneNumber: string
  emailAddress: string
  occupation: string
  address: string
  diabetes: boolean
  hypertension: boolean
  asthma: boolean
  arthritis: boolean
  ulcers: boolean
  sicklecell: boolean
  cancer: boolean
  thyroid: boolean
  otherConditions: string
  currentMedications: string
  surgeries: string
  smoking: string
  alcohol: string
  exercise: string
  diet: string
  otherDiet: string
  allergies: string
  submittedAt: string
  appointmentDate: string | null
  notes: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function DoctorDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [submissions, setSubmissions] = useState<PatientSubmission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<PatientSubmission[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<PatientSubmission | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const appointments = getAppointmentsForDate(date);
      toast({
        title: "📅 Date Selected",
        description: `Viewing appointments for ${format(date, "MMMM dd, yyyy")}. ${appointments.length} appointment(s) found.`,
      });
    }
  };
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [notes, setNotes] = useState("")
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for token on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/admin-login");
    }
  }, [router]);

  useEffect(() => {
    // Load submissions from backend
    const fetchPatients = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/patients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.status === 401) {
          localStorage.removeItem("adminToken");
          router.replace("/admin-login");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch patients");
        const data = await res.json();
        setSubmissions(data);
        setFilteredSubmissions(data);
        toast({
          title: "✅ Patients Loaded",
          description: `Successfully loaded ${data.length} patient records.`,
        });
      } catch (err) {
        toast({
          title: "❌ Failed to load patients",
          description: "There was an error loading patient data. Please try again.",
          variant: "destructive",
        });
      }
    };
    fetchPatients();
  }, [router, toast]);

  useEffect(() => {
    // Filter submissions based on search
    let filtered = submissions

    if (searchTerm) {
      filtered = filtered.filter(
        (submission) =>
          submission.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.phoneNumber.includes(searchTerm),
      )
    }

    setFilteredSubmissions(filtered)
    
    // Show search results toast
    if (searchTerm && filtered.length > 0) {
      toast({
        title: "🔍 Search Results",
        description: `Found ${filtered.length} patient(s) matching "${searchTerm}".`,
      });
    }
  }, [submissions, searchTerm, toast])

  useEffect(() => {
    if (searchTerm && filteredSubmissions.length === 0) {
      toast({
        title: "🔍 No Results Found",
        description: `No patients matched your search for "${searchTerm}".`,
      });
    }
  }, [searchTerm, filteredSubmissions, toast]);

  const updatePatient = async (id: string, updates: Partial<PatientSubmission>) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    try {
      toast({
        title: "⏳ Setting Appointment",
        description: "Please wait while we update the appointment...",
      });

      const res = await fetch(`${API_URL}/patients/${id}/appointment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.status === 401) {
        localStorage.removeItem("adminToken");
        router.replace("/admin-login");
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        toast({
          title: "❌ Failed to update appointment",
          description: errorData.message || "There was an error setting the appointment. Please try again.",
          variant: "destructive",
        });
        throw new Error("Failed to update appointment");
      }
      const updatedPatient = await res.json();
      setSubmissions((prev) => prev.map((submission) => (submission.id === id ? updatedPatient : submission)));
      setFilteredSubmissions((prev) => prev.map((submission) => (submission.id === id ? updatedPatient : submission)));
      toast({
        title: "✅ Appointment Set Successfully!",
        description: `Appointment scheduled for ${updatedPatient.fullName} on ${format(new Date(updates.appointmentDate!), "MMM dd, yyyy 'at' HH:mm")}.`,
      });
    } catch (err) {
      // Error toast already shown above
    }
  };

  const handleSetAppointment = async () => {
    if (!selectedPatient || !selectedPatient._id) {
      toast({
        title: "⚠️ No patient selected",
        description: "Please select a patient before setting an appointment.",
        variant: "destructive",
      });
      return;
    }
    if (!appointmentDate || !appointmentTime) {
      toast({
        title: "⚠️ Missing Date or Time",
        description: "Please select both an appointment date and time.",
        variant: "destructive",
      });
      return;
    }
    try {
      const appointmentDateTime = `${appointmentDate} ${appointmentTime}`;
      await updatePatient(selectedPatient._id, {
        appointmentDate: appointmentDateTime,
        notes: notes,
      });
      setAppointmentDate("");
      setAppointmentTime("");
      setNotes("");
      setSelectedPatient(null);
    } catch (err) {
      toast({
        title: "❌ Error",
        description: "Failed to set appointment. Please try again.",
        variant: "destructive",
      });
    }
  }

  const getAppointmentsForDate = (date: Date) => {
    return submissions.filter((submission) => {
      if (!submission.appointmentDate) return false
      const appointmentDate = new Date(submission.appointmentDate)
      return (
        appointmentDate.getDate() === date.getDate() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const todayAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-green-50">
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 bg-white rounded-lg p-6 shadow-lg">
            {/* Logo above dashboard title */}
            <div className="flex items-center justify-center mb-1 mt-12">
              <img src="/logo.jpg" alt="Logo" className="h-20 w-auto mr-3" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* Profile picture on the left */}
                <img src="/profile.png" alt="Profile" className="h-16 w-16 rounded-full border-2 border-green-200 shadow mr-3 object-cover" />
                <div>
                  {/* <h1 className="text-3xl font-bold text-gray-900">DELAUDS HERBAL HEALTHCARE</h1> */}
                  <p className="text-green-600 font-medium">Welcome, Dr. Doris <span role="img" aria-label="waving hand">👋</span></p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + "/");
                    toast({
                      title: "📋 Form Link Copied!",
                      description: "The patient form link has been copied to your clipboard.",
                    });
                  }}
                  className="text-green-700 border-green-600 hover:bg-green-50 focus:outline-none"
                >
                  Copy Form Link
                </Button>
                {copied && <span className="text-green-600 text-xs mt-1">Copied!</span>}
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="mb-8">
            <Card className="shadow-lg">
              <CardHeader className="bg-white border-b">
                <CardTitle className="flex items-center text-gray-900">
                  <Users className="h-6 w-6 mr-2" />
                  Dashboard Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{submissions.length}</div>
                    <div className="text-gray-600">Total Patients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {submissions.filter((s) => s.appointmentDate).length}
                    </div>
                    <div className="text-gray-600">Scheduled Appointments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{todayAppointments.length}</div>
                    <div className="text-gray-600">Today's Appointments</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="patients" className="space-y-6" onValueChange={(value) => {
            if (value === "patients") {
              toast({
                title: "👥 Patients Tab",
                description: "Viewing patient records and managing appointments.",
              });
            } else if (value === "calendar") {
              toast({
                title: "📅 Calendar Tab",
                description: "Viewing appointment calendar and scheduled visits.",
              });
            }
          }}>
            <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
              <TabsTrigger
                value="patients"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                <Users className="h-4 w-4 mr-2" />
                Patients
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
            </TabsList>

            {/* Patients Tab */}
            <TabsContent value="patients">
              <Card className="shadow-lg">
                <CardHeader style={{ backgroundColor: "#22c55e" }} className="text-white">
                  <CardTitle>Patient Records</CardTitle>
                  <CardDescription className="text-green-100">
                    View and manage patient information and appointments
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Search */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchTerm(value);
                          if (value) {
                            toast({
                              title: "🔍 Searching...",
                              description: `Searching for patients matching "${value}"...`,
                            });
                          }
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Patients List */}
                  <div className="space-y-4">
                    {filteredSubmissions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No patient records found</p>
                        <p className="text-sm">Patient records will appear here when forms are submitted</p>
                      </div>
                    ) : (
                      filteredSubmissions.map((submission) => (
                        <Card
                          key={submission.id}
                          className="hover:shadow-md transition-shadow border-l-4"
                          style={{ borderLeftColor: "#22c55e" }}
                        >
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold">{submission.fullName}</h3>
                                  {submission.appointmentDate && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                      Appointment Set
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    {submission.fullName}
                                  </div>
                                  <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-2" />
                                    {submission.phoneNumber}
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {submission.submittedAt && !isNaN(new Date(submission.submittedAt))
                                      ? format(new Date(submission.submittedAt), "MMM dd, yyyy")
                                      : ""}
                                  </div>
                                </div>
                                {submission.appointmentDate && (
                                  <div className="mt-2 text-sm font-medium" style={{ color: "#22c55e" }}>
                                    Next Appointment:{" "}
                                    {submission.appointmentDate && !isNaN(new Date(submission.appointmentDate))
                                      ? format(new Date(submission.appointmentDate), "MMM dd, yyyy 'at' HH:mm")
                                      : ""}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col md:flex-row gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedPatient(submission);
                                        toast({
                                          title: "👁️ Viewing Patient Details",
                                          description: `Opening details for ${submission.fullName}...`,
                                        });
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Patient Details: {submission.fullName}</DialogTitle>
                                      <DialogDescription>
                                        Submitted on {submission.submittedAt && !isNaN(new Date(submission.submittedAt))
                                          ? format(new Date(submission.submittedAt), "MMMM dd, yyyy")
                                          : ""}
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-6">
                                      {/* Personal Information */}
                                      <div>
                                        <h3 className="text-lg font-semibold mb-3 text-green-600">
                                          Personal Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="font-medium">Full Name:</span> {submission.fullName}
                                          </div>
                                          <div>
                                            <span className="font-medium">Gender:</span>{" "}
                                            {submission.gender || "Not specified"}
                                          </div>
                                          <div>
                                            <span className="font-medium">Date of Birth:</span>{" "}
                                            {submission.dateOfBirth && !isNaN(new Date(submission.dateOfBirth))
                                              ? format(new Date(submission.dateOfBirth), "dd/MM/yyyy")
                                              : "Not provided"}
                                          </div>
                                          <div>
                                            <span className="font-medium">Blood Group:</span>{" "}
                                            {submission.bloodGroup || "Not specified"}
                                          </div>
                                          <div>
                                            <span className="font-medium">Phone:</span> {submission.phoneNumber}
                                          </div>
                                          <div>
                                            <span className="font-medium">Email:</span> {submission.emailAddress}
                                          </div>
                                          <div>
                                            <span className="font-medium">Occupation:</span>{" "}
                                            {submission.occupation || "Not specified"}
                                          </div>
                                        </div>
                                        {submission.address && (
                                          <div className="mt-2 text-sm">
                                            <span className="font-medium">Address:</span> {submission.address}
                                          </div>
                                        )}
                                      </div>

                                      {/* Medical History */}
                                      <div>
                                        <h3 className="text-lg font-semibold mb-3" style={{ color: "#22c55e" }}>
                                          Medical History
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                          <div>
                                            <span className="font-medium">Diagnosed Conditions:</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                              {[
                                                { key: "diabetes", label: "Diabetes" },
                                                { key: "hypertension", label: "Hypertension" },
                                                { key: "asthma", label: "Asthma" },
                                                { key: "arthritis", label: "Arthritis" },
                                                { key: "ulcers", label: "Ulcers" },
                                                { key: "sicklecell", label: "Sickle Cell" },
                                                { key: "cancer", label: "Cancer" },
                                                { key: "thyroid", label: "Thyroid Issues" },
                                              ].map(
                                                (condition) =>
                                                  submission[condition.key as keyof PatientSubmission] && (
                                                    <span
                                                      key={condition.key}
                                                      className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                                                    >
                                                      {condition.label}
                                                    </span>
                                                  ),
                                              )}
                                              {!Object.values(submission).slice(8, 16).some(Boolean) && (
                                                <span className="text-gray-500">None reported</span>
                                              )}
                                            </div>
                                          </div>
                                          {submission.otherConditions && (
                                            <div>
                                              <span className="font-medium">Other Conditions:</span>{" "}
                                              {submission.otherConditions}
                                            </div>
                                          )}
                                          {submission.currentMedications && (
                                            <div>
                                              <span className="font-medium">Current Medications:</span>
                                              <p className="bg-gray-50 p-2 rounded mt-1">
                                                {submission.currentMedications}
                                              </p>
                                            </div>
                                          )}
                                          {submission.surgeries && (
                                            <div>
                                              <span className="font-medium">Surgeries:</span>
                                              <p className="bg-gray-50 p-2 rounded mt-1">{submission.surgeries}</p>
                                            </div>
                                          )}
                                          {submission.allergies && (
                                            <div>
                                              <span className="font-medium">Allergies:</span>
                                              <p className="bg-red-50 p-2 rounded mt-1 border border-red-200">
                                                {submission.allergies}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Lifestyle */}
                                      <div>
                                        <h3 className="text-lg font-semibold mb-3 text-green-600">Lifestyle & Diet</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="font-medium">Smoking:</span>{" "}
                                            {submission.smoking || "Not specified"}
                                          </div>
                                          <div>
                                            <span className="font-medium">Alcohol:</span>{" "}
                                            {submission.alcohol || "Not specified"}
                                          </div>
                                          <div>
                                            <span className="font-medium">Exercise:</span>{" "}
                                            {submission.exercise || "Not specified"}
                                          </div>
                                          <div>
                                            <span className="font-medium">Diet:</span>{" "}
                                            {submission.diet || "Not specified"}
                                            {submission.diet === "other" &&
                                              submission.otherDiet &&
                                              ` (${submission.otherDiet})`}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Appointment Section */}
                                      <div className="border-t pt-4">
                                        <h3 className="text-lg font-semibold mb-3" style={{ color: "#22c55e" }}>
                                          Appointment & Notes
                                        </h3>
                                        {submission.appointmentDate ? (
                                          <div className="bg-green-50 p-4 rounded-lg">
                                            <div className="font-medium text-green-800">
                                              Scheduled:{" "}
                                              {submission.appointmentDate && !isNaN(new Date(submission.appointmentDate))
                                                ? format(new Date(submission.appointmentDate), "MMMM dd, yyyy 'at' HH:mm")
                                                : ""}
                                            </div>
                                            {submission.notes && (
                                              <div className="mt-2 text-sm text-green-700">
                                                <span className="font-medium">Notes:</span> {submission.notes}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label htmlFor="appointmentDate">Appointment Date</Label>
                                                <Input
                                                  id="appointmentDate"
                                                  type="date"
                                                  value={appointmentDate}
                                                  onChange={(e) => setAppointmentDate(e.target.value)}
                                                />
                                              </div>
                                              <div>
                                                <Label htmlFor="appointmentTime">Appointment Time</Label>
                                                <Input
                                                  id="appointmentTime"
                                                  type="time"
                                                  value={appointmentTime}
                                                  onChange={(e) => setAppointmentTime(e.target.value)}
                                                />
                                              </div>
                                            </div>
                                            <div>
                                              <Label htmlFor="notes">Notes</Label>
                                              <Textarea
                                                id="notes"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Add any notes or observations..."
                                                rows={3}
                                              />
                                            </div>
                                            <Button
                                              onClick={handleSetAppointment}
                                              disabled={!appointmentDate || !appointmentTime}
                                              style={{ backgroundColor: "#22c55e" }}
                                            >
                                              <Plus className="h-4 w-4 mr-2" />
                                              Set Appointment
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-white border-b">
                    <CardTitle className="text-gray-900">Appointment Calendar</CardTitle>
                    <CardDescription className="text-gray-600">
                      Select a date to view scheduled appointments
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveCalendar value={selectedDate || new Date()} onChange={handleDateChange} />
                  </CardContent>
                </Card>

                {/* Appointments for Selected Date */}
                <Card className="shadow-lg">
                  <CardHeader style={{ backgroundColor: "#22c55e" }} className="text-white">
                    <CardTitle>{selectedDate ? format(selectedDate, "MMMM dd, yyyy") : "Select a Date"}</CardTitle>
                    <CardDescription className="text-green-100">
                      {todayAppointments.length} appointment{todayAppointments.length !== 1 ? "s" : ""} scheduled
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {todayAppointments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No appointments scheduled</p>
                        <p className="text-sm">for this date</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {todayAppointments.map((appointment) => (
                          <Card key={appointment.id} className="border-l-4" style={{ borderLeftColor: "#22c55e" }}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold">{appointment.fullName}</h4>
                                  <p className="text-sm text-gray-600">
                                    {format(new Date(appointment.appointmentDate!), "HH:mm")}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center">
                                      <Phone className="h-3 w-3 mr-1" />
                                      {appointment.phoneNumber}
                                    </span>
                                    <span className="flex items-center">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {appointment.emailAddress}
                                    </span>
                                  </div>
                                  {appointment.notes && (
                                    <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                                      {appointment.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 