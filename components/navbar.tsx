"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Menu, X, Settings, Shield } from "lucide-react"
import { signOutSupabase } from "@/lib/auth-supabase"
import { PlanBadge } from "./plan-badge"
import { getUserPlan } from "@/lib/storage-supabase"
import type { UserPlan } from "@/lib/plan-utils"

const ADMIN_EMAIL = "ali_jamal2002@hotmail.com"

interface NavbarProps {
  user?: {
    id: string
    email: string
    usuario_id?: string
  } | null
}

export function Navbar({ user }: NavbarProps) {
  const [userPlan, setUserPlan] = useState<UserPlan>("free")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAdmin = user?.email === ADMIN_EMAIL

  const handleLogout = async () => {
    try {
      await signOutSupabase()
    } catch (error) {
      console.error("Error in handleLogout:", error)
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
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9">
              <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-01-18%20at%2013.42.00-h5YH5w6TEQRvNKBn0ZdfMByfc3Wdz8.jpeg" alt="Bora Revalidar" fill className="object-contain" priority />
            </div>
            <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-teal-400 to-orange-400 bg-clip-text text-transparent">
              BORA Revalidar
            </span>
          </Link>

          {user && (
            <>
              {/* Desktop menu */}
              <div className="hidden md:flex items-center gap-3">
                <PlanBadge plan={userPlan} />
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</span>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="p-2 rounded-md hover:bg-muted transition-colors"
                    aria-label="Admin"
                    title="Painel Administrativo"
                  >
                    <Shield className="w-4 h-4" />
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="p-2 rounded-md hover:bg-muted transition-colors"
                  aria-label="Configurações"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
                >
                  Sair
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t border-border py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              <PlanBadge plan={userPlan} />
            </div>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Painel Admin
              </Link>
            )}
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </Link>
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 text-sm font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
