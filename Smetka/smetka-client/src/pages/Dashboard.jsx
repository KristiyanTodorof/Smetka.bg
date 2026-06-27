import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { billsApi } from '../api/client'

const MONTHS = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек']
const TYPES = [
  { key: 'electricity', label: 'Ток',  icon: '⚡', color: '#3B82F6', unit: 'kWh' },
  { key: 'water',       label: 'Вода', icon: '💧', color: '#10B981', unit: 'м³'  },
  { key: 'gas',         label: 'Газ',  icon: '🔥', color: '#F59E0B', unit: 'м³'  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [bills, setBills] = useState([])
  const [summary, setSummary] = useState([])
  const [tab, setTab] = useState('electricity')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: 'electricity', month: new Date().getMonth() + 1,
    year: new Date().getFullYear(), amount: '', consumption: '', unit: 'kWh', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [billsRes, summaryRes] = await Promise.all([
        billsApi.getAll(),
        billsApi.getSummary()
      ])
      setBills(billsRes.data)
      setSummary(summaryRes.data)
    } catch {
      setError('Грешка при зареждане.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await billsApi.create({
        ...form,
        month: parseInt(form.month),
        year: parseInt(form.year),
        amount: parseFloat(form.amount),
        consumption: form.consumption ? parseFloat(form.consumption) : null,
      })
      setShowForm(false)
      setForm({ type: 'electricity', month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: '', consumption: '', unit: 'kWh', notes: '' })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Грешка при запазване.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Сигурен ли си?')) return
    await billsApi.delete(id)
    fetchData()
  }

  const chartData = () => {
    const filtered = bills.filter(b => b.type === tab)
    const map = {}
    filtered.forEach(b => { map[`${b.month}/${b.year}`] = b.amount })
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(new Date().getFullYear(), new Date().getMonth() - 11 + i, 1)
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`
      return { name: MONTHS[date.getMonth()], amount: map[key] || 0 }
    })
  }

  const currentType = TYPES.find(t => t.key === tab)

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Навигация */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-slate-800 text-lg">Сметки.bg</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/chat"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              🤖 AI Асистент
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-xs">
                {user.name?.charAt(0)}
              </div>
              {user.name}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition"
            >
              Изход
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Заглавие */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Добре дошъл, {user.name?.split(' ')[0]}!</h1>
          <p className="text-slate-500 mt-1">Преглед на комуналните ти разходи</p>
        </div>

        {/* Summary карти */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {TYPES.map(type => {
            const s = summary.find(x => x.type === type.key)
            const delta = s?.changePercent
            return (
              <div key={type.key} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-500">{type.icon} {type.label}</span>
                  {delta !== null && delta !== undefined && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${delta > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-slate-800">
                  {s ? `${s.amount} €` : '—'}
                </div>
                {s?.previousAmount && (
                  <div className="text-xs text-slate-400 mt-1">
                    Предходен: {s.previousAmount} €
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Графика */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg font-semibold text-slate-800">История на разходите</h2>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
                    tab === t.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData()} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} unit=" €" />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                formatter={v => [`${v} €`, currentType.label]}
              />
              <Bar dataKey="amount" fill={currentType.color} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Списък сметки */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Последни сметки</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
                showForm
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              {showForm ? '✕ Затвори' : '+ Добави сметка'}
            </button>
          </div>

          {/* Форма */}
          {showForm && (
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Тип</label>
                    <select
                      value={form.type}
                      onChange={e => {
                        const t = TYPES.find(x => x.key === e.target.value)
                        setForm({ ...form, type: e.target.value, unit: t?.unit || '' })
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {TYPES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Месец</label>
                    <select
                      value={form.month}
                      onChange={e => setForm({ ...form, month: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Година</label>
                    <input
                      type="number"
                      value={form.year}
                      onChange={e => setForm({ ...form, year: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Сума (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      required
                      placeholder="0.00"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Консумация ({form.unit})</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.consumption}
                      onChange={e => setForm({ ...form, consumption: e.target.value })}
                      placeholder="по избор"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Бележка</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="напр. нова тарифа, климатик..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition shadow-sm"
                >
                  {saving ? 'Запазване...' : 'Запази сметката'}
                </button>
              </form>
            </div>
          )}

          {/* Таблица */}
          {loading ? (
            <div className="text-center text-slate-400 py-12">Зареждане...</div>
          ) : bills.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-slate-500 font-medium">Все още няма сметки</p>
              <p className="text-slate-400 text-sm mt-1">Добави първата си сметка</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Тип</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Период</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Сума</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Консумация</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Бележка</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bills.slice(0, 20).map(b => {
                    const t = TYPES.find(x => x.key === b.type)
                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 text-sm text-slate-700">{t?.icon} {t?.label}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{MONTHS[b.month - 1]} {b.year}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">{b.amount} €</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{b.consumption ? `${b.consumption} ${b.unit}` : '—'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{b.notes || '—'}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="text-slate-300 hover:text-red-400 transition text-lg"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}