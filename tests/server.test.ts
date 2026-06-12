import { spawn } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const distEntry = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist/index.js"
);

// Boots the real compiled stdio server and exercises the MCP handshake.
// Screen capture itself is macOS-only and needs a display, so CI verifies
// the protocol surface: clean JSON-RPC on stdout and the advertised tool.
describe("mcp-screenshot server", () => {
  it("responds to initialize and tools/list over stdio", async () => {
    const result = await new Promise<{
      stdoutLines: string[];
    }>((resolve, reject) => {
      const p = spawn("node", [distEntry]);
      let out = "";
      p.stdout.on("data", (d) => {
        out += d.toString();
      });
      p.on("error", reject);
      const send = (o: object) => p.stdin.write(`${JSON.stringify(o)}\n`);
      send({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      });
      setTimeout(
        () => send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
        600
      );
      setTimeout(() => {
        p.kill();
        resolve({ stdoutLines: out.trim().split("\n").filter(Boolean) });
      }, 1800);
    });

    // stdout must be pure JSON-RPC
    const parsed = result.stdoutLines.map((l) => JSON.parse(l));
    const tools = parsed.find((m) => m.id === 2);
    expect(tools?.result?.tools?.length).toBeGreaterThanOrEqual(1);
    const names = tools.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain("capture");
  });
});
