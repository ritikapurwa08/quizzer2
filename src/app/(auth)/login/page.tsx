"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { GraduationCap, User, Mail, Lock, Shield } from "lucide-react";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"student" | "admin">("student");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  const toggleMode = (newMode: "signIn" | "signUp") => {
    setMode(newMode);
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signUp") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === "signIn") {
        await signIn("password", { email, password, flow: "signIn" });
      } else {
        await signIn("password", { email, password, name, role, flow: "signUp" });
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      if (mode === "signIn") {
        setError("Invalid email or password.");
      } else {
        const message = err instanceof Error ? err.message : "Failed to create account.";
        setError(
          message.includes("AccountAlreadyExists") || message.includes("already")
            ? "An account with this email already exists."
            : "Could not sign up. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <Card className="w-full max-w-md p-6 shadow-lg border border-border bg-card">
      <div className="flex flex-col items-center gap-2 mb-6 text-center">
        <div className="p-3 rounded-full bg-primary/10 text-primary mb-1">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "signIn" ? "Welcome back to Quizzer" : "Create a Quizzer Account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "signIn"
            ? "Enter your email and password to access your dashboard"
            : "Fill in the details below to register a new account"}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-lg bg-muted text-sm font-medium">
        <button
          type="button"
          onClick={() => toggleMode("signIn")}
          className={`py-2 px-3 rounded-md transition-all ${
            mode === "signIn"
              ? "bg-background text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => toggleMode("signUp")}
          className={`py-2 px-3 rounded-md transition-all ${
            mode === "signUp"
              ? "bg-background text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signUp" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Jane Doe"
                required
                className="pl-9"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              className="pl-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {mode === "signUp" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="pl-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Account Role</Label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-sm font-medium transition-all ${
                    role === "student"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-input bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <User className="h-4 w-4" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-sm font-medium transition-all ${
                    role === "admin"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-input bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </button>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full font-medium" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "signIn"
              ? "Signing in..."
              : "Creating account..."
            : mode === "signIn"
            ? "Sign In"
            : "Create Account"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signIn" ? (
          <p>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => toggleMode("signUp")}
              className="text-primary underline font-medium hover:text-primary/80"
            >
              Sign up
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => toggleMode("signIn")}
              className="text-primary underline font-medium hover:text-primary/80"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </Card>
  );
}
