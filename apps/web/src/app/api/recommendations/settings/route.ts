const apiUrl = (): string =>
  `${process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1'}/recommendations/settings`;

export async function PATCH(request: Request): Promise<Response> {
  const response = await fetch(apiUrl(), {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
    cache: 'no-store',
  });
  return new Response(await response.text(), {
    status: response.status,
    headers: { 'content-type': 'application/json' },
  });
}
