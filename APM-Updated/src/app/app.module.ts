import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// Dostupan je celoj aplikaciji zato sto:
// When registering service with Angular module,
// the Service is registered with Root injector.
// servis je registrovan sa root indjektorom
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import { AppComponent }  from './app.component';
import { WelcomeComponent } from './home/welcome.component';

/* Feature Modules */
import { ProductModule } from './products/product.module';

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    RouterModule.forRoot([
      { path: 'welcome', component: WelcomeComponent },
      { path: '', redirectTo: 'welcome', pathMatch: 'full' },
      { path: '**', redirectTo: 'welcome', pathMatch: 'full' }
    ]),
    ProductModule
  ],
  declarations: [
    AppComponent,
    WelcomeComponent
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
