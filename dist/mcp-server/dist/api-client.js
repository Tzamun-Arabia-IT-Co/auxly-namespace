import axios from 'axios';
export class ApiClient {
    axios;
    apiKey;
    constructor(baseURL, apiKey) {
        this.apiKey = apiKey;
        this.axios = axios.create({
            baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            }
        });
    }
    async verifyApiKey() {
        const response = await this.axios.get('/api-keys/verify');
        return response.data.user;
    }
    async getTasks(status) {
        const params = status ? { status } : {};
        const response = await this.axios.get('/tasks', { params });
        return response.data;
    }
    async getTask(taskId) {
        const response = await this.axios.get(`/tasks/${taskId}`);
        return response.data;
    }
    async createTask(task) {
        const response = await this.axios.post('/tasks', task);
        return response.data;
    }
    async updateTask(taskId, updates) {
        const response = await this.axios.put(`/tasks/${taskId}`, updates);
        return response.data;
    }
    async deleteTask(taskId) {
        await this.axios.delete(`/tasks/${taskId}`);
    }
    isAuthenticated() {
        return this.apiKey.length > 0;
    }
    getApiKey() {
        return this.apiKey;
    }
}
//# sourceMappingURL=api-client.js.map