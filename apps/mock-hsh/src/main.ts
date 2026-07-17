import { createServer, type ServerResponse } from 'node:http';

import { createGold965Fixture, createGold9999Fixture } from './fixtures.js';

const port = Number(process.env.MOCK_HSH_PORT ?? 4010);

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

const server = createServer((request, response) => {
  const path = new URL(request.url ?? '/', 'http://localhost').pathname;

  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'method_not_allowed' });
    return;
  }

  if (path === '/health') {
    sendJson(response, 200, {
      status: 'ok',
      service: 'mock-hsh',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (path === '/api/values/getprice/') {
    sendJson(response, 200, createGold965Fixture());
    return;
  }

  if (path === '/api/values') {
    sendJson(response, 200, createGold9999Fixture());
    return;
  }

  sendJson(response, 404, { error: 'not_found' });
});

server.listen(port, '0.0.0.0', () => {
  process.stdout.write(
    `${JSON.stringify({
      level: 'info',
      service: 'mock-hsh',
      message: 'Mock Hua Seng Heng API listening',
      port,
    })}\n`,
  );
});

function shutdown(signal: string): void {
  process.stdout.write(
    `${JSON.stringify({
      level: 'info',
      service: 'mock-hsh',
      message: 'Shutting down',
      signal,
    })}\n`,
  );
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
