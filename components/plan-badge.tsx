"use client"

import { Crown, Sparkles } from "lucide-react"
import type { UserPlan } from "@/lib/plan-utils"

interface PlanBadgeProps {
  plan: UserPlan
  className?: string
}

export function PlanBadge({ plan, className = "" }: PlanBadgeProps) {
  if (plan === "premium") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-full ${className}`}
      >
        <Crown className="w-4 h-4" />
        <span>Premium</span>
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 bg-muted text-muted-foreground text-sm font-medium rounded-full ${className}`}
    >
      <Sparkles className="w-4 h-4" />
      <span>Free</span>
    </div>
  )
}
