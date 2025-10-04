# How to Add Translations to Any Page

## Quick Start Guide

### Step 1: Import useTranslation Hook

At the top of your component file:

```tsx
import { useTranslation } from 'react-i18next';
```

### Step 2: Use the Hook in Your Component

```tsx
export default function MyPage() {
  const { t } = useTranslation();
  
  // Now you can use t() to translate!
  return (
    <div>
      <h1>{t('page.section.key')}</h1>
    </div>
  );
}
```

### Step 3: Add Translation Keys

Add your text to ALL language files in `src/lib/locales/`:

**en-full.json** (English):
```json
{
  "page": {
    "section": {
      "key": "Your English Text"
    }
  }
}
```

**es-full.json** (Spanish):
```json
{
  "page": {
    "section": {
      "key": "Tu Texto en Español"
    }
  }
}
```

Repeat for all 10 language files!

## Complete Example

### Before (Hardcoded):
```tsx
export default function Dashboard() {
  return (
    <div>
      <h1>Welcome to Dashboard</h1>
      <p>View your appointments</p>
      <button>Book Now</button>
    </div>
  );
}
```

### After (Translated):
```tsx
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.viewAppointments')}</p>
      <button>{t('dashboard.bookNow')}</button>
    </div>
  );
}
```

### Translation Files:
```json
// en-full.json
{
  "dashboard": {
    "title": "Welcome to Dashboard",
    "viewAppointments": "View your appointments",
    "bookNow": "Book Now"
  }
}

// es-full.json
{
  "dashboard": {
    "title": "Bienvenido al Panel",
    "viewAppointments": "Ver tus citas",
    "bookNow": "Reservar Ahora"
  }
}
```

## Translation with Variables

If you need to insert dynamic data:

```tsx
// In component
<p>{t('booking.selectedDate', { date: 'Jan 15, 2025' })}</p>

// In translation file
{
  "booking": {
    "selectedDate": "You selected: {{date}}"
  }
}
```

## Translation with Plurals

```tsx
// In component
<p>{t('messages.count', { count: 5 })}</p>

// In translation file
{
  "messages": {
    "count_one": "{{count}} message",
    "count_other": "{{count}} messages"
  }
}
```

## Naming Conventions

Use hierarchical structure:

```
feature.section.element
```

Examples:
- `home.hero.title`
- `auth.login.button`
- `dashboard.appointments.upcoming`
- `search.filters.specialty`
- `profile.edit.saveButton`

## Common Mistakes to Avoid

### ❌ Wrong: Hardcoded text
```tsx
<h1>Find a Doctor</h1>
```

### ✅ Correct: Using translation
```tsx
<h1>{t('search.title')}</h1>
```

---

### ❌ Wrong: Changing the key names
```json
// en-full.json
{
  "home": {
    "title": "Welcome"
  }
}

// es-full.json
{
  "inicio": {  // ❌ Different key!
    "titulo": "Bienvenido"
  }
}
```

### ✅ Correct: Keep keys the same
```json
// en-full.json
{
  "home": {
    "title": "Welcome"
  }
}

// es-full.json
{
  "home": {  // ✅ Same key!
    "title": "Bienvenido"
  }
}
```

---

### ❌ Wrong: Not escaping quotes
```json
{
  "message": "I'm can't do this"  // ❌ Breaks JSON!
}
```

### ✅ Correct: Escape quotes or use different quotes
```json
{
  "message": "I'm can't do this"  // ✅ Use straight quotes
}
```

## Testing Your Translations

1. Add translation keys to all 10 language files
2. Use `t()` in your component
3. Run the app
4. Click language switcher
5. Verify text changes for each language!

## What If Translation Is Missing?

The system will:
1. Try the selected language (e.g., Spanish)
2. If missing, fall back to English
3. If still missing, show the key name

Example:
```tsx
{t('missing.key')}  // Shows "missing.key" if not found
```

## Quick Checklist

- [ ] Imported `useTranslation`
- [ ] Used `const { t } = useTranslation()`
- [ ] Replaced all hardcoded text with `t('key')`
- [ ] Added keys to ALL 10 language files
- [ ] Kept key structure identical across all files
- [ ] Only translated the VALUES, not the keys
- [ ] Tested language switching

## Files to Update

When adding new translations, update these 10 files:

1. `src/lib/locales/en-full.json` (English)
2. `src/lib/locales/es-full.json` (Spanish)
3. `src/lib/locales/fr-full.json` (French)
4. `src/lib/locales/de-full.json` (German)
5. `src/lib/locales/pt-full.json` (Portuguese PT)
6. `src/lib/locales/pt-BR-full.json` (Portuguese BR)
7. `src/lib/locales/ar-full.json` (Arabic)
8. `src/lib/locales/ko-full.json` (Korean)
9. `src/lib/locales/ms-full.json` (Malay)
10. `src/lib/locales/id-full.json` (Indonesian)

## Need Help?

Check these examples:
- `src/pages/HomePage.tsx` - Fully translated page
- `src/components/LanguageSwitcher.tsx` - Language switcher component
- `src/lib/i18n.ts` - i18n configuration
- `src/lib/locales/en-full.json` - English template

---

**Remember**: Translation keys are in English, but translation VALUES are in each language!
