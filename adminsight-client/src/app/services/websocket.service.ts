import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private subject: Subject<string> | null = null;

  connect(systemId: number): Observable<string> {
    console.log(`Intentando conectar a ws://localhost:8800/ws/terminal/${systemId}/`); // Log de la URL
    this.socket = new WebSocket(`ws://localhost:8800/ws/terminal/${systemId}/`);
    this.subject = new Subject<string>();

    this.socket.onopen = () => {
      console.log('WebSocket connection established'); // Log de conexión exitosa
    };

    this.socket.onmessage = (event) => {
      console.log('Mensaje recibido:', event.data); // Log de mensaje recibido
      this.subject?.next(event.data);
    };

    this.socket.onerror = (event) => {
      console.error('Error WebSocket:', event); // Log de error
      this.subject?.error(event);
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed', event); // Log de conexión cerrada
      this.subject?.complete();
    };

    return this.subject.asObservable();
  }

  sendCommand(command: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('Enviando comando:', command); // Log de comando enviado
      this.socket.send(command);
    }
  }

  close() {
    if (this.socket) {
      console.log('Cerrando conexión WebSocket'); // Log de cierre de conexión
      this.socket.close();
    }
  }
}
