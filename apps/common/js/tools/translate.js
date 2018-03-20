import translations from '../lang';

const defaultLang = 'en_us',
      varRegExp = /\$\{\s*(\d+)\s*\}/g,
      error = '** TRANSLATION ERROR **';

const translateString = (key, lang) => translations[lang] && translations[lang][key] || key;

/**
 * Translates strings if they exist in the language file. Otherwise, passes back
 * string unchanged.
 * You can also pass an array of strings, where the first is the main text, and
 * the others are variables to be placed in the string:
 *   ["Good ${0}, ${1}", "evening", "User"]
 * will return "Good evening, User". Each string in the array may optionally be
 * in the language file:
 *   ["~TIME_SENSITIVE_GREETING", "~TIME.EVENING", "User"]
 */
export default function translate(key, lang=defaultLang) {
  if (typeof key === 'string') {
    return translateString(key, lang);
  } else if (Array.isArray(key)) {
    let translation = translateString(key[0], lang);
    return translation.replace(varRegExp, (match, id) =>
      key[++id] ? translateString(key[id], lang) : error);
  } else if (key != null) {
    console.log('Could not translate: ', key);
  }
  return error;
}
