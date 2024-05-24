import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.css']
})
export class TerminalComponent implements OnInit, OnDestroy {
  output: string[] = [];
  subscription: Subscription | null = null;
  command: string = '';
  isConnecting: boolean = false;
  isConnected: boolean = false;

  private serverId: number = Number(this.router.url.split('/')[2]);

  constructor(
    private wsService: WebSocketService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    console.log('Iniciando TerminalComponent');
    this.connect();
  }

  connect() {
    if (this.serverId) {
      this.isConnecting = true;
      console.log('Intentando conectar al servidor con ID:', this.serverId); // Log de conexión
      this.subscription = this.wsService.connect(this.serverId).subscribe(
        (message: string) => {
          console.log('Mensaje recibido:', message); // Log de mensaje recibido
          this.output.push(message);
          this.isConnected = true;
          this.isConnecting = false;
        },
        (error) => {
          console.error('Error al conectar al WebSocket:', error); // Log de error
          this.isConnecting = false;
          this.isConnected = false;
        }
      );
    }
  }

  sendCommand() {
    if (this.command.trim() && this.isConnected) {
      console.log('Enviando comando:', this.command); // Log de comando enviado
      this.wsService.sendCommand(this.command);
      this.command = '';
    }
  }

  ngOnDestroy() {
    console.log('Destruyendo TerminalComponent'); // Log de destrucción del componente
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.wsService.close();
  }
}
