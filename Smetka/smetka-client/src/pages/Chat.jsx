import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { chatApi } from '../api/client'

export default function Chat() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Съжалявам, възникна грешка.' }])
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
    if (!confirm('Сигурен ли си?')) return
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
    <div className="h-screen bg-slate-50 flex flex-col">

      {/* Навигация */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium transition"
          >
            ← Назад
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-sm">🤖</span>
            </div>
            <span className="font-semibold text-slate-800">AI Асистент</span>
          </div>
          <button
            onClick={clearHistory}
            className="text-sm text-slate-400 hover:text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
          >
            Изчисти
          </button>
        </div>
      </nav>

      {/* Съобщения */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">🤖</span>
                </div>
              )}
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-slate-700 rounded-bl-sm border border-slate-200 shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🤖</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Бързи въпроси */}
      {messages.length <= 1 && (
        <div className="max-w-4xl mx-auto px-4 pb-3 w-full">
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="text-xs bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 px-3 py-2 rounded-xl transition shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Поле за въвеждане */}
      <div className="bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-3 items-end bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Напишете въпрос за сметките си..."
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent resize-none text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition shadow-sm"
            >
              ➤
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">Enter за изпращане • Shift+Enter за нов ред</p>
        </div>
      </div>
    </div>
  )
}