// terminal.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

interface TerminalItem {
  type: 'command' | 'output';
  value: string;
}

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
})
export class TerminalComponent implements OnInit, OnDestroy {
  terminalHistory: TerminalItem[] = [];
  subscription: Subscription | null = null;
  command: string = '';
  isConnecting: boolean = false;
  isConnected: boolean = false;
  currentDirectory: string = '/'; // Directorio actual inicial

  private serverId: number = Number(this.router.url.split('/')[2]);

  constructor(
    private wsService: WebSocketService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.connect();
  }

  connect() {
    if (this.serverId) {
      this.isConnecting = true;
      this.subscription = this.wsService.connect(this.serverId).subscribe(
        (message: string) => {
          this.handleServerResponse(message);
          this.isConnected = true;
          this.isConnecting = false;
        },
        (error) => {
          console.error('Error al conectar al WebSocket:', error);
          this.isConnecting = false;
          this.isConnected = false;
        }
      );
    }
  }

  sendCommand() {
    if (this.command.trim() && this.isConnected) {
      const prompt = `$~ ${this.currentDirectory} ${this.command}`;
      this.terminalHistory.push({ type: 'command', value: prompt });
      this.wsService.sendCommand(this.command);
      this.command = '';
      this.scrollToBottom();
    }
  }

  handleServerResponse(message: string) {
    // Verificar si el mensaje es una respuesta al comando 'cd'
    if (message.includes('cd')) {
      const newDirectory = message.split(':')[1].trim();
      this.currentDirectory = newDirectory;
    } else {
      this.terminalHistory.push({ type: 'output', value: message });
    }
    this.scrollToBottom();
  }

  scrollToBottom() {
    setTimeout(() => {
      const terminalOutput = document.querySelector('.terminal-output');
      terminalOutput?.scrollTo(0, terminalOutput.scrollHeight);
    }, 0);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.wsService.close();
  }
}