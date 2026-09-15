'use client'

import { useEffect, useState } from 'react'

interface SlackConnectionProps {
  userId: string
}

interface SlackStatusResponse {
  connected: boolean
}

export default function SlackConnection ({ userId }: SlackConnectionProps) {
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSlackStatus () {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          'http://localhost:5000/auth/slack/status',
          {
            credentials: 'include'
          }
        )

        const data: SlackStatusResponse = await response.json()

        if (!response.ok) {
          throw new Error('Failed to load Slack status')
        }

        setConnected(data.connected)
      } catch (error) {
        console.error('Failed to load Slack status:', error)

        setError(
          error instanceof Error ? error.message : 'Failed to load Slack status'
        )
      } finally {
        setLoading(false)
      }
    }

    loadSlackStatus()
  }, [userId])

  function connectSlack () {
    window.location.href = `http://localhost:5000/auth/slack?userId=${encodeURIComponent(
      userId
    )}`
  }

  async function disconnectSlack () {
    try {
      setDisconnecting(true)
      setError('')

      const response = await fetch('http://localhost:5000/auth/slack', {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to disconnect Slack')
      }

      setConnected(false)
    } catch (error) {
      console.error(error)

      setError(
        error instanceof Error ? error.message : 'Failed to disconnect Slack'
      )
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <section className='rounded-xl border border-slate-200 bg-white p-6'>
      <div className='flex flex-col justify-between gap-5 sm:flex-row sm:items-center'>
        <div>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-xl'>
              #
            </div>

            <div>
              <h2 className='font-semibold text-slate-900'>
                Slack Notifications
              </h2>

              <p className='text-sm text-slate-500'>
                Get notified when your hourly email limit is reached.
              </p>
            </div>
          </div>

          {loading && (
            <p className='mt-3 text-sm text-slate-500'>
              Checking Slack connection...
            </p>
          )}

          {!loading && connected && (
            <p className='mt-3 text-sm font-medium text-green-600'>
              ● Slack connected
            </p>
          )}

          {!loading && !connected && !error && (
            <p className='mt-3 text-sm text-slate-500'>
              Slack is not connected.
            </p>
          )}

          {error && <p className='mt-3 text-sm text-red-600'>{error}</p>}
        </div>

        {!loading && (
          <>
            {connected ? (
              <button
                onClick={disconnectSlack}
                disabled={disconnecting}
                className='rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50'
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            ) : (
              <button
                onClick={connectSlack}
                className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800'
              >
                Connect Slack
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
