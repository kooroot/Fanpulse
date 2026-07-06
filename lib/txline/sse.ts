export type ServerSentEvent = {
  event?: string;
  data: string;
  id?: string;
};

export async function* readServerSentEvents(
  response: Response,
): AsyncGenerator<ServerSentEvent> {
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const raw = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = parseSseBlock(raw);
      if (event) yield event;
      boundary = buffer.indexOf("\n\n");
    }
  }
}

function parseSseBlock(raw: string): ServerSentEvent | undefined {
  const event: ServerSentEvent = { data: "" };

  for (const line of raw.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    const index = line.indexOf(":");
    const field = index >= 0 ? line.slice(0, index) : line;
    const value = index >= 0 ? line.slice(index + 1).trimStart() : "";

    if (field === "event") event.event = value;
    if (field === "id") event.id = value;
    if (field === "data") event.data += event.data ? `\n${value}` : value;
  }

  return event.data ? event : undefined;
}
