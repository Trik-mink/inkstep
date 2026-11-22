import { useRef, useState, type FormEvent } from 'react'
import { useAuthProfileReady, useMutations, useQuery } from 'deepspace'
import { SCOPE_ID } from '../../../constants'
import { PRACTICE_COLLECTION, type PracticeSession } from '../../../schemas/practice-sessions-schema'

export default function PracticeLabPage() {
  const { user } = useAuthProfileReady({ requireUser: true })
  const { records, status, error: queryError } = useQuery<PracticeSession>(PRACTICE_COLLECTION, {
    orderBy: 'createdAt', orderDir: 'desc', limit: 20,
  })
  const { createConfirmed, ready } = useMutations<PracticeSession>(PRACTICE_COLLECTION)
  const [response, setResponse] = useState('x = 12')
  const [pending, setPending] = useState(false)
  const [savedId, setSavedId] = useState('')
  const [writeError, setWriteError] = useState('')
  const saving = useRef(false)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving.current || !ready || !user || !response.trim()) return
    saving.current = true
    setPending(true)
    setSavedId('')
    setWriteError('')
    try {
      // This resolves after the server's persistence acknowledgement.
      const recordId = await createConfirmed({ problem: 'x + 7 = 19', response: response.trim() })
      setSavedId(recordId)
    } catch (failure) {
      setWriteError(failure instanceof Error ? failure.message : 'The write was not confirmed. Keep your answer and check the connection.')
    } finally {
      saving.current = false
      setPending(false)
    }
  }

  return <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold">DeepSpace practice lab</h1>
      <p>Save a typed example, wait for server confirmation, then reload to read the same record.</p>
      <p className="text-sm text-muted-foreground">This learning page saves examples only. It does not read handwriting or grade math.</p>
    </header>
    <section aria-labelledby="connection-title" className="rounded-lg border border-border bg-card p-5">
      <h2 id="connection-title" className="font-semibold">1. Identify the boundary</h2>
      <dl className="mt-3 space-y-2 break-all text-sm">
        <div><dt className="font-semibold">Signed-in user</dt><dd data-testid="practice-user-id">{user?.id ?? 'Loading profile'}</dd></div>
        <div><dt className="font-semibold">Scope / room</dt><dd data-testid="practice-scope">{SCOPE_ID}</dd></div>
        <div><dt className="font-semibold">Collection</dt><dd>{PRACTICE_COLLECTION}</dd></div>
        <div><dt className="font-semibold">Read connection</dt><dd role="status" data-testid="practice-query-status">{status}</dd></div>
      </dl>
      <p className="mt-3 text-sm">This is an app-scoped room. Each record is private to its creator through a server-side “own” rule; this exercise does not use teams.</p>
    </section>
    <section aria-labelledby="save-title" className="rounded-lg border border-border bg-card p-5">
      <h2 id="save-title" className="font-semibold">2. Write one practice record</h2>
      <p className="my-3 text-xl">x + 7 = 19</p>
      <form onSubmit={event => void save(event)} className="space-y-3">
        <label htmlFor="practice-response" className="block text-sm font-medium">Example answer</label>
        <input id="practice-response" value={response} onChange={event => setResponse(event.target.value)} disabled={pending} required maxLength={200} className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2" />
        <button type="submit" disabled={!ready || !user || pending || !response.trim()} className="min-h-11 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{pending ? 'Waiting for server confirmation…' : 'Save practice record'}</button>
      </form>
      {pending && <p role="status" className="mt-3 text-sm">Keep this page open. No success is claimed until the server acknowledges the write.</p>}
      {savedId && <p role="status" className="mt-3 break-all text-sm" data-testid="practice-save-result">Server confirmed record: {savedId}. Note this ID, then reload.</p>}
      {writeError && <p role="alert" className="mt-3 break-words text-sm">{writeError}</p>}
    </section>
    <section aria-labelledby="records-title" className="rounded-lg border border-border bg-card p-5">
      <h2 id="records-title" className="font-semibold">3. Read records returned by DeepSpace</h2>
      <p className="mt-2 text-sm">The query has no owner filter in React. The server decides which rows may reach this account. Showing the same ID after reload is the first persistence check.</p>
      {status === 'loading' && <p role="status" className="mt-3">Loading records…</p>}
      {status === 'error' && <p role="alert" className="mt-3">{queryError ?? 'Could not read records.'}</p>}
      {status === 'ready' && !records.length && <p className="mt-3">No practice records visible to this account yet.</p>}
      <ul className="mt-4 space-y-3" data-testid="practice-records">
        {records.map(record => <li key={record.recordId} data-record-id={record.recordId} className="space-y-1 rounded-md border border-border p-3">
          <p>{record.data.problem} → {record.data.response}</p>
          <p className="break-all text-xs">Record ID: {record.recordId}</p>
          <p className="break-all text-xs">Created by: {record.createdBy}</p>
          <p className="text-xs">Created at: {record.createdAt}</p>
        </li>)}
      </ul>
    </section>
  </div>
}
