"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function ForgotPasswordPage() {
  const { forgotPassword, ready } = useHotel();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setSending(true);
    try {
      const result = await forgotPassword(email);
      if ("error" in result) {
        toast({
          title: "Could not send reset link",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Check your email",
        description:
          "If a client account exists for that address, a reset link has been sent.",
      });
      setEmail("");
    } finally {
      setSending(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <Building2 className="h-10 w-10 text-amber-700" />
          </div>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Client accounts can request a password reset link here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Client email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={sending}
            >
              {sending ? "Sending link..." : "Send reset link"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4 dark:text-slate-400">
            Admin and receptionist passwords are reset only inside the admin portal.
          </p>
          <p className="text-center text-sm text-slate-500 mt-2 dark:text-slate-400">
            <Link href="/login" className="text-amber-700 hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
