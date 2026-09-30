import { useState, useEffect } from 'react';
import { LayoutGrid, History as HistoryIcon, Settings, Plus, Flame } from 'lucide-react';

type View = 'overview' | 'history';

export default function App() {
  const [view, setView] = useState<View>('overview');
  const [weight, setWeight] = useState('');
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const res = await fetch('/api/entries');
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    try {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          weight: parseFloat(weight),
          note: '',
        }),
      });
      setWeight('');
      loadEntries();
    } catch (err) {
      console.error('Failed to save entry:', err);
    }
  };

  return (
    <div className="app">
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <svg className="sidebar-logo" viewBox="0 0 48 48">
              <rect x="3" y="3" width="42" height="42" rx="13" fill="var(--color-pine-900)" />
              <path d="M13 27a11 11 0 0 1 22 0" stroke="var(--color-lime)" strokeWidth="3.4" fill="none" strokeLinecap="round" />
              <circle cx="24" cy="27" r="2.7" fill="var(--color-lime)" />
            </svg>
            <div>
              <div className="sidebar-title">МАССА</div>
              <div className="sidebar-subtitle">дневник контроля веса</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-btn ${view === 'overview' ? 'active' : ''}`}
              onClick={() => setView('overview')}
            >
              <LayoutGrid />
              Обзор
            </button>
            <button
              className={`sidebar-nav-btn ${view === 'history' ? 'active' : ''}`}
              onClick={() => setView('history')}
            >
              <HistoryIcon />
              История
            </button>
            <button className="sidebar-nav-btn">
              <Settings />
              Параметры
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-streak">
              <div className="sidebar-streak-header">
                <div className="sidebar-streak-icon">
                  <Flame />
                </div>
                <div>
                  <div className="sidebar-streak-value">0 дней</div>
                </div>
              </div>
              <div className="sidebar-streak-text">
                Отметьтесь сегодня, чтобы начать серию
              </div>
            </div>
            <div className="sidebar-info">
              Данные хранятся в PostgreSQL на вашем сервере
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="mobile-header">
          <div className="mobile-header-content">
            <div className="mobile-header-logo">
              <svg className="mobile-header-logo-icon" viewBox="0 0 48 48">
                <rect x="3" y="3" width="42" height="42" rx="13" fill="var(--color-pine-900)" />
                <path d="M13 27a11 11 0 0 1 22 0" stroke="var(--color-lime)" strokeWidth="3.4" fill="none" strokeLinecap="round" />
                <circle cx="24" cy="27" r="2.7" fill="var(--color-lime)" />
              </svg>
              <div>
                <div className="mobile-header-logo-text">МАССА</div>
                <div className="mobile-header-logo-subtitle">дневник веса</div>
              </div>
            </div>
            <div className="mobile-header-actions">
              <div className="mobile-header-streak">
                <Flame />
                <span className="mobile-header-streak-value">0</span>
              </div>
              <button className="mobile-header-settings-btn">
                <Settings />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main">
          {view === 'overview' ? (
            <div className="grid gap-5">
              {/* Hero */}
              <section className="hero">
                <div className="hero-glow" />
                <div className="hero-content">
                  <div>
                    <div className="hero-status">
                      <div className="hero-status-dot live-dot" />
                      <div className="hero-status-text">Текущий вес</div>
                    </div>
                    <div className="hero-weight">
                      <div className="hero-weight-value">
                        {entries.length > 0 ? entries[entries.length - 1].weight : '——,——'}
                      </div>
                      <div className="hero-weight-unit">кг</div>
                    </div>
                    {entries.length === 0 && (
                      <>
                        <div className="hero-empty-text">
                          Встаньте на весы и запишите первое значение
                        </div>
                        <button className="hero-empty-btn">
                          <Plus strokeWidth={3} />
                          Записать первый вес
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Entry Form */}
              <section className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Новое взвешивание</div>
                  </div>
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v18M3 12h18" />
                    </svg>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="card-body">
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="input-label">Вес, кг</label>
                      <input
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="70.0"
                        className="input mt-2"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-md">
                      <Plus />
                      Сохранить запись
                    </button>
                  </div>
                </form>
              </section>

              {/* Recent Entries */}
              {entries.length > 0 && (
                <section className="card">
                  <div className="card-header">
                    <div className="card-title">Последние записи</div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setView('history')}
                    >
                      Вся история
                    </button>
                  </div>
                  <div className="list">
                    {entries.slice(-5).reverse().map((entry) => (
                      <div key={entry.id} className="list-item">
                        <div className="flex-1">
                          <div className="text-sm font-bold">{entry.date}</div>
                          {entry.note && (
                            <div className="text-xs text-fog">{entry.note}</div>
                          )}
                        </div>
                        <div className="text-lg font-bold">{entry.weight} кг</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="grid gap-5">
              <div>
                <h1 className="text-2xl font-bold">История взвешиваний</h1>
                <p className="text-sm text-fog mt-1">
                  {entries.length} записей
                </p>
              </div>

              {entries.length > 0 ? (
                <section className="card">
                  <div className="list">
                    {entries.map((entry) => (
                      <div key={entry.id} className="list-item">
                        <div className="flex-1">
                          <div className="text-sm font-bold">{entry.date}</div>
                          {entry.note && (
                            <div className="text-xs text-fog">{entry.note}</div>
                          )}
                        </div>
                        <div className="text-lg font-bold">{entry.weight} кг</div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <section className="card">
                  <div className="card-body text-center p-5">
                    <div className="text-lg font-bold">Пока нет записей</div>
                    <p className="text-sm text-fog mt-2">
                      Начните с первого взвешивания
                    </p>
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-content">
          <button
            className={`mobile-nav-btn ${view === 'overview' ? 'active' : ''}`}
            onClick={() => setView('overview')}
          >
            <div className="mobile-nav-btn-icon">
              <LayoutGrid />
            </div>
            <span className="mobile-nav-btn-label">Обзор</span>
          </button>

          <div className="mobile-nav-btn-center">
            <button className="mobile-nav-btn-center-btn">
              <Plus strokeWidth={3} />
            </button>
            <span className="mobile-nav-btn-center-label">Записать</span>
          </div>

          <button
            className={`mobile-nav-btn ${view === 'history' ? 'active' : ''}`}
            onClick={() => setView('history')}
          >
            <div className="mobile-nav-btn-icon">
              <HistoryIcon />
            </div>
            <span className="mobile-nav-btn-label">История</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
