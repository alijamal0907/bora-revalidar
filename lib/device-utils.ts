export function generateDeviceId(): string {
  // Gerar ID único baseado no navegador
  const nav = typeof window !== 'undefined' ? window.navigator : null
  
  if (!nav) return 'server-device'
  
  const deviceInfo = [
    nav.userAgent,
    nav.language,
    nav.platform,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ].join('|')
  
  // Hash simples
  let hash = 0
  for (let i = 0; i < deviceInfo.length; i++) {
    const char = deviceInfo.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return `device-${Math.abs(hash).toString(36)}`
}

export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'server',
      platform: 'server',
      deviceId: 'server-device',
    }
  }
  
  return {
    userAgent: window.navigator.userAgent,
    platform: window.navigator.platform,
    deviceId: generateDeviceId(),
  }
}

export function storeDeviceId(deviceId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bora_device_id', deviceId)
  }
}

export function getStoredDeviceId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('bora_device_id')
  }
  return null
}
