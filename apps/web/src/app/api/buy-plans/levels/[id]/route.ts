const apiUrl = (id: string): string =>
  `${process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1'}/buy-plans/levels/${id}`;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const response = await fetch(apiUrl(id), {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
    cache: 'no-store',
  });
  return new Response(await response.text(), { status: response.status });
}
