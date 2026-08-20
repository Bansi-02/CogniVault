// Central API config — all URLs come from .env, never hardcode localhost
export const NODE_URL = import.meta.env.VITE_NODE_URL || 'http://localhost:5000';
export const PYTHON_URL = import.meta.env.VITE_PYTHON_URL || 'http://localhost:8000';
