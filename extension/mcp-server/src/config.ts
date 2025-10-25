/**
 * Configuration Management
 */

// Note: dotenv is NOT needed here because Cursor sets env vars via settings.json mcpServers.auxly.env
// Using dotenv would output to stdout and break the MCP JSON-RPC protocol!

export interface Config {
    apiUrl: string;
    apiKey: string | undefined;
}

export function loadConfig(): Config {
    const apiKey = process.env.AUXLY_API_KEY || undefined;

    return {
        apiUrl: process.env.AUXLY_API_URL || 'http://localhost:7000',
        apiKey
    };
}

