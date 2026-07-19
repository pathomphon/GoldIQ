interface RouteContext {
  readonly params: Promise<{ id: string }>;
}

function apiUrl(id: string): string {
  const baseUrl = process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1';
  return `${baseUrl}/portfolio/sales/${encodeURIComponent(id)}`;
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const response = await fetch(apiUrl(id), {
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

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const response = await fetch(apiUrl(id), {
    method: 'DELETE',
    cache: 'no-store',
  });
  return new Response(response.status === 204 ? null : await response.text(), {
    status: response.status,
  });
}
