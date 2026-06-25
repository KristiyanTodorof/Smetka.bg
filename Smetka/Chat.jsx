import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { chatApi } from '../api/client'

export default function Chat() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { loadHistory() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadHistory = async () => {
    try {
      const { data } = await chatApi.getHistory(50)
      if (data.length === 0) {
        setMessages([{
          role: 'assistant',
          content: `Здравейте, ${user.name}! 👋 Аз съм вашият AI асистент за анализ на сметки. Мога да ви помогна да разберете защо сметките ви се повишават или намаляват. Задайте ми въпрос!`
        }])
      } else {
        setMessages(data)
      }
    } catch {
      setMessages([{ role: 'assistant', content: 'Здравейте! Как мога да помогна?' }])
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await chatApi.send(input)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Съжалявам, възникна грешка. Моля, опитайте отново.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearHistory = async () => {
    if (!confirm('Сигурен ли си че искаш да изчистиш историята?')) return
    await chatApi.clearHistory()
    loadHistory()
  }

  const QUICK = [
    'Защо сметката ми за ток е висока?',
    'Как да намаля разходите за вода?',
    'Сравни сметките ми с миналата година',
    'Дай ми съвети за пестене на ток',
  ]

  return (
    <div style={styles.page}>
      {/* Навигация */}
      <nav style={styles.nav}>
        <Link to="/dashboard" style={styles.backBtn}>← Назад</Link>
        <span style={styles.navTitle}>🤖 AI Асистент</span>
        <button style={styles.clearBtn} onClick={clearHistory}>Изчисти</button>
      </nav>

      <div style={styles.container}>
        {/* Съобщения */}
        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <div key={i} style={{ ...styles.msgWrap, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && <div style={styles.avatar}>🤖</div>}
              <div style={{
                ...styles.bubble,
                background: msg.role === 'user' ? '#185FA5' : '#f0f0f0',
                color: msg.role === 'user' ? '#fff' : '#222',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderBottomLeftRadius:  msg.role === 'user' ? '16px' : '4px',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.msgWrap, justifyContent: 'flex-start' }}>
              <div style={styles.avatar}>🤖</div>
              <div style={{ ...styles.bubble, background: '#f0f0f0', color: '#888' }}>
                Пиша...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Бързи въпроси */}
        {messages.length <= 1 && (
          <div style={styles.quickWrap}>
            {QUICK.map((q, i) => (
              <button key={i} style={styles.quickBtn} onClick={() => {
                setInput(q)
              }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Поле за въвеждане */}
        <div style={styles.inputArea}>
          <textarea
            style={styles.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Напишете въпрос за сметките си..."
            rows={2}
            disabled={loading}
          />
          <button style={styles.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()}>
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page:      { height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  nav:       { background: '#fff', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' },
  backBtn:   { color: '#185FA5', textDecoration: 'none', fontSize: '0.875rem' },
  navTitle:  { fontWeight: 600 },
  clearBtn:  { background: 'none', border: '1px solid #ddd', padding: '0.375rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#888' },
  container: { flex: 1, maxWidth: '760px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.75rem', overflow: 'hidden' },
  messages:  { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' },
  msgWrap:   { display: 'flex', alignItems: 'flex-end', gap: '0.5rem' },
  avatar:    { fontSize: '1.25rem', flexShrink: 0 },
  bubble:    { maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: '16px', fontSize: '0.9rem', lineHeight: 1.55, whiteSpace: 'pre-wrap' },
  quickWrap: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  quickBtn:  { background: '#fff', border: '1px solid #ddd', borderRadius: '20px', padding: '0.5rem 0.875rem', fontSize: '0.8rem', cursor: 'pointer', color: '#444' },
  inputArea: { display: 'flex', gap: '0.5rem', alignItems: 'flex-end', background: '#fff', borderRadius: '12px', padding: '0.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  textarea:  { flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: '0.9rem', fontFamily: 'system-ui, sans-serif', background: 'transparent' },
  sendBtn:   { background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 },
}