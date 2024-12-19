declare module "@modelcontextprotocol/sdk" {
	export interface ServerInfo {
		name: string;
		version: string;
	}

	export interface ServerConfig {
		capabilities: {
			tools: Record<string, unknown>;
			resources: Record<string, unknown>;
		};
	}

	export type RequestHandler<T = unknown, R = unknown> = (
		request: T,
	) => Promise<R>;

	export interface ToolResponse {
		content: Array<{
			type: string;
			text: string;
		}>;
		isError?: boolean;
	}

	export interface ListToolsResponse {
		tools: Array<{
			name: string;
			description: string;
			inputSchema: unknown;
		}>;
	}

	export class Server {
		constructor(info: ServerInfo, config: ServerConfig);

		setRequestHandler<T = unknown, R = unknown>(
			schema: unknown,
			handler: RequestHandler<T, R>,
		): void;

		connect(transport: StdioServerTransport): Promise<void>;
	}

	export class StdioServerTransport {
		constructor();
	}
}
