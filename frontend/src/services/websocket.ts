import { Transaction, Alert } from '../types';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval = 5000;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(
    onTransaction: (tx: Transaction) => void,
    onAlert: (alert: Alert) => void,
    onError?: (error: Event) => void
  ) {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'transaction') {
          onTransaction(message.data);
        } else if (message.type === 'alert') {
          onAlert(message.data);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      if (onError) onError(error);
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected. Reconnecting...');
      setTimeout(() => {
        this.connect(onTransaction, onAlert, onError);
      }, this.reconnectInterval);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default WebSocketService;