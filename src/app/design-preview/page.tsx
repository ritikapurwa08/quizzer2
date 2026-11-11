"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  LogOut,
  FileText,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Settings,
  FolderOpen,
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
  | "practice-sets"
  | "quiz"
  | "quiz-results"
  | "saved"
  | "syllabus"
  | "history"
  | "analytics"
  | "admin-overview";

// ── Authentic Rajasthan GK Questions ──
const MOCK_QUESTIONS = [
  {
    id: "rg_000535",
    qNum: 1,
    question: "भारत सरकार द्वारा स्थापित 'राष्ट्रीय वर्षा सिंचित क्षेत्र प्राधिकरण' (NRAA) का मुख्यालय कहाँ स्थित है?",
    options: {
      A: "नई दिल्ली",
      B: "पुणे",
      C: "जोधपुर",
      D: "हैदराबाद",
    },
    correctAnswer: "A",
    explanation:
      "राष्ट्रीय वर्षा सिंचित क्षेत्र प्राधिकरण (National Rainfed Area Authority - NRAA) की स्थापना 3 नवंबर 2006 को कृषि मंत्रालय के अंतर्गत की गई थी। इसका केंद्रीय मुख्यालय नई दिल्ली में स्थित है। यह शुष्क एवं अर्द्ध-शुष्क क्षेत्रों के जल प्रबंधन एवं कृषि संवर्धन हेतु शीर्ष निकाय है।",
  },
  {
    id: "rg_000102",
    qNum: 2,
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
    id: "rg_000103",
    qNum: 3,
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
    id: "rg_000104",
    qNum: 4,
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
    id: "rg_000105",
    qNum: 5,
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
];

// ── Complete 55 Syllabus Topics Mock ──
const MOCK_SYLLABUS_DATA = [
  { id: "41", sec: "राजस्थान राज्यव्यवस्था / प्रशासन", name: "राजस्थान के राज्यपाल", sub: "Governor of Rajasthan", completed: true },
  { id: "42", sec: "राजस्थान राज्यव्यवस्था / प्रशासन", name: "राजस्थान के मुख्यमंत्री एवं मंत्रिपरिषद", sub: "Chief Minister and Council of Ministers of Rajasthan", completed: true },
  { id: "43", sec: "राजस्थान राज्यव्यवस्था / प्रशासन", name: "राजस्थान राज्य विधानमंडल (विधानसभा)", sub: "State Legislature (Vidhan Sabha) of Rajasthan", completed: true },
  { id: "44", sec: "राजस्थान राज्यव्यवस्था / प्रशासन", name: "राजस्थान उच्च न्यायालय एवं अधीनस्थ न्यायपालिका", sub: "High Court and Subordinate Judiciary of Rajasthan", completed: false },
  { id: "45", sec: "राजस्थान राज्यव्यवस्था / प्रशासन", name: "राज्य सचिवालय, मुख्य सचिव, संभागीय आयुक्त एवं जिला प्रशासन", sub: "State Secretariat, Chief Secretary and District Administration", completed: true },
  { id: "46", sec: "राजस्थान राज्यव्यवस्था / प्रशासन", name: "राजस्थान पंचायती राज व्यवस्था एवं प्रशासन", sub: "Panchayati Raj Administration in Rajasthan", completed: true },
  { id: "48", sec: "राजस्थान राज्यव्यवस्था / प्रशासन", name: "राजस्थान लोक सेवा आयोग (RPSC)", sub: "Rajasthan Public Service Commission", completed: true },
  { id: "1", sec: "सामान्य ज्ञान एवं भूगोल", name: "राजस्थान का सामान्य ज्ञान", sub: "General Knowledge & Geography of Rajasthan", completed: true },
  { id: "2", sec: "सामान्य ज्ञान एवं भूगोल", name: "राजस्थान का भौतिक स्वरूप एवं भूगोल", sub: "Physical Features & Relief of Rajasthan", completed: true },
  { id: "3", sec: "सामान्य ज्ञान एवं भूगोल", name: "राजस्थान की जलवायु", sub: "Climate Zones & Seasons of Rajasthan", completed: true },
  { id: "6", sec: "सामान्य ज्ञान एवं भूगोल", name: "राजस्थान का अपवाह तंत्र, नदियाँ एवं झीलें", sub: "Drainage System, Rivers and Lakes", completed: true },
  { id: "16", sec: "इतिहास", name: "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल", sub: "Ancient Civilizations & Archaeological Sites", completed: true },
  { id: "17", sec: "इतिहास", name: "राजस्थान के प्रमुख राजपूत राजवंश एवं प्रशासनिक व्यवस्था", sub: "Major Rajput Dynasties (8th to 18th Century)", completed: true },
  { id: "26", sec: "कला एवं संस्कृति", name: "राजस्थान के मेले", sub: "Fairs of Rajasthan", completed: true },
  { id: "27", sec: "कला एवं संस्कृति", name: "राजस्थान के त्योहार", sub: "Festivals of Rajasthan", completed: true },
  { id: "30", sec: "कला एवं संस्कृति", name: "राजस्थान की स्थापत्य कला एवं वास्तुकला", sub: "Architecture, Forts and Palaces", completed: true },
];

function DesignPreviewContent() {
  const searchParams = useSearchParams();
  const rawPage = searchParams.get("page");
  const validPages: AppPage[] = ["dashboard", "practice-sets", "quiz", "quiz-results", "saved", "syllabus", "history", "analytics", "admin-overview"];
  const initialPage = (validPages.includes(rawPage as AppPage) ? rawPage : "dashboard") as AppPage;
  const rawDevice = searchParams.get("device");
  const initialDevice: DeviceMode = rawDevice === "mobile" || rawDevice === "tablet" || rawDevice === "desktop" ? rawDevice : "desktop";

  const [deviceMode, setDeviceMode] = useState<DeviceMode>(initialDevice);
  const [currentPage, setCurrentPage] = useState<AppPage>(initialPage);
  const { theme, setTheme } = useTheme();

  // Active quiz runner state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({
    rg_000535: "A",
  });
  const [quizBookmarks, setQuizBookmarks] = useState<Record<string, boolean>>({
    rg_000535: true,
  });
  const [isExamMode, setIsExamMode] = useState(false);

  // Saved questions state
  const [savedTab, setSavedTab] = useState<"wrong" | "bookmarks">("wrong");
  const [savedSubjectFilter, setSavedSubjectFilter] = useState("all");
  const [savedTopicFilter, setSavedTopicFilter] = useState("all");

  // Syllabus tracker state
  const [syllabusList, setSyllabusList] = useState(MOCK_SYLLABUS_DATA);
  const [syllabusScope, setSyllabusScope] = useState<"raj" | "eng" | "all">("raj");
  const [syllabusSection, setSyllabusSection] = useState("all");
  const [syllabusStatusFilter, setSyllabusStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [syllabusSearch, setSyllabusSearch] = useState("");

  const toggleSyllabusTopic = (id: string) => {
    setSyllabusList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = useMemo(() => syllabusList.filter((s) => s.completed).length, [syllabusList]);
  const syllabusPercent = Math.round((completedCount / syllabusList.length) * 100);

  // Synchronize query params if passed dynamically
  useEffect(() => {
    const d = searchParams.get("device");
    if (d === "mobile" || d === "tablet" || d === "desktop") setDeviceMode(d);
    const p = searchParams.get("page");
    if (p && validPages.includes(p as AppPage)) {
      setCurrentPage(p as AppPage);
    }
    const t = searchParams.get("theme");
    if (t === "light" || t === "dark") setTheme(t);
  }, [searchParams, setTheme]);

  const frameWidthClass =
    deviceMode === "mobile"
      ? "w-[390px] border-x border-b border-border shadow-2xl"
      : deviceMode === "tablet"
      ? "w-[768px] border-x border-b border-border shadow-2xl"
      : "w-full max-w-7xl";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none">
      {/* ══════════════════════════════════════════════════════════════════════
          TOP GLOBAL CONTROLS TOOLBAR
          ══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <BrandLogo size="sm" />
          <div className="h-4 w-px bg-border hidden sm:block" />
          <span className="text-xs font-semibold text-foreground hidden md:inline">
            Live Website Lab
          </span>
          <Badge variant="outline" className="text-[10px] font-bold text-sky-400 border-sky-500/30 bg-sky-500/10 rounded-xs px-1.5 py-0.5">
            100% Exact Live Copy
          </Badge>
        </div>

        {/* Device Switcher */}
        <div className="inline-flex items-center p-0.5 rounded-sm bg-secondary/80 border border-border gap-0.5">
          <button
            type="button"
            onClick={() => setDeviceMode("desktop")}
            className={cn(
              "flex items-center gap-1.5 h-7 px-2.5 rounded-xs text-xs font-medium transition-all cursor-pointer",
              deviceMode === "desktop"
                ? "bg-card text-foreground font-semibold shadow-2xs border border-border"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
            title="Desktop Full Screen"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceMode("tablet")}
            className={cn(
              "flex items-center gap-1.5 h-7 px-2.5 rounded-xs text-xs font-medium transition-all cursor-pointer",
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
              "flex items-center gap-1.5 h-7 px-2.5 rounded-xs text-xs font-medium transition-all cursor-pointer",
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

        {/* Page Shortcut Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="inline-flex items-center p-0.5 rounded-sm bg-secondary/80 border border-border gap-0.5">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "practice-sets", label: "Sets" },
              { id: "quiz", label: "Active Quiz" },
              { id: "quiz-results", label: "Results" },
              { id: "saved", label: "Saved" },
              { id: "syllabus", label: "Syllabus" },
              { id: "history", label: "History" },
              { id: "analytics", label: "Analytics" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setCurrentPage(p.id as AppPage)}
                className={cn(
                  "h-7 px-2 rounded-xs text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                  currentPage === p.id
                    ? "bg-card text-foreground font-semibold shadow-2xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="xs"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-7 px-2.5 rounded-xs border-border cursor-pointer"
            title="Toggle Theme"
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
          DEVICE PREVIEW CANVAS
          ══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex justify-center p-0 sm:p-4 bg-muted/20 overflow-y-auto">
        <div className={cn("bg-background transition-all flex flex-col min-h-screen", frameWidthClass)}>
          {/* Bezel info for mobile/tablet */}
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

          <div className="flex-1 flex">
            {/* ── EXACT DESKTOP SIDEBAR (Identical to Live App) ── */}
            {deviceMode === "desktop" && (
              <aside className="w-56 border-r border-border p-3.5 flex flex-col justify-between shrink-0 bg-card/40">
                <div className="space-y-4">
                  {/* Brand Title */}
                  <div className="px-1.5 pt-0.5">
                    <span className="text-base font-bold tracking-tight text-foreground block">
                      Quizzer.
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                      RPSC 2nd Grade GK
                    </span>
                  </div>

                  {/* Navigation — Strictly 5 Student Items */}
                  <div className="space-y-1">
                    <span className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                      Navigation
                    </span>
                    <nav className="space-y-1 pt-1.5">
                      {[
                        { id: "dashboard", label: "Home", icon: LayoutGrid },
                        { id: "history", label: "Tests", icon: HistoryIcon },
                        { id: "saved", label: "Saved", icon: Bookmark },
                        { id: "analytics", label: "Analytics", icon: BarChart3 },
                        { id: "admin-overview", label: "Profile", icon: User },
                      ].map((item) => {
                        const Icon = item.icon;
                        const active = currentPage === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setCurrentPage(item.id as AppPage)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-sm text-sm transition-all cursor-pointer select-none",
                              active
                                ? "bg-primary/10 text-primary border border-primary/20 font-medium shadow-2xs"
                                : "bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground border-0 font-normal"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={cn("h-4.5 w-4.5", active ? "text-primary" : "text-muted-foreground")} />
                              <span>{item.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                {/* User Profile Box (Exact Match to Live App) */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-xs bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20">
                      RI
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-foreground block truncate">Ritik</span>
                      <span className="text-[10px] text-muted-foreground block truncate">Admin User</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-muted-foreground">
                    <button
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="p-1 rounded-xs hover:text-foreground cursor-pointer"
                      title="Theme"
                    >
                      {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                    </button>
                    <button className="p-1 rounded-xs hover:text-foreground cursor-pointer" title="Sign out">
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </aside>
            )}

            {/* Central Main Viewport */}
            <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto pb-20 md:pb-6 space-y-6">
              {/* ════════════════════════════════════════════════════════════
                  VIEW 1: DASHBOARD (EXACT LIVE APP MATCH)
                  ════════════════════════════════════════════════════════════ */}
              {currentPage === "dashboard" && (
                <div className="space-y-6">
                  {/* 4 Stat Cards Strip (Exact to media_1794373861705_206f182a.png) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Card className="p-3.5 rounded-sm border border-border bg-card shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Questions Solved</span>
                        <div className="p-1 rounded-xs bg-cyan-500/10 text-cyan-500">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-bold tracking-tight text-foreground block">8,340</span>
                        <span className="text-[11px] text-muted-foreground">Across verified sets</span>
                      </div>
                    </Card>

                    <Card className="p-3.5 rounded-sm border border-border bg-card shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Accuracy %</span>
                        <div className="p-1 rounded-xs bg-emerald-500/10 text-emerald-500">
                          <Percent className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-bold tracking-tight text-foreground block">79.3%</span>
                        <span className="text-[11px] text-muted-foreground">Overall success rate</span>
                      </div>
                    </Card>

                    <Card className="p-3.5 rounded-sm border border-border bg-card shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Saved Items</span>
                        <div className="p-1 rounded-xs bg-amber-500/10 text-amber-500">
                          <Bookmark className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-bold tracking-tight text-foreground block">329</span>
                        <span className="text-[11px] text-muted-foreground">Bookmarks &amp; wrong Qs</span>
                      </div>
                    </Card>

                    <Card className="p-3.5 rounded-sm border border-border bg-card shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Active Streak</span>
                        <div className="p-1 rounded-xs bg-rose-500/10 text-rose-500">
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

                  {/* CONTINUE PRACTICE · NEXT AVAILABLE TESTS (5) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                        <span>CONTINUE PRACTICE · NEXT AVAILABLE TESTS (5)</span>
                      </div>
                      <button
                        onClick={() => setCurrentPage("practice-sets")}
                        className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 cursor-pointer"
                      >
                        All Topics →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
                      {/* Card 1: भौतिक स्वरूप एवं भूगोल */}
                      <Card className="p-2.5 sm:p-3.5 rounded-sm border border-border bg-card shadow-xs flex flex-col justify-between gap-2 select-none">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-muted-foreground flex items-center gap-1 font-hindi text-[11px] sm:text-xs">
                              📐 भूगोल
                            </span>
                            <span className="font-bold text-primary bg-primary/15 px-1.5 py-0.2 rounded-xs border border-primary/30 text-[10px] font-mono">
                              भाग 16
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-[13.5px] font-medium text-foreground font-hindi line-clamp-2 leading-snug">
                              भौतिक स्वरूप एवं भूगोल
                            </h3>
                            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <span>20 प्रश्न</span>
                              <span>·</span>
                              <span className="text-primary font-medium flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                In Progress
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentPage("quiz")}
                          className="w-full h-7 sm:h-8 rounded-xs font-medium text-xs flex items-center justify-center gap-1.5 bg-primary text-white hover:bg-primary/90 border border-primary/40 transition-all cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white shrink-0" />
                          <span className="text-white font-medium truncate">
                            <span className="sm:hidden">Resume</span>
                            <span className="hidden sm:inline">Resume Attempt</span>
                          </span>
                        </button>
                      </Card>

                      {/* Card 2: राजस्थान की कृषि */}
                      <Card className="p-2.5 sm:p-3.5 rounded-sm border border-border bg-card shadow-xs flex flex-col justify-between gap-2 select-none">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-muted-foreground flex items-center gap-1 font-hindi text-[11px] sm:text-xs">
                              📐 भूगोल
                            </span>
                            <span className="font-bold text-primary bg-primary/15 px-1.5 py-0.2 rounded-xs border border-primary/30 text-[10px] font-mono">
                              Part 1
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-[13.5px] font-medium text-foreground font-hindi line-clamp-2 leading-snug">
                              राजस्थान की कृषि
                            </h3>
                            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <span>20 प्रश्न</span>
                              <span>·</span>
                              <span className="text-primary font-medium flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                In Progress
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentPage("quiz")}
                          className="w-full h-7 sm:h-8 rounded-xs font-medium text-xs flex items-center justify-center gap-1.5 bg-primary text-white hover:bg-primary/90 border border-primary/40 transition-all cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white shrink-0" />
                          <span className="text-white font-medium truncate">
                            <span className="sm:hidden">Resume</span>
                            <span className="hidden sm:inline">Resume Attempt</span>
                          </span>
                        </button>
                      </Card>

                      {/* Card 3: राजस्थान का सामान्य ज्ञान */}
                      <Card className="p-2.5 sm:p-3.5 rounded-sm border border-border bg-card shadow-xs flex flex-col justify-between gap-2 select-none">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-muted-foreground flex items-center gap-1 font-hindi text-[11px] sm:text-xs">
                              📐 भूगोल
                            </span>
                            <span className="font-semibold text-muted-foreground bg-muted px-1.5 py-0.2 rounded-xs text-[10px] font-mono border border-border/70">
                              भाग 1
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-[13.5px] font-medium text-foreground font-hindi line-clamp-2 leading-snug">
                              राजस्थान का सामान्य ज्ञान
                            </h3>
                            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">20 प्रश्न · New Practice</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentPage("quiz")}
                          className="w-full h-7 sm:h-8 rounded-xs font-medium text-xs flex items-center justify-center gap-1.5 bg-secondary/60 text-foreground border border-border/50 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer shadow-2xs"
                        >
                          <Play className="h-3 w-3 fill-current shrink-0" />
                          <span className="truncate">
                            <span className="sm:hidden">Start Test</span>
                            <span className="hidden sm:inline">Start Practice Test</span>
                          </span>
                        </button>
                      </Card>
                    </div>
                  </div>

                  {/* Rajasthan General Knowledge (4 Canonical Subjects) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-foreground">
                          Rajasthan General Knowledge
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Official 55 Master Topics across 4 Canonical Subjects (RPSC Senior Teacher 2nd Grade)
                        </p>
                      </div>
                      <button
                        onClick={() => setCurrentPage("syllabus")}
                        className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        View All →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        {
                          title: "Rajasthan General Knowledge & Geography",
                          hindi: "राजस्थान का सामान्य ज्ञान, भौतिक...",
                          count: "15 TOPICS",
                        },
                        {
                          title: "Rajasthan History",
                          hindi: "राजस्थान का संपूर्ण इतिहास: प्राचीन...",
                          count: "10 TOPICS",
                        },
                        {
                          title: "Rajasthan Art & Culture",
                          hindi: "राजस्थान के मेले, त्योहार, रीति-रिवा...",
                          count: "15 TOPICS",
                        },
                        {
                          title: "Rajasthan Polity & Administration",
                          hindi: "राज्य सचिवालय, राज्यपाल, मुख्यमं...",
                          count: "15 TOPICS",
                        },
                      ].map((item, idx) => (
                        <Card
                          key={idx}
                          onClick={() => setCurrentPage("practice-sets")}
                          className="p-4 rounded-sm border border-border bg-card shadow-xs hover:border-cyan-500/50 transition-all cursor-pointer space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <BookOpen className="h-4 w-4 text-cyan-400" />
                            <span className="text-[10px] font-bold text-muted-foreground tracking-wider">
                              {item.count}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground leading-snug">{item.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.hindi}</p>
                          </div>
                          <div className="text-[11px] font-bold text-cyan-400 flex items-center justify-between pt-1">
                            <span>PRACTICE TESTS</span>
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* General English (Paper-II Dedicated Grid) */}
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-base font-bold text-foreground">General English (Paper-II)</h2>
                      <p className="text-xs text-muted-foreground">
                        Paper-II English Grammar, Core Syntax, Vocabulary &amp; Comprehension
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Card className="p-4 rounded-sm border border-border bg-card shadow-xs space-y-2.5 hover:border-emerald-500/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <FileCheck2 className="h-4 w-4 text-emerald-500" />
                          <Badge className="text-[9px] rounded-xs bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-1.5 font-bold">
                            ACTIVE READY
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">Grammar &amp; Core Rules</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Tenses, voice, narration, prepositions.</p>
                        </div>
                        <button
                          onClick={() => setCurrentPage("practice-sets")}
                          className="text-[11px] font-bold text-primary flex items-center justify-between pt-1 cursor-pointer w-full"
                        >
                          <span>Start Practice</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </Card>

                      <Card className="p-4 rounded-sm border border-border bg-card/60 shadow-xs space-y-2.5 select-none">
                        <div className="flex items-center justify-between">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="text-[9px] rounded-xs border-border text-muted-foreground font-bold">
                            COMING SOON
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground/80">Part 2: Vocabulary &amp; Idioms</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Synonyms, antonyms, phrasal verbs.</p>
                        </div>
                      </Card>

                      <Card className="p-4 rounded-sm border border-border bg-card/60 shadow-xs space-y-2.5 select-none">
                        <div className="flex items-center justify-between">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="text-[9px] rounded-xs border-border text-muted-foreground font-bold">
                            COMING SOON
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground/80">Part 3: Comprehension &amp; Usage</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Reading passages &amp; cloze tests.</p>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════
                  VIEW 2: PRACTICE SETS (EXACT MATCH TO media_1794305435714_35f12b36.jpg)
                  ════════════════════════════════════════════════════════════ */}
              {currentPage === "practice-sets" && (
                <div className="space-y-4">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <button onClick={() => setCurrentPage("dashboard")} className="hover:text-foreground cursor-pointer">
                      Dashboard
                    </button>
                    <ChevronRight className="h-3 w-3" />
                    <span>Subjects</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>राजस्थान सामान्य ज्ञान एवं भूगोल</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-semibold">राजस्थान की जलवायु</span>
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      राजस्थान की जलवायु
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Practice test sets for this topic.
                    </p>
                  </div>

                  {/* Section Title with 3/12 completed badge */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      PRACTICE SETS (12)
                    </span>
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> 3/12 completed
                    </span>
                  </div>

                  {/* 2-Column Exact Sets Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { title: "राजस्थान की जलवायु Part 1", completed: true },
                      { title: "राजस्थान की जलवायु Part 2", completed: true },
                      { title: "राजस्थान की जलवायु Part 3", completed: true },
                      { title: "राजस्थान की जलवायु Part 4", completed: false },
                      { title: "राजस्थान की जलवायु भाग 5", completed: false },
                      { title: "राजस्थान की जलवायु भाग 6", completed: false },
                      { title: "राजस्थान की जलवायु भाग 7", completed: false },
                      { title: "राजस्थान की जलवायु भाग 8", completed: false },
                      { title: "राजस्थान की जलवायु भाग 9", completed: false },
                      { title: "राजस्थान की जलवायु भाग 10", completed: false },
                      { title: "राजस्थान की जलवायु भाग 11", completed: false },
                      { title: "राजस्थान की जलवायु भाग 12", completed: false },
                    ].map((set, i) => (
                      <Card
                        key={i}
                        className="p-3 rounded-sm border border-border bg-card shadow-xs flex items-center justify-between gap-3 hover:border-cyan-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {set.completed ? (
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-foreground truncate">
                            {set.title}
                          </span>
                        </div>

                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setCurrentPage("quiz")}
                          className="h-7 px-3 rounded-xs text-xs font-semibold hover:bg-muted text-foreground flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Play className="h-2.5 w-2.5 fill-current" />
                          <span>{set.completed ? "Retake" : "Start"}</span>
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════
                  VIEW 3: ACTIVE QUIZ RUNNER (INTERACTIVE TEST SESSION)
                  ════════════════════════════════════════════════════════════ */}
              {currentPage === "quiz" && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between p-3 rounded-sm border border-border bg-card shadow-xs">
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
                      <div className="flex items-center gap-1 px-2 py-1 rounded-xs bg-secondary text-xs font-mono font-semibold text-foreground border border-border">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        <span>18:42</span>
                      </div>

                      <button
                        onClick={() => setIsExamMode(!isExamMode)}
                        className={cn(
                          "px-2 py-1 rounded-xs text-[11px] font-semibold border transition-all cursor-pointer",
                          isExamMode
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                        )}
                      >
                        {isExamMode ? "Exam Mode" : "Practice Mode"}
                      </button>

                      <Button
                        size="xs"
                        onClick={() => setCurrentPage("quiz-results")}
                        className="h-7 px-3 rounded-xs bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Submit Test
                      </Button>
                    </div>
                  </div>

                  {(() => {
                    const q = MOCK_QUESTIONS[currentQIndex];
                    const selected = userAnswers[q.id];
                    const isBookmarked = quizBookmarks[q.id];

                    return (
                      <Card className="p-4 sm:p-5 rounded-sm border border-border bg-card shadow-xs space-y-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-mono text-xs text-muted-foreground">
                            #{q.qNum} · {q.id} · Single Choice (+2.0 / -0.66)
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuizBookmarks((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-xs text-xs font-medium cursor-pointer border",
                              isBookmarked
                                ? "bg-amber-500/15 text-amber-500 border-amber-500/30 font-semibold"
                                : "text-muted-foreground border-transparent hover:bg-muted"
                            )}
                          >
                            <Bookmark className="h-3.5 w-3.5" />
                            <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
                          </button>
                        </div>

                        <p className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
                          {q.question}
                        </p>

                        {/* Options Strip with Exact Checkmark Alignments */}
                        <div className="space-y-2 pt-1">
                          {Object.entries(q.options).map(([key, text]) => {
                            const isOptionSelected = selected === key;
                            const isCorrect = key === q.correctAnswer;
                            const showFeedback = !isExamMode && selected !== undefined;

                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setUserAnswers((prev) => ({ ...prev, [q.id]: key }))}
                                className={cn(
                                  "w-full text-left p-3 rounded-xs text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 border cursor-pointer",
                                  showFeedback && isCorrect
                                    ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-600 dark:text-emerald-400 font-semibold"
                                    : showFeedback && isOptionSelected && !isCorrect
                                    ? "bg-rose-500/10 border-rose-500/60 text-rose-500 font-semibold"
                                    : isOptionSelected
                                    ? "bg-cyan-500/10 border-cyan-500 text-foreground font-semibold"
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

                        {/* Detailed Explanation */}
                        {!isExamMode && selected && (
                          <div className="p-3.5 rounded-xs bg-muted/60 border border-border space-y-1.5 animate-in fade-in duration-200">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                              DETAILED EXPLANATION
                            </span>
                            <p className="text-xs text-foreground leading-relaxed">{q.explanation}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={currentQIndex === 0}
                            onClick={() => setCurrentQIndex((prev) => prev - 1)}
                            className="h-8 px-3 rounded-xs text-xs font-semibold cursor-pointer"
                          >
                            Previous
                          </Button>

                          {currentQIndex < MOCK_QUESTIONS.length - 1 ? (
                            <Button
                              size="xs"
                              onClick={() => setCurrentQIndex((prev) => prev + 1)}
                              className="h-8 px-4 rounded-xs text-xs font-semibold cursor-pointer"
                            >
                              Next Question →
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              onClick={() => setCurrentPage("quiz-results")}
                              className="h-8 px-4 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                            >
                              Finish &amp; View Results
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Palette Strip */}
                  <div className="p-3 rounded-sm border border-border bg-card shadow-xs space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      QUESTION PALETTE
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
                                ? "border-cyan-400 ring-2 ring-cyan-400/30 bg-cyan-400/10 text-foreground"
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

              {/* ════════════════════════════════════════════════════════════
                  VIEW 4: QUIZ RESULTS PAGE
                  ════════════════════════════════════════════════════════════ */}
              {currentPage === "quiz-results" && (
                <div className="space-y-4 max-w-4xl mx-auto">
                  <Card className="p-5 rounded-sm border border-border bg-card shadow-xs text-center space-y-3">
                    <span className="text-xs font-bold text-emerald-500 block">✓ Test Completed</span>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      राजस्थान की जलवायु (Part 4) Results
                    </h1>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto pt-1">
                      <div className="p-2.5 rounded-xs bg-secondary/80 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Final Score</span>
                        <span className="text-xl font-bold text-foreground">37.33 / 40</span>
                      </div>
                      <div className="p-2.5 rounded-xs bg-secondary/80 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Accuracy</span>
                        <span className="text-xl font-bold text-emerald-500">95.0%</span>
                      </div>
                      <div className="p-2.5 rounded-xs bg-secondary/80 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Correct</span>
                        <span className="text-xl font-bold text-emerald-500">19 / 20</span>
                      </div>
                      <div className="p-2.5 rounded-xs bg-secondary/80 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Time Taken</span>
                        <span className="text-xl font-bold text-foreground">11m 45s</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button
                        size="xs"
                        onClick={() => setCurrentPage("quiz")}
                        className="h-8 px-4 rounded-xs text-xs font-semibold cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake Test
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setCurrentPage("practice-sets")}
                        className="h-8 px-4 rounded-xs text-xs font-semibold cursor-pointer"
                      >
                        Back to Sets
                      </Button>
                    </div>
                  </Card>

                  {/* Question Review */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      QUESTION-BY-QUESTION REVIEW
                    </span>
                    {MOCK_QUESTIONS.map((q, idx) => (
                      <Card key={q.id} className="p-3.5 rounded-sm border border-border bg-card shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                          <span>Question #{idx + 1} ({q.id})</span>
                          <span className="text-emerald-500">✓ Correct (+2.00)</span>
                        </div>
                        <p className="text-sm font-bold text-foreground">{q.question}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
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

              {/* ════════════════════════════════════════════════════════════
                  VIEW 5: SAVED & REVIEW (EXACT MATCH TO media_1794373844309_e7daeaa6.png)
                  ════════════════════════════════════════════════════════════ */}
              {currentPage === "saved" && (
                <div className="space-y-4">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <button onClick={() => setCurrentPage("dashboard")} className="hover:text-foreground cursor-pointer">
                      Dashboard
                    </button>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-semibold">Saved Questions</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Saved &amp; Review Questions
                      </h1>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Review questions you missed during practice tests or bookmarked for revision.
                      </p>
                    </div>

                    {/* Exact Segmented Control */}
                    <div className="inline-flex items-center p-0.5 rounded-sm bg-secondary/80 border border-border self-start sm:self-auto gap-0.5">
                      <button
                        type="button"
                        onClick={() => setSavedTab("wrong")}
                        className={cn(
                          "inline-flex items-center gap-2 h-8 px-3.5 rounded-sm text-xs transition-all cursor-pointer border select-none",
                          savedTab === "wrong"
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/30 shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/50 font-normal"
                        )}
                      >
                        <AlertCircle className={cn("h-3.5 w-3.5", savedTab === "wrong" ? "text-rose-500" : "text-rose-500/70")} />
                        <span>Wrong Questions</span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.2 rounded-xs tabular-nums border",
                            savedTab === "wrong"
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                              : "bg-muted text-muted-foreground border-border/60"
                          )}
                        >
                          1698
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSavedTab("bookmarks")}
                        className={cn(
                          "inline-flex items-center gap-2 h-8 px-3.5 rounded-sm text-xs transition-all cursor-pointer border select-none",
                          savedTab === "bookmarks"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/50 font-normal"
                        )}
                      >
                        <Bookmark className={cn("h-3.5 w-3.5", savedTab === "bookmarks" ? "text-amber-500" : "text-amber-500/70")} />
                        <span>Bookmarks</span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.2 rounded-xs tabular-nums border",
                            savedTab === "bookmarks"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "bg-muted text-muted-foreground border-border/60"
                          )}
                        >
                          329
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Bar with Result Counter */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                    <div className="inline-flex items-center gap-1 bg-secondary/60 p-0.5 rounded-sm border border-border">
                      <select
                        value={savedSubjectFilter}
                        onChange={(e) => setSavedSubjectFilter(e.target.value)}
                        className="h-8 text-xs rounded-xs border border-border bg-card px-3 text-foreground font-medium cursor-pointer"
                      >
                        <option value="all">All Subjects</option>
                        <option value="geo">राजस्थान का सामान्य ज्ञान एवं भूगोल</option>
                        <option value="hist">राजस्थान का इतिहास</option>
                        <option value="cul">राजस्थान कला एवं संस्कृति</option>
                        <option value="pol">राजस्थान राजव्यवस्था एवं प्रशासन</option>
                      </select>

                      <select
                        value={savedTopicFilter}
                        onChange={(e) => setSavedTopicFilter(e.target.value)}
                        className="h-8 text-xs rounded-xs border border-border bg-card px-3 text-foreground font-medium cursor-pointer"
                      >
                        <option value="all">All Topics</option>
                        <option value="climate">राजस्थान की जलवायु</option>
                        <option value="geo">भौतिक स्वरूप एवं भूगोल</option>
                      </select>
                    </div>

                    <span className="text-xs text-muted-foreground">Showing 1–10 of 329</span>
                  </div>

                  {/* Exact Question Card matching media_1794373844309_e7daeaa6.png */}
                  <Card className="p-4 rounded-sm border border-border bg-card shadow-xs space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-xs bg-secondary flex items-center justify-center font-bold text-foreground text-xs">
                          1
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground font-medium">
                          <BookOpen className="h-3.5 w-3.5" /> Practice Question
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer">
                          <Flag className="h-3.5 w-3.5" /> Flag
                        </button>
                        <Badge className="text-xs rounded-xs bg-cyan-700/40 text-cyan-200 border border-cyan-500/50 px-2.5 py-0.5 font-bold flex items-center gap-1">
                          <Bookmark className="h-3.5 w-3.5 fill-current" /> Saved
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
                      भारत सरकार द्वारा स्थापित 'राष्ट्रीय वर्षा सिंचित क्षेत्र प्राधिकरण' (NRAA) का मुख्यालय कहाँ स्थित है?
                    </p>

                    {/* Exact 4 Options with Option A highlighted in green with right check */}
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      <div className="p-2.5 rounded-xs bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="h-5 w-5 rounded-xs bg-emerald-500 text-black font-bold flex items-center justify-center text-xs">
                            A
                          </span>
                          <span>नई दिल्ली</span>
                        </div>
                        <Check className="h-4 w-4 text-emerald-400" />
                      </div>

                      <div className="p-2.5 rounded-xs bg-secondary/30 border border-border text-muted-foreground flex items-center gap-2.5">
                        <span className="h-5 w-5 rounded-xs bg-secondary text-muted-foreground font-bold flex items-center justify-center text-xs">
                          B
                        </span>
                        <span>पुणे</span>
                      </div>

                      <div className="p-2.5 rounded-xs bg-secondary/30 border border-border text-muted-foreground flex items-center gap-2.5">
                        <span className="h-5 w-5 rounded-xs bg-secondary text-muted-foreground font-bold flex items-center justify-center text-xs">
                          C
                        </span>
                        <span>जोधपुर</span>
                      </div>

                      <div className="p-2.5 rounded-xs bg-secondary/30 border border-border text-muted-foreground flex items-center gap-2.5">
                        <span className="h-5 w-5 rounded-xs bg-secondary text-muted-foreground font-bold flex items-center justify-center text-xs">
                          D
                        </span>
                        <span>हैदराबाद</span>
                      </div>
                    </div>

                    {/* Detailed Explanation */}
                    <div className="pt-2 border-t border-border/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        DETAILED EXPLANATION
                      </span>
                      <p className="text-xs text-foreground leading-relaxed">
                        राष्ट्रीय वर्षा सिंचित क्षेत्र प्राधिकरण (National Rainfed Area Authority - NRAA) की स्थापना 3 नवंबर 2006 को कृषि मंत्रालय के अंतर्गत की गई थी। इसका केंद्रीय मुख्यालय नई दिल्ली में स्थित है।
                      </p>
                    </div>

                    {/* Footer with ADMIN RG_000535 & Mark as Duplicate */}
                    <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground border-t border-border/60">
                      <span className="text-amber-500 font-mono font-bold flex items-center gap-1">
                        ● ADMIN <span className="text-muted-foreground">RG_000535</span>
                      </span>
                      <button className="hover:text-foreground cursor-pointer flex items-center gap-1">
                        Mark as Duplicate
                      </button>
                    </div>
                  </Card>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════
                  VIEW 6: SYLLABUS TRACKER (EXACT MATCH TO media_1794373900125_4b953c6e.jpg)
                  ════════════════════════════════════════════════════════════ */}
              {currentPage === "syllabus" && (
                <div className="space-y-4">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <button onClick={() => setCurrentPage("dashboard")} className="hover:text-foreground cursor-pointer">
                      Dashboard
                    </button>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-semibold">Syllabus Tracker</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <span>◎ Syllabus Tracker</span>
                      </h1>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Authoritative Master Topics tracking for RPSC Senior Teacher (2nd Grade).
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setSyllabusList((prev) => prev.map((s) => ({ ...s, completed: false })))}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Progress
                    </Button>
                  </div>

                  {/* Scope Pills */}
                  <div className="inline-flex items-center p-0.5 rounded-sm bg-secondary/80 border border-border gap-0.5">
                    <button
                      onClick={() => setSyllabusScope("raj")}
                      className={cn(
                        "px-3 py-1.5 rounded-xs text-xs font-medium cursor-pointer flex items-center gap-1.5",
                        syllabusScope === "raj" ? "bg-card text-foreground font-bold shadow-2xs border border-border" : "text-muted-foreground"
                      )}
                    >
                      <span>राजस्थान GK (Paper-I)</span>
                      <span className="text-[10px] bg-cyan-500/15 text-cyan-400 px-1.5 rounded-xs font-bold">55</span>
                    </button>

                    <button
                      onClick={() => setSyllabusScope("eng")}
                      className={cn(
                        "px-3 py-1.5 rounded-xs text-xs font-medium cursor-pointer flex items-center gap-1.5",
                        syllabusScope === "eng" ? "bg-card text-foreground font-bold shadow-2xs border border-border" : "text-muted-foreground"
                      )}
                    >
                      <span>English (Paper-II)</span>
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 rounded-xs font-bold">33</span>
                    </button>

                    <button
                      onClick={() => setSyllabusScope("all")}
                      className={cn(
                        "px-3 py-1.5 rounded-xs text-xs font-medium cursor-pointer flex items-center gap-1.5",
                        syllabusScope === "all" ? "bg-card text-foreground font-bold shadow-2xs border border-border" : "text-muted-foreground"
                      )}
                    >
                      <span>All Topics</span>
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 rounded-xs font-bold">88</span>
                    </button>
                  </div>

                  {/* Section Tabs matching the user's screen */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                    {[
                      { id: "all", label: "All 55 Topics", count: 55 },
                      { id: "geo", label: "सामान्य ज्ञान एवं भूगोल", count: 15 },
                      { id: "hist", label: "इतिहास", count: 10 },
                      { id: "art", label: "कला एवं संस्कृति", count: 15 },
                      { id: "pol", label: "राज्यव्यवस्था एवं प्रशासन", count: 15 },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => setSyllabusSection(sec.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-xs text-xs font-medium cursor-pointer flex items-center gap-1.5 whitespace-nowrap border",
                          syllabusSection === sec.id
                            ? "bg-zinc-800 text-zinc-100 border-zinc-700 font-bold shadow-2xs"
                            : "bg-card text-muted-foreground border-border hover:text-foreground"
                        )}
                      >
                        <span>{sec.label}</span>
                        <span className="text-[10px] bg-muted px-1.5 rounded-xs font-bold">{sec.count}</span>
                      </button>
                    ))}
                  </div>

                  {/* Search Bar + All/Completed/Pending Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card p-2 rounded-sm border border-border">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={syllabusSearch}
                        onChange={(e) => setSyllabusSearch(e.target.value)}
                        placeholder="Search topic by name, #ID, or keyword..."
                        className="pl-8 h-8 text-xs rounded-xs bg-background border-border"
                      />
                    </div>

                    <div className="inline-flex items-center p-0.5 rounded-xs bg-secondary/80 border border-border gap-0.5">
                      {(["all", "completed", "pending"] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setSyllabusStatusFilter(st)}
                          className={cn(
                            "px-2.5 py-1 rounded-xs text-xs font-semibold capitalize cursor-pointer",
                            syllabusStatusFilter === st
                              ? "bg-card text-foreground shadow-2xs border border-border"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Progress Card (Matching Exact Banner in User Screenshot) */}
                  <Card className="p-4 rounded-sm border border-border bg-card shadow-xs space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">RAJASTHAN GK TOTAL</span>
                        <span className="text-xl font-bold text-foreground">55 Topics</span>
                        <span className="text-[10px] text-muted-foreground block">Rajasthan GK Preparation Progress</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">COMPLETED</span>
                        <span className="text-xl font-bold text-emerald-500">42</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">REMAINING</span>
                        <span className="text-xl font-bold text-amber-500">13</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">PREPARED</span>
                        <span className="text-xl font-bold text-cyan-400">76%</span>
                        <span className="text-[10px] text-muted-foreground block text-right font-bold pt-1">
                          42 / 55 (76%)
                        </span>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-secondary rounded-xs overflow-hidden">
                      <div className="h-full bg-cyan-400 transition-all" style={{ width: "76%" }} />
                    </div>
                  </Card>

                  {/* Topic Rows (Exact to User Screenshot) */}
                  <div className="space-y-2">
                    {syllabusList.map((t) => (
                      <Card
                        key={t.id}
                        onClick={() => toggleSyllabusTopic(t.id)}
                        className="p-3 rounded-sm border border-border bg-card shadow-xs flex items-center justify-between gap-3 hover:border-cyan-500/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            className="text-emerald-500 shrink-0 mt-0.5 cursor-pointer"
                          >
                            {t.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground font-mono">#{t.id}</span>
                              <span className="text-[10px] text-muted-foreground">· {t.sec}</span>
                              {t.completed && (
                                <Badge className="text-[9px] rounded-xs bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 px-1 py-0 font-bold">
                                  COMPLETED
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-foreground mt-0.5">{t.name}</h3>
                            <p className="text-xs text-muted-foreground">{t.sub}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentPage("practice-sets");
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground font-semibold shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          Practice →
                        </button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════
                  VIEW 7: TEST HISTORY (EXACT MATCH TO media_1794373917779_d96e66aa.png)
                  ════════════════════════════════════════════════════════════ */}
              {currentPage === "history" && (
                <div className="space-y-4">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <button onClick={() => setCurrentPage("dashboard")} className="hover:text-foreground cursor-pointer">
                      Dashboard
                    </button>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-semibold">Test History</span>
                  </div>

                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      Test History
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Complete record of all test attempts, ordered newest to oldest.
                    </p>
                  </div>

                  {/* Filter Row without debug button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                    <div className="inline-flex items-center gap-1 bg-secondary/60 p-0.5 rounded-sm border border-border">
                      <select className="h-8 text-xs rounded-xs border border-border bg-card px-3 text-foreground font-medium cursor-pointer">
                        <option>All Subjects</option>
                      </select>
                      <select className="h-8 text-xs rounded-xs border border-border bg-card px-3 text-foreground font-medium cursor-pointer">
                        <option>All Topics</option>
                      </select>
                      <span className="text-xs text-muted-foreground px-2">438 attempts</span>
                    </div>
                  </div>

                  {/* Attempts List matching media_1794373917779_d96e66aa.png */}
                  <div className="space-y-2">
                    {[
                      { title: "राजस्थान की जलवायु भाग 12", date: "11 Nov 2026", qs: "20 प्रश्न", right: "19 सही", pct: "95%", score: "37.33 / 40", color: "emerald" },
                      { title: "राजस्थान की जलवायु भाग 11", date: "11 Nov 2026", qs: "20 प्रश्न", right: "17 सही", pct: "85%", score: "32 / 40", color: "cyan" },
                      { title: "राजस्थान की जलवायु भाग 10", date: "11 Nov 2026", qs: "20 प्रश्न", right: "17 सही", pct: "85%", score: "32 / 40", color: "cyan" },
                      { title: "राजस्थान की जलवायु भाग 10", date: "11 Nov 2026", qs: "20 प्रश्न", right: "12 सही", pct: "60%", score: "18.67 / 40", color: "cyan" },
                      { title: "राजस्थान की जलवायु भाग 9", date: "11 Nov 2026", qs: "20 प्रश्न", right: "19 सही", pct: "95%", score: "37.33 / 40", color: "emerald" },
                      { title: "राजस्थान की जलवायु भाग 8", date: "10 Nov 2026", qs: "20 प्रश्न", right: "19 सही", pct: "95%", score: "37.33 / 40", color: "emerald" },
                      { title: "राजस्थान की जलवायु भाग 7", date: "10 Nov 2026", qs: "20 प्रश्न", right: "18 सही", pct: "90%", score: "35.33 / 40", color: "emerald" },
                    ].map((row, i) => (
                      <Card
                        key={i}
                        onClick={() => setCurrentPage("quiz-results")}
                        className="p-3 rounded-sm border border-border bg-card shadow-xs flex items-center justify-between gap-3 hover:border-cyan-500/40 transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-bold text-foreground block">{row.title}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {row.date} · {row.qs} · {row.right}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "text-xs font-bold font-mono",
                              row.color === "emerald" ? "text-emerald-500" : "text-cyan-400"
                            )}
                          >
                            {row.pct}
                          </span>
                          <span className="text-xs font-mono font-bold text-foreground">{row.score}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════
                  VIEW 8: ANALYTICS & STATS
                  ════════════════════════════════════════════════════════════ */}
              {currentPage === "analytics" && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      Analytics &amp; Performance
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Subject-level mastery breakdown and accuracy trends.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card className="p-4 rounded-sm border border-border bg-card shadow-xs space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Subject Accuracy Breakdown
                      </span>
                      <div className="space-y-3">
                        {[
                          { name: "राजस्थान का भूगोल", pct: 84 },
                          { name: "राजस्थान का इतिहास", pct: 76 },
                          { name: "राजस्थान कला एवं संस्कृति", pct: 88 },
                          { name: "राजस्थान राजव्यवस्था", pct: 71 },
                        ].map((s) => (
                          <div key={s.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-foreground">{s.name}</span>
                              <span className="font-mono text-muted-foreground">{s.pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary rounded-xs overflow-hidden">
                              <div className="h-full bg-cyan-400" style={{ width: `${s.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-4 rounded-sm border border-border bg-card shadow-xs space-y-3 text-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block text-left">
                        Exam Readiness
                      </span>
                      <div className="py-4 space-y-2">
                        <div className="h-20 w-20 rounded-full border-4 border-cyan-400/20 border-t-cyan-400 flex items-center justify-center mx-auto">
                          <span className="text-xl font-bold text-foreground">82%</span>
                        </div>
                        <span className="text-xs font-bold text-foreground block">RPSC 2nd Grade Prepared</span>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                          42 of 55 master topics prepared with 79.3% accuracy across verified sets.
                        </p>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════
                  VIEW 9: ADMIN CONSOLE OVERVIEW
                  ════════════════════════════════════════════════════════════ */}
              {currentPage === "admin-overview" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-amber-500" />
                        <span>Admin Console</span>
                      </h1>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Authoritative pool management and set validation.
                      </p>
                    </div>
                    <Badge className="text-xs rounded-xs bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2 py-0.5 font-bold">
                      Admin Access Verified
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card
                      onClick={() => setCurrentPage("quiz")}
                      className="p-4 rounded-sm border border-border bg-card shadow-xs space-y-2 hover:border-amber-500/50 transition-colors cursor-pointer"
                    >
                      <FileText className="h-4 w-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-foreground">Question Editor</h3>
                      <p className="text-xs text-muted-foreground">Edit individual questions, answers &amp; explanations.</p>
                    </Card>

                    <Card
                      onClick={() => setCurrentPage("syllabus")}
                      className="p-4 rounded-sm border border-border bg-card shadow-xs space-y-2 hover:border-amber-500/50 transition-colors cursor-pointer"
                    >
                      <Layers className="h-4 w-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-foreground">55 Topics Pool</h3>
                      <p className="text-xs text-muted-foreground">Inspect pool size across all 55 canonical topics.</p>
                    </Card>

                    <Card
                      onClick={() => setCurrentPage("practice-sets")}
                      className="p-4 rounded-sm border border-border bg-card shadow-xs space-y-2 hover:border-amber-500/50 transition-colors cursor-pointer"
                    >
                      <FolderOpen className="h-4 w-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-foreground">Import Sets</h3>
                      <p className="text-xs text-muted-foreground">Import, audit and publish 20-question test sets.</p>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── MOBILE BOTTOM NAVIGATION (Strict 5 Items) ── */}
          {deviceMode !== "desktop" && (
            <nav className="sticky bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-bottom shadow-lg">
              <div className="grid grid-cols-5 items-center px-1.5 py-1.5 gap-1">
                {[
                  { id: "dashboard", label: "Home", icon: LayoutGrid },
                  { id: "history", label: "Tests", icon: HistoryIcon },
                  { id: "saved", label: "Saved", icon: Bookmark },
                  { id: "analytics", label: "Analytics", icon: BarChart3 },
                  { id: "admin-overview", label: "Profile", icon: User },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentPage(item.id as AppPage)}
                      className="w-full flex items-center justify-center cursor-pointer border-0"
                    >
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 w-full py-1.5 px-1 rounded-md transition-all select-none",
                          active
                            ? "bg-primary/10 text-primary border border-primary/20 font-medium shadow-2xs"
                            : "bg-transparent text-muted-foreground hover:text-foreground border-0 font-normal"
                        )}
                      >
                        <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-[10.5px] leading-tight truncate max-w-full font-medium", active ? "text-primary" : "text-muted-foreground")}>
                          {item.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DesignPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted-foreground">Loading preview...</div>}>
      <DesignPreviewContent />
    </Suspense>
  );
}
