# QA: Android TalkBack checklist

Goal: validate the P0 flows with TalkBack enabled.

## Setup

1. Android Settings → Accessibility → TalkBack → On.
2. Optional: enable "Speak passwords" if testing auth flows.

## Gestures used during QA

- Swipe right/left: move to next/previous element
- Double tap: activate

## P0 checks

### Header actions

- Confirm menu/overflow/quick actions are labeled properly.
- Confirm back behavior is predictable.

### Send Alert

- Confirm each alert CTA announces a meaningful label and is reachable.
- Confirm there is no reliance on color only.

### Chat input

- Text input announces as editable with hint.
- Send/microphone announces correct action depending on whether there is text.
- In recording mode, delete control is reachable and announced as a button.

## Reporting

Record issues in [`docs/a11y-audit-log.md`](docs/a11y-audit-log.md:1).

