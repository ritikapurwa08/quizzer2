"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, User, Mail, Lock, Shield, AlertCircle } from "lucide-react";

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
        setError("Invalid email or password. Please try again.");
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
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8 shadow-lg">
      {/* Brand badge */}
      <div className="flex flex-col items-center gap-2 mb-6 text-center">
        <div className="p-3 rounded-full bg-primary/10 text-primary mb-1">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {mode === "signIn" ? "Welcome back to Quizzer" : "Create a Quizzer Account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "signIn"
            ? "Enter your credentials to access your dashboard"
            : "Fill in the details below to register a new account"}
        </p>
      </div>

      {/* Mode Switcher — pill container with white active tab */}
      <div className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-xl bg-muted text-sm font-medium">
        <button
          type="button"
          onClick={() => toggleMode("signIn")}
          className={`py-2.5 px-3 rounded-lg transition-all font-semibold ${
            mode === "signIn"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => toggleMode("signUp")}
          className={`py-2.5 px-3 rounded-lg transition-all font-semibold ${
            mode === "signUp"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signUp" && (
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="name"
                type="text"
                placeholder="Jane Doe"
                required
                className="pl-9 h-11 rounded-lg border-border bg-background"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              className="pl-9 h-11 rounded-lg border-border bg-background"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              className="pl-9 h-11 rounded-lg border-border bg-background"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {mode === "signUp" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="pl-9 h-11 rounded-lg border-border bg-background"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Account Role</Label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-semibold transition-all ${
                    role === "student"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <User className="h-4 w-4" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-semibold transition-all ${
                    role === "admin"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
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
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 font-semibold text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all cursor-pointer"
          disabled={isSubmitting}
        >
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
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => toggleMode("signUp")}
              className="text-primary font-semibold hover:underline cursor-pointer"
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
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
