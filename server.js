const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect/Create SQLite Database File
const db = new sqlite3.Database('./projects.db', (err) => {
    if (err) console.error('Error opening database:', err.message);
    else console.log('Connected to SQLite database.');
});

// Initialize Schema
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            phases_json TEXT NOT NULL
        )
    `);
});

// Default initial starter template if new project created
const defaultPhases = [
    { id: 0, title: "Project Foundation", category: "foundation", goal: "Initial core setup", build: ["Setup repository", "Configure environment"], doneWhen: "App boots clean", status: "completed", x: 100, y: 100 },
    { id: 1, title: "Mina Core Engine", category: "foundation", goal: "Build core message router", build: ["Tool router", "Event bus"], doneWhen: "Routes correctly", status: "in-progress", x: 480, y: 100 },
    { id: 2, title: "Gemini Integration", category: "intelligence", goal: "Connect LLM API", build: ["Streaming chat", "API configuration"], doneWhen: "Receives AI streaming response", status: "pending", x: 860, y: 100 }
];

// --- ROUTES ---

// 1. GET ALL PROJECTS (List summary)
app.get('/api/projects', (req, res) => {
    db.all(`SELECT id, title, description, updated_at FROM projects ORDER BY updated_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. GET SINGLE PROJECT BY ID
app.get('/api/projects/:id', (req, res) => {
    db.get(`SELECT * FROM projects WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Project not found' });
        
        res.json({
            id: row.id,
            title: row.title,
            description: row.description,
            updated_at: row.updated_at,
            phases: JSON.parse(row.phases_json)
        });
    });
});

// 3. CREATE OR UPDATE PROJECT
app.post('/api/projects', (req, res) => {
    const { id, title, description, phases } = req.body;
    if (!id || !title) return res.status(400).json({ error: 'Missing required fields' });

    const phasesStr = JSON.stringify(phases || defaultPhases);
    const sql = `
        INSERT INTO projects (id, title, description, phases_json, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            description = excluded.description,
            phases_json = excluded.phases_json,
            updated_at = CURRENT_TIMESTAMP
    `;

    db.run(sql, [id, title, description || '', phasesStr], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id, message: 'Project saved successfully' });
    });
});

// 4. DELETE PROJECT
app.delete('/api/projects/:id', (req, res) => {
    db.run(`DELETE FROM projects WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Project deleted' });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Roadmap Whiteboard API running at http://localhost:${PORT}`);
});