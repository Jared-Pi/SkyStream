const express = require('express');
const path = require('path');
const client = require('prom-client');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Record the start time when the server starts
const startTimeDate = new Date();

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

// Define a custom metric
const requestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
});
register.registerMetric(requestCounter);

// Custom metric for tracking requests to /api/trending-tags
const trendingTagsRequests = new client.Counter({
    name: 'trending_tags_requests_total',
    help: 'Total number of requests to /api/trending-tags',
});
register.registerMetric(trendingTagsRequests);

// Middleware to count requests to /api/trending-tags
app.use('/api/trending-tags', (req, res, next) => {
    trendingTagsRequests.inc();
    next();
});

// Custom metric for tracking the number of trending tags
const trendingTagsCount = new client.Gauge({
    name: 'trending_tags_count',
    help: 'Number of trending tags returned by /api/trending-tags',
});
register.registerMetric(trendingTagsCount);

// Update trendingTagsCount in the /api/trending-tags endpoint
app.get('/api/trending-tags', (req, res) => {
    const data = JSON.parse(fs.readFileSync('trendingTags.json', 'utf-8'));
    trendingTagsCount.set(data.length); // Set the number of trending tags
    res.json(data);
});

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

const requestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5] // Define buckets for response times
});
register.registerMetric(requestDuration);

// Middleware to measure request duration
app.use((req, res, next) => {
    const end = requestDuration.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
    });
    next();
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});