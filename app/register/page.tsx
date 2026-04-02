"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { useHotel } from "@/components/hotel/HotelProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register, ready } = useHotel();
  const [fullName, setFullName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("registrationFullName") || "";
    }
    return "";
  });
  const [phone, setPhone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("registrationPhone") || "";
    }
    return "";
  });
  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("registrationEmail") || "";
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setLoading(true);
    try {
      const res = await register(email, password, fullName, phone);
      if ("error" in res) {
        toast({
          title: "Registration failed",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Account created",
        description: "You can book a room from the guest portal.",
      });
      router.replace("/client");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("registrationFullName", fullName);
  }, [fullName]);

  useEffect(() => {
    localStorage.setItem("registrationPhone", phone);
  }, [phone]);

  useEffect(() => {
    localStorage.setItem("registrationEmail", email);
  }, [email]);

  if (!ready) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <Building2 className="h-10 w-10 text-amber-700" />
          </div>
          <CardTitle>Guest registration</CardTitle>
          <CardDescription>
            App account only. Full Ghana guest-register details are collected
            per booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={loading}
            >
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            <Link href="/login" className="text-amber-700 hover:underline">
              Already have an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
