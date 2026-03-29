"use client"

import type { GuestDetailsGhana, IdType } from "@/lib/hotel/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function emptyGuestDetails(
  checkInDate: string,
  checkOutDate: string,
  defaults?: { fullName?: string; phone?: string; email?: string },
): GuestDetailsGhana {
  return {
    fullName: defaults?.fullName ?? "",
    nationality: "Ghanaian",
    passportNumber: "",
    permanentAddress: "",
    dateOfBirth: "",
    occupation: "",
    maritalStatus: "single",
    travelCompanionsSpouseName: "",
    travelCompanionsChildrenCount: 0,
    phone: defaults?.phone ?? "",
    email: defaults?.email ?? "",
    checkInDateTime: `${checkInDate}T14:00`,
    checkOutDateTime: `${checkOutDate}T11:00`,
    idType: "ghana_card",
    idNumber: "",
    eta: "15:00",
    paymentMethod: "momo",
    paymentStatus: "pending",
    paymentNote: "",
  }
}

export function validateGuestDetails(g: GuestDetailsGhana): string | null {
  if (!g.fullName.trim()) return "Full name is required."
  if (!g.nationality.trim()) return "Nationality is required."
  const n = g.nationality.toLowerCase()
  if (!n.includes("ghana") && !(g.passportNumber && g.passportNumber.trim())) {
    return "Passport number is required for non-Ghanaian guests."
  }
  if (!g.permanentAddress.trim()) return "Permanent address is required."
  if (!g.dateOfBirth.trim()) return "Date of birth is required."
  if (!g.occupation.trim()) return "Occupation is required."
  if (!g.maritalStatus.trim()) return "Marital status is required."
  if (!g.phone.trim()) return "Phone is required."
  if (!g.email.trim()) return "Email is required."
  if (!g.idNumber.trim()) return "ID number is required."
  if (!g.eta.trim()) return "Estimated time of arrival is required."
  return null
}

type Props = {
  value: GuestDetailsGhana
  onChange: (next: GuestDetailsGhana) => void
  idPrefix?: string
}

export function GhanaGuestForm({ value, onChange, idPrefix = "g" }: Props) {
  const p = (k: string) => `${idPrefix}-${k}`
  const set = (patch: Partial<GuestDetailsGhana>) => onChange({ ...value, ...patch })

  const foreign = !value.nationality.toLowerCase().includes("ghana")

  return (
    <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={p("name")}>Full name (as on ID)</Label>
          <Input id={p("name")} value={value.fullName} onChange={(e) => set({ fullName: e.target.value })} />
        </div>
        <div>
          <Label htmlFor={p("nat")}>Nationality</Label>
          <Input id={p("nat")} value={value.nationality} onChange={(e) => set({ nationality: e.target.value })} />
        </div>
      </div>
      {foreign && (
        <div>
          <Label htmlFor={p("pass")}>Passport number (non-Ghanaian)</Label>
          <Input
            id={p("pass")}
            value={value.passportNumber ?? ""}
            onChange={(e) => set({ passportNumber: e.target.value })}
          />
        </div>
      )}
      <div>
        <Label htmlFor={p("addr")}>Permanent address</Label>
        <Textarea id={p("addr")} value={value.permanentAddress} onChange={(e) => set({ permanentAddress: e.target.value })} rows={2} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor={p("dob")}>Date of birth</Label>
          <Input id={p("dob")} type="date" value={value.dateOfBirth} onChange={(e) => set({ dateOfBirth: e.target.value })} />
        </div>
        <div>
          <Label htmlFor={p("job")}>Occupation</Label>
          <Input id={p("job")} value={value.occupation} onChange={(e) => set({ occupation: e.target.value })} />
        </div>
        <div>
          <Label>Marital status</Label>
          <Select value={value.maritalStatus} onValueChange={(v) => set({ maritalStatus: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={p("spouse")}>Travel: spouse name (optional)</Label>
          <Input
            id={p("spouse")}
            value={value.travelCompanionsSpouseName ?? ""}
            onChange={(e) => set({ travelCompanionsSpouseName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor={p("kids")}>Number of children in room</Label>
          <Input
            id={p("kids")}
            type="number"
            min={0}
            value={value.travelCompanionsChildrenCount ?? 0}
            onChange={(e) => set({ travelCompanionsChildrenCount: Number(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={p("phone")}>Phone</Label>
          <Input id={p("phone")} value={value.phone} onChange={(e) => set({ phone: e.target.value })} />
        </div>
        <div>
          <Label htmlFor={p("email")}>Email</Label>
          <Input id={p("email")} type="email" value={value.email} onChange={(e) => set({ email: e.target.value })} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={p("cin")}>Check-in date &amp; time</Label>
          <Input
            id={p("cin")}
            type="datetime-local"
            value={value.checkInDateTime}
            onChange={(e) => set({ checkInDateTime: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor={p("cout")}>Check-out date &amp; time</Label>
          <Input
            id={p("cout")}
            type="datetime-local"
            value={value.checkOutDateTime}
            onChange={(e) => set({ checkOutDateTime: e.target.value })}
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>ID type</Label>
          <Select
            value={value.idType}
            onValueChange={(v) => set({ idType: v as IdType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ghana_card">Ghana Card</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="drivers_license">Driver&apos;s license</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={p("idn")}>ID number</Label>
          <Input id={p("idn")} value={value.idNumber} onChange={(e) => set({ idNumber: e.target.value })} />
        </div>
      </div>
      <div>
        <Label htmlFor={p("eta")}>Estimated arrival (ETA)</Label>
        <Input id={p("eta")} value={value.eta} onChange={(e) => set({ eta: e.target.value })} placeholder="e.g. 19:30 flight" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Payment method</Label>
          <Select
            value={value.paymentMethod}
            onValueChange={(v) => set({ paymentMethod: v as GuestDetailsGhana["paymentMethod"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="momo">MTN Mobile Money</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Payment status</Label>
          <Select
            value={value.paymentStatus}
            onValueChange={(v) => set({ paymentStatus: v as GuestDetailsGhana["paymentStatus"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor={p("paynote")}>Payment note (MoMo ref, last digits, etc.)</Label>
        <Input
          id={p("paynote")}
          value={value.paymentNote ?? ""}
          onChange={(e) => set({ paymentNote: e.target.value })}
        />
      </div>
    </div>
  )
}
