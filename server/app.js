const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const collegesRoutes = require('./routes/colleges');
const departmentsRoutes = require('./routes/departments');
const mousRoutes = require('./routes/mous');
const resourcesRoutes = require('./routes/resources');
const projectsRoutes = require('./routes/projects');

app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/mous', mousRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api', resourcesRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`MOU server listening on port ${port}`));

module.exports = app;
