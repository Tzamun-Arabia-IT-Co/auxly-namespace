/**
 * Test Utilities for Auxly Extension
 * Simple functions to test MCP workflow functionality
 */

/**
 * Returns a Hello World greeting message
 * @returns A string containing "Hello World"
 */
export function getHelloWorld(): string {
    return 'Hello World';
}

/**
 * Returns a personalized greeting
 * @param name - The name to greet
 * @returns A personalized greeting message
 */
export function getGreeting(name: string): string {
    return `Hello, ${name}! Welcome to Auxly.`;
}

/**
 * Test function to verify MCP workflow
 * @returns An object with test status and message
 */
export function testMcpWorkflow(): { status: 'success' | 'failure'; message: string } {
    try {
        const greeting = getHelloWorld();
        if (greeting === 'Hello World') {
            return {
                status: 'success',
                message: 'MCP workflow test passed! All systems operational.'
            };
        }
        return {
            status: 'failure',
            message: 'Unexpected greeting message'
        };
    } catch (error) {
        return {
            status: 'failure',
            message: `Test failed: ${error}`
        };
    }
}

