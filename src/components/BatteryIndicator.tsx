import { useState, useEffect } from 'react'

interface BatteryManager extends EventTarget {
  charging: boolean
  level: number
  addEventListener(type: 'levelchange' | 'chargingchange', listener: () => void): void
  removeEventListener(type: 'levelchange' | 'chargingchange', listener: () => void): void
}

const LOW_BATTERY_THRESHOLD = 0.2

export default function BatteryIndicator() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!('getBattery' in navigator)) return

    let battery: BatteryManager | null = null

    function update() {
      if (!battery) return
      setShow(!battery.charging && battery.level <= LOW_BATTERY_THRESHOLD)
    }

    ;(navigator as any).getBattery().then((b: BatteryManager) => {
      battery = b
      update()
      battery.addEventListener('levelchange', update)
      battery.addEventListener('chargingchange', update)
    })

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', update)
        battery.removeEventListener('chargingchange', update)
      }
    }
  }, [])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      left: '1rem',
      zIndex: 9999,
      fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
      fontSize: '0.65rem',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: '#c44',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(8px)',
      padding: '0.4rem 0.75rem',
      borderRadius: '4px',
      border: '1px solid rgba(204, 68, 68, 0.2)',
      pointerEvents: 'none',
    }}>
      Low battery — may get low FPS
    </div>
  )
}
