import { SEEKASE_SOLANA_NETWORK, SEEKASE_SOLANA_NETWORK_LABEL } from './solana-network'

export const DAILY_CHECKIN_MEMO_PREFIX = 'seekase:check-in:v1:'
export const DAILY_CHECKIN_NETWORK = SEEKASE_SOLANA_NETWORK

export type DailyCheckInStatus = {
  checkedInToday: boolean
  currentStreak: number
  longestStreak: number
  totalCheckIns: number
  lastCheckInDay: string | null
}

export function dailyCheckInMemo(requestId: string) {
  return `${DAILY_CHECKIN_MEMO_PREFIX}${requestId}`
}

export function dailyCheckInErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const normalized = raw.toLowerCase()
  if (normalized.includes('cancellationexception') || normalized.includes('cancelled')) {
    return `The wallet cancelled this ${SEEKASE_SOLANA_NETWORK_LABEL} transaction. Make sure the wallet network is set to ${SEEKASE_SOLANA_NETWORK_LABEL}, then try again.`
  }
  if (normalized.includes('network') || normalized.includes('cluster')) {
    return `Wallet network mismatch. Switch the wallet to ${SEEKASE_SOLANA_NETWORK_LABEL}, then try again.`
  }
  if (normalized.includes('insufficient') || normalized.includes('balance')) {
    return `This wallet needs a small amount of ${SEEKASE_SOLANA_NETWORK_LABEL} SOL to pay the network fee.`
  }
  if (normalized.includes('invalid or expired')) {
    return 'This check-in request expired before wallet approval. Tap check in again to create a fresh request.'
  }
  return raw || 'Daily check-in could not be completed. Please try again.'
}

export function deriveDailyCheckInStatus(days: string[], today: string): DailyCheckInStatus {
  const ordered = [...new Set(days)].sort().reverse()
  if (!ordered.length) {
    return { checkedInToday: false, currentStreak: 0, longestStreak: 0, totalCheckIns: 0, lastCheckInDay: null }
  }

  const toDayNumber = (value: string) => Math.floor(Date.parse(`${value}T00:00:00.000Z`) / 86_400_000)
  const dayNumbers = ordered.map(toDayNumber).filter(Number.isFinite)
  let longestStreak = 1
  let run = 1
  for (let index = 1; index < dayNumbers.length; index += 1) {
    if (dayNumbers[index - 1] - dayNumbers[index] === 1) {
      run += 1
      longestStreak = Math.max(longestStreak, run)
    } else {
      run = 1
    }
  }

  const todayNumber = toDayNumber(today)
  const lastNumber = dayNumbers[0]
  let currentStreak = 0
  if (lastNumber === todayNumber || lastNumber === todayNumber - 1) {
    currentStreak = 1
    for (let index = 1; index < dayNumbers.length; index += 1) {
      if (dayNumbers[index - 1] - dayNumbers[index] !== 1) break
      currentStreak += 1
    }
  }

  return {
    checkedInToday: ordered[0] === today,
    currentStreak,
    longestStreak,
    totalCheckIns: ordered.length,
    lastCheckInDay: ordered[0],
  }
}
