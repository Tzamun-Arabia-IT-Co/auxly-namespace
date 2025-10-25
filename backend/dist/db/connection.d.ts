import { Pool, PoolClient, QueryResult } from 'pg';
export declare const pool: Pool;
export declare const testConnection: () => Promise<void>;
export declare const query: (text: string, params?: any[]) => Promise<QueryResult>;
export declare const transaction: <T>(callback: (client: PoolClient) => Promise<T>) => Promise<T>;
export declare const closePool: () => Promise<void>;
export declare function getPool(): Pool;
export default pool;
//# sourceMappingURL=connection.d.ts.map