export function loadConfig() {
    const apiKey = process.env.AUXLY_API_KEY || undefined;
    return {
        apiUrl: process.env.AUXLY_API_URL || 'http://localhost:7000',
        apiKey
    };
}
//# sourceMappingURL=config.js.map