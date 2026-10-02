import { describe, expect, it } from 'vitest'
import { dailyCheckInErrorMessage, dailyCheckInMemo, deriveDailyCheckInStatus } from '../src/data/daily-checkin'
import { functionErrorMessage } from '../src/repositories/daily-checkin-repository'

describe('daily check-in', () => {
  it('creates a versioned request memo without account identity', () => {
    expect(dailyCheckInMemo('123e4567-e89b-42d3-a456-426614174000')).toBe(
      'seekase:check-in:v1:123e4567-e89b-42d3-a456-426614174000',
    )
  })

  it('derives current and longest UTC-day streaks', () => {
    expect(
      deriveDailyCheckInStatus(['2026-09-23', '2026-09-22', '2026-09-21', '2026-09-18', '2026-09-17'], '2026-09-23'),
    ).toEqual({
      checkedInToday: true,
      currentStreak: 3,
      longestStreak: 3,
      totalCheckIns: 5,
      lastCheckInDay: '2026-09-23',
    })
  })

  it('keeps yesterday streak active and resets an older streak', () => {
    expect(deriveDailyCheckInStatus(['2026-09-22', '2026-09-21'], '2026-09-23').currentStreak).toBe(2)
    expect(deriveDailyCheckInStatus(['2026-09-20', '2026-09-19'], '2026-09-23').currentStreak).toBe(0)
  })

  it('turns the Android wallet cancellation into a useful Devnet instruction', () => {
    expect(dailyCheckInErrorMessage(new Error('java.util.concurrent.CancellationException'))).toBe(
      'The wallet cancelled this Devnet transaction. Make sure the wallet network is set to Devnet, then try again.',
    )
  })

  it('shows the Edge Function response instead of the generic SDK error', async () => {
    const error = {
      message: 'Edge Function returned a non-2xx status code',
      context: new Response(JSON.stringify({ error: 'This check-in request is invalid or expired.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
    await expect(functionErrorMessage(error, 'Fallback')).resolves.toBe('This check-in request is invalid or expired.')
  })

  it('reads React Native response-like contexts without relying on browser Response identity', async () => {
    const error = {
      message: 'Edge Function returned a non-2xx status code',
      context: {
        clone: () => ({
          json: async () => ({ error: 'This wallet is not linked to the signed-in Seekase account.' }),
        }),
      },
    }
    await expect(functionErrorMessage(error, 'Fallback')).resolves.toBe(
      'This wallet is not linked to the signed-in Seekase account.',
    )
  })

  it('explains how to retry an expired check-in request', () => {
    expect(dailyCheckInErrorMessage(new Error('This check-in request is invalid or expired.'))).toContain(
      'Tap check in again',
    )
  })
})
