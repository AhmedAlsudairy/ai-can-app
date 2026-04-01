"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { SensorCard } from "@/components/sensor-card"
import { StatusHeader } from "@/components/status-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2 } from "lucide-react"

// Match ESP32 constants
const MAX_DISTANCE = 30 // cm — empty can
const MIN_DISTANCE = 3  // cm — full can

interface SensorData {
  id: number
  created_at: string
  distance_cm: number | null
  gas_ppm: number | null
  led_status: string | null
}

function getFillPercent(distance: number | null): number {
  if (distance === null || distance < 0) return 0
  const percent =
    (1 - (distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)) * 100
  return Math.max(0, Math.min(100, Math.round(percent)))
}

function getGasStatus(ppm: number | null) {
  if (ppm === null) return { label: "Unknown", color: "text-muted-foreground" }
  if (ppm <= 300) return { label: "Normal", color: "text-green-500" }
  if (ppm <= 500) return { label: "Moderate", color: "text-yellow-500" }
  if (ppm <= 700) return { label: "High", color: "text-orange-500" }
  return { label: "Danger", color: "text-red-500" }
}

function ledBadgeVariant(
  status: string | null
): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "secondary"
  if (status === "gas_danger" || status === "can_full") return "destructive"
  if (status === "gas_high" || status === "can_high") return "outline"
  if (status === "normal") return "default"
  return "secondary"
}

export default function SmartCanDashboard() {
  const [latest, setLatest] = useState<SensorData | null>(null)
  const [records, setRecords] = useState<SensorData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("sensor_data")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (!error && data && data.length > 0) {
      setLatest(data[0])
      setRecords(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel("sensor_data_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_data" },
        (payload) => {
          const newRow = payload.new as SensorData
          setLatest(newRow)
          setRecords((prev) => [newRow, ...prev.slice(0, 19)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fillLevel = getFillPercent(latest?.distance_cm ?? null)
  const gasStatus = getGasStatus(latest?.gas_ppm ?? null)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Trash2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Smart Can
            </h1>
            <p className="text-sm text-muted-foreground">Real-time monitoring</p>
          </div>
        </header>

        <StatusHeader loading={loading} lastUpdated={latest?.created_at ?? null} />

        <div className="mt-6 grid gap-4">
          <SensorCard
            title="Fill Level"
            value={loading ? "--" : `${fillLevel}%`}
            subtitle={
              loading
                ? "Loading..."
                : latest?.distance_cm != null
                  ? `${latest.distance_cm.toFixed(1)} cm from sensor`
                  : "No data"
            }
            type="fill"
            fillPercent={fillLevel}
          />

          <div className="grid grid-cols-2 gap-4">
            <SensorCard
              title="Air Quality"
              value={loading ? "--" : gasStatus.label}
              subtitle={
                loading
                  ? "Loading..."
                  : latest?.gas_ppm != null
                    ? `${latest.gas_ppm.toFixed(0)} PPM`
                    : "No data"
              }
              type="gas"
              gasLevel={latest?.gas_ppm ?? 0}
            />

            <SensorCard
              title="LED Status"
              value={
                loading
                  ? "--"
                  : (latest?.led_status ?? "Off")
                      .replace(/_/g, " ")
                      .toUpperCase()
              }
              subtitle="Indicator light"
              type="led"
              ledStatus={latest?.led_status ?? "off"}
            />
          </div>
        </div>

        {/* Records Table */}
        <Card className="mt-8 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Recent Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">ID</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Distance (cm)</TableHead>
                  <TableHead>Fill %</TableHead>
                  <TableHead>Gas (PPM)</TableHead>
                  <TableHead className="pr-5">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No records yet
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="pl-5 text-muted-foreground">
                        #{row.id}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(row.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {row.distance_cm != null
                          ? row.distance_cm.toFixed(1)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {row.distance_cm != null
                          ? `${getFillPercent(row.distance_cm)}%`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {row.gas_ppm != null
                          ? row.gas_ppm.toFixed(0)
                          : "—"}
                      </TableCell>
                      <TableCell className="pr-5">
                        <Badge variant={ledBadgeVariant(row.led_status)}>
                          {row.led_status?.replace(/_/g, " ") ?? "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          Data updates automatically via real-time connection
        </footer>
      </div>
    </main>
  )
}
