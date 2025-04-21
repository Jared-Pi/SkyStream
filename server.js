const express = require('express');
const path = require('path');
const client = require('prom-client');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Read startTime from the JSON file
const startTimeFilePath = path.join(__dirname, "startTime.json");
const { startTime } = JSON.parse(fs.readFileSync(startTimeFilePath, "utf-8"));
const startTimeDate = new Date(startTime);

// Serve static files (e.g., HTML, JS, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to get elapsed time
app.get("/api/elapsed-time", (req, res) => {
    const now = new Date();
    const elapsedTime = Math.floor((now - startTimeDate) / 1000); // Elapsed time in seconds
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    res.json({ hours, minutes, seconds, elapsedTime });
});

// Endpoint to get trending tags data
app.get('/api/trending-tags', (req, res) => {
    const data = JSON.parse(fs.readFileSync('trendingTags.json', 'utf-8'));
    res.json(data);
});

// Create a Registry to register the metrics
const register = new client.Registry();

// Enable collection of default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Define a custom metric (optional)
const requestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
});
register.registerMetric(requestCounter);

// Use middleware to count requests
app.use((req, res, next) => {
    requestCounter.inc();
    next();
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Your other routes
app.get('/', (req, res) => {
    res.send('Hello from SkyStream!');
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});