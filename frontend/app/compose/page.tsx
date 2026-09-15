'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { apiFetch } from '../../lib/api'

interface Sender {
  id: string
  email: string
}

interface ScheduleResponse {
  message: string
  count: number
  emails: unknown[]
}

export default function ComposePage () {
  const router = useRouter()

  // -----------------------------
  // Sender state
  // -----------------------------
  const [senderId, setSenderId] = useState('')

  const [senders, setSenders] = useState<Sender[]>([])

  const [senderLoading, setSenderLoading] = useState(true)

  // -----------------------------
  // Email form state
  // -----------------------------
  const [recipients, setRecipients] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  // -----------------------------
  // Scheduling state
  // -----------------------------
  const [startTime, setStartTime] = useState('')
  const [delayMs, setDelayMs] = useState('2000')
  const [hourlyLimit, setHourlyLimit] = useState('100')

  // -----------------------------
  // CSV state
  // -----------------------------
  const [csvFile, setCsvFile] = useState<File | null>(null)

  // -----------------------------
  // UI state
  // -----------------------------
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // ============================================================
  // LOAD SENDERS
  // ============================================================

  useEffect(() => {
    async function loadSenders () {
      try {
        setSenderLoading(true)

        const data = await apiFetch('/api/emails/senders')

        const senderList: Sender[] = data.senders || []

        setSenders(senderList)

        // Automatically select the first sender
        if (senderList.length > 0) {
          setSenderId(senderList[0].id)
        }
      } catch (error) {
        console.error('Failed to load senders:', error)

        setError(
          error instanceof Error ? error.message : 'Failed to load senders.'
        )
      } finally {
        setSenderLoading(false)
      }
    }

    loadSenders()
  }, [])

  // ============================================================
  // CSV UPLOAD
  // ============================================================

  function handleCsvUpload (event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setCsvFile(file)
    setError('')
    setMessage('')

    const reader = new FileReader()

    reader.onload = () => {
      const text = String(reader.result || '')

      const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)

      if (lines.length === 0) {
        setError('CSV file is empty.')
        return
      }

      let emailLines = lines

      // If first row looks like a header, skip it.
      if (lines[0].toLowerCase().includes('email')) {
        emailLines = lines.slice(1)
      }

      const extractedEmails = emailLines
        .map(line => {
          // Take the first column
          const firstColumn = line.split(',')[0]

          return firstColumn.trim()
        })
        .filter(email => email.includes('@'))

      if (extractedEmails.length === 0) {
        setError('No email addresses were found in the CSV.')
        return
      }

      setRecipients(extractedEmails.join(', '))
    }

    reader.readAsText(file)
  }

  // ============================================================
  // SUBMIT CAMPAIGN
  // ============================================================

  async function handleSubmit (event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setMessage('')

    // Convert recipients text into an array
    const recipientList = recipients
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(Boolean)

    // -----------------------------
    // Validation
    // -----------------------------

    if (!senderId) {
      setError('Please select a sender.')
      return
    }

    if (recipientList.length === 0) {
      setError('Please enter at least one recipient.')
      return
    }

    if (!subject.trim()) {
      setError('Please enter a subject.')
      return
    }

    if (!body.trim()) {
      setError('Please enter the email body.')
      return
    }

    if (!startTime) {
      setError('Please select a start time.')
      return
    }

    const selectedTime = new Date(startTime)

    if (selectedTime.getTime() <= Date.now()) {
      setError('Start time must be in the future.')
      return
    }

    const delay = Number(delayMs)

    if (!Number.isFinite(delay)) {
      setError('Please enter a valid delay.')
      return
    }

    if (delay < 2000) {
      setError('Delay must be at least 2000 milliseconds.')
      return
    }
    const limit = Number(hourlyLimit)

    if (!Number.isInteger(limit)) {
      setError('Please enter a valid hourly limit.')
      return
    }

    if (limit < 1 || limit > 10000) {
      setError('Hourly limit must be between 1 and 10000 emails.')
      return
    }

    // -----------------------------
    // Send request
    // -----------------------------

    try {
      setLoading(true)

      const data: ScheduleResponse = await apiFetch('/api/emails/schedule', {
        method: 'POST',

        body: JSON.stringify({
          senderId,
          recipients: recipientList,
          subject: subject.trim(),
          body: body.trim(),
          startTime: selectedTime.toISOString(),
          delayMs: delay,
          hourlyLimit: limit
        })
      })

      setMessage(data.message || `${data.count} emails scheduled successfully.`)

      // Clear form
      setRecipients('')
      setSubject('')
      setBody('')
      setStartTime('')
      setCsvFile(null)

      // Go back to dashboard
      // after showing success message
      setTimeout(() => {
        router.push('/dashboard')
      }, 1200)
    } catch (error) {
      console.error('Failed to schedule campaign:', error)

      setError(
        error instanceof Error ? error.message : 'Failed to schedule emails.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className='min-h-screen bg-slate-100 p-6 lg:p-10'>
      <div className='mx-auto max-w-4xl'>
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className='mb-8'>
          <button
            type='button'
            onClick={() => router.push('/dashboard')}
            className='mb-4 text-sm font-medium text-slate-500 transition hover:text-slate-900'
          >
            ← Back to dashboard
          </button>

          <p className='text-sm font-medium text-blue-600'>CAMPAIGN</p>

          <h1 className='mt-1 text-3xl font-bold text-slate-900'>
            Compose Email Campaign
          </h1>

          <p className='mt-2 text-slate-500'>
            Create and schedule personalized outreach.
          </p>
        </div>

        {/* ================================================== */}
        {/* FORM */}
        {/* ================================================== */}

        <form
          onSubmit={handleSubmit}
          className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8'
        >
          {/* ================================================== */}
          {/* ERROR MESSAGE */}
          {/* ================================================== */}

          {error && (
            <div className='mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
              {error}
            </div>
          )}

          {/* ================================================== */}
          {/* SUCCESS MESSAGE */}
          {/* ================================================== */}

          {message && (
            <div className='mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700'>
              {message}
            </div>
          )}

          {/* ================================================== */}
          {/* SENDER */}
          {/* ================================================== */}

          <div className='mb-6'>
            <label
              htmlFor='senderId'
              className='mb-2 block text-sm font-medium text-slate-700'
            >
              Sender
            </label>

            {senderLoading ? (
              <div className='flex h-12 items-center rounded-lg border border-slate-300 px-4 text-sm text-slate-500'>
                Loading senders...
              </div>
            ) : senders.length === 0 ? (
              <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
                No sender accounts found for your account.
              </div>
            ) : (
              <select
                id='senderId'
                value={senderId}
                onChange={event => setSenderId(event.target.value)}
                className='w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
              >
                {senders.map(sender => (
                  <option key={sender.id} value={sender.id}>
                    {sender.email}
                  </option>
                ))}
              </select>
            )}

            <p className='mt-1 text-xs text-slate-400'>
              Choose the email account you want to send from.
            </p>
          </div>

          {/* ================================================== */}
          {/* CSV */}
          {/* ================================================== */}

          <div className='mb-6'>
            <label
              htmlFor='csv'
              className='mb-2 block text-sm font-medium text-slate-700'
            >
              Recipients CSV
            </label>

            <input
              id='csv'
              type='file'
              accept='.csv'
              onChange={handleCsvUpload}
              className='block w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:text-sm file:font-medium'
            />

            {csvFile && (
              <p className='mt-2 text-xs text-slate-500'>
                Loaded: {csvFile.name}
              </p>
            )}
          </div>

          {/* ================================================== */}
          {/* RECIPIENTS */}
          {/* ================================================== */}

          <div className='mb-6'>
            <label
              htmlFor='recipients'
              className='mb-2 block text-sm font-medium text-slate-700'
            >
              Recipients
            </label>

            <textarea
              id='recipients'
              value={recipients}
              onChange={event => setRecipients(event.target.value)}
              placeholder='john@example.com, jane@example.com'
              rows={4}
              className='w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
            />

            <p className='mt-1 text-xs text-slate-400'>
              Separate multiple email addresses using commas or new lines.
            </p>
          </div>

          {/* ================================================== */}
          {/* SUBJECT */}
          {/* ================================================== */}

          <div className='mb-6'>
            <label
              htmlFor='subject'
              className='mb-2 block text-sm font-medium text-slate-700'
            >
              Subject
            </label>

            <input
              id='subject'
              type='text'
              value={subject}
              onChange={event => setSubject(event.target.value)}
              placeholder='Your email subject'
              className='w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
            />
          </div>

          {/* ================================================== */}
          {/* BODY */}
          {/* ================================================== */}

          <div className='mb-6'>
            <label
              htmlFor='body'
              className='mb-2 block text-sm font-medium text-slate-700'
            >
              Email Body
            </label>

            <textarea
              id='body'
              value={body}
              onChange={event => setBody(event.target.value)}
              placeholder='Write your email...'
              rows={10}
              className='w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
            />
          </div>

          {/* ================================================== */}
          {/* SCHEDULING */}
          {/* ================================================== */}

          <div className='grid gap-6 md:grid-cols-3'>
            <div>
              <label
                htmlFor='startTime'
                className='mb-2 block text-sm font-medium text-slate-700'
              >
                Start Time
              </label>

              <input
                id='startTime'
                type='datetime-local'
                value={startTime}
                onChange={event => setStartTime(event.target.value)}
                className='w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
              />

              <p className='mt-1 text-xs text-slate-400'>
                Choose when the first email should be sent.
              </p>
            </div>

            <div>
              <label
                htmlFor='delay'
                className='mb-2 block text-sm font-medium text-slate-700'
              >
                Delay Between Emails
              </label>

              <div className='flex'>
                <input
                  id='delay'
                  type='number'
                  min='2000'
                  step='100'
                  value={delayMs}
                  onChange={event => setDelayMs(event.target.value)}
                  className='w-full rounded-l-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
                />

                <div className='flex items-center rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 px-4 text-sm text-slate-500'>
                  ms
                </div>
              </div>

              <p className='mt-1 text-xs text-slate-400'>
                Minimum delay: 2000 ms
              </p>
            </div>

            <div>
              <label
                htmlFor='hourlyLimit'
                className='mb-2 block text-sm font-medium text-slate-700'
              >
                Campaign Hourly Limit
              </label>

              <div className='flex'>
                <input
                  id='hourlyLimit'
                  type='number'
                  min='1'
                  max='10000'
                  step='1'
                  value={hourlyLimit}
                  onChange={event => setHourlyLimit(event.target.value)}
                  className='w-full rounded-l-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100'
                />

                <div className='flex items-center rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 px-4 text-sm text-slate-500'>
                  / hour
                </div>
              </div>

              <p className='mt-1 text-xs text-slate-400'>
                Maximum emails this campaign can send per hour.
              </p>
            </div>
          </div>

          {/* ================================================== */}
          {/* SUBMIT */}
          {/* ================================================== */}

          <div className='mt-8 flex items-center justify-end gap-3'>
            <button
              type='button'
              onClick={() => router.push('/dashboard')}
              disabled={loading}
              className='rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50'
            >
              Cancel
            </button>

            <button
              type='submit'
              disabled={loading || senderLoading || senders.length === 0}
              className='rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {loading ? 'Scheduling...' : 'Schedule Campaign'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
