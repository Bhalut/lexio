# Lexio UI Guidelines

## Typography

Lexio uses a dual-font system to balance legal authority with operational efficiency.

- **Display**: `Cormorant Garamond`
    - Used for: Case titles, section headers, branding.
    - Rationale: Evokes the feeling of legal documents and traditional law firm excellence.
- **Sans-serif**: `Manrope`
    - Used for: Body text, UI controls, navigation, data tables.
    - Rationale: Modern, highly readable, and professional.

## Color Palette (Ink & Brass)

- **Ink (Primary)**: `#142a42` (Blue 700)
    - Primary brand color. Used for sidebar, primary headings, and authority elements.
- **Brass (Accent)**: `#a37f49` (Accent 500)
    - Action color. Used for primary buttons, focus states, and key highlights.
- **Paper (Background)**: `#f7f1e8` (Surface 50)
    - Warm neutral background to reduce eye strain during long document reviews.
- **Success (Sage)**: `#4a7a64` (Success 500)
- **Danger (Rust)**: `#c05c54` (Danger 500)

## Motion & Transitions

Animations in Lexio are designed to orient the user, not to entertain.

- **Principles**:
    - **Purposeful**: Every animation must serve a navigational or feedback purpose.
    - **Restrained**: Avoid over-animating; use motion for entry and focus changes only.
    - **Staggered**: Lists use a subtle stagger effect (50ms increments) to feel lighter.
- **Tokens**:
    - `duration-normal`: 250ms
    - `ease-out-expo`: `cubic-bezier(0.16, 1, 0.3, 1)`

## Component Standards

- **Buttons**: All buttons must have a distinct hover state (subtle transformation or box-shadow).
- **Modals**: Must use an overlay with blur and animate from the bottom.
- **Drawers**: Must enter from the right with a slide-in effect.
