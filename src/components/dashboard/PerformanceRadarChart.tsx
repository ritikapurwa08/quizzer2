"use client"

import * as React from "react"
import { TrendingUp, Award } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A radar chart showing performance breakdown"

const defaultChartData = [
  { subject: "राजस्थान का इतिहास", score: 85 },
  { subject: "भूगोल", score: 72 },
  { subject: "कला एवं संस्कृति", score: 90 },
  { subject: "राजव्यवस्था", score: 68 },
  { subject: "अर्थव्यवस्था", score: 78 },
  { subject: "दैनिक समसामयिकी", score: 82 },
]

const chartConfig = {
  score: {
    label: "सटीकता / Score (%)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartRadarDefault() {
  return (
    <Card className="rounded-xl border border-border shadow-xs">
      <CardHeader className="items-center pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 font-hindi">
          <Award className="h-4 w-4 text-primary" />
          विषयवार प्रदर्शन (Performance Radar)
        </CardTitle>
        <CardDescription className="text-xs font-hindi text-muted-foreground text-center">
          प्रमुख विषयों में आपकी सटीकता एवं पकड़ का विश्लेषण
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] w-full"
        >
          <RadarChart data={defaultChartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={({ x, y, textAnchor, payload }) => (
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  className="fill-muted-foreground text-[10px] sm:text-[11px] font-hindi"
                >
                  {payload.value}
                </text>
              )}
            />
            <PolarGrid className="stroke-border/60" />
            <Radar
              name="सटीकता"
              dataKey="score"
              fill="var(--chart-1)"
              fillOpacity={0.45}
              stroke="var(--chart-1)"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1.5 text-xs text-center pt-2">
        <div className="flex items-center justify-center gap-1.5 font-medium font-hindi text-foreground">
          सटीकता दर में सुधार जारी <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        </div>
        <div className="text-[11px] text-muted-foreground font-hindi">
          नियमित अभ्यास से अपनी कमजोरियों को पहचानें और सुधारें
        </div>
      </CardFooter>
    </Card>
  )
}

interface PerformanceRadarProps {
  data?: { subject: string; score: number }[]
  averageScore?: number
}

export function PerformanceRadarChart({ data, averageScore }: PerformanceRadarProps) {
  const chartData = React.useMemo(() => {
    if (data && data.length >= 3) {
      return data
    }
    return defaultChartData
  }, [data])

  const avg = averageScore ?? Math.round(
    chartData.reduce((acc, curr) => acc + curr.score, 0) / chartData.length
  )

  return (
    <Card className="rounded-xl border border-border shadow-xs">
      <CardHeader className="items-center pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 font-hindi">
          <Award className="h-4 w-4 text-primary" />
          विषयवार प्रदर्शन (Skill Radar)
        </CardTitle>
        <CardDescription className="text-xs font-hindi text-muted-foreground text-center">
          विषयों की पकड़ एवं सटीकता का बहुकोणीय विश्लेषण
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] w-full"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={({ x, y, textAnchor, payload }) => (
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  className="fill-muted-foreground text-[10px] sm:text-[11px] font-hindi"
                >
                  {payload.value}
                </text>
              )}
            />
            <PolarGrid className="stroke-border/60" />
            <Radar
              name="सटीकता"
              dataKey="score"
              fill="var(--chart-1)"
              fillOpacity={0.4}
              stroke="var(--chart-1)"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1 text-xs text-center pt-2">
        <div className="flex items-center justify-center gap-1.5 font-medium font-hindi text-foreground">
          औसत विषय सटीकता: <span className="font-mono font-bold text-primary">{avg}%</span>
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        </div>
        <div className="text-[11px] text-muted-foreground font-hindi">
          सभी मुख्य विषयों के प्रश्नों के आधार पर विश्लेषित
        </div>
      </CardFooter>
    </Card>
  )
}
