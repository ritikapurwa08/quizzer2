"use client"

import * as React from "react"
import { Award, BarChart2 } from "lucide-react"
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

const chartConfig = {
  score: {
    label: "सटीकता / Score (%)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface PerformanceRadarProps {
  data?: { subject: string; score: number }[]
  averageScore?: number
}

export function PerformanceRadarChart({ data, averageScore }: PerformanceRadarProps) {
  const hasEnoughData = data && data.length >= 3

  const avg = averageScore ?? (
    hasEnoughData
      ? Math.round(data.reduce((acc, curr) => acc + curr.score, 0) / data.length)
      : 0
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

      {!hasEnoughData ? (
        /* Empty state — shown when user has attempted fewer than 3 subjects */
        <CardContent className="pb-4 flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground font-hindi">
              अभी पर्याप्त डेटा नहीं है
            </p>
            <p className="text-xs text-muted-foreground font-hindi leading-relaxed">
              कम से कम 3 विषयों में अभ्यास करें<br />तब यहाँ प्रदर्शन रेडार दिखेगा।
            </p>
          </div>
        </CardContent>
      ) : (
        <>
          <CardContent className="pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px] w-full"
            >
              <RadarChart data={data}>
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
            </div>
            <div className="text-[11px] text-muted-foreground font-hindi">
              सभी मुख्य विषयों के प्रश्नों के आधार पर विश्लेषित
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  )
}

