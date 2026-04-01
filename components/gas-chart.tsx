"use client"

import { useMemo } from "react"
import {
  LineChart,
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

interface SensorRow {
  created_at: string
  gas_ppm: number | null
}

const chartConfig = {
  gas: { label: "Gas PPM", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export function GasChart({ data }: { data: SensorRow[] }) {
  const rows = useMemo(
    () =>
      data.map((d) => ({
        time: new Date(d.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        gas: d.gas_ppm ?? 0,
      })),
    [data]
  )

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Gas PPM History</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart
            data={rows}
            margin={{ top: 4, right: 40, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10 }} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine
              y={300}
              stroke="hsl(48 96% 53%)"
              strokeDasharray="4 2"
              label={{ value: "Moderate", position: "right", fontSize: 9 }}
            />
            <ReferenceLine
              y={500}
              stroke="hsl(25 95% 53%)"
              strokeDasharray="4 2"
              label={{ value: "High", position: "right", fontSize: 9 }}
            />
            <ReferenceLine
              y={700}
              stroke="hsl(var(--destructive))"
              strokeDasharray="4 2"
              label={{ value: "Danger", position: "right", fontSize: 9 }}
            />
            <Line
              type="monotone"
              dataKey="gas"
              stroke="var(--color-gas)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
