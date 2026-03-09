# A11y: Color contrast (WCAG 2.2 AA)

This project uses theme **tokens** (see [`src/theme/app/Light.js`](../src/theme/app/Light.js:1) / [`src/theme/app/Dark.js`](../src/theme/app/Dark.js:1)) as the single source of truth for core UI colors.

The goal is to ensure **text and icons** meet **WCAG 2.2 AA** contrast:

- **Normal text**: contrast ratio **≥ 4.5:1**
- **Large text / icons**: contrast ratio **≥ 3:1**

We intentionally enforce **4.5:1** for our key UI states (buttons, alert levels, banners/toasts), because:

- buttons mix text + icons, and size can vary with device scaling
- alert-level CTAs are primary critical actions

## Approved core pairs (tokens)

All pairs below were validated with a standard WCAG contrast formula (relative luminance).

### Buttons (react-native-paper)

Implementation notes:

- Contained buttons typically use `colors.primary` background with `colors.onPrimary` text.
- Outlined buttons in this codebase render with white background and primary-colored label (see [`src/components/CustomButton.js`](../src/components/CustomButton.js:1)).

| Usage | Foreground token | Background token | Target |
|---|---|---|---|
| Contained primary button label/icon | `colors.onPrimary` | `colors.primary` | ≥ 4.5:1 |
| Outlined button label/icon (on white) | `colors.primary` | `colors.onPrimary` | ≥ 4.5:1 |
| Disabled states (material defaults) | `colors.onSurfaceDisabled` | `colors.surfaceDisabled` | N/A (disabled content is excluded from contrast requirements) |

### Alert levels (CTA backgrounds)

Alert level colors are under `theme.custom.appColors`.

These are used as:

- **backgrounds** for the “send alert” CTAs (text + icons), with `custom.appColors.onColor` as the foreground
- **foreground indicators** (dots/icons) on surfaces in places like notifications

| Alert level | Background token | Foreground token | Target |
|---|---|---|---|
| Red | `custom.appColors.red` | `custom.appColors.onColor` | ≥ 4.5:1 |
| Yellow | `custom.appColors.yellow` | `custom.appColors.onColor` | ≥ 4.5:1 |
| Green | `custom.appColors.green` | `custom.appColors.onColor` | ≥ 4.5:1 |
| Unknown | `custom.appColors.unknown` | `custom.appColors.onColor` | ≥ 4.5:1 |
| Call | `custom.appColors.call` | `custom.appColors.onColor` | ≥ 4.5:1 |

### Error / success / warning (banners + toasts)

This codebase uses a mix of:

- `colors.error` + `colors.onError` when error is used as a **background**
- `colors.ok`, `colors.no`, `colors.warn` for status backgrounds (e.g. confirmation/rejection)
- toast “normal” uses `colors.surfaceVariant` background with `colors.onSurfaceVariant` text (see [`src/lib/toast-notifications/toast.js`](../src/lib/toast-notifications/toast.js:1))

| Usage | Foreground token | Background token | Target |
|---|---|---|---|
| Error background + white text | `colors.onError` | `colors.error` | ≥ 4.5:1 |
| Success background + white text | `colors.onPrimary` | `colors.ok` | ≥ 4.5:1 |
| Reject/Danger background + white text | `colors.onPrimary` | `colors.no` | ≥ 4.5:1 |
| Warning background + white text | `colors.onWarning` | `colors.warn` | ≥ 4.5:1 |
| Toast (normal) | `colors.onSurfaceVariant` | `colors.surfaceVariant` | ≥ 4.5:1 |

## Rationale for token adjustments

We keep component code unchanged and only adjust theme tokens.

Key changes (both Light/Dark) were made because the previous palette failed AA in multiple critical states:

- white on `error` / `no` / `critical` reds
- white on `ok` greens
- white on alert-level colors (especially yellow/green/unknown)
- dark theme `primary` was too light for white text
- light theme `onSurfaceVariant` narrowly missed 4.5:1 on `surfaceVariant`

Branding impact was minimized by:

- preserving the overall hue families (blue primary, red/yellow/green alerts)
- applying the smallest darkening needed to cross AA thresholds

