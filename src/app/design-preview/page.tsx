"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Smartphone,
  Tablet,
  Monitor,
  Sun,
  Moon,
  CheckCircle2,
  Percent,
  Bookmark,
  Flame,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Compass,
  Globe,
  TrendingUp,
  Landmark,
  FileCheck2,
  Lock,
  Search,
  Flag,
  Check,
  RotateCcw,
  LayoutGrid,
  History,
  User,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DeviceMode = "mobile" | "tablet" | "desktop";

export default function DesignPreviewPage() {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [activeTab, setActiveTab] = useState<"wrong" | "bookmarks">("wrong");
  const [selectedOption, setSelectedOption] = useState<string>("A");
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const d = params.get("device");
    if (d === "mobile" || d === "tablet" || d === "desktop") {
      setDeviceMode(d);
    }
    const t = params.get("theme");
    if (t === "light" || t === "dark") {
      setTheme(t);
    }
  }, [setTheme]);

  const containerWidth =
    deviceMode === "mobile"
      ? "max-w-[390px]"
      : deviceMode === "tablet"
      ? "max-w-[768px]"
      : "max-w-6xl";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* ── TOP CONTROL TOOLBAR (Device Switcher & Theme) ── */}
      <header className="sticky top-0 z-50 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" />
          <div className="h-4 w-px bg-neutral-800 hidden sm:block" />
          <span className="text-xs font-semibold text-neutral-300 hidden sm:inline">
            Design System &amp; Live Device Preview Lab
          </span>
          <Badge variant="outline" className="text-[10px] uppercase font-bold text-sky-400 border-sky-500/30 bg-sky-500/10">
            Public · No Auth
          </Badge>
        </div>

        {/* Device Switcher */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-neutral-950 border border-neutral-800 gap-0.5">
          <button
            type="button"
            onClick={() => setDeviceMode("mobile")}
            className={cn(
              "flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer",
              deviceMode === "mobile"
                ? "bg-neutral-800 text-white font-semibold shadow-xs"
                : "text-neutral-400 hover:text-white"
            )}
            title="Mobile (390px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mobile (390px)</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceMode("tablet")}
            className={cn(
              "flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer",
              deviceMode === "tablet"
                ? "bg-neutral-800 text-white font-semibold shadow-xs"
                : "text-neutral-400 hover:text-white"
            )}
            title="Tablet (768px)"
          >
            <Tablet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tablet (768px)</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceMode("desktop")}
            className={cn(
              "flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer",
              deviceMode === "desktop"
                ? "bg-neutral-800 text-white font-semibold shadow-xs"
                : "text-neutral-400 hover:text-white"
            )}
            title="Desktop (Full)"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
        </div>

        {/* Theme Toggle & Links */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 px-2.5 text-xs rounded-lg border-neutral-800 bg-neutral-950 hover:bg-neutral-800 cursor-pointer gap-1.5 text-neutral-200"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-sky-400" />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </Button>

          <Button asChild size="sm" className="h-8 px-3 text-xs rounded-lg bg-sky-500 hover:bg-sky-600 text-neutral-950 font-semibold cursor-pointer">
            <Link href="/dashboard">Open Live App</Link>
          </Button>
        </div>
      </header>

      {/* ── DEVICE VIEWPORT FRAME ── */}
      <main className="flex-1 bg-neutral-950/90 p-4 sm:p-6 overflow-y-auto flex justify-center">
        <div
          className={cn(
            "w-full transition-all duration-300 bg-background text-foreground rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col",
            containerWidth
          )}
        >
          {/* Device Mock Header */}
          <div className="bg-secondary/70 border-b border-border px-4 py-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              <span className="ml-2 font-medium text-foreground">
                {deviceMode === "mobile" ? "iPhone 14 / Mobile (390px)" : deviceMode === "tablet" ? "iPad Mini (768px)" : "Desktop Pro (Full)"}
              </span>
            </div>
            <span className="uppercase text-[10px] tracking-wider font-semibold">Live Theme Applied</span>
          </div>

          {/* Website Canvas Area */}
          <div className="p-4 sm:p-6 md:p-8 space-y-8 overflow-y-auto">
            {/* ── 1. BRAND & NAVIGATION BAR PREVIEW ── */}
            <section className="space-y-3 pb-6 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  1. Navigation &amp; Active Sidebar Items (Clean "चौकोर" State)
                </span>
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                  Zero Stark White Pill
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Desktop Sidebar Preview */}
                <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                  <div className="pb-2 border-b border-border flex items-center justify-between">
                    <BrandLogo size="sm" />
                    <span className="text-[10px] text-muted-foreground font-mono">Sidebar Menu</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-2xs">
                      <Bookmark className="h-4 w-4 text-primary" />
                      <span>Saved (Active Item — Subtle &amp; Crisp)</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                      <LayoutGrid className="h-4 w-4" />
                      <span>Home</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                      <History className="h-4 w-4" />
                      <span>Tests</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Bottom Bar Preview */}
                <div className="p-3 rounded-xl bg-card border border-border space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-mono block mb-1">
                      Mobile Bottom Navigation (Strictly 5 Items · 20% Width)
                    </span>
                  </div>
                  <div className="grid grid-cols-5 items-center p-1 rounded-xl bg-secondary/80 border border-border text-center">
                    <div className="flex flex-col items-center py-1 text-muted-foreground">
                      <LayoutGrid className="h-4 w-4" />
                      <span className="text-[9px] mt-0.5">Home</span>
                    </div>
                    <div className="flex flex-col items-center py-1 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-[9px] mt-0.5">Tests</span>
                    </div>
                    <div className="flex flex-col items-center py-1 text-foreground font-bold bg-foreground/10 rounded-lg">
                      <Bookmark className="h-4 w-4 text-primary" />
                      <span className="text-[9px] mt-0.5">Saved</span>
                    </div>
                    <div className="flex flex-col items-center py-1 text-muted-foreground">
                      <Percent className="h-4 w-4" />
                      <span className="text-[9px] mt-0.5">Analytics</span>
                    </div>
                    <div className="flex flex-col items-center py-1 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-[9px] mt-0.5">Profile</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 2. TYPOGRAPHY HIERARCHY PREVIEW ── */}
            <section className="space-y-3 pb-6 border-b border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                2. Responsive Typography System (Inter + Noto Sans Devanagari)
              </span>

              <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground">.typo-display (Hero metric / scores)</span>
                  <div className="typo-display text-foreground">8,340 Solved · 79.3% Accuracy</div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground">.typo-h1 (Page Title)</span>
                  <div className="typo-h1 text-foreground">Saved &amp; Review Questions</div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground">.typo-h2 (Section Header)</span>
                  <div className="typo-h2 text-foreground">Rajasthan General Knowledge</div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground">.typo-h3 (Card &amp; Topic Titles)</span>
                  <div className="typo-h3 text-foreground">राजस्थान का भौतिक स्वरूप एवं भूगोल</div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground">.typo-question (Hindi Question Text with Smooth Leading)</span>
                  <div className="typo-question text-foreground">
                    भारत सरकार द्वारा स्थापित &apos;राष्ट्रीय वर्षा सिंचित क्षेत्र प्राधिकरण&apos; (NRAA) का मुख्यालय कहाँ स्थित है?
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground">.typo-body (Base UI &amp; Options)</span>
                  <div className="typo-body text-foreground">नई दिल्ली (New Delhi), पुणे, जोधपुर, हैदराबाद</div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground">.typo-small (Buttons, Labels &amp; Filters)</span>
                  <div className="typo-small text-muted-foreground">All Subjects · 15 Master Topics · Showing 1–20 of 240 questions</div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground">.typo-caption (Badges &amp; Tags)</span>
                  <div className="typo-caption text-primary font-bold">15 TOPICS · COMPLETED · COMING SOON</div>
                </div>
              </div>
            </section>

            {/* ── 3. METRIC STAT CARDS STRIP ── */}
            <section className="space-y-3 pb-6 border-b border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                3. Metric Stat Cards Strip ("चौकोर" 10px-12px Radius + 1px Crisp Border)
              </span>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="typo-small text-muted-foreground">Questions Solved</span>
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <span className="typo-display text-foreground block">8,340</span>
                    <span className="text-[11px] text-muted-foreground">Across 55 topics</span>
                  </div>
                </Card>

                <Card className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="typo-small text-muted-foreground">Accuracy %</span>
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Percent className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <span className="typo-display text-foreground block">79.3%</span>
                    <span className="text-[11px] text-muted-foreground">Verified answer rate</span>
                  </div>
                </Card>

                <Card className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="typo-small text-muted-foreground">Saved Items</span>
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                      <Bookmark className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <span className="typo-display text-foreground block">329</span>
                    <span className="text-[11px] text-muted-foreground">Bookmarks &amp; wrong Qs</span>
                  </div>
                </Card>

                <Card className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="typo-small text-muted-foreground">Active Streak</span>
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                      <Flame className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <span className="typo-display text-foreground block">3 Days</span>
                    <span className="text-[11px] text-muted-foreground">Consistent preparation</span>
                  </div>
                </Card>
              </div>
            </section>

            {/* ── 4. SEGMENTED CONTROL & FILTER BAR ── */}
            <section className="space-y-3 pb-6 border-b border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                4. Linear-Style Segmented Tabs &amp; Filter Bar (No Oval Pill Bubble!)
              </span>

              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Clean Segmented Tab Switcher */}
                <div className="inline-flex items-center p-0.5 rounded-lg bg-secondary/80 border border-border gap-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("wrong")}
                    className={cn(
                      "inline-flex items-center gap-2 h-8 px-3 rounded-md text-xs font-medium transition-all cursor-pointer border",
                      activeTab === "wrong"
                        ? "bg-card text-foreground border-border shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
                    )}
                  >
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                    <span>Wrong Questions</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 tabular-nums">
                      1,698
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("bookmarks")}
                    className={cn(
                      "inline-flex items-center gap-2 h-8 px-3 rounded-md text-xs font-medium transition-all cursor-pointer border",
                      activeTab === "bookmarks"
                        ? "bg-card text-foreground border-border shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
                    )}
                  >
                    <Bookmark className="h-3.5 w-3.5 text-amber-500" />
                    <span>Bookmarks</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 tabular-nums">
                      329
                    </span>
                  </button>
                </div>

                {/* Filter Dropdown Pills */}
                <div className="inline-flex items-center p-0.5 rounded-lg bg-secondary/60 border border-border gap-1">
                  <div className="h-8 px-3 rounded-md bg-card border border-border text-xs font-medium text-foreground flex items-center gap-2 cursor-pointer shadow-2xs">
                    <span>All Subjects</span>
                    <span className="text-muted-foreground text-[10px]">▼</span>
                  </div>
                  <div className="h-8 px-3 rounded-md bg-card border border-border text-xs font-medium text-foreground flex items-center gap-2 cursor-pointer shadow-2xs">
                    <span>All Topics</span>
                    <span className="text-muted-foreground text-[10px]">▼</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 5. LIVE QUIZ QUESTION CARD ── */}
            <section className="space-y-3 pb-6 border-b border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                5. Live Question Card (Clean Hindi Rendering &amp; Option States)
              </span>

              <Card className="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs space-y-4">
                {/* Question Header */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-[11px]">
                      1
                    </span>
                    <span className="font-semibold text-foreground">Practice Question</span>
                    <span className="text-[10px] font-mono text-muted-foreground">rg_000535</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 border-0 text-muted-foreground hover:text-foreground">
                      <Flag className="h-3.5 w-3.5" /> Flag
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-md border-border bg-muted/60">
                      <Bookmark className="h-3.5 w-3.5 text-primary" /> Saved
                    </Button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="typo-question text-foreground font-medium">
                  भारत सरकार द्वारा स्थापित &apos;राष्ट्रीय वर्षा सिंचित क्षेत्र प्राधिकरण&apos; (NRAA) का मुख्यालय कहाँ स्थित है?
                </div>

                {/* 4 Interactive Options */}
                <div className="space-y-2 pt-1">
                  {[
                    { id: "A", text: "नई दिल्ली" },
                    { id: "B", text: "पुणे" },
                    { id: "C", text: "जोधपुर" },
                    { id: "D", text: "हैदराबाद" },
                  ].map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    const isCorrect = opt.id === "A";
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOption(opt.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg text-left transition-all border cursor-pointer",
                          isCorrect && isSelected
                            ? "bg-emerald-500/10 border-emerald-500/40 text-foreground"
                            : isSelected
                            ? "bg-primary/10 border-primary/40 text-foreground"
                            : "bg-secondary/40 border-border hover:bg-secondary/80 text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold shrink-0",
                              isCorrect && isSelected
                                ? "bg-emerald-500 text-white"
                                : isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {opt.id}
                          </span>
                          <span className="typo-body">{opt.text}</span>
                        </div>

                        {isCorrect && isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Detailed Explanation Box */}
                <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border/80 space-y-1.5">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Detailed Explanation (प्रामाणिक व्याख्या)</span>
                  </div>
                  <p className="typo-small text-foreground/90 leading-relaxed font-hindi">
                    राष्ट्रीय वर्षा सिंचित क्षेत्र प्राधिकरण (National Rainfed Area Authority - NRAA) की स्थापना 3 नवंबर 2006 को कृषि मंत्रालय के अंतर्गत की गई थी। इसका केंद्रीय मुख्यालय <strong>नई दिल्ली</strong> में स्थित है। यह शुष्क एवं अर्द्ध-शुष्क क्षेत्रों के जल प्रबंधन एवं कृषि संवर्धन हेतु शीर्ष निकाय है।
                  </p>
                </div>
              </Card>
            </section>

            {/* ── 6. CURRICULUM SECTIONS & COMING SOON CARDS ── */}
            <section className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                6. Curriculum Sections &amp; "Coming Soon" Grid ("चौकोर" 10px Radius)
              </span>

              {/* Rajasthan GK Active 4-Col */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="typo-h3 text-foreground">Rajasthan General Knowledge (4 Canonical Subjects)</h3>
                  <span className="text-xs text-primary font-semibold">55 Topics</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { title: "राजस्थान का भूगोल", topics: "15 Topics", desc: "भौतिक प्रदेश, नदियाँ, जलवायु व वन" },
                    { title: "राजस्थान का इतिहास", topics: "10 Topics", desc: "सभ्यताएँ, राजपूत राजवंश व एकीकरण" },
                    { title: "राजस्थान कला एवं संस्कृति", topics: "15 Topics", desc: "मेले, त्योहार, दुर्ग, चित्रकला व साहित्य" },
                    { title: "राजस्थान राजव्यवस्था", topics: "15 Topics", desc: "राज्यपाल, मुख्यमंत्री, RPSC व उच्च न्यायालय" },
                  ].map((s, idx) => (
                    <Card key={idx} className="p-4 rounded-xl border border-border bg-card shadow-xs hover:border-primary/50 transition-colors space-y-2 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold border-border text-muted-foreground">
                          {s.topics}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="typo-h3 text-foreground font-semibold">{s.title}</h4>
                        <p className="typo-small text-muted-foreground mt-0.5 line-clamp-1">{s.desc}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px] font-semibold text-primary">
                        <span>Practice Tests</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* General English 3-Col Grid */}
              <div className="space-y-2 pt-2">
                <h3 className="typo-h3 text-foreground">General English (Paper-II)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2 cursor-pointer hover:border-emerald-500/40">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <FileCheck2 className="h-4 w-4" />
                      </div>
                      <Badge className="text-[10px] font-bold border-0 bg-emerald-500/15 text-emerald-400">
                        ACTIVE READY
                      </Badge>
                    </div>
                    <div>
                      <h4 className="typo-h3 text-foreground font-semibold">Grammar &amp; Core Rules</h4>
                      <p className="typo-small text-muted-foreground mt-0.5">Tenses, voice, narration, prepositions &amp; transformations.</p>
                    </div>
                  </Card>

                  <Card className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-xs space-y-2 select-none">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-semibold border-border text-muted-foreground">
                        COMING SOON
                      </Badge>
                    </div>
                    <div>
                      <h4 className="typo-h3 text-foreground/80 font-semibold">Part 2: Vocabulary &amp; Idioms</h4>
                      <p className="typo-small text-muted-foreground mt-0.5">Synonyms, antonyms, phrasal verbs &amp; idioms.</p>
                    </div>
                  </Card>

                  <Card className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-xs space-y-2 select-none">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-semibold border-border text-muted-foreground">
                        COMING SOON
                      </Badge>
                    </div>
                    <div>
                      <h4 className="typo-h3 text-foreground/80 font-semibold">Part 3: Comprehension &amp; Usage</h4>
                      <p className="typo-small text-muted-foreground mt-0.5">Reading passages &amp; cloze tests in curation.</p>
                    </div>
                  </Card>
                </div>
              </div>

              {/* India & World GK 4-Col Grid */}
              <div className="space-y-2 pt-2">
                <h3 className="typo-h3 text-foreground">India &amp; World GK (Coming Soon Modules)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { title: "Indian Geography", icon: Compass, sub: "Physical features, rivers & climate" },
                    { title: "World Geography", icon: Globe, sub: "Continents, oceans & global wind zones" },
                    { title: "Indian Economy", icon: TrendingUp, sub: "Agriculture, industries, national budget" },
                    { title: "Indian Polity & History", icon: Landmark, sub: "Constitution, parliament & freedom struggle" },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <Card key={i} className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-xs space-y-2 select-none">
                        <div className="flex items-center justify-between">
                          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                            <Icon className="h-4 w-4" />
                          </div>
                          <Badge variant="outline" className="text-[10px] font-semibold border-border text-muted-foreground">
                            COMING SOON
                          </Badge>
                        </div>
                        <div>
                          <h4 className="typo-h3 text-foreground/80 font-semibold">{item.title}</h4>
                          <p className="typo-small text-muted-foreground mt-0.5">{item.sub}</p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

