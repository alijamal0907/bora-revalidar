"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { signOutSupabase } from "@/lib/auth-supabase"
import { PlanBadge } from "./plan-badge"
import { getUserPlan } from "@/lib/storage-supabase"
import type { UserPlan } from "@/lib/plan-utils"

interface NavbarProps {
  user?: {
    id: string
    email: string
    usuario_id?: string
  } | null
}

export function Navbar({ user }: NavbarProps) {
  const [userPlan, setUserPlan] = useState<UserPlan>("free")

  const handleLogout = async () => {
    console.log("[v0] Logout button clicked, signing out user:", user?.email)
    try {
      await signOutSupabase()
      console.log("[v0] Signout successful, redirecting to login")
    } catch (error) {
      console.error("[v0] Error in handleLogout:", error)
    } finally {
      window.location.href = "/login"
    }
  }

  useEffect(() => {
    const loadPlan = async () => {
      if (user?.email) {
        const plan = await getUserPlan(user.email)
        setUserPlan(plan)
      }
    }
    loadPlan()
  }, [user])

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <Image
                src="/images/imagem-20do-20whatsapp-20de-202025-11-12-20-c3-a0-28s-29-2016.jpg"
                alt="Bora Revalidar"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-orange-400 bg-clip-text text-transparent">
              Bora Revalidar
            </span>
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              <PlanBadge plan={userPlan} />

              <span className="text-sm text-muted-foreground">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
