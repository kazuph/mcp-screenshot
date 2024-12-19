#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type {
	CallToolRequest,
	ListToolsRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createWorker } from "tesseract.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const execFileAsync = promisify(execFile);

// Screenshot region types
type Region = "left" | "right" | "full";

const ScreenshotArgsSchema = z.object({
	region: z.enum(["left", "right", "full"]).default("left"),
});

interface ScreenshotResult {
	imagePath: string;
	ocrText: string;
}

async function ensureDateDirectory(): Promise<string> {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");

	const downloadDir = join(homedir(), "Downloads");
	const dateDir = join(downloadDir, `${year}${month}${day}`);

	await mkdir(dateDir, { recursive: true });
	return dateDir;
}

async function takeScreenshot(region: Region): Promise<string> {
	const dateDir = await ensureDateDirectory();
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const filename = `screenshot-${region}-${timestamp}.png`;
	const filepath = join(dateDir, filename);

	// AppleScript to capture screenshot of specified region
	let bounds;
	switch (region) {
		case "left":
			bounds = "0, 0, (item 3 of res) div 2, item 4 of res";
			break;
		case "right":
			bounds = "(item 3 of res) div 2, 0, item 3 of res, item 4 of res";
			break;
		case "full":
			bounds = "0, 0, item 3 of res, item 4 of res";
			break;
	}

	const script = `
    tell application "System Events"
      set res to get size of window 1 of (first application process whose frontmost is true)
      set {x, y, w, h} to {${bounds}}
      do shell script "screencapture -R " & x & "," & y & "," & w & "," & h & " " & quoted form of "${filepath}"
    end tell
  `;

	await execFileAsync("osascript", ["-e", script]);
	return filepath;
}

async function performOCR(imagePath: string): Promise<string> {
	const worker = await createWorker("eng");
	const {
		data: { text },
	} = await worker.recognize(imagePath);
	await worker.terminate();
	return text;
}

// Server setup
const server = new Server(
	{
		name: "mcp-screenshot",
		version: "1.0.0",
	},
	{
		capabilities: {
			tools: {},
			resources: {},
		},
	},
);

server.setRequestHandler(
	z.object({ method: z.literal("tools/list") }),
	async () => ({
		tools: [
			{
				name: "capture",
				description:
					"Captures a screenshot of the specified region (left/right/full), saves it to a dated directory in Downloads, and performs OCR.",
				inputSchema: zodToJsonSchema(ScreenshotArgsSchema),
			},
		],
	}),
);

server.setRequestHandler(
	z.object({
		method: z.literal("tools/call"),
		params: z.object({
			name: z.string(),
			arguments: z.record(z.unknown()).optional(),
		}),
	}),
	async (request) => {
		try {
			const { name, arguments: args } = request.params;

			if (name !== "capture") {
				throw new Error(`Unknown tool: ${name}`);
			}

			const parsed = ScreenshotArgsSchema.safeParse(args);
			if (!parsed.success) {
				throw new Error(`Invalid arguments: ${parsed.error}`);
			}

			const imagePath = await takeScreenshot(parsed.data.region);
			const ocrText = await performOCR(imagePath);

			return {
				content: [
					{
						type: "text",
						text: `Screenshot saved to: ${imagePath}\n\nOCR Results:\n${ocrText}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	},
);

// Start server
async function runServer() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Screenshot MCP server running on stdio");
}

runServer().catch((error) => {
	process.stderr.write(`Fatal error running server: ${error}\n`);
	process.exit(1);
});
