import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../app.layout.service';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-language-switcher',
    imports: [CommonModule, RadioButtonModule, FormsModule, TranslateModule],
    templateUrl: './app-language-switcher.component.html'
})
export class AppLanguageSwitcher {
    selectedLanguage: string;
    selectedFontSize: string;
    private translate: TranslateService = inject(TranslateService);
    private layoutService: LayoutService = inject(LayoutService);

    constructor() {
        this.selectedLanguage = this.translate.currentLang || this.translate.defaultLang || 'en';
        this.selectedFontSize = this.layoutService.layoutConfig().fontSize || '1rem';
    }

    onLanguageChange(language: string) {
        this.selectedLanguage = language;
        this.translate.use(language);
    }

    onFontSizeChange(size: string) {
        this.selectedFontSize = size;
        this.layoutService.updateLayoutConfig({ fontSize: size });
    }
}
