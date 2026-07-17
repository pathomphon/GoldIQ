const apiUrl = (id: string): string =>
  `${process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1'}/buy-plans/${id}`;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const response = await fetch(apiUrl(id), { method: 'DELETE', cache: 'no-store' });
  return new Response(null, { status: response.status });
}
