import next from 'next';
import http from 'http';

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = '0.0.0.0';

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

http.createServer((req, res) => {
    handle(req, res);
}).listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
});