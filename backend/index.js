import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ========== API: Записи веса ==========

app.get('/api/entries', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, date, weight, note, created_at FROM weight_entries ORDER BY date ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

app.post('/api/entries', async (req, res) => {
  try {
    const { id, date, weight, note } = req.body;
    
    const result = await pool.query(
      `INSERT INTO weight_entries (id, date, weight, note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (date) 
       DO UPDATE SET weight = $3, note = $4
       RETURNING id, date, weight, note, created_at`,
      [id, date, weight, note || null]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error upserting entry:', error);
    res.status(500).json({ error: 'Failed to save entry' });
  }
});

app.patch('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { weight } = req.body;
    
    const result = await pool.query(
      'UPDATE weight_entries SET weight = $1 WHERE id = $2 RETURNING id, date, weight, note, created_at',
      [weight, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM weight_entries WHERE id = $1 RETURNING id, date, weight, note, created_at',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// ========== API: Профиль ==========

app.get('/api/profile', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profile WHERE id = $1', ['main']);
    
    if (result.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO profile (id, height_cm, age, sex, target)
         VALUES ('main', 170, 30, 'female', NULL)
         RETURNING *`
      );
      return res.json(insertResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const { height_cm, age, sex, target } = req.body;
    
    const result = await pool.query(
      `UPDATE profile 
       SET height_cm = $1, age = $2, sex = $3, target = $4
       WHERE id = 'main'
       RETURNING *`,
      [height_cm, age, sex, target]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ========== API: Очистка данных ==========

app.delete('/api/clear', async (req, res) => {
  try {
    await pool.query('DELETE FROM weight_entries');
    await pool.query(
      `UPDATE profile 
       SET height_cm = 170, age = 30, sex = 'female', target = NULL
       WHERE id = 'main'`
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

// ========== API: Инициализация БД ==========

app.post('/api/init-db', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weight_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL UNIQUE,
        weight NUMERIC(5,2) NOT NULL CHECK (weight > 0 AND weight < 500),
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS profile (
        id TEXT PRIMARY KEY DEFAULT 'main' CHECK (id = 'main'),
        height_cm INTEGER NOT NULL CHECK (height_cm > 0 AND height_cm < 300),
        age INTEGER NOT NULL CHECK (age > 0 AND age < 200),
        sex TEXT NOT NULL CHECK (sex IN ('female', 'male')),
        target NUMERIC(5,2)
      );

      INSERT INTO profile (id, height_cm, age, sex, target)
      VALUES ('main', 170, 30, 'female', NULL)
      ON CONFLICT (id) DO NOTHING;

      CREATE INDEX IF NOT EXISTS idx_entries_date ON weight_entries(date);
    `);
    
    res.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

// ========== Запуск сервера ==========

app.listen(PORT, () => {
  console.log(`🚀 Massa server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});
