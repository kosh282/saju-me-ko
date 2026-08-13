const GA_MEASUREMENT_ID = 'G-24NL4KLJXE'

export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return
  }

  window.gtag('event', eventName, {
    send_to: GA_MEASUREMENT_ID,
    ...params,
  })
}
