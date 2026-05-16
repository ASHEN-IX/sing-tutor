import { PitchDataPoint } from '@/types/api';

export interface WebSocketManager {
  connect(url: string): Promise<void>;
  disconnect(): void;
  onMessage(callback: (data: PitchDataPoint) => void): void;
  send(data: unknown): void;
}

class WebSocketService implements WebSocketManager {
  private ws: WebSocket | null = null;
  private messageCallbacks: ((data: PitchDataPoint) => void)[] = [];
  private url: string = '';

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.url = url;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as PitchDataPoint;
            this.messageCallbacks.forEach((callback) => callback(data));
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(callback: (data: PitchDataPoint) => void): void {
    this.messageCallbacks.push(callback);
  }

  send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const webSocketService = new WebSocketService();
