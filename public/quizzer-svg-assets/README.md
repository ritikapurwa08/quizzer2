# Quizzer SVG Assets

All icons are editable vector SVGs.

## Files
- `quizzer-logo.svg`: scalable Q-inspired brand mark, 512×512 viewBox
- `section-a-geography.svg` through `section-e-english.svg`: five subject/section icons
- `nav-dashboard.svg`, `nav-syllabus.svg`, `nav-quiz.svg`, `nav-analytics.svg`, `nav-bookmarks.svg`, `card-weak-areas.svg`, `nav-notes.svg`, `admin-pool.svg`: 24×24 navigation and feature icons

## Usage
Use the brand mark for PWA/app icon exports. For maskable app icons, place it on a 512×512 solid background and keep the mark within the central safe area before exporting PNG sizes.

UI icons use `stroke="currentColor"` and no fixed width/height, so they inherit the text color and can be sized with CSS/Tailwind, e.g. `className="h-5 w-5"`.

Example:
```tsx
<img src="/icons/nav-dashboard.svg" alt="" className="h-5 w-5" />
```

For inline SVG components in React, copy the SVG markup into a component and use `className` for sizing.
