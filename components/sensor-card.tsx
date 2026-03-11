import { Card, CardContent } from "@/components/ui/card"
import { Gauge, Wind, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

interface SensorCardProps {
  title: string
  value: string
  subtitle: string
  type: "fill" | "gas" | "led"
  fillPercent?: number
  gasLevel?: number
  ledStatus?: string
}

export function SensorCard({
  title,
  value,
  subtitle,
  type,
  fillPercent = 0,
  gasLevel = 0,
  ledStatus = "off",
}: SensorCardProps) {
  const getIcon = () => {
    switch (type) {
      case "fill":
        return <Gauge className="h-5 w-5" />
      case "gas":
        return <Wind className="h-5 w-5" />
      case "led":
        return <Lightbulb className="h-5 w-5" />
    }
  }

  const getFillColor = () => {
    if (fillPercent < 50) return "bg-primary"
    if (fillPercent < 75) return "bg-accent"
    return "bg-destructive"
  }

  const getGasColor = () => {
    if (gasLevel < 200) return "text-primary"
    if (gasLevel < 400) return "text-accent-foreground"
    return "text-destructive"
  }

  const getLedColor = () => {
    const status = ledStatus.toLowerCase()
    if (status === "green" || status === "on") return "bg-primary"
    if (status === "yellow") return "bg-accent"
    if (status === "red") return "bg-destructive"
    return "bg-muted"
  }

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className={cn(
                "mt-1 text-3xl font-semibold tracking-tight",
                type === "gas" && getGasColor()
              )}
            >
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              type === "led" ? getLedColor() : "bg-secondary",
              type === "led" && ledStatus.toLowerCase() !== "off"
                ? "text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            {getIcon()}
          </div>
        </div>

        {type === "fill" && (
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  getFillColor()
                )}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Empty</span>
              <span>Full</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
