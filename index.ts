#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createWorker } from "tesseract.js";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

// Screenshot region types
const ScreenshotArgsSchema = z.object({
	region: z.enum(["left", "right", "full"]).default("left"),
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

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

async function getDisplayDimensions(): Promise<{
	width: number;
	height: number;
}> {
	try {
		// Get the actual pixel dimensions using system_profiler
		const { stdout } = await execFileAsync("system_profiler", [
			"SPDisplaysDataType",
			"-json",
		]);
		const data = JSON.parse(stdout);
		const mainDisplay = data.SPDisplaysDataType[0].spdisplays_ndrvs[0];
		const dimensions = mainDisplay._spdisplays_pixels.split(" x ");

		// Convert dimensions to numbers
		const width = Number(dimensions[0]);
		const height = Number(dimensions[1]);

		if (!width || !height || Number.isNaN(width) || Number.isNaN(height)) {
			throw new Error(
				`Invalid display dimensions: width=${width}, height=${height}`,
			);
		}

		console.error(
			`Debug: Display dimensions - width: ${width}, height: ${height}`,
		);
		return { width, height };
	} catch (error) {
		throw new Error(`Failed to get display dimensions: ${error}`);
	}
}
async function takeScreenshot(
	region: z.infer<typeof ScreenshotArgsSchema>["region"],
): Promise<string> {
	const dateDir = await ensureDateDirectory();
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const filename = `screenshot-${region}-${timestamp}.png`;
	const filepath = join(dateDir, filename);

	try {
		// メインディスプレイのサイズを取得
		const { width, height } = await getDisplayDimensions();
		console.error(
			`Debug: Display dimensions - width: ${width}, height: ${height}`,
		);

		// 常にフルスクリーンでキャプチャ
		await execFileAsync("screencapture", [filepath]);

		// 必要に応じて画像を加工
		if (region !== "full") {
			const tempFilePath = `${filepath}.temp.png`;
			await sharp(filepath).toFile(tempFilePath);

			const metadata = await sharp(tempFilePath).metadata();
			if (!metadata.width || !metadata.height) {
				throw new Error("Failed to get image dimensions");
			}

			const halfWidth = Math.floor(metadata.width / 2);

			// 左半分または右半分を切り出し
			if (region === "left") {
				await sharp(tempFilePath)
					.extract({
						left: 0,
						top: 0,
						width: halfWidth,
						height: metadata.height,
					})
					.toFile(filepath);
			} else if (region === "right") {
				await sharp(tempFilePath)
					.extract({
						left: halfWidth,
						top: 0,
						width: halfWidth,
						height: metadata.height,
					})
					.toFile(filepath);
			}

			// 一時ファイルを削除
			await execFileAsync("rm", [tempFilePath]);
		}

		return filepath;
	} catch (error) {
		throw new Error(`Screenshot capture failed: ${error}`);
	}
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
		},
	},
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: [
		{
			name: "capture",
			description:
				"Captures a screenshot of the specified region (left/right/full) of the screen, saves it to a dated directory in Downloads, and performs OCR.",
			inputSchema: zodToJsonSchema(ScreenshotArgsSchema) as ToolInput,
		},
	],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	try {
		const { name, arguments: args } = request.params;

		if (name !== "capture") {
			throw new Error(`Unknown tool: ${name}`);
		}

		const parsed = ScreenshotArgsSchema.safeParse(args);
		if (!parsed.success) {
			throw new Error(`Invalid arguments: ${parsed.error}`);
		}

		console.error(
			`Debug: Starting screenshot capture for region: ${parsed.data.region}`,
		);
		const imagePath = await takeScreenshot(parsed.data.region);
		console.error(`Debug: Screenshot saved to: ${imagePath}`);

		const ocrText = await performOCR(imagePath);
		console.error("Debug: OCR completed");

		return {
			content: [
				{
					type: "text",
					text: `Screenshot saved to: ${imagePath}\n\nOCR Results:\n${ocrText}`,
				},
			],
		};
	} catch (error) {
		console.error("Error:", error);
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
});

// Start server
async function runServer() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Screenshot MCP server running on stdio");
}

runServer().catch((error) => {
	console.error("Fatal error running server:", error);
	process.exit(1);
});
