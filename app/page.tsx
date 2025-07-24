"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, Leaf, Phone, Mail, MapPin } from "lucide-react"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import ResponsiveCalendar from "@/components/ui/ResponsiveCalendar"

interface PatientForm {
  // Personal Information
  fullName: string
  dateOfBirth: string
  gender: string
  bloodGroup: string
  phoneNumber: string
  emailAddress: string
  occupation: string
  address: string

  // Medical History
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

  // Lifestyle & Diet
  smoking: string
  alcohol: string
  exercise: string
  diet: string
  otherDiet: string
  allergies: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function PatientForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<PatientForm>({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    phoneNumber: "",
    emailAddress: "",
    occupation: "",
    address: "",
    diabetes: false,
    hypertension: false,
    asthma: false,
    arthritis: false,
    ulcers: false,
    sicklecell: false,
    cancer: false,
    thyroid: false,
    otherConditions: "",
    currentMedications: "",
    surgeries: "",
    smoking: "",
    alcohol: "",
    exercise: "",
    diet: "",
    otherDiet: "",
    allergies: "",
  })

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (field: keyof PatientForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.fullName || !formData.phoneNumber || !formData.emailAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Send to backend
      const response = await fetch(`${API_URL}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        toast({
          title: "Submission Failed",
          description: "There was an error submitting your form. Please try again.",
          variant: "destructive",
        });
        throw new Error("Failed to submit form");
      }

      toast({
        title: "Form Submitted Successfully",
        description: "Your information has been sent to DELAUDS HERBAL HEALTHCARE. You will be contacted soon.",
      })

      // Reset form
      setFormData({
        fullName: "",
        dateOfBirth: "",
        gender: "",
        bloodGroup: "",
        phoneNumber: "",
        emailAddress: "",
        occupation: "",
        address: "",
        diabetes: false,
        hypertension: false,
        asthma: false,
        arthritis: false,
        ulcers: false,
        sicklecell: false,
        cancer: false,
        thyroid: false,
        otherConditions: "",
        currentMedications: "",
        surgeries: "",
        smoking: "",
        alcohol: "",
        exercise: "",
        diet: "",
        otherDiet: "",
        allergies: "",
      })
    } catch (error) {
      // Error toast already shown above
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-50">
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 bg-white rounded-lg p-6 shadow-lg">
            {/* Remove cover image and white rectangle background */}
            <div className="flex items-center justify-center mb-1 mt-12">
              {mounted
                ? <img src="/logo.jpg" alt="Logo" className="h-20 w-auto mr-3" />
                : <span className="h-20 w-20 mr-3 inline-block" />
              }
              <div>
                {/* Subtitle or other content here */}
              </div>
            </div>
            {/* Contact Info under logo */}
            <div className="flex flex-col items-center gap-1 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-green-600" />
                <span>Adenta SSNIT Flats, 75 Junction, Accra - Ghana</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 text-green-600" />
                <span>0244138296</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 text-green-600" />
                <span>benitta75@gmail.com</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Information */}
            <Card className="shadow-lg">
              <CardHeader className="bg-white border-b">
                <CardTitle className="text-xl text-gray-900">PATIENT INFORMATION</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-base font-medium">
                    Full Name: *
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-base font-medium">Date of Birth:</Label>
                    <Input
                      id="dateOfBirth"
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={formData.dateOfBirth}
                      onChange={e => {
                        const val = e.target.value;
                        // Only update if matches YYYY-MM-DD or is empty
                        if (/^\d{0,4}-?\d{0,2}-?\d{0,2}$/.test(val) || val === "") {
                          handleInputChange("dateOfBirth", val);
                        }
                      }}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Gender:</Label>
                    <RadioGroup
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange("gender", value)}
                      className="flex gap-6 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">Female</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="bloodGroup" className="text-base font-medium">
                      Blood Group:
                    </Label>
                    <Select
                      value={formData.bloodGroup}
                      onValueChange={(value) => handleInputChange("bloodGroup", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phoneNumber" className="text-base font-medium">
                      Phone Number: *
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailAddress" className="text-base font-medium">
                      Email Address: *
                    </Label>
                    <Input
                      id="emailAddress"
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) => handleInputChange("emailAddress", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="occupation" className="text-base font-medium">
                    Occupation:
                  </Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange("occupation", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-base font-medium">
                    Address:
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card className="shadow-lg">
              <CardHeader className="bg-white border-b">
                <CardTitle className="text-xl text-gray-900">MEDICAL HISTORY</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-base font-medium mb-3 block">Have you been diagnosed with:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: "diabetes", label: "Diabetes" },
                      { key: "hypertension", label: "Hypertension" },
                      { key: "asthma", label: "Asthma" },
                      { key: "arthritis", label: "Arthritis" },
                      { key: "ulcers", label: "Ulcers" },
                      { key: "sicklecell", label: "Sickle Cell" },
                      { key: "cancer", label: "Cancer" },
                      { key: "thyroid", label: "Thyroid Issues" },
                    ].map((condition) => (
                      <div key={condition.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={condition.key}
                          checked={formData[condition.key as keyof PatientForm] as boolean}
                          onCheckedChange={(checked) => handleInputChange(condition.key as keyof PatientForm, checked)}
                        />
                        <Label htmlFor={condition.key} className="text-sm">
                          {condition.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="otherConditions" className="text-base font-medium">
                    Others:
                  </Label>
                  <Input
                    id="otherConditions"
                    value={formData.otherConditions}
                    onChange={(e) => handleInputChange("otherConditions", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="currentMedications" className="text-base font-medium">
                    Current Medications:
                  </Label>
                  <Textarea
                    id="currentMedications"
                    value={formData.currentMedications}
                    onChange={(e) => handleInputChange("currentMedications", e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="surgeries" className="text-base font-medium">
                    Any surgeries (type/year):
                  </Label>
                  <Textarea
                    id="surgeries"
                    value={formData.surgeries}
                    onChange={(e) => handleInputChange("surgeries", e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lifestyle & Diet */}
            <Card className="shadow-lg">
              <CardHeader className="bg-white border-b">
                <CardTitle className="text-xl text-gray-900">LIFESTYLE & DIET</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-medium">Do you smoke?</Label>
                    <RadioGroup
                      value={formData.smoking}
                      onValueChange={(value) => handleInputChange("smoking", value)}
                      className="flex gap-6 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="smoke-yes" />
                        <Label htmlFor="smoke-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="smoke-no" />
                        <Label htmlFor="smoke-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Drink alcohol?</Label>
                    <RadioGroup
                      value={formData.alcohol}
                      onValueChange={(value) => handleInputChange("alcohol", value)}
                      className="flex gap-6 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="alcohol-yes" />
                        <Label htmlFor="alcohol-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="alcohol-no" />
                        <Label htmlFor="alcohol-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Exercise:</Label>
                  <RadioGroup
                    value={formData.exercise}
                    onValueChange={(value) => handleInputChange("exercise", value)}
                    className="flex flex-wrap gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="exercise-daily" />
                      <Label htmlFor="exercise-daily">Daily</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="occasionally" id="exercise-occasionally" />
                      <Label htmlFor="exercise-occasionally">Occasionally</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rarely" id="exercise-rarely" />
                      <Label htmlFor="exercise-rarely">Rarely</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="never" id="exercise-never" />
                      <Label htmlFor="exercise-never">Never</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium">Diet:</Label>
                  <RadioGroup
                    value={formData.diet}
                    onValueChange={(value) => handleInputChange("diet", value)}
                    className="flex flex-wrap gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vegetarian" id="diet-vegetarian" />
                      <Label htmlFor="diet-vegetarian">Vegetarian</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="balanced" id="diet-balanced" />
                      <Label htmlFor="diet-balanced">Balanced</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fastfood" id="diet-fastfood" />
                      <Label htmlFor="diet-fastfood">Fast Food</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="diet-other" />
                      <Label htmlFor="diet-other">Other</Label>
                    </div>
                  </RadioGroup>

                  {formData.diet === "other" && (
                    <Input
                      placeholder="Please specify..."
                      value={formData.otherDiet}
                      onChange={(e) => handleInputChange("otherDiet", e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="allergies" className="text-base font-medium">
                    Allergies:
                  </Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => handleInputChange("allergies", e.target.value)}
                    rows={3}
                    className="mt-1"
                    placeholder="Please list any known allergies..."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center pb-8">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full md:w-auto px-12 py-3 text-lg font-semibold hover:bg-green-600"
                style={{ backgroundColor: "#22c55e" }}
              >
                {isSubmitting ? "Submitting..." : "Submit Patient Information"}
              </Button>
            </div>
          </form>

          <div className="text-center pb-4">
            <Button variant="link" asChild className="text-white hover:text-gray-200">
              <a href="/dashboard">Healthcare Provider Dashboard</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
