import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { billsApi } from '../api/client'

const MONTHS = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек']
const TYPES = [
    { key: 'electricity', label: 'Ток', icon: '⚡', color: '#185FA5', unit: 'kWh' },
    { key: 'water', label: 'Вода', icon: '💧', color: '#0F6E56', unit: 'м³' },
    { key: 'gas', label: 'Газ', icon: '🔥', color: '#854F0B', unit: 'м³' },
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
            setError('Грешка при зареждане на данните.')
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
        if (!confirm('Сигурен ли си че искаш да изтриеш тази сметка?')) return
        await billsApi.delete(id)
        fetchData()
    }

    // Подготвя данните за графиката
    const chartData = () => {
        const filtered = bills.filter(b => b.type === tab)
        const map = {}
        filtered.forEach(b => { map[`${b.month}/${b.year}`] = b.amount })
        return Array.from({ length: 12 }, (_, i) => {
            const m = new Date().getMonth() - 11 + i
            const date = new Date(new Date().getFullYear(), new Date().getMonth() - 11 + i, 1)
            const key = `${date.getMonth() + 1}/${date.getFullYear()}`
            return { name: MONTHS[date.getMonth()], amount: map[key] || 0 }
        })
    }

    const currentType = TYPES.find(t => t.key === tab)

    return (
        <div style={styles.page}>
            {/* Навигация */}
            <nav style={styles.nav}>
                <span style={styles.navLogo}>⚡ Сметки.bg</span>
                <div style={styles.navRight}>
                    <Link to="/chat" style={styles.chatBtn}>🤖 AI Асистент</Link>
                    <span style={styles.userName}>{user.name}</span>
                    <button style={styles.logoutBtn} onClick={handleLogout}>Изход</button>
                </div>
            </nav>

            <div style={styles.content}>
                {error && <div style={styles.error}>{error}</div>}

                {/* Summary карти */}
                <div style={styles.summaryGrid}>
                    {TYPES.map(type => {
                        const s = summary.find(x => x.type === type.key)
                        const delta = s?.changePercent
                        return (
                            <div key={type.key} style={styles.summaryCard}>
                                <div style={styles.summaryLabel}>{type.icon} {type.label}</div>
                                <div style={styles.summaryAmount}>{s ? `${s.amount} лв` : '—'}</div>
                                {delta !== null && delta !== undefined && (
                                    <div style={{ ...styles.summaryDelta, color: delta > 0 ? '#A32D2D' : '#3B6D11' }}>
                                        {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}% vs предходен месец
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Графика */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardTitle}>История на разходите</span>
                        <div style={styles.tabs}>
                            {TYPES.map(t => (
                                <button
                                    key={t.key}
                                    style={{ ...styles.tab, ...(tab === t.key ? { background: '#185FA5', color: '#fff' } : {}) }}
                                    onClick={() => setTab(t.key)}
                                >
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData()} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} unit=" лв" />
                            <Tooltip formatter={v => [`${v} лв`, currentType.label]} />
                            <Bar dataKey="amount" fill={currentType.color} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Списък сметки */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardTitle}>Последни сметки</span>
                        <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
                            {showForm ? '✕ Затвори' : '+ Добави сметка'}
                        </button>
                    </div>

                    {/* Форма за добавяне */}
                    {showForm && (
                        <form onSubmit={handleSubmit} style={styles.form}>
                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Тип</label>
                                    <select style={styles.input} value={form.type}
                                        onChange={e => {
                                            const t = TYPES.find(x => x.key === e.target.value)
                                            setForm({ ...form, type: e.target.value, unit: t?.unit || '' })
                                        }}>
                                        {TYPES.map(t => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Месец</label>
                                    <select style={styles.input} value={form.month}
                                        onChange={e => setForm({ ...form, month: e.target.value })}>
                                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Година</label>
                                    <input style={styles.input} type="number" value={form.year}
                                        onChange={e => setForm({ ...form, year: e.target.value })} />
                                </div>
                            </div>
                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Сума (лв)</label>
                                    <input style={styles.input} type="number" step="0.01" value={form.amount}
                                        onChange={e => setForm({ ...form, amount: e.target.value })} required />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Консумация ({form.unit})</label>
                                    <input style={styles.input} type="number" step="0.01" value={form.consumption}
                                        onChange={e => setForm({ ...form, consumption: e.target.value })} />
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Бележка (по избор)</label>
                                <input style={styles.input} type="text" value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    placeholder="напр. нова тарифа, климатик..." />
                            </div>
                            <button style={styles.saveBtn} type="submit" disabled={saving}>
                                {saving ? 'Запазване...' : 'Запази сметката'}
                            </button>
                        </form>
                    )}

                    {/* Таблица */}
                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>Зареждане...</p>
                    ) : bills.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                            Все още няма въведени сметки. Добави първата!
                        </p>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHead}>
                                    <th style={styles.th}>Тип</th>
                                    <th style={styles.th}>Период</th>
                                    <th style={styles.th}>Сума</th>
                                    <th style={styles.th}>Консумация</th>
                                    <th style={styles.th}>Бележка</th>
                                    <th style={styles.th}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.slice(0, 20).map(b => {
                                    const t = TYPES.find(x => x.key === b.type)
                                    return (
                                        <tr key={b.id} style={styles.tableRow}>
                                            <td style={styles.td}>{t?.icon} {t?.label}</td>
                                            <td style={styles.td}>{MONTHS[b.month - 1]} {b.year}</td>
                                            <td style={{ ...styles.td, fontWeight: 500 }}>{b.amount} лв</td>
                                            <td style={styles.td}>{b.consumption ? `${b.consumption} ${b.unit}` : '—'}</td>
                                            <td style={styles.td}>{b.notes || '—'}</td>
                                            <td style={styles.td}>
                                                <button style={styles.deleteBtn} onClick={() => handleDelete(b.id)}>🗑</button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}

const styles = {
    page: { minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
    nav: { background: '#fff', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 },
    navLogo: { fontWeight: 600, fontSize: '1.1rem' },
    navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
    chatBtn: { background: '#185FA5', color: '#fff', padding: '0.4rem 0.875rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem' },
    userName: { fontSize: '0.875rem', color: '#555' },
    logoutBtn: { background: 'none', border: '1px solid #ddd', padding: '0.4rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' },
    content: { maxWidth: '960px', margin: '0 auto', padding: '1.5rem' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' },
    summaryCard: { background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    summaryLabel: { fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' },
    summaryAmount: { fontSize: '1.75rem', fontWeight: 600, color: '#222' },
    summaryDelta: { fontSize: '0.8rem', marginTop: '0.25rem' },
    card: { background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '1.25rem' },
    cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' },
    cardTitle: { fontWeight: 600, fontSize: '1rem' },
    tabs: { display: 'flex', gap: '0.375rem' },
    tab: { padding: '0.375rem 0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '0.8rem' },
    addBtn: { background: '#185FA5', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' },
    form: { background: '#f9f9f9', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    formRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
    label: { fontSize: '0.8rem', fontWeight: 500, color: '#555' },
    input: { padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem' },
    saveBtn: { background: '#185FA5', color: '#fff', border: 'none', padding: '0.625rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', alignSelf: 'flex-start', minWidth: '140px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHead: { background: '#f9f9f9' },
    th: { padding: '0.625rem 0.75rem', textAlign: 'left', fontSize: '0.8rem', color: '#666', fontWeight: 500, borderBottom: '1px solid #eee' },
    tableRow: { borderBottom: '1px solid #f0f0f0' },
    td: { padding: '0.625rem 0.75rem', fontSize: '0.875rem', color: '#333' },
    deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.5 },
    error: { background: '#FCEBEB', color: '#A32D2D', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' },
}