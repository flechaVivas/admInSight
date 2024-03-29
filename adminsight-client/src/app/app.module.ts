import { APP_INITIALIZER, Inject, NgModule, Optional } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ServerListComponent } from './components/server-list/server-list.component';
import { LoginServerComponent } from './components/login-server/login-server.component';
import { SshFormComponent } from './components/ssh-form/ssh-form.component';
import { isPlatformServer } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

function initializeApp(platformId: Object): () => void {
  return () => {
    if (!isPlatformServer(platformId)) {
      // Aquí puedes agregar cualquier lógica adicional que se deba ejecutar solo en el cliente
    }
  };
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    SidebarComponent,
    ServerListComponent,
    LoginServerComponent,
    SshFormComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    provideClientHydration(),
    provideHttpClient(withFetch()),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [
        [new Optional(), new Inject(PLATFORM_ID)]
      ],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }