import type { AuthResponse, SessionResponse } from '../types';

// Use relative URL for API endpoints to work with Vite's proxy
const API_BASE_URL = '/api';

export class AuthService {
  private static async fetchWithCredentials(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  static async authenticate(username: string, token: string, room?: string): Promise<AuthResponse> {
    try {
      const response = await this.fetchWithCredentials('/auth', {
        method: 'POST',
        body: JSON.stringify({ username, token, room }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      return data;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  static async checkSession(): Promise<SessionResponse> {
    try {
      const response = await this.fetchWithCredentials('/session', {
        method: 'GET',
      });
      return await response.json();
    } catch (error) {
      console.error('Session check error:', error);
      return { valid: false };
    }
  }

  static async logout(): Promise<void> {
    try {
      await this.fetchWithCredentials('/logout', { 
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
} 