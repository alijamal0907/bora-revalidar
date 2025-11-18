import { useEffect, useRef } from 'react'
import { checkDeviceSession } from '@/lib/storage-supabase'
import { getStoredDeviceId, generateDeviceId, storeDeviceId } from '@/lib/device-utils'
import { useRouter } from 'next/navigation'

export function useDeviceSession(userId: string | undefined) {
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!userId) return

    let deviceId = getStoredDeviceId()
    if (!deviceId) {
      console.log('[v0] No device ID found, generating new one')
      deviceId = generateDeviceId()
      storeDeviceId(deviceId)
    }

    // Verificar sessão a cada 30 segundos
    const checkSession = async () => {
      const isActive = await checkDeviceSession(userId, deviceId!)
      
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
