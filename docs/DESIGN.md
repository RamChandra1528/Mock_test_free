# Design System — MockMaster

**Status:** Documents the existing implementation; it is not a redesign.  
**Last verified:** 2026-09-20.

## Design philosophy

MockMaster uses a calm, high-contrast study-workspace aesthetic: deep forest navigation grounds the experience, mint surfaces identify positive/learning actions, lime highlights progress, and warm cream softens large work areas. Information-dense exam and admin views favor clear hierarchy, readable tables, compact badges, and purposeful feedback over decorative UI.

## Foundations

### Color tokens — IMPLEMENTED

| Token | Value | Primary use |
| --- | --- | --- |
| `ink` | `#17241f` | Main text |
| `forest` | `#173f35` | Sidebar, primary action, active state |
| `mint` | `#dff4e9` | Positive/soft surface |
| `lime` | `#c9ed71` | Accent, success/progress highlight |
| `cream` | `#f6f5ee` | App/page background |
| `coral` | `#ef765f` | Accent; destructive/attention contexts use explicit rose/coral variants |

Status palettes use green for answered/success, rose for error/unanswered attention, amber for warnings, violet for review, and neutral gray for inactive states. Pair every color state with a label/icon/count.

### Typography — IMPLEMENTED

- Body: `Manrope, sans-serif`.
- Display/headings: `Plus Jakarta Sans, sans-serif` through `font-display`.
- Page title: `text-2xl` on small screens, `text-3xl` at medium and above, extra-bold, slightly tight tracking.
- Body: generally `text-sm`/`text-base`, normal to semibold, with readable line height.
- Eyebrow: `text-xs`, extra-bold, uppercase, approximately `.2em` tracking.
- Numeric status/button labels: compact `text-[10px]`–`text-xs`, bold/extra-bold.

### Spacing, radius, shadow, and motion — IMPLEMENTED

- Tailwind’s 4px-derived spacing scale is used; page shell padding is `p-4` mobile and `sm:p-7` desktop.
- Core elements use `rounded-xl` (12px) or `rounded-2xl` (16px); pills use `rounded-full`.
- `shadow-soft`: `0 18px 50px rgba(28, 52, 43, .09)` for elevated cards. Modals use stronger `shadow-2xl`.
- Primary buttons use a short transition and modest upward hover motion; honor `prefers-reduced-motion` for ticker animation.

## Reusable patterns

| Pattern | Existing implementation / behavior |
| --- | --- |
| Primary action | `.btn-primary`: forest background, white text, icon + label when applicable |
| Secondary action | `.btn-secondary`: white, subtle border, forest hover treatment |
| Destructive action | `.btn-danger` or explicit muted coral/rose treatment; never use the primary style |
| Form field | `.input` plus `.label`; 12px radius, clear focus ring, helpful placeholder |
| Card | `.card`: white, subtle border, 16px radius, soft shadow |
| Data table | `.table-wrap` + `.data-table`, horizontal overflow, compact uppercase header |
| Badge | `Badge` uses neutral/green/amber/red/purple semantic tones |
| Page heading | `PageHeader` with optional eyebrow, title, description, action |
| Modal | `Modal` with labelled heading, focus handling, Escape/backdrop close, scrollable/full-screen modes |
| Feedback | `Loading`, `Empty`, `ErrorState`, and toast provider; mutations should state success/failure |
| Pagination | `Pagination` with Previous/Next and accessible current-page label |

## Layout and navigation

Authenticated desktop views use a fixed 270px forest sidebar with an independently scrollable navigation list, a 64px sticky cream header, and a `max-w-[1500px]` content area. On smaller breakpoints the sidebar becomes an off-canvas panel with an overlay and visible open/close buttons.

Student and admin navigation differ by role. Student views include the language toggle and reminder ticker. The live CBT view intentionally uses its own full-screen header, answer workspace, sticky question actions, and question palette; on mobile the palette is off-canvas. The palette number grid scrolls independently so the title, legend, and submit action remain reachable.

## Component guidance

- **Buttons:** Preserve icon + text in primary actions; compact label hiding is acceptable only at narrow breakpoints if the icon and accessible name remain clear. Disabled state uses visual opacity and native disabled behavior.
- **Inputs/selects:** Always associate a visible label or accessible name, show validation close to the field, and do not rely on placeholder as a label.
- **Cards/statistics:** Use `StatCard` for key metrics: label, prominent value, mint icon tile, optional context note.
- **Tables:** Use a scroll wrapper on small screens. Keep headers meaningful and avoid hiding the only critical action off-screen.
- **Modals/dropdowns:** Modal is the sanctioned dialog primitive. Use a menu only when several closely related actions exist; preserve focus/escape behavior.
- **Charts/progress:** Recharts communicates trends/sections. Provide nearby textual labels, values, and a non-color explanation; charts alone are not an accessible summary.

## States

- **Loading:** Centered spinner plus plain-language label.
- **Empty:** Card with inbox icon, concise title/description, and an optional relevant action.
- **Error:** Rose-tinted card with alert icon, safe human-readable message, and a retry action. Unexpected runtime/render errors also surface through the global toast and recovery boundary; server error references may be shown without exposing a stack trace.
- **Success:** Toast confirmation and/or green badge/surface; retain context rather than redirecting abruptly unless completion requires it.
- **Exam states:** answered green, not answered rose, not visited gray, review violet, and answered+review paired violet/green. The written legend is required.

## Accessibility and responsive requirements

- Maintain the global 3px forest focus outline and do not suppress focus without an equal or stronger accessible replacement.
- Use semantic headings, buttons, form control grouping, `aria-current` for navigation/pagination, and labels for icon buttons.
- Ensure responsive behavior from 320px upward; Tailwind project breakpoints are `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), and `2xl` (1536px).
- Touch controls must remain comfortably tappable; use scroll containment inside constrained panes, not a clipped list.
- No dark-mode theme is implemented. Do not add ad hoc dark styles; a dark-mode product decision is **NOT YET DEFINED**.
