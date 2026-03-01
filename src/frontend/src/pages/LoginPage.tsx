import { Button } from "@/components/ui/button";
import {
  BarChart3,
  GraduationCap,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: BarChart3,
    title: "Performance Analytics",
    desc: "Track class averages and score distributions",
  },
  {
    icon: TrendingUp,
    title: "Projected Outcomes",
    desc: "Linear regression to predict future performance",
  },
  {
    icon: Users,
    title: "Student Profiles",
    desc: "Individual breakdowns with deviation indicators",
  },
];

export default function LoginPage() {
  const { login, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-sidebar p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/20">
            <GraduationCap className="h-6 w-6 text-sidebar-primary" />
          </div>
          <div>
            <span className="font-display text-lg font-bold text-sidebar-foreground">
              EduTrack
            </span>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40">
              Performance Tracker
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-4xl font-bold leading-tight text-sidebar-foreground">
              Track every
              <br />
              student's journey
            </h2>
            <p className="mt-4 text-sidebar-foreground/60 leading-relaxed">
              Import marks from Excel, visualize trends, identify at-risk
              students, and project outcomes — all in one place.
            </p>
          </motion.div>

          <div className="space-y-4">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/10">
                  <Icon className="h-4 w-4 text-sidebar-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-sidebar-foreground">
                    {title}
                  </p>
                  <p className="text-xs text-sidebar-foreground/50">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/30">
          Powered by Internet Computer · Decentralized & Secure
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="font-display text-xl font-bold">EduTrack</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your classroom dashboard
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-11 font-semibold"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in with Internet Identity"
              )}
            </Button>

            {isLoginError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {loginError?.message ?? "Login failed. Please try again."}
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Internet Identity provides secure, privacy-preserving authentication
          </p>
        </motion.div>
      </div>
    </div>
  );
}
