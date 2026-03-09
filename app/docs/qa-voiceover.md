# QA: iOS VoiceOver checklist

Goal: validate the P0 flows with VoiceOver enabled.

## Setup

1. iOS Settings → Accessibility → VoiceOver → On.
2. Set Speech rate to a comfortable speed.

## Gestures used during QA

- Swipe right/left: move to next/previous element
- Double tap: activate
- Two-finger scrub: back (system)

## P0 checks

### Header actions

On a screen with header icons:

- Navigate through header controls and confirm each icon-only button announces a clear label and hint.
- Confirm back behavior is predictable.

Selectors for automation: see [`docs/testids.md`](docs/testids.md:1).

### Send Alert

Screen: "Quelle est votre situation ?"

- Swipe through CTAs and confirm each announces the alert level (Rouge / Jaune / Verte / …) and the hint explains it opens confirmation.
- Activate each CTA and verify the next screen is reachable and the focus does not get lost.

### Chat input

- Focus the text input: it should announce an editable field with a French hint.
- Focus the send/microphone control: it should announce the correct action depending on mode.
- In recording mode, ensure the delete button is reachable and announced as a button.

## Reporting

Record issues in [`docs/a11y-audit-log.md`](docs/a11y-audit-log.md:1) and link to the relevant file/line.

