export const tg = window.Telegram?.WebApp || {}

export function initTg() {
  if (tg.ready) tg.ready()
  if (tg.expand) tg.expand()
}

export function getTgUser() {
  return tg.initDataUnsafe?.user || null
}

export function haptic(style = 'medium') {
  tg.HapticFeedback?.impactOccurred(style)
}
