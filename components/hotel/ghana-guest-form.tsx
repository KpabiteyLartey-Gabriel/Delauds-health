"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import type { GuestDetailsGhana, IdType } from "@/lib/hotel/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PolicyNotice } from "@/components/policy-notice";
import { cn } from "@/lib/utils";
import { CreditCard, IdCard, UserRound } from "lucide-react";

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
    idPhotoUrl: "",
    eta: "15:00",
    paymentMethod: "card",
    paymentStatus: "pending",
    paymentNote: "",
  };
}

export function validateGuestDetails(g: GuestDetailsGhana): string | null {
  if (!g.fullName.trim()) return "Full name is required.";
  if (!g.nationality.trim()) return "Nationality is required.";
  const n = g.nationality.toLowerCase();
  if (!n.includes("ghana") && !(g.passportNumber && g.passportNumber.trim())) {
    return "Passport number is required for non-Ghanaian guests.";
  }
  if (!g.permanentAddress.trim()) return "Permanent address is required.";
  if (!g.dateOfBirth.trim()) return "Date of birth is required.";
  if (!g.occupation.trim()) return "Occupation is required.";
  if (!g.maritalStatus.trim()) return "Marital status is required.";
  if (!g.phone.trim()) return "Phone is required.";
  if (!g.email.trim()) return "Email is required.";
  if (!g.idNumber.trim()) return "ID number is required.";
  if (!g.idPhotoUrl.trim())
    return "ID photo is required. Please upload or take a photo of your ID.";
  if (!g.eta.trim()) return "Estimated time of arrival is required.";
  return null;
}

type Props = {
  value: GuestDetailsGhana;
  onChange: (next: GuestDetailsGhana) => void;
  idPrefix?: string;
  /** Hides stay datetime pickers when dates were chosen earlier in booking */
  mode?: "full" | "booking";
  checkInDate?: string;
  checkOutDate?: string;
  className?: string;
};

function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 dark:border-stone-700 dark:bg-stone-900/40">
      <legend className="mb-3 flex w-full items-start gap-2 px-1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span>
          <span className="block text-sm font-semibold text-stone-800 dark:text-stone-100">
            {title}
          </span>
          {description ? (
            <span className="mt-0.5 block text-xs font-normal text-stone-500 dark:text-stone-400">
              {description}
            </span>
          ) : null}
        </span>
      </legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <Label htmlFor={htmlFor} className="text-stone-700 dark:text-stone-300">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </Label>
  );
}

export function GhanaGuestForm({
  value,
  onChange,
  idPrefix = "g",
  mode = "full",
  checkInDate,
  checkOutDate,
  className,
}: Props) {
  const p = (k: string) => `${idPrefix}-${k}`;
  const set = (patch: Partial<GuestDetailsGhana>) =>
    onChange({ ...value, ...patch });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Could not read selected image."));
      reader.readAsDataURL(file);
    });

  const resizeImageDataUrl = (
    dataUrl: string,
    maxSide = 1600,
    quality = 0.82,
  ) =>
    new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process selected image."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Could not process selected image."));
      img.src = dataUrl;
    });

  const uploadIdPhotoFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setPhotoUploadError("Please select a valid image file.");
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoUploadError(null);

    try {
      const rawDataUrl = await fileToDataUrl(file);
      const normalizedDataUrl =
        file.size > 900 * 1024 ? await resizeImageDataUrl(rawDataUrl) : rawDataUrl;

      const res = await fetch("/api/auth/upload-id-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Data: normalizedDataUrl }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || "Failed to upload ID photo.");
      }

      set({ idPhotoUrl: data.url });
    } catch (error) {
      setPhotoUploadError(
        error instanceof Error ? error.message : "Failed to upload ID photo.",
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const foreign = !value.nationality.toLowerCase().includes("ghana");
  const isBooking = mode === "booking";
  const stayIn = checkInDate ?? value.checkInDateTime.slice(0, 10);
  const stayOut = checkOutDate ?? value.checkOutDateTime.slice(0, 10);

  const inputClass =
    "border-stone-200 bg-white focus-visible:ring-amber-400/30 dark:border-stone-700 dark:bg-stone-950";

  return (
    <div
      className={cn(
        "space-y-5 max-h-[min(58vh,520px)] overflow-y-auto pr-1",
        className,
      )}
    >
      {isBooking && stayIn && stayOut ? (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
          <span className="font-medium">Stay:</span> {stayIn} → {stayOut} ·
          Check-in from 2:00 PM · Check-out by 11:00 AM
        </div>
      ) : null}

      <Section
        title="Personal details"
        description="As shown on your government ID"
        icon={UserRound}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel htmlFor={p("name")} required>
              Full name
            </FieldLabel>
            <Input
              id={p("name")}
              autoComplete="name"
              value={value.fullName}
              onChange={(e) => set({ fullName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor={p("nat")} required>
              Nationality
            </FieldLabel>
            <Input
              id={p("nat")}
              autoComplete="country-name"
              value={value.nationality}
              onChange={(e) => set({ nationality: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        {foreign && (
          <div className="space-y-1.5">
            <FieldLabel htmlFor={p("pass")} required>
              Passport number
            </FieldLabel>
            <Input
              id={p("pass")}
              value={value.passportNumber ?? ""}
              onChange={(e) => set({ passportNumber: e.target.value })}
              className={inputClass}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <FieldLabel htmlFor={p("addr")} required>
            Permanent address
          </FieldLabel>
          <Textarea
            id={p("addr")}
            autoComplete="street-address"
            value={value.permanentAddress}
            onChange={(e) => set({ permanentAddress: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <FieldLabel htmlFor={p("dob")} required>
              Date of birth
            </FieldLabel>
            <Input
              id={p("dob")}
              type="date"
              value={value.dateOfBirth}
              onChange={(e) => set({ dateOfBirth: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor={p("job")} required>
              Occupation
            </FieldLabel>
            <Input
              id={p("job")}
              value={value.occupation}
              onChange={(e) => set({ occupation: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Marital status</FieldLabel>
            <Select
              value={value.maritalStatus}
              onValueChange={(v) => set({ maritalStatus: v })}
            >
              <SelectTrigger className={inputClass}>
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel htmlFor={p("phone")} required>
              Phone
            </FieldLabel>
            <Input
              id={p("phone")}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={value.phone}
              onChange={(e) => set({ phone: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor={p("email")} required>
              Email
            </FieldLabel>
            <Input
              id={p("email")}
              type="email"
              autoComplete="email"
              value={value.email}
              onChange={(e) => set({ email: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel htmlFor={p("spouse")}>Spouse travelling with you</FieldLabel>
            <Input
              id={p("spouse")}
              value={value.travelCompanionsSpouseName ?? ""}
              onChange={(e) =>
                set({ travelCompanionsSpouseName: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor={p("kids")}>Children in room</FieldLabel>
            <Input
              id={p("kids")}
              type="number"
              min={0}
              value={value.travelCompanionsChildrenCount ?? 0}
              onChange={(e) =>
                set({
                  travelCompanionsChildrenCount: Number(e.target.value) || 0,
                })
              }
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor={p("eta")} required>
            Estimated arrival time
          </FieldLabel>
          <Input
            id={p("eta")}
            type="time"
            value={
              /^\d{1,2}:\d{2}$/.test(value.eta.trim())
                ? value.eta.trim()
                : "15:00"
            }
            onChange={(e) => set({ eta: e.target.value })}
            className={inputClass}
          />
        </div>
      </Section>

      {!isBooking ? (
        <Section
          title="Stay times"
          description="Adjust if you need a different check-in or check-out time"
          icon={UserRound}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel htmlFor={p("cin")} required>
                Check-in date &amp; time
              </FieldLabel>
              <Input
                id={p("cin")}
                type="datetime-local"
                value={value.checkInDateTime}
                onChange={(e) => set({ checkInDateTime: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor={p("cout")} required>
                Check-out date &amp; time
              </FieldLabel>
              <Input
                id={p("cout")}
                type="datetime-local"
                value={value.checkOutDateTime}
                onChange={(e) => set({ checkOutDateTime: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </Section>
      ) : null}

      <Section
        title="Identification"
        description="Required under Ghana guest registration rules"
        icon={IdCard}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel required>ID type</FieldLabel>
            <Select
              value={value.idType}
              onValueChange={(v) => set({ idType: v as IdType })}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ghana_card">Ghana Card</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="drivers_license">
                  Driver&apos;s license
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor={p("idn")} required>
              ID number
            </FieldLabel>
            <Input
              id={p("idn")}
              value={value.idNumber}
              onChange={(e) => set({ idNumber: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="rounded-lg border-2 border-dashed border-stone-300 bg-white p-4 dark:border-stone-600 dark:bg-stone-950">
          <FieldLabel required>ID photo</FieldLabel>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Upload a clear photo of your{" "}
            {value.idType === "ghana_card"
              ? "Ghana Card"
              : value.idType === "passport"
                ? "passport"
                : "driver's license"}
            . The person on the ID must be present at check-in.
          </p>

          {value.idPhotoUrl ? (
            <div className="mt-4">
              <div className="relative mx-auto h-44 w-44">
                <img
                  src={value.idPhotoUrl}
                  alt="Uploaded ID"
                  className="h-full w-full rounded-lg border border-stone-200 object-cover dark:border-stone-700"
                />
              </div>
              <button
                type="button"
                onClick={() => set({ idPhotoUrl: "" })}
                className="mt-3 w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              >
                Remove photo
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {isUploadingPhoto && (
                <p className="col-span-full text-sm text-amber-700 dark:text-amber-300">
                  Uploading…
                </p>
              )}
              {photoUploadError && (
                <p className="col-span-full text-sm text-red-600 dark:text-red-400">
                  {photoUploadError}
                </p>
              )}
              <input
                id={p("photo-file")}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await uploadIdPhotoFile(file);
                  e.currentTarget.value = "";
                }}
              />
              <ButtonLike
                disabled={isUploadingPhoto}
                onClick={() =>
                  (
                    document.getElementById(p("photo-file")) as HTMLInputElement
                  )?.click()
                }
                variant="secondary"
              >
                Upload from device
              </ButtonLike>
              <input
                id={p("photo-camera")}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await uploadIdPhotoFile(file);
                  e.currentTarget.value = "";
                }}
              />
              <ButtonLike
                disabled={isUploadingPhoto}
                onClick={() =>
                  (
                    document.getElementById(p("photo-camera")) as HTMLInputElement
                  )?.click()
                }
                variant="primary"
              >
                Take photo
              </ButtonLike>
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Payment"
        description="Card and Mobile Money are confirmed online; cash is confirmed at reception"
        icon={CreditCard}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel required>Payment method</FieldLabel>
            <Select
              value={value.paymentMethod}
              onValueChange={(v) =>
                set({ paymentMethod: v as GuestDetailsGhana["paymentMethod"] })
              }
            >
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="momo">MTN Mobile Money</SelectItem>
                <SelectItem value="telecel_cash">Telecel Cash</SelectItem>
                <SelectItem value="card">Card (Paystack)</SelectItem>
                <SelectItem value="cash">Cash at reception</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor={p("paynote")}>Reference note</FieldLabel>
            <Input
              id={p("paynote")}
              value={value.paymentNote ?? ""}
              onChange={(e) => set({ paymentNote: e.target.value })}
              placeholder={
                value.paymentMethod === "cash"
                  ? "Optional — pay on arrival"
                  : "MoMo reference or card note (optional)"
              }
              className={inputClass}
            />
          </div>
        </div>
      </Section>

      <PolicyNotice className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100" />
    </div>
  );
}

function ButtonLike({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-60",
        variant === "primary"
          ? "bg-amber-600 text-white hover:bg-amber-700"
          : "border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100",
      )}
    >
      {children}
    </button>
  );
}
