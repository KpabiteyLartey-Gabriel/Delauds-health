"use client";

import { useState } from "react";
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
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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

  if (!ready) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4 py-12 dark:bg-stone-950">
      <Card className="w-full max-w-md border-stone-200 shadow-xl dark:border-stone-800">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <Building2 className="h-7 w-7" />
            </span>
          </div>
          <CardTitle className="font-display text-2xl font-light">
            Create guest account
          </CardTitle>
          <CardDescription>
            Sign up to book rooms online. Ghana registration details are
            completed when you reserve a stay.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">At least 8 characters</p>
            </div>
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={loading}
            >
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4 dark:text-slate-400">
            <Link href="/login" className="text-amber-700 hover:underline">
              Already have an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
