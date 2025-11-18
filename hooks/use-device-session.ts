import { useEffect, useRef } from 'react'
import { checkDeviceSession } from '@/lib/storage-supabase'
import { getStoredDeviceId } from '@/lib/device-utils'
import { useRouter } from 'next/navigation'

export function useDeviceSession(userId: string | undefined) {
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!userId) return

    const deviceId = getStoredDeviceId()
    if (!deviceId) {
      console.error('[v0] No device ID found')
      return
    }

    // Verificar sessão a cada 30 segundos
    const checkSession = async () => {
      const isActive = await checkDeviceSession(userId, deviceId)
      
      if (!isActive) {
        console.log('[v0] Session terminated on this device')
        alert('Sua sessão foi encerrada porque você fez login em outro dispositivo.')
        router.push('/login')
      }
    }

    // Verificação inicial
    checkSession()

    // Verificações periódicas
    intervalRef.current = setInterval(checkSession, 30000) // 30 segundos

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [userId, router])
}
