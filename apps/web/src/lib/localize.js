const FIELD_BY_LANG = { uz: 'Uz', ru: 'Ru', en: 'En' };

export function localizedField(obj, baseField, lang) {
  if (!obj) return '';
  const suffix = FIELD_BY_LANG[lang] || 'Uz';
  return obj[`${baseField}${suffix}`] ?? obj[`${baseField}Uz`] ?? '';
}
