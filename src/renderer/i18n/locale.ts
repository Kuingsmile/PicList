type SupportedLocale = 'en' | 'zh-CN' | 'zh-TW'

export function getInitialLocale(savedLocale: string | null, systemLocale: string): SupportedLocale {
  if (savedLocale === 'en' || savedLocale === 'zh-CN' || savedLocale === 'zh-TW') {
    return savedLocale
  }

  try {
    const locale = new Intl.Locale(systemLocale)
    if (locale.language === 'zh') {
      return locale.maximize().script === 'Hant' ? 'zh-TW' : 'zh-CN'
    }
  } catch {
    // Ignore malformed system locales and use the default language.
  }

  return 'en'
}
