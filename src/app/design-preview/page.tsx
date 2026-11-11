"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  History as HistoryIcon,
  User,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  BarChart3,
  ListFilter,
  CheckSquare,
  Square,
  ShieldCheck,
  Radio,
  ExternalLink,
  Play,
  Award,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DeviceMode = "mobile" | "tablet" | "desktop";
type AppPage =
  | "dashboard"
  | "topics"
  | "practice-sets"
  | "quiz"
  | "quiz-results"
  | "saved"
  | "syllabus"
  | "history"
  | "analytics"
  | "profile";

// ── Mock Rajasthan GK Questions Pool ──
const MOCK_QUESTIONS = [
  {
    id: "Q1",
    question: "कोपेन के जलवायु वर्गीकरण के अनुसार 'BWhw' जलवायु प्रदेश के अंतर्गत राजस्थान का कौन-सा जिला आता है?",
    options: {
      A: "जैसलमेर",
      B: "झालावाड़",
      C: "उदयपुर",
      D: "जयपुर",
    },
    correctAnswer: "A",
    explanation:
      "कोपेन के वर्गीकरण में 'BWhw' उष्णकटिबंधीय शुष्क मरुस्थलीय जलवायु को प्रदर्शित करता है। इसके अंतर्गत जैसलमेर, बीकानेर, उत्तर-पश्चिमी जोधपुर एवं फलौदी क्षेत्र सम्मिलित हैं। यहाँ वार्षिक वर्षा 10 से 20 सेमी के मध्य होती है।",
  },
  {
    id: "Q2",
    question: "राजस्थान में 'मावठ' (शीतकालीन वर्षा) का मुख्य कारण निम्नलिखित में से क्या है?",
    options: {
      A: "भूमध्यसागरीय चक्रवात (पश्चिमी विक्षोभ)",
      B: "बंगाल की खाड़ी का मानसून",
      C: "अरब सागर की मानसूनी हवाएँ",
      D: "दक्षिण-पश्चिमी व्यापारिक पवनें",
    },
    correctAnswer: "A",
    explanation:
      "राजस्थान में शीतकाल (दिसंबर-जनवरी) में होने वाली वर्षा को 'मावठ' कहा जाता है। यह भूमध्यसागर से उत्पन्न पश्चिमी विक्षोभों (Western Disturbances) के कारण होती है और रबी की फसल (विशेषकर गेहूँ व चना) के लिए अत्यंत लाभकारी (गोल्डन ड्रॉप्स) मानी जाती है।",
  },
  {
    id: "Q3",
    question: "राजस्थान का सर्वाधिक वार्षिक वर्षा वाला स्थान (सर्वाधिक आर्द्र स्थान) कौन-सा है?",
    options: {
      A: "माउंट आबू (सिरोही)",
      B: "झालावाड़",
      C: "कुंभलगढ़ (राजसमंद)",
      D: "बांसवाड़ा",
    },
    correctAnswer: "A",
    explanation:
      "राजस्थान में सर्वाधिक वर्षा वाला स्थान माउंट आबू (सिरोही) है, जहाँ लगभग 150 सेमी वर्षा होती है। यदि सर्वाधिक वर्षा वाला 'जिला' पूछा जाए तो वह झालावाड़ (लगभग 100 सेमी) है।",
  },
  {
    id: "Q4",
    question: "ग्रीष्म ऋतु में राज्य के पश्चिमी भाग में चलने वाली अत्यंत गर्म एवं शुष्क धूल भरी हवाओं को क्या कहा जाता है?",
    options: {
      A: "लू",
      B: "मावठ",
      C: "पुरवइयां",
      D: "बबूल्या",
    },
    correctAnswer: "A",
    explanation:
      "ग्रीष्मकाल में थार मरुस्थल में चलने वाली अति-उष्ण एवं शुष्क हवाओं को 'लू' कहा जाता है। स्थानीय भाषा में वायु के चक्रवाती भंवर को 'बबूल्या' तथा बंगाल की खाड़ी से आने वाली मानसूनी हवाओं को 'पुरवइयां' कहते हैं।",
  },
  {
    id: "Q5",
    question: "थार्नवेट के जलवायु वर्गीकरण के अनुसार राजस्थान का अधिकांश भाग किस जलवायु प्रदेश के अंतर्गत आता है?",
    options: {
      A: "DA'w",
      B: "CA'w",
      C: "DB'w",
      D: "EA'd",
    },
    correctAnswer: "A",
    explanation:
      "थार्नवेट वर्गीकरण में 'DA'w' उष्णकटिबंधीय अर्ध-शुष्क या स्टेपी तुल्य जलवायु को प्रदर्शित करता है, जो राजस्थान के सर्वाधिक विस्तृत भूभाग (मध्यवर्ती एवं पूर्वी जिलों) पर फैला हुआ है।",
  },
];

// ── Mock 55 Syllabus Topics Data ──
const MOCK_SYLLABUS = [
  { id: "1", title: "राजस्थान का सामान्य ज्ञान", subject: "भूगोल", completed: true },
  { id: "2", title: "राजस्थान का भौतिक स्वरूप एवं भूगोल", subject: "भूगोल", completed: true },
  { id: "3", title: "राजस्थान की जलवायु", subject: "भूगोल", completed: true },
  { id: "4", title: "राजस्थान की जनसंख्या एवं जनगणना", subject: "भूगोल", completed: true },
  { id: "5", title: "राजस्थान की मृदा", subject: "भूगोल", completed: true },
  { id: "6", title: "राजस्थान का अपवाह तंत्र, नदियाँ एवं झीलें", subject: "भूगोल", completed: true },
  { id: "7", title: "राजस्थान की सिंचाई परियोजनाएँ, बाँध एवं जल प्रबंधन", subject: "भूगोल", completed: true },
  { id: "8", title: "राजस्थान के वन, वन्यजीव, अभयारण्य एवं राष्ट्रीय उद्यान", subject: "भूगोल", completed: false },
  { id: "9", title: "राजस्थान की कृषि", subject: "भूगोल", completed: true },
  { id: "10", title: "राजस्थान का पशुपालन एवं डेयरी विकास", subject: "भूगोल", completed: false },
  { id: "16", title: "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल", subject: "इतिहास", completed: true },
  { id: "17", title: "राजस्थान के प्रमुख राजपूत राजवंश एवं प्रशासनिक व्यवस्था", subject: "इतिहास", completed: true },
  { id: "18", title: "राजस्थान में 1857 का विद्रोह एवं ब्रिटिश संधियाँ", subject: "इतिहास", completed: true },
  { id: "19", title: "राजस्थान के किसान एवं जनजातीय आंदोलन", subject: "इतिहास", completed: true },
  { id: "20", title: "राजस्थान के प्रजामंडल आंदोलन", subject: "इतिहास", completed: true },
  { id: "26", title: "राजस्थान के मेले", subject: "कला एवं संस्कृति", completed: true },
  { id: "27", title: "राजस्थान के त्योहार", subject: "कला एवं संस्कृति", completed: true },
  { id: "28", title: "राजस्थान की रीति-रिवाज एवं परंपराएँ", subject: "कला एवं संस्कृति", completed: true },
  { id: "29", title: "राजस्थान की वेशभूषा एवं आभूषण", subject: "कला एवं संस्कृति", completed: false },
  { id: "30", title: "राजस्थान की स्थापत्य कला एवं वास्तुकला", subject: "कला एवं संस्कृति", completed: true },
  { id: "41", title: "राजस्थान के राज्यपाल", subject: "राजव्यवस्था", completed: true },
  { id: "42", title: "राजस्थान के मुख्यमंत्री एवं मंत्रिपरिषद", subject: "राजव्यवस्था", completed: true },
  { id: "43", title: "राजस्थान राज्य विधानमंडल (विधानसभा)", subject: "राजव्यवस्था", completed: true },
  { id: "44", title: "राजस्थान उच्च न्यायालय एवं अधीनस्थ न्यायपालिका", subject: "राजव्यवस्था", completed: false },
  { id: "48", title: "राजस्थान लोक सेवा आयोग (RPSC)", subject: "राजव्यवस्था", completed: true },
];

export default function DesignPreviewPage() {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const { theme, setTheme } = useTheme();

  // Active quiz runner state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({
    Q1: "A",
  });
  const [quizBookmarks, setQuizBookmarks] = useState<Record<string, boolean>>({
    Q1: true,
  });
  const [isExamMode, setIsExamMode] = useState(false);

  // Saved questions state
  const [savedTab, setSavedTab] = useState<"wrong" | "bookmarks">("wrong");
  const [savedSubjectFilter, setSavedSubjectFilter] = useState("all");

  // Syllabus tracker state
  const [syllabusState, setSyllabusState] = useState(MOCK_SYLLABUS);
  const [syllabusSection, setSyllabusSection] = useState("all");

  // Synchronize query params if passed
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const d = params.get("device");
    if (d === "mobile" || d === "tablet" || d === "desktop") setDeviceMode(d);
    const p = params.get("page");
    if (p && [
      "dashboard",
      "topics",
      "practice-sets",
      "quiz",
      "quiz-results",
      "saved",
      "syllabus",
      "history",
      "analytics",
      "profile",
    ].includes(p)) {
      setCurrentPage(p as AppPage);
    }
    const t = params.get("theme");
    if (t === "light" || t === "dark") setTheme(t);
  }, [setTheme]);

  const toggleSyllabusItem = (id: string) => {
    setSyllabusState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedSyllabusCount = useMemo(() => {
    return syllabusState.filter((s) => s.completed).length;
  }, [syllabusState]);

  const syllabusPercentage = Math.round((completedSyllabusCount / syllabusState.length) * 100);

  // Container width constraints
  const frameWidthClass =
    deviceMode === "mobile"
      ? "w-[390px] border-x border-b border-border shadow-2xl"
      : deviceMode === "tablet"
      ? "w-[768px] border-x border-b border-border shadow-2xl"
      : "w-full max-w-7xl";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none">
      {/* ══════════════════════════════════════════════════════════════════════
          TOP GLOBAL CONTROLS BAR (DEVICE, PAGE & THEME SWITCHER)
          ══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-3 py-2 flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <BrandLogo size="sm" />
          <div className="h-4 w-px bg-border hidden sm:block" />
          <span className="text-xs font-semibold tracking-tight text-foreground hidden md:inline">
            Live Interactive Mock Lab
          </span>
          <Badge variant="outline" className="text-[10px] font-bold text-sky-400 border-sky-500/30 bg-sky-500/10 rounded-xs px-1.5 py-0.5">
            Public · 100% Mock
          </Badge>
        </div>

        {/* Device Switcher */}
        <div className="inline-flex items-center p-0.5 rounded-md bg-secondary/80 border border-border gap-0.5">
          <button
            type="button"
            onClick={() => setDeviceMode("desktop")}
            className={cn(
              "flex items-center gap-1.5 h-7 px-2.5 rounded-sm text-xs font-medium transition-all cursor-pointer",
              deviceMode === "desktop"
                ? "bg-card text-foreground font-semibold shadow-2xs border border-border"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
            title="Desktop (Full)"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceMode("tablet")}
            className={cn(
              "flex items-center gap-1.5 h-7 px-2.5 rounded-sm text-xs font-medium transition-all cursor-pointer",
              deviceMode === "tablet"
                ? "bg-card text-foreground font-semibold shadow-2xs border border-border"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
            title="Tablet (768px)"
          >
            <Tablet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tablet (768px)</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceMode("mobile")}
            className={cn(
              "flex items-center gap-1.5 h-7 px-2.5 rounded-sm text-xs font-medium transition-all cursor-pointer",
              deviceMode === "mobile"
                ? "bg-card text-foreground font-semibold shadow-2xs border border-border"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
            title="Mobile (390px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mobile (390px)</span>
          </button>
        </div>

        {/* Direct Page Switcher & Theme */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="inline-flex items-center p-0.5 rounded-md bg-secondary/80 border border-border gap-0.5">
            <button
              onClick={() => setCurrentPage("dashboard")}
              className={cn(
                "h-7 px-2 rounded-sm text-xs font-medium transition-all cursor-pointer",
                currentPage === "dashboard"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage("practice-sets")}
              className={cn(
                "h-7 px-2 rounded-sm text-xs font-medium transition-all cursor-pointer",
                currentPage === "practice-sets"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sets
            </button>
            <button
              onClick={() => setCurrentPage("quiz")}
              className={cn(
                "h-7 px-2 rounded-sm text-xs font-medium transition-all cursor-pointer",
                currentPage === "quiz"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Quiz Runner
            </button>
            <button
              onClick={() => setCurrentPage("quiz-results")}
              className={cn(
                "h-7 px-2 rounded-sm text-xs font-medium transition-all cursor-pointer",
                currentPage === "quiz-results"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Results
            </button>
            <button
              onClick={() => setCurrentPage("saved")}
              className={cn(
                "h-7 px-2 rounded-sm text-xs font-medium transition-all cursor-pointer",
                currentPage === "saved"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Saved
            </button>
            <button
              onClick={() => setCurrentPage("syllabus")}
              className={cn(
                "h-7 px-2 rounded-sm text-xs font-medium transition-all cursor-pointer",
                currentPage === "syllabus"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Syllabus
            </button>
            <button
              onClick={() => setCurrentPage("history")}
              className={cn(
                "h-7 px-2 rounded-sm text-xs font-medium transition-all cursor-pointer",
                currentPage === "history"
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              History
            </button>
          </div>

          <Button
            variant="outline"
            size="xs"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-7 px-2.5 rounded-sm border-border cursor-pointer"
            title="Toggle Dark / Light"
          >
            {theme === "light" ? (
              <Moon className="h-3.5 w-3.5 text-neutral-800" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            )}
          </Button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          DEVICE PREVIEW WRAPPER / CONTAINER
          ══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex justify-center p-0 sm:p-4 bg-muted/20 overflow-y-auto">
        <div className={cn("bg-background transition-all flex flex-col min-h-screen", frameWidthClass)}>
          {/* Device Hardware Top Bezel (for Tablet / Mobile) */}
          {deviceMode !== "desktop" && (
            <div className="bg-card px-4 py-2 border-b border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {deviceMode === "mobile" ? "iPhone 14 · 390px" : "iPad Mini · 768px"}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span>9:41 AM · 100%</span>
              </div>
            </div>
          )}

          {/* ── INTERACTIVE APP BODY ── */}
          <div className="flex-1 flex flex-col">
            {/* Desktop SideNav + Content Layout */}
            <div className="flex-1 flex">
              {deviceMode === "desktop" && (
                <aside className="w-56 border-r border-border p-3 space-y-4 shrink-0 bg-card/60">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <BrandLogo size="sm" />
                  </div>

                  <div className="space-y-1">
                    <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Navigation
                    </span>
                    <nav className="space-y-0.5 pt-1">
                      {[
                        { id: "dashboard", label: "Home", icon: BookOpen },
                        { id: "practice-sets", label: "Tests & Sets", icon: FileCheck2 },
                        { id: "saved", label: "Saved Questions", icon: Bookmark },
                        { id: "syllabus", label: "Syllabus Tracker", icon: CheckSquare },
                        { id: "history", label: "Test History", icon: HistoryIcon },
                        { id: "analytics", label: "Analytics", icon: BarChart3 },
                        { id: "profile", label: "Profile & Settings", icon: User },
                      ].map((item) => {
                        const Icon = item.icon;
                        const active = currentPage === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setCurrentPage(item.id as AppPage)}
                            className={cn(
                              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer border",
                              active
                                ? "bg-zinc-800 text-zinc-100 border-zinc-700 font-semibold shadow-2xs"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5" />
                              <span>{item.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Quick Shortcut to Quiz Runner */}
                  <div className="pt-3 border-t border-border">
                    <Card className="p-2.5 rounded-md border border-border bg-card/90 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Quick Quiz</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Live interactive 20-question test runner demo.
                      </p>
                      <Button
                        size="xs"
                        className="w-full h-7 rounded-sm text-xs font-semibold"
                        onClick={() => setCurrentPage("quiz")}
                      >
                        Start Mock Quiz
                      </Button>
                    </Card>
                  </div>
                </aside>
              )}

              {/* Central Content Area */}
              <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto pb-20 md:pb-6 space-y-6">
                {/* ══════════════════════════════════════════════════════════
                    PAGE 1: DASHBOARD
                    ══════════════════════════════════════════════════════════ */}
                {currentPage === "dashboard" && (
                  <div className="space-y-6">
                    {/* Welcome Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                          Welcome back, Ritik!
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          RPSC Senior Teacher (2nd Grade) Rajasthan GK Master Revision
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold self-start sm:self-auto">
                        <Flame className="h-3.5 w-3.5" />
                        <span>3 Days Streak</span>
                      </div>
                    </div>

                    {/* 4 Stat Cards Strip (Razor-Sharp "चौकोर" 4px Radius) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <Card className="p-3.5 rounded-md border border-border bg-card shadow-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium">Questions Solved</span>
                          <div className="p-1.5 rounded-xs bg-primary/10 text-primary">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                        </div>
                        <div>
                          <span className="text-2xl font-bold tracking-tight text-foreground block">8,340</span>
                          <span className="text-[11px] text-muted-foreground">Across verified sets</span>
                        </div>
                      </Card>

                      <Card className="p-3.5 rounded-md border border-border bg-card shadow-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium">Accuracy %</span>
                          <div className="p-1.5 rounded-xs bg-emerald-500/10 text-emerald-500">
                            <Percent className="h-3.5 w-3.5" />
                          </div>
                        </div>
                        <div>
                          <span className="text-2xl font-bold tracking-tight text-foreground block">79.3%</span>
                          <span className="text-[11px] text-muted-foreground">Overall success rate</span>
                        </div>
                      </Card>

                      <Card className="p-3.5 rounded-md border border-border bg-card shadow-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium">Saved Items</span>
                          <div className="p-1.5 rounded-xs bg-amber-500/10 text-amber-500">
                            <Bookmark className="h-3.5 w-3.5" />
                          </div>
                        </div>
                        <div>
                          <span className="text-2xl font-bold tracking-tight text-foreground block">329</span>
                          <span className="text-[11px] text-muted-foreground">Bookmarks &amp; wrong Qs</span>
                        </div>
                      </Card>

                      <Card className="p-3.5 rounded-md border border-border bg-card shadow-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium">Active Streak</span>
                          <div className="p-1.5 rounded-xs bg-rose-500/10 text-rose-500">
                            <Flame className="h-3.5 w-3.5" />
                          </div>
                        </div>
                        <div>
                          <span className="text-2xl font-bold tracking-tight text-foreground block">
                            3 <span className="text-sm font-medium text-muted-foreground">Days</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground">Daily practice consistency</span>
                        </div>
                      </Card>
                    </div>

                    {/* Continue Practice Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Continue Practice · Next Available Tests
                          </h2>
                        </div>
                        <button
                          onClick={() => setCurrentPage("practice-sets")}
                          className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          All Topics <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Card className="p-3.5 rounded-md border border-border bg-card shadow-xs space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-primary">भूगोल</span>
                            <Badge variant="outline" className="text-[10px] rounded-xs border-amber-500/30 text-amber-500 bg-amber-500/10 font-bold">
                              Part 3 · In Progress
                            </Badge>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">राजस्थान की जलवायु</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">20 Questions · Attempted 8/20</p>
                          </div>
                          <Button
                            size="xs"
                            onClick={() => setCurrentPage("quiz")}
                            className="w-full h-8 rounded-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Resume Attempt
                          </Button>
                        </Card>

                        <Card className="p-3.5 rounded-md border border-border bg-card shadow-xs space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-primary">इतिहास</span>
                            <Badge variant="outline" className="text-[10px] rounded-xs border-primary/30 text-primary bg-primary/10 font-bold">
                              Part 1 · New Set
                            </Badge>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">20 Questions · Verified Pool</p>
                          </div>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setCurrentPage("quiz")}
                            className="w-full h-8 rounded-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Play className="h-3.5 w-3.5" /> Start Practice Test
                          </Button>
                        </Card>

                        <Card className="p-3.5 rounded-md border border-border bg-card shadow-xs space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-primary">कला एवं संस्कृति</span>
                            <Badge variant="outline" className="text-[10px] rounded-xs border-primary/30 text-primary bg-primary/10 font-bold">
                              Part 1 · New Set
                            </Badge>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">राजस्थान के मेले एवं त्योहार</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">20 Questions · Standard Exam</p>
                          </div>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setCurrentPage("quiz")}
                            className="w-full h-8 rounded-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Play className="h-3.5 w-3.5" /> Start Practice Test
                          </Button>
                        </Card>
                      </div>
                    </div>

                    {/* 4 Canonical Subjects Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-bold text-foreground">
                            Rajasthan General Knowledge (4 Canonical Subjects)
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            Official 55 Master Topics strictly aligned with RPSC 2nd Grade Syllabus
                          </p>
                        </div>
                        <button
                          onClick={() => setCurrentPage("syllabus")}
                          className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                        >
                          View 55 Syllabus →
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          {
                            title: "राजस्थान का सामान्य ज्ञान एवं भूगोल",
                            topics: "15 Topics",
                            desc: "भौतिक प्रदेश, नदियाँ, जलवायु, वन, खनिज एवं कृषि",
                          },
                          {
                            title: "राजस्थान का इतिहास",
                            topics: "10 Topics",
                            desc: "प्राचीन सभ्यताएँ, राजपूत राजवंश, 1857 व एकीकरण",
                          },
                          {
                            title: "राजस्थान कला एवं संस्कृति",
                            topics: "15 Topics",
                            desc: "मेले, त्योहार, लोक देवता, स्थापत्य व चित्रकला",
                          },
                          {
                            title: "राजस्थान राजव्यवस्था एवं प्रशासन",
                            topics: "15 Topics",
                            desc: "राज्यपाल, मुख्यमंत्री, RPSC, लोकायुक्त व मानवाधिकार",
                          },
                        ].map((subj, i) => (
                          <Card
                            key={i}
                            onClick={() => setCurrentPage("practice-sets")}
                            className="p-3.5 rounded-md border border-border bg-card shadow-xs hover:border-primary/50 transition-all cursor-pointer space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="p-1.5 rounded-xs bg-primary/10 text-primary">
                                <BookOpen className="h-4 w-4" />
                              </div>
                              <Badge variant="outline" className="text-[10px] rounded-xs border-border/80 text-muted-foreground font-semibold">
                                {subj.topics}
                              </Badge>
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-foreground line-clamp-1">{subj.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subj.desc}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-primary font-semibold pt-1">
                              <span>Practice Tests</span>
                              <ArrowRight className="h-3 w-3" />
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    PAGE 2: PRACTICE SETS (TOPIC 3: CLIMATE - 12 SETS)
                    ══════════════════════════════════════════════════════════ */}
                {currentPage === "practice-sets" && (
                  <div className="space-y-5">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <button onClick={() => setCurrentPage("dashboard")} className="hover:text-foreground cursor-pointer">
                        Dashboard
                      </button>
                      <ChevronRight className="h-3 w-3" />
                      <span>राजस्थान सामान्य ज्ञान एवं भूगोल</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-foreground font-semibold">राजस्थान की जलवायु</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                          राजस्थान की जलवायु
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          Authentic practice test sets. Exactly 12 sets (240 questions in pool).
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs rounded-xs border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-bold self-start sm:self-auto px-2 py-1">
                        ✓ 3/12 Completed
                      </Badge>
                    </div>

                    {/* Sets Grid (Exactly 12 Verified Sets) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Array.from({ length: 12 }).map((_, index) => {
                        const partNumber = index + 1;
                        const isCompleted = partNumber <= 3;
                        return (
                          <Card
                            key={partNumber}
                            className="p-3 rounded-md border border-border bg-card shadow-xs flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={cn(
                                  "p-1.5 rounded-xs shrink-0",
                                  isCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                                )}
                              >
                                {isCompleted ? <Check className="h-3.5 w-3.5" /> : <FileCheck2 className="h-3.5 w-3.5" />}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-foreground truncate block">
                                  राजस्थान की जलवायु Part {partNumber}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {isCompleted ? "Score: 37.33 / 40 (95%)" : "20 Questions · Standard Exam"}
                                </span>
                              </div>
                            </div>

                            <Button
                              size="xs"
                              variant={isCompleted ? "outline" : "default"}
                              onClick={() => setCurrentPage("quiz")}
                              className="h-7 px-3 rounded-sm text-xs font-semibold shrink-0 cursor-pointer"
                            >
                              {isCompleted ? "Retake" : "Start"}
                            </Button>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    PAGE 3: ACTIVE QUIZ RUNNER (FULLY INTERACTIVE)
                    ══════════════════════════════════════════════════════════ */}
                {currentPage === "quiz" && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {/* Quiz Top Navigation Bar */}
                    <div className="flex items-center justify-between p-3 rounded-md border border-border bg-card shadow-xs gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setCurrentPage("practice-sets")}
                          className="h-7 w-7 p-0 rounded-xs cursor-pointer"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Button>
                        <div>
                          <span className="text-xs font-bold text-foreground block">राजस्थान की जलवायु (Part 4)</span>
                          <span className="text-[10px] text-muted-foreground">
                            Question {currentQIndex + 1} of {MOCK_QUESTIONS.length}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Live Timer Pill */}
                        <div className="flex items-center gap-1 px-2 py-1 rounded-sm bg-secondary text-xs font-mono font-semibold text-foreground border border-border">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span>18:42</span>
                        </div>

                        {/* Exam / Practice Mode Toggle */}
                        <button
                          type="button"
                          onClick={() => setIsExamMode(!isExamMode)}
                          className={cn(
                            "px-2 py-1 rounded-sm text-[11px] font-semibold border transition-all cursor-pointer",
                            isExamMode
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                              : "bg-primary/10 text-primary border-primary/30"
                          )}
                        >
                          {isExamMode ? "Exam Mode" : "Practice Mode"}
                        </button>

                        <Button
                          size="xs"
                          onClick={() => setCurrentPage("quiz-results")}
                          className="h-7 px-2.5 rounded-sm bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Submit
                        </Button>
                      </div>
                    </div>

                    {/* Question Card */}
                    {(() => {
                      const q = MOCK_QUESTIONS[currentQIndex];
                      const selected = userAnswers[q.id];
                      const isBookmarked = quizBookmarks[q.id];

                      return (
                        <Card className="p-4 sm:p-5 rounded-md border border-border bg-card shadow-xs space-y-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] rounded-xs border-border font-bold">
                              Q#{currentQIndex + 1} · +2.0 / -0.66
                            </Badge>
                            <button
                              type="button"
                              onClick={() =>
                                setQuizBookmarks((prev) => ({
                                  ...prev,
                                  [q.id]: !prev[q.id],
                                }))
                              }
                              className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium cursor-pointer border",
                                isBookmarked
                                  ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                                  : "text-muted-foreground border-transparent hover:bg-muted"
                              )}
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                              <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
                            </button>
                          </div>

                          {/* Authentic Hindi Question Stem */}
                          <p className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
                            {q.question}
                          </p>

                          {/* 4 Crisp Options */}
                          <div className="space-y-2 pt-1">
                            {Object.entries(q.options).map(([key, text]) => {
                              const isOptionSelected = selected === key;
                              const isCorrect = key === q.correctAnswer;
                              const showFeedback = !isExamMode && selected !== undefined;

                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() =>
                                    setUserAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: key,
                                    }))
                                  }
                                  className={cn(
                                    "w-full text-left p-3 rounded-sm text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 border cursor-pointer",
                                    showFeedback && isCorrect
                                      ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-600 dark:text-emerald-400 font-semibold"
                                      : showFeedback && isOptionSelected && !isCorrect
                                      ? "bg-rose-500/10 border-rose-500/60 text-rose-500 font-semibold"
                                      : isOptionSelected
                                      ? "bg-primary/10 border-primary text-foreground font-semibold"
                                      : "bg-card hover:bg-muted/60 border-border text-foreground"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={cn(
                                        "h-6 w-6 rounded-xs flex items-center justify-center text-xs font-bold border",
                                        isOptionSelected
                                          ? "bg-primary text-primary-foreground border-primary"
                                          : "bg-secondary text-muted-foreground border-border"
                                      )}
                                    >
                                      {key}
                                    </span>
                                    <span>{text}</span>
                                  </div>
                                  {showFeedback && isCorrect && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>

                          {/* Detailed Explanation in Practice Mode */}
                          {!isExamMode && selected && (
                            <div className="p-3.5 rounded-sm bg-muted/60 border border-border space-y-1.5 animate-in fade-in duration-200">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                                <span>प्रामाणिक व्याख्या (Detailed Explanation)</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                            </div>
                          )}

                          {/* Navigation Buttons */}
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <Button
                              variant="outline"
                              size="xs"
                              disabled={currentQIndex === 0}
                              onClick={() => setCurrentQIndex((prev) => prev - 1)}
                              className="h-8 px-3 rounded-sm text-xs font-semibold cursor-pointer"
                            >
                              Previous
                            </Button>

                            <div className="flex items-center gap-2">
                              {currentQIndex < MOCK_QUESTIONS.length - 1 ? (
                                <Button
                                  size="xs"
                                  onClick={() => setCurrentQIndex((prev) => prev + 1)}
                                  className="h-8 px-4 rounded-sm text-xs font-semibold cursor-pointer"
                                >
                                  Next Question →
                                </Button>
                              ) : (
                                <Button
                                  size="xs"
                                  onClick={() => setCurrentPage("quiz-results")}
                                  className="h-8 px-4 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                                >
                                  Finish &amp; View Results
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })()}

                    {/* Question Palette Strip */}
                    <div className="p-3 rounded-md border border-border bg-card shadow-xs space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Question Palette
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {MOCK_QUESTIONS.map((q, idx) => {
                          const isAnswered = userAnswers[q.id] !== undefined;
                          const isCurrent = currentQIndex === idx;

                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setCurrentQIndex(idx)}
                              className={cn(
                                "h-7 w-7 rounded-xs text-xs font-bold flex items-center justify-center border transition-all cursor-pointer",
                                isCurrent
                                  ? "border-primary ring-2 ring-primary/30 bg-primary/10 text-foreground"
                                  : isAnswered
                                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    PAGE 4: QUIZ RESULTS PAGE
                    ══════════════════════════════════════════════════════════ */}
                {currentPage === "quiz-results" && (
                  <div className="space-y-5 max-w-4xl mx-auto">
                    <Card className="p-5 rounded-md border border-border bg-card shadow-xs text-center space-y-3">
                      <Badge variant="outline" className="text-xs rounded-xs border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-bold px-2 py-0.5">
                        Test Completed Successfully
                      </Badge>
                      <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        राजस्थान की जलवायु (Part 4) Results
                      </h1>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto pt-2">
                        <div className="p-2.5 rounded-sm bg-secondary/80 border border-border">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Final Score</span>
                          <span className="text-xl font-bold text-foreground">37.33 / 40</span>
                        </div>
                        <div className="p-2.5 rounded-sm bg-secondary/80 border border-border">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Accuracy</span>
                          <span className="text-xl font-bold text-emerald-500">95.0%</span>
                        </div>
                        <div className="p-2.5 rounded-sm bg-secondary/80 border border-border">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Correct</span>
                          <span className="text-xl font-bold text-emerald-500">19 / 20</span>
                        </div>
                        <div className="p-2.5 rounded-sm bg-secondary/80 border border-border">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Time Taken</span>
                          <span className="text-xl font-bold text-foreground">11m 45s</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button
                          size="xs"
                          onClick={() => setCurrentPage("quiz")}
                          className="h-8 px-4 rounded-sm text-xs font-semibold cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake Test
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setCurrentPage("practice-sets")}
                          className="h-8 px-4 rounded-sm text-xs font-semibold cursor-pointer"
                        >
                          Back to Sets
                        </Button>
                      </div>
                    </Card>

                    {/* Detailed Review Section */}
                    <div className="space-y-3">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Question Review &amp; Official Explanations
                      </h2>
                      {MOCK_QUESTIONS.map((q, idx) => (
                        <Card key={q.id} className="p-3.5 rounded-md border border-border bg-card shadow-xs space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                            <span>Question #{idx + 1}</span>
                            <span className="text-emerald-500">✓ Correct (+2.00)</span>
                          </div>
                          <p className="text-sm font-bold text-foreground">{q.question}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Correct Answer: Option {q.correctAnswer} — {q.options[q.correctAnswer as keyof typeof q.options]}
                          </p>
                          <div className="p-2.5 rounded-xs bg-muted/60 text-xs text-muted-foreground border border-border leading-relaxed">
                            {q.explanation}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    PAGE 5: SAVED & REVIEW QUESTIONS
                    ══════════════════════════════════════════════════════════ */}
                {currentPage === "saved" && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                          Saved &amp; Review Questions
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          Review questions you missed during practice tests or bookmarked for revision.
                        </p>
                      </div>

                      {/* Segmented Tab Switcher (Crisp "चौकोर" Linear/Raycast Style) */}
                      <div className="inline-flex items-center p-0.5 rounded-md bg-secondary/80 border border-border self-start sm:self-auto gap-0.5">
                        <button
                          type="button"
                          onClick={() => setSavedTab("wrong")}
                          className={cn(
                            "inline-flex items-center gap-1.5 h-8 px-3 rounded-sm text-xs font-medium transition-all cursor-pointer border",
                            savedTab === "wrong"
                              ? "bg-card text-foreground border-border shadow-2xs font-semibold"
                              : "text-muted-foreground hover:text-foreground border-transparent"
                          )}
                        >
                          <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                          <span>Wrong Questions</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-xs bg-rose-500/15 text-rose-500 border border-rose-500/20">
                            1,698
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSavedTab("bookmarks")}
                          className={cn(
                            "inline-flex items-center gap-1.5 h-8 px-3 rounded-sm text-xs font-medium transition-all cursor-pointer border",
                            savedTab === "bookmarks"
                              ? "bg-card text-foreground border-border shadow-2xs font-semibold"
                              : "text-muted-foreground hover:text-foreground border-transparent"
                          )}
                        >
                          <Bookmark className="h-3.5 w-3.5 text-amber-500" />
                          <span>Bookmarks</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-xs bg-amber-500/15 text-amber-500 border border-amber-500/20">
                            329
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-secondary/60 p-0.5 rounded-md border border-border inline-flex items-center gap-1">
                      <select
                        value={savedSubjectFilter}
                        onChange={(e) => setSavedSubjectFilter(e.target.value)}
                        className="h-8 text-xs rounded-sm border border-border bg-card px-2.5 text-foreground font-medium cursor-pointer"
                      >
                        <option value="all">All Subjects</option>
                        <option value="geo">राजस्थान का भूगोल</option>
                        <option value="hist">राजस्थान का इतिहास</option>
                        <option value="culture">राजस्थान कला एवं संस्कृति</option>
                        <option value="polity">राजस्थान राजव्यवस्था</option>
                      </select>

                      <select className="h-8 text-xs rounded-sm border border-border bg-card px-2.5 text-foreground font-medium cursor-pointer">
                        <option value="all">All Topics</option>
                        <option value="climate">राजस्थान की जलवायु</option>
                        <option value="soil">राजस्थान की मृदा</option>
                      </select>
                    </div>

                    {/* List of Saved Questions */}
                    <div className="space-y-3">
                      <Card className="p-4 rounded-md border border-border bg-card shadow-xs space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">1 · Practice Question rg_000535</span>
                          <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1 hover:text-foreground cursor-pointer">
                              <Flag className="h-3.5 w-3.5" /> Flag
                            </button>
                            <Badge variant="outline" className="text-[10px] rounded-xs border-amber-500/30 text-amber-500 bg-amber-500/10 font-bold">
                              Saved
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm font-bold text-foreground leading-relaxed">
                          भारत सरकार द्वारा स्थापित 'राष्ट्रीय वर्षा सिंचित क्षेत्र प्राधिकरण' (NRAA) का मुख्यालय कहाँ स्थित है?
                        </p>

                        <div className="space-y-1.5 text-xs">
                          <div className="p-2.5 rounded-xs bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-between">
                            <span>A · नई दिल्ली</span>
                            <Check className="h-4 w-4" />
                          </div>
                          <div className="p-2.5 rounded-xs bg-secondary/50 border border-border text-muted-foreground">
                            <span>B · पुणे</span>
                          </div>
                          <div className="p-2.5 rounded-xs bg-secondary/50 border border-border text-muted-foreground">
                            <span>C · जोधपुर</span>
                          </div>
                          <div className="p-2.5 rounded-xs bg-secondary/50 border border-border text-muted-foreground">
                            <span>D · हैदराबाद</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xs bg-muted/60 text-xs text-muted-foreground border border-border leading-relaxed">
                          <span className="font-bold text-foreground block mb-0.5">DETAILED EXPLANATION</span>
                          राष्ट्रीय वर्षा सिंचित क्षेत्र प्राधिकरण (National Rainfed Area Authority - NRAA) की स्थापना 3 नवंबर 2006 को कृषि मंत्रालय के अंतर्गत की गई थी। इसका केंद्रीय मुख्यालय नई दिल्ली में स्थित है।
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    PAGE 6: SYLLABUS TRACKER
                    ══════════════════════════════════════════════════════════ */}
                {currentPage === "syllabus" && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                          Syllabus Tracker
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          Authoritative Master Topics tracking for RPSC Senior Teacher (2nd Grade).
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          setSyllabusState((prev) => prev.map((s) => ({ ...s, completed: false })))
                        }
                        className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Progress
                      </Button>
                    </div>

                    {/* Progress Card */}
                    <Card className="p-4 rounded-md border border-border bg-card shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-muted-foreground uppercase">
                          Rajasthan GK Total: 55 Topics
                        </span>
                        <span className="font-bold text-primary">
                          {completedSyllabusCount} / {syllabusState.length} Prepared ({syllabusPercentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-xs overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${syllabusPercentage}%` }}
                        />
                      </div>
                    </Card>

                    {/* Section Selector Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {["all", "भूगोल", "इतिहास", "कला एवं संस्कृति", "राजव्यवस्था"].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setSyllabusSection(sec)}
                          className={cn(
                            "px-3 py-1.5 rounded-sm text-xs font-medium transition-all cursor-pointer border whitespace-nowrap",
                            syllabusSection === sec
                              ? "bg-zinc-800 text-zinc-100 border-zinc-700 font-semibold shadow-2xs"
                              : "bg-card text-muted-foreground hover:text-foreground border-border"
                          )}
                        >
                          {sec === "all" ? "All 55 Topics" : sec}
                        </button>
                      ))}
                    </div>

                    {/* Topics Checklist */}
                    <div className="space-y-1.5">
                      {syllabusState
                        .filter((item) => (syllabusSection === "all" ? true : item.subject === syllabusSection))
                        .map((item) => (
                          <div
                            key={item.id}
                            onClick={() => toggleSyllabusItem(item.id)}
                            className={cn(
                              "p-3 rounded-md border transition-all flex items-center justify-between gap-3 cursor-pointer",
                              item.completed
                                ? "bg-card/90 border-border hover:border-emerald-500/40"
                                : "bg-card/40 border-border/80 hover:border-primary/40"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <button
                                type="button"
                                className="text-primary shrink-0 cursor-pointer"
                                aria-label="Toggle completed"
                              >
                                {item.completed ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Square className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <span
                                  className={cn(
                                    "text-xs sm:text-sm font-semibold truncate block",
                                    item.completed ? "text-foreground" : "text-muted-foreground"
                                  )}
                                >
                                  #{item.id} {item.title}
                                </span>
                                <span className="text-[11px] text-muted-foreground">{item.subject}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPage("practice-sets");
                              }}
                              className="text-xs text-primary font-semibold hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
                            >
                              Practice →
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    PAGE 7: TEST HISTORY
                    ══════════════════════════════════════════════════════════ */}
                {currentPage === "history" && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                          Test History
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          Complete record of all test attempts, ordered newest to oldest.
                        </p>
                      </div>

                      <Button variant="outline" size="xs" className="h-7 text-xs rounded-sm text-rose-500 border-border cursor-pointer self-start sm:self-auto">
                        Clean 0-Score Tests
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {[
                        { title: "राजस्थान की जलवायु भाग 12", score: "37.33 / 40", acc: "95%", date: "11 Nov 2026" },
                        { title: "राजस्थान की जलवायु भाग 11", score: "32.00 / 40", acc: "85%", date: "11 Nov 2026" },
                        { title: "राजस्थान की जलवायु भाग 10", score: "18.67 / 40", acc: "60%", date: "11 Nov 2026" },
                        { title: "राजस्थान की जलवायु भाग 9", score: "37.33 / 40", acc: "95%", date: "11 Nov 2026" },
                        { title: "राजस्थान की जलवायु भाग 8", score: "37.33 / 40", acc: "95%", date: "10 Nov 2026" },
                      ].map((item, i) => (
                        <Card
                          key={i}
                          onClick={() => setCurrentPage("quiz-results")}
                          className="p-3 rounded-md border border-border bg-card shadow-xs flex items-center justify-between gap-3 hover:border-primary/40 transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="text-xs font-bold text-foreground block">{item.title}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {item.date} · 20 Questions
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[10px] rounded-xs border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-bold">
                              {item.acc}
                            </Badge>
                            <span className="text-xs font-mono font-bold text-foreground">{item.score}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    PAGE 8: ANALYTICS
                    ══════════════════════════════════════════════════════════ */}
                {currentPage === "analytics" && (
                  <div className="space-y-5">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Performance Analytics
                      </h1>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        In-depth mastery breakdown by subject and accuracy trend.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Card className="p-4 rounded-md border border-border bg-card shadow-xs space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Subject Mastery (Accuracy %)
                        </span>
                        <div className="space-y-2.5">
                          {[
                            { name: "राजस्थान का भूगोल", pct: 84 },
                            { name: "राजस्थान का इतिहास", pct: 76 },
                            { name: "राजस्थान कला एवं संस्कृति", pct: 88 },
                            { name: "राजस्थान राजव्यवस्था", pct: 71 },
                          ].map((sub) => (
                            <div key={sub.name} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-foreground">{sub.name}</span>
                                <span className="font-mono text-muted-foreground">{sub.pct}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-secondary rounded-xs overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${sub.pct}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="p-4 rounded-md border border-border bg-card shadow-xs space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Readiness Status
                        </span>
                        <div className="text-center py-4 space-y-2">
                          <div className="h-20 w-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center mx-auto">
                            <span className="text-xl font-bold text-foreground">82%</span>
                          </div>
                          <span className="text-xs font-bold text-foreground block">RPSC 2nd Grade GK Ready</span>
                          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            You have mastered 42 of 55 master topics with 79.3% verified accuracy.
                          </p>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    PAGE 9: PROFILE & SETTINGS
                    ══════════════════════════════════════════════════════════ */}
                {currentPage === "profile" && (
                  <div className="space-y-5 max-w-xl mx-auto">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Profile &amp; Settings
                      </h1>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Manage your revision preferences and theme.
                      </p>
                    </div>

                    <Card className="p-4 rounded-md border border-border bg-card shadow-xs space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-sm bg-primary/10 text-primary font-bold flex items-center justify-center text-base border border-primary/20">
                          RI
                        </div>
                        <div>
                          <span className="text-sm font-bold text-foreground block">Ritik (Admin Candidate)</span>
                          <span className="text-xs text-muted-foreground">RPSC Senior Teacher Aspirant</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Appearance Theme</span>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="h-7 px-2.5 rounded-sm border-border cursor-pointer text-xs"
                          >
                            {theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-muted-foreground">Admin Console Access</span>
                          <span className="font-mono text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-xs border border-border">
                            Ctrl + Shift + A
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Bottom Navigation Bar (Strict 5 Items) */}
            {deviceMode !== "desktop" && (
              <nav className="sticky bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-bottom shadow-lg">
                <div className="grid grid-cols-5 items-center px-1 py-1">
                  {[
                    { id: "dashboard", label: "Home", icon: BookOpen },
                    { id: "practice-sets", label: "Tests", icon: FileCheck2 },
                    { id: "saved", label: "Saved", icon: Bookmark },
                    { id: "analytics", label: "Analytics", icon: BarChart3 },
                    { id: "profile", label: "Profile", icon: User },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCurrentPage(item.id as AppPage)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-sm min-w-0 w-full transition-all cursor-pointer border-0",
                          active ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className={cn("p-1 rounded-xs transition-all", active ? "bg-foreground/10 text-foreground" : "")}>
                          <Icon className="h-4 w-4 shrink-0" />
                        </div>
                        <span className="text-[10px] font-semibold truncate max-w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
