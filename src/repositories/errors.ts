export type RepoErrorCode =
  'unavailable' | 'unauthenticated' | 'conflict' | 'not_found' | 'validation' | 'network' | 'unknown'

export type RepoError = {
  code: RepoErrorCode
  message: string
}

export type RepoResult<T> = { ok: true; data: T } | { ok: false; error: RepoError }

export function repoOk<T>(data: T): RepoResult<T> {
  return { ok: true, data }
}

export function repoFail(code: RepoErrorCode, message: string): RepoResult<never> {
  return { ok: false, error: { code, message } }
}

export function unavailableResult(message = 'Backend is not configured. Continuing in local mode.'): RepoResult<never> {
  return repoFail('unavailable', message)
}

export function normalizeAuthError(message: string): RepoError {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return { code: 'validation', message: 'Email or password is incorrect.' }
  }
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return { code: 'conflict', message: 'An account with this email already exists.' }
  }
  if (lower.includes('duplicate') && lower.includes('handle')) {
    return { code: 'conflict', message: 'That handle is already taken.' }
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return { code: 'network', message: 'Network unavailable. Try again when you are online.' }
  }
  return { code: 'unknown', message: 'Something went wrong. Please try again.' }
}

export function mapPostgrestError(message: string, fallback = 'Something went wrong.'): RepoError {
  const lower = message.toLowerCase()
  if (lower.includes('duplicate key') && lower.includes('handle')) {
    return { code: 'conflict', message: 'That handle is already taken.' }
  }
  if (lower.includes('duplicate key')) {
    return { code: 'conflict', message: 'That record already exists.' }
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('abort')) {
    return {
      code: 'network',
      message: 'Could not confirm the request. Check your connection and refresh before trying again.',
    }
  }
  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return {
      code: 'unauthenticated',
      message: 'Your account cannot change this record. Sign in again or refresh your collections.',
    }
  }
  if (lower.includes('items_collection_owner_fkey')) {
    return { code: 'validation', message: 'Choose a collection belonging to your account.' }
  }
  if (lower.includes('jwt') || lower.includes('not authenticated')) {
    return { code: 'unauthenticated', message: 'Sign in to continue.' }
  }
  return { code: 'unknown', message: fallback }
}
