/* Applied inline in <head> so language and appearance are set before paint. */
window.portfolioPreferences = (() => {
    const keys = {
        language: 'qi-wang-portfolio.language.v1',
        languageSource: 'qi-wang-portfolio.language-source.v1',
        theme: 'qi-wang-portfolio.theme.v1'
    };
    const chineseZones = new Set(['Asia/Shanghai', 'Asia/Chongqing', 'Asia/Chungking', 'Asia/Harbin', 'Asia/Urumqi', 'Asia/Hong_Kong', 'Asia/Macau', 'Asia/Macao', 'Asia/Taipei', 'PRC', 'ROC']);
    const read = (key, choices) => {
        try { const value = localStorage.getItem(key); return choices.includes(value) ? value : null; }
        catch { return null; }
    };
    const save = (key, value) => {
        try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); }
        catch { /* Keep this page usable when storage is unavailable. */ }
    };
    let languageChoice = read(keys.language, ['zh', 'en']);
    let languageSource = read(keys.languageSource, ['timezone', 'browser']) || 'timezone';
    let themeChoice = read(keys.theme, ['light', 'dark', 'system']);
    let started = false;
    const systemTheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function browserLanguage() {
        const languages = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
        for (const language of languages) {
            if (/^zh(?:-|$)/i.test(language)) return 'zh';
            if (/^en(?:-|$)/i.test(language)) return 'en';
        }
        return null;
    }

    function timezoneLanguage() {
        let zone = '';
        try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch {}
        return zone ? (chineseZones.has(zone) ? 'zh' : 'en') : (browserLanguage() || 'en');
    }

    function automaticTheme() {
        if (themeChoice === 'system') return systemTheme?.matches ? 'dark' : 'light';
        const hour = new Date().getHours();
        return Number.isFinite(hour) ? (hour >= 7 && hour < 19 ? 'light' : 'dark') : (systemTheme?.matches ? 'dark' : 'light');
    }

    function apply() {
        const language = languageChoice || (languageSource === 'browser' ? browserLanguage() || timezoneLanguage() : timezoneLanguage());
        const theme = ['light', 'dark'].includes(themeChoice) ? themeChoice : automaticTheme();
        const languageSetting = languageChoice || languageSource;
        const themeSetting = themeChoice || 'time';
        const root = document.documentElement;
        root.dataset.lang = language;
        root.dataset.theme = theme;
        root.dataset.languageMode = languageChoice ? 'manual' : 'auto';
        root.dataset.themeMode = ['light', 'dark'].includes(themeChoice) ? 'manual' : 'auto';
        root.dataset.languageSource = languageSource;
        root.dataset.themeSource = themeSetting;
        root.lang = language === 'zh' ? 'zh-CN' : 'en';
        root.style.colorScheme = theme;
        const resume = document.getElementById('resume-btn');
        if (resume) resume.href = language === 'zh' ? 'Resume_CN.pdf' : 'Resume_EN.pdf';
        const languageButton = document.getElementById('language-btn');
        if (languageButton) languageButton.setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换到中文');
        const themeButton = document.getElementById('theme-btn');
        if (themeButton) themeButton.setAttribute('aria-label', language === 'zh' ? (theme === 'dark' ? '切换至浅色模式' : '切换至深色模式') : (theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'));
        document.querySelectorAll('[data-label-en]').forEach(element => element.setAttribute('aria-label', element.dataset[language === 'zh' ? 'labelZh' : 'labelEn']));
        document.querySelectorAll('[data-text-en]').forEach(element => { element.textContent = element.dataset[language === 'zh' ? 'textZh' : 'textEn']; });
        const languageSelect = document.getElementById('language-setting');
        if (languageSelect) languageSelect.value = languageSetting;
        const themeSelect = document.getElementById('theme-setting');
        if (themeSelect) themeSelect.value = themeSetting;
        const status = document.getElementById('preference-status');
        if (status) {
            const langMode = languageChoice ? (language === 'zh' ? '手动' : 'manual') : (language === 'zh' ? '自动' : 'automatic');
            const appearanceMode = ['light', 'dark'].includes(themeChoice) ? (language === 'zh' ? '手动' : 'manual') : (language === 'zh' ? '自动' : 'automatic');
            status.textContent = language === 'zh'
                ? `当前：中文（${langMode}） · ${theme === 'dark' ? '暗色' : '明亮'}（${appearanceMode}）`
                : `Current: English (${langMode}) · ${theme === 'dark' ? 'Dark' : 'Light'} (${appearanceMode})`;
        }
        window.dispatchEvent(new CustomEvent('portfolio:preferences', { detail: { language, theme } }));
        return { language, theme, languageSetting, themeSetting };
    }

    function setLanguage(value) {
        if (['zh', 'en'].includes(value)) {
            languageChoice = value;
            save(keys.language, value);
        } else if (['timezone', 'browser'].includes(value)) {
            languageChoice = null;
            languageSource = value;
            save(keys.language, null);
            save(keys.languageSource, value);
        }
        return apply();
    }

    function setTheme(value) {
        if (!['light', 'dark', 'system', 'time'].includes(value)) return apply();
        themeChoice = value === 'time' ? null : value;
        save(keys.theme, themeChoice);
        return apply();
    }

    function resetLanguage() {
        languageChoice = null;
        languageSource = 'timezone';
        save(keys.language, null);
        save(keys.languageSource, null);
        return apply();
    }

    function resetTheme() {
        themeChoice = null;
        save(keys.theme, null);
        return apply();
    }

    function reset() { resetLanguage(); return resetTheme(); }

    function start() {
        apply();
        if (started) return;
        started = true;
        window.setInterval(() => { if (document.visibilityState !== 'hidden') apply(); }, 60000);
        ['focus', 'pageshow', 'languagechange'].forEach(event => window.addEventListener(event, apply));
        document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden') apply(); });
        systemTheme?.addEventListener?.('change', () => { if (themeChoice === 'system') apply(); });
        window.addEventListener('storage', event => {
            if (event.key && !Object.values(keys).includes(event.key)) return;
            languageChoice = read(keys.language, ['zh', 'en']);
            languageSource = read(keys.languageSource, ['timezone', 'browser']) || 'timezone';
            themeChoice = read(keys.theme, ['light', 'dark', 'system']);
            apply();
        });
    }
    return { apply, setLanguage, setTheme, resetLanguage, resetTheme, reset, start };
})();
window.portfolioPreferences.apply();
