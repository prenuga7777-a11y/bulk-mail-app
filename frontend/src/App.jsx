import { useState } from 'react'
import './App.css'

function App() {
  const [subject, setSubject] = useState('')
  const [recipients, setRecipients] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const handleSend = async () => {
    if (!subject.trim() || !recipients.trim() || !message.trim()) {
      setStatus('Please fill all fields!')
      return
    }

    const emailList = recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email !== '')

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (emailList.some(email => !emailPattern.test(email))) {
      setStatus('Please enter valid email addresses!')
      return
    }

    try {
      setLoading(true)
      setStatus('Sending emails...')

      const response = await fetch('https://bulk-mail-app-a0rd.onrender.com/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject,
          recipients: emailList,
          message
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      setStatus('Emails sent successfully!')

      setSubject('')
      setRecipients('')
      setMessage('')

    } catch (error) {
      setStatus(error.message || 'Failed to send emails!')
    } finally {
      setLoading(false)
    }
  }

  const handleHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/history')
      const data = await response.json()

      if (!response.ok) {
        throw new Error('Unable to fetch email history')
      }

      setHistory(data.data)
      setShowHistory(true)

    } catch (error) {
      setStatus(error.message)
    }
  }

  return (
    <div className="container">

      <header>
        <h1>📧 Bulk Mail App</h1>
        <p>Send emails to multiple recipients easily</p>
      </header>

      <main className="mail-box">

        <h2>Compose Email</h2>

        <label>Subject</label>
        <input
          type="text"
          placeholder="Enter email subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <label>Recipient Emails</label>
        <textarea
          placeholder="Enter email addresses separated by commas"
          rows="4"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
        />

        <label>Email Message</label>
        <textarea
          placeholder="Write your email message here..."
          rows="8"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Mail'}
        </button>

        {status && (
          <p className="status-message">{status}</p>
        )}

        <hr />

        <button type="button" onClick={handleHistory}>
          View Email History
        </button>

        {showHistory && (
          <section className="history-section">
            <h2>Email History</h2>

            {history.length === 0 ? (
              <p>No email history available.</p>
            ) : (
              history.map((email) => (
                <div className="history-card" key={email._id}>
                  <h3>{email.subject}</h3>
                  <p><strong>Recipients:</strong> {email.recipients.join(', ')}</p>
                  <p><strong>Message:</strong> {email.body}</p>
                  <p><strong>Status:</strong> {email.status}</p>
                  <p>
                    <strong>Date:</strong>{' '}
                    {new Date(email.sentAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </section>
        )}

      </main>

    </div>
  )
}

export default App