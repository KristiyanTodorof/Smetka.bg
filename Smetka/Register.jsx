import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/client'

export default function Register() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { data } = await authApi.register(form)
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email }))
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.message || 'Грешка при регистрацията.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h1 style={styles.logo}>⚡ Сметки.bg</h1>
                <h2 style={styles.title}>Регистрация</h2>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <label style={styles.label}>Име</label>
                    <input
                        style={styles.input}
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Иван Иванов"
                        required
                    />

                    <label style={styles.label}>Имейл</label>
                    <input
                        style={styles.input}
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="ivan@example.com"
                        required
                    />

                    <label style={styles.label}>Парола</label>
                    <input
                        style={styles.input}
                        type="password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        placeholder="Минимум 6 символа"
                        minLength={6}
                        required
                    />

                    <button style={styles.btn} type="submit" disabled={loading}>
                        {loading ? 'Регистриране...' : 'Регистрация'}
                    </button>
                </form>

                <p style={styles.footer}>
                    Вече имаш акаунт? <Link to="/login">Вход</Link>
                </p>
            </div>
        </div>
    )
}

const styles = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
    card: { background: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' },
    logo: { textAlign: 'center', fontSize: '1.5rem', marginBottom: '0.5rem' },
    title: { textAlign: 'center', marginBottom: '1.5rem', color: '#333' },
    form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    label: { fontSize: '0.875rem', fontWeight: 500, color: '#555' },
    input: { padding: '0.625rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' },
    btn: { padding: '0.75rem', borderRadius: '8px', background: '#185FA5', color: '#fff', border: 'none', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem' },
    error: { background: '#FCEBEB', color: '#A32D2D', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '0.5rem' },
    footer: { textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#666' },
}