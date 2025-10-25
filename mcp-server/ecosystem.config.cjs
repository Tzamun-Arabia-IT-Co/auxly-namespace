// PM2 Configuration for Auxly MCP Server
// Auto-restart on crash, memory monitoring, log management

module.exports = {
  apps: [{
    name: 'auxly-mcp',
    script: './dist/index.js',
    cwd: __dirname,
    
    // Auto-restart configuration
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Restart delay with exponential backoff
    restart_delay: 1000,
    exp_backoff_restart_delay: 100,
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      AUXLY_API_URL: process.env.AUXLY_API_URL || 'http://localhost:7000',
      AUXLY_API_KEY: process.env.AUXLY_API_KEY || ''
    },
    
    // Memory management
    max_memory_restart: '300M',
    
    // Logging
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Process management
    kill_timeout: 3000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};

