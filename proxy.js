const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');

// Proxy server configuration
const PORT = 8080;

// Create a proxy server
const server = http.createServer((req, res) => {
    // Parse the requested URL
    const requestedUrl = url.parse(req.url);

    // Check if the requested URL includes a search query
    const query = querystring.parse(requestedUrl.query);
    const searchQuery = query.q;

    if (searchQuery) {
        // Perform a search using the specified search query
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

        // Prepare options for the outgoing request
        const options = {
            hostname: url.parse(searchUrl).hostname,
            path: url.parse(searchUrl).path,
            method: 'GET',
            headers: req.headers
        };

        // Make a request to the search engine
        const proxyReq = https.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        // Handle errors
        proxyReq.on('error', (err) => {
            console.error('Proxy request error:', err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Proxy request error');
        });

        // Send the request
        proxyReq.end();
    } else {
        // If no search query is provided, handle the request as usual
        const options = {
            hostname: requestedUrl.hostname,
            port: requestedUrl.port || (requestedUrl.protocol === 'https:' ? 443 : 80),
            path: requestedUrl.path,
            method: req.method,
            headers: req.headers
        };

        // Decide whether to use HTTP or HTTPS module based on the protocol of the requested URL
        const proxyReq = (requestedUrl.protocol === 'https:' ? https.request : http.request)(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        // Handle errors
        proxyReq.on('error', (err) => {
            console.error('Proxy request error:', err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Proxy request error');
        });

        // Pipe the request body, if any
        req.pipe(proxyReq);
    }

    // Log the request
    console.log(`${req.method} ${req.url}`);
});

// Start the proxy server
server.listen(PORT, () => {
    console.log(`Proxy server listening on port ${PORT}`);
});
