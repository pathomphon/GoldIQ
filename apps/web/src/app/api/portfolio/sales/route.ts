function apiUrl(): string {
  const baseUrl = process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1';
  return `${baseUrl}/portfolio/sales`;
}

export async function POST(request: Request): Promise<Response> {
  const response = await fetch(apiUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
    cache: 'no-store',
  });
  return new Response(await response.text(), {
    status: response.status,
    headers: { 'content-type': 'application/json' },
  });
}
