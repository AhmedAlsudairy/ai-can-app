"use client"

import { useMemo } from "react"
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const MAX_DISTANCE = 30
const MIN_DISTANCE = 3

function getFillPercent(distance: number | null): number {
  if (distance === null || distance < 0) return 0
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (1 - (distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)) * 100
      )
    )
  )
}

function linReg(pts: { x: number; y: number }[]) {
  const n = pts.length
  if (n < 3) return null
  const sx = pts.reduce((s, p) => s + p.x, 0)
  const sy = pts.reduce((s, p) => s + p.y, 0)
  const sxy = pts.reduce((s, p) => s + p.x * p.y, 0)
  const sx2 = pts.reduce((s, p) => s + p.x * p.x, 0)
  const d = n * sx2 - sx * sx
  if (Math.abs(d) < 1e-10) return null
  const slope = (n * sxy - sx * sy) / d
  const intercept = (sy - slope * sx) / n
  return { slope, intercept }
}

interface SensorRow {
  created_at: string
  distance_cm: number | null
}

const chartConfig = {
  fill: { label: "Fill %", color: "hsl(var(--primary))" },
  trend: { label: "AI Trend", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function FillChart({ data }: { data: SensorRow[] }) {
  const rows = useMemo(() => {
    if (data.length === 0) return []
    const t0 = new Date(data[0].created_at).getTime()
    const pts = data.map((d) => ({
      time: new Date(d.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      x: (new Date(d.created_at).getTime() - t0) / 60000,
      fill: getFillPercent(d.distance_cm),
    }))
    const reg = linReg(pts.map((p) => ({ x: p.x, y: p.fill })))
    return pts.map((p) => ({
      time: p.time,
      fill: p.fill,
      trend: reg
        ? Math.max(
            0,
            Math.min(100, Math.round(reg.slope * p.x + reg.intercept))
          )
        : null,
    }))
  }, [data])

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Fill Level — with AI Trend Line
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ComposedChart
            data={rows}
            margin={{ top: 4, right: 24, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10 }}
              width={40}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine
              y={90}
              stroke="hsl(var(--destructive))"
              strokeDasharray="4 2"
              label={{ value: "⚠ Full", position: "right", fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="fill"
              stroke="var(--color-fill)"
              fill="var(--color-fill)"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="trend"
              stroke="var(--color-trend)"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
