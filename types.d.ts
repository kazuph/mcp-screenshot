declare module "applescript" {
	export function execString(
		script: string,
		callback: (err: Error | null, result: unknown) => void,
	): void;

	export function execFile(
		scriptPath: string,
		callback: (err: Error | null, result: unknown) => void,
	): void;
}
