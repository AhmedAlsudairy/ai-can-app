"use client"

import { useMemo } from "react"
import {
  ComposedChart,
  Area,
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
        {rows.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No gas data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ComposedChart
              data={rows}
              margin={{ top: 4, right: 40, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-gas)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-gas)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="gas"
                stroke="var(--color-gas)"
                fill="url(#gasGradient)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-gas)", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
