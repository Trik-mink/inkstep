import { getAuthToken } from 'deepspace'
export async function tutorAction<T>(name: 'tutor-grade' | 'tutor-read', params: unknown, signal?: AbortSignal): Promise<T> {
  const token = await getAuthToken()
  if (!token) throw new Error('Please sign in again to keep your progress private.')
  const response = await fetch(`/api/actions/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(params), signal })
  const result = await response.json() as { success?: boolean; data?: T; error?: string }
  if (!response.ok || !result.success) throw new Error(result.error ?? 'The check did not finish. Your writing is still here.')
  return result.data as T
}
