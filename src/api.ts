import type { HealthResponse, StreamEvent, TraceRequest, TraceResult } from '../shared/types';

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch('/api/health');
  if (!response.ok) {
    throw new Error(`The API server answered with HTTP ${response.status}. Check that it is running on port 5174.`);
  }
  return (await response.json()) as HealthResponse;
}

/**
 * Starts a trace and reports progress events as they arrive.
 * Resolves with the final result, or rejects with the real error message from the server.
 */
export async function traceClaim(
  request: TraceRequest,
  onEvent: (event: StreamEvent) => void
): Promise<TraceResult> {
  const response = await fetch('/api/trace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok || !response.body) {
    let message = `Request failed with HTTP ${response.status}. Check that the API server is running on port 5174.`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Keep the generic message.
    }
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: TraceResult | null = null;

  const handleLine = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as StreamEvent;
    if (event.type === 'error') throw new Error(event.message);
    if (event.type === 'result') result = event.data;
    onEvent(event);
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline = buffer.indexOf('\n');
    while (newline >= 0) {
      handleLine(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf('\n');
    }
  }
  handleLine(buffer);

  if (!result) throw new Error('The trace ended without a result. Check the API server log.');
  return result;
}
