"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react"

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
  gas_ppm: number | null
}

export function AiInsights({ data }: { data: SensorRow[] }) {
  const insights = useMemo(() => {
    if (data.length < 3) return null

    const t0 = new Date(data[0].created_at).getTime()

    // Fill trend via linear regression (x = minutes from first reading)
    const fillPts = data
      .filter((d) => d.distance_cm !== null)
      .map((d) => ({
        x: (new Date(d.created_at).getTime() - t0) / 60000,
        y: getFillPercent(d.distance_cm),
        ts: new Date(d.created_at).getTime(),
      }))

    const reg = linReg(fillPts.map((p) => ({ x: p.x, y: p.y })))
    const ratePerHour = reg ? reg.slope * 60 : 0 // %/hour

    const lastFillPt = fillPts[fillPts.length - 1]
    let predictedFullAt: Date | null = null
    if (reg && reg.slope > 0.01 && lastFillPt) {
      const minutesToFull = (100 - lastFillPt.y) / reg.slope
      // Only show if within 7 days
      if (minutesToFull > 0 && minutesToFull < 60 * 24 * 7) {
        predictedFullAt = new Date(lastFillPt.ts + minutesToFull * 60000)
      }
    }

    // Gas anomaly: z-score of latest reading vs history
    const gasPts = data.map((d) => d.gas_ppm ?? 0)
    const avgGas = gasPts.reduce((s, v) => s + v, 0) / gasPts.length
    const stdGas = Math.sqrt(
      gasPts.reduce((s, v) => s + (v - avgGas) ** 2, 0) / gasPts.length
    )
    const latestGas = gasPts[gasPts.length - 1]
    const zScore = stdGas > 1 ? (latestGas - avgGas) / stdGas : 0
    const gasAnomaly = Math.abs(zScore) > 2

    // R² goodness-of-fit for trend confidence
    let r2 = 0
    if (reg && fillPts.length > 2) {
      const meanY = fillPts.reduce((s, p) => s + p.y, 0) / fillPts.length
      const ssTot = fillPts.reduce((s, p) => s + (p.y - meanY) ** 2, 0)
      const ssRes = fillPts.reduce((s, p) => {
        const pred = reg.slope * p.x + reg.intercept
        return s + (p.y - pred) ** 2
      }, 0)
      r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0
    }

    return {
      ratePerHour,
      predictedFullAt,
      gasAnomaly,
      zScore,
      latestGas,
      avgGas,
      latestFill: lastFillPt?.y ?? 0,
      confidence: Math.max(0, Math.min(100, Math.round(r2 * 100))),
    }
  }, [data])

  if (!insights) return null

  const {
    ratePerHour,
    predictedFullAt,
    gasAnomaly,
    zScore,
    latestGas,
    avgGas,
    latestFill,
    confidence,
  } = insights

  const trendIcon =
    ratePerHour > 1 ? (
      <TrendingUp className="h-4 w-4 text-destructive" />
    ) : ratePerHour < -1 ? (
      <TrendingDown className="h-4 w-4 text-green-500" />
    ) : (
      <Minus className="h-4 w-4 text-muted-foreground" />
    )

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Brain className="h-4 w-4 text-primary" />
          AI Insights
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            R² confidence: {confidence}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {/* Fill trend */}
        <div className="flex flex-col gap-1 rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Fill Rate</p>
          <div className="flex items-center gap-1.5">
            {trendIcon}
            <span className="text-sm font-semibold">
              {ratePerHour > 0 ? "+" : ""}
              {ratePerHour.toFixed(1)}% / hr
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Currently at {latestFill}%
          </p>
        </div>

        {/* Predicted full */}
        <div className="flex flex-col gap-1 rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Predicted Full</p>
          {predictedFullAt ? (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-semibold">
                  {predictedFullAt.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {predictedFullAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {ratePerHour <= 0 ? "Stable / emptying" : "Beyond 7 days"}
            </p>
          )}
        </div>

        {/* Gas anomaly */}
        <div className="flex flex-col gap-1 rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Gas Anomaly</p>
          <div className="flex items-center gap-1.5">
            {gasAnomaly ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            <span className="text-sm font-semibold">
              {gasAnomaly ? "Anomaly Detected" : "Normal"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            z={zScore.toFixed(1)} · now {latestGas.toFixed(0)} / avg{" "}
            {avgGas.toFixed(0)} PPM
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
