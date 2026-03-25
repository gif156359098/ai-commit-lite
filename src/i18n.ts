import * as vscode from 'vscode';

export type Locale = 'en' | 'zh-cn' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'ru' | 'pt' | 'it';

export type MessageKey = string;

const messages: Record<Locale, Record<string, string>> = {
  en: require('./i18n/locales/en.json'),
  'zh-cn': require('./i18n/locales/zh-cn.json'),
  ja: require('./i18n/locales/ja.json'),
  ko: require('./i18n/locales/ko.json'),
  es: require('./i18n/locales/es.json'),
  fr: require('./i18n/locales/fr.json'),
  de: require('./i18n/locales/de.json'),
  ru: require('./i18n/locales/ru.json'),
  pt: require('./i18n/locales/pt.json'),
  it: require('./i18n/locales/it.json')
};

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const locale = getLocale();
  const template = messages[locale][key] ?? messages.en[key] ?? key;

  return template.replace(/\{(\w+)\}/g, (_, placeholder) => {
    const value = params?.[placeholder];
    return value === undefined ? `{${placeholder}}` : String(value);
  });
}

export function getLocale(): Locale {
  const language = vscode.env.language.toLowerCase();

  const localeMap: Record<string, Locale> = {
    'zh': 'zh-cn',
    'zh-cn': 'zh-cn',
    'en': 'en',
    'ja': 'ja',
    'ko': 'ko',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'ru': 'ru',
    'pt': 'pt',
    'it': 'it'
  };

  return localeMap[language] || localeMap[language.split('-')[0]] || 'en';
}
