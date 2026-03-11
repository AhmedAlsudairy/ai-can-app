"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { SensorCard } from "@/components/sensor-card"
import { StatusHeader } from "@/components/status-header"
import { Trash2 } from "lucide-react"

interface SensorData {
  id: number
  created_at: string
  distance_cm: number | null
  gas_ppm: number | null
  led_status: string | null
}

export default function SmartCanDashboard() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchLatestData = async () => {
    console.log("[v0] Fetching sensor data...")
    const { data, error } = await supabase
      .from("sensor_data")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    console.log("[v0] Supabase response - data:", data, "error:", error)
    
    if (error) {
      console.log("[v0] Error fetching data:", error.message)
    }
    
    if (!error && data) {
      setSensorData(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLatestData()

    const channel = supabase
      .channel("sensor_data_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_data" },
        (payload) => {
          setSensorData(payload.new as SensorData)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getFillLevel = (distance: number | null) => {
    if (distance === null) return 0
    const maxDistance = 100
    const fillPercent = Math.max(0, Math.min(100, 100 - (distance / maxDistance) * 100))
    return Math.round(fillPercent)
  }

 
const getGasStatus = (ppm: number | null) => {
  if (ppm === null) return { label: "Unknown", color: "text-muted-foreground" }
  if (ppm <= 300) return { label: "Normal", color: "text-green-500" }
  if (ppm <= 500) return { label: "Moderate", color: "text-yellow-500" }
  if (ppm <= 700) return { label: "High", color: "text-orange-500" }
  return { label: "Danger", color: "text-red-500" }
}
  const fillLevel = getFillLevel(sensorData?.distance_cm ?? null)
  const gasStatus = getGasStatus(sensorData?.gas_ppm ?? null)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
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

        <StatusHeader
          loading={loading}
          lastUpdated={sensorData?.created_at ?? null}
        />

        <div className="mt-6 grid gap-4">
          <SensorCard
            title="Fill Level"
            value={loading ? "--" : `${fillLevel}%`}
            subtitle={
              loading
                ? "Loading..."
                : sensorData?.distance_cm
                  ? `${sensorData.distance_cm.toFixed(1)} cm from sensor`
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
                  : sensorData?.gas_ppm
                    ? `${sensorData.gas_ppm.toFixed(0)} PPM`
                    : "No data"
              }
              type="gas"
              gasLevel={sensorData?.gas_ppm ?? 0}
            />

         <SensorCard
  title="LED Status"
  value={loading ? "--" : (sensorData?.led_status ?? "Off").replace("_", " ").toUpperCase()}
  subtitle="Indicator light"
  type="led"
  ledStatus={sensorData?.led_status ?? "off"}
/>

          
          </div>
        </div>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Data updates automatically via real-time connection
        </footer>
      </div>
    </main>
  )
}
