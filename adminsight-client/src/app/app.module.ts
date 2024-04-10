import { APP_INITIALIZER, Inject, NgModule, Optional } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ServerListComponent } from './components/server-list/server-list.component';
import { LoginServerComponent } from './components/login-server/login-server.component';
import { SshFormComponent } from './components/ssh-form/ssh-form.component';
import { isPlatformServer } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { RegisterServerComponent } from './components/register-server/register-server.component';
import { ServerOptionsComponent } from './components/server-options/server-options.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { OsInfoComponent } from './components/options/os-info/os-info.component';
import { HardwareComponent } from './components/options/hardware/hardware.component';
import { ProcessesComponent } from './components/options/processes/processes.component';
import { ServicesComponent } from './components/options/services/services.component';
import { FilterServicesPipe } from './pipes/filter-services.pipe';
import { OrderByPipe } from './pipes/order-by.pipe';

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
    SshFormComponent,
    RegisterServerComponent,
    ServerOptionsComponent,
    DashboardComponent,
    OsInfoComponent,
    HardwareComponent,
    ProcessesComponent,
    ServicesComponent,
    FilterServicesPipe,
    OrderByPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
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