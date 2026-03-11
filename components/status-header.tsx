import { Badge } from "@/components/ui/badge"
import { Circle } from "lucide-react"

interface StatusHeaderProps {
  loading: boolean
  lastUpdated: string | null
}

export function StatusHeader({ loading, lastUpdated }: StatusHeaderProps) {
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "Never"
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm border border-border/50">
      <div className="flex items-center gap-2">
        <Circle
          className={`h-2 w-2 fill-current ${
            loading ? "text-muted-foreground animate-pulse" : "text-primary"
          }`}
        />
        <span className="text-sm font-medium text-foreground">
          {loading ? "Connecting..." : "Connected"}
        </span>
      </div>
      <Badge variant="secondary" className="font-normal">
        Last update: {formatTime(lastUpdated)}
      </Badge>
    </div>
  )
}
