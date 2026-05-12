---
name: Financial Clarity Engine
colors:
  surface: '#fafbe6'
  surface-dim: '#dadcc7'
  surface-bright: '#fafbe6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f5e0'
  surface-container: '#eeefda'
  surface-container-high: '#e8ead5'
  surface-container-highest: '#e2e4cf'
  on-surface: '#1a1d10'
  on-surface-variant: '#454933'
  inverse-surface: '#2f3224'
  inverse-on-surface: '#f1f2dd'
  outline: '#757961'
  outline-variant: '#c5c9ac'
  surface-tint: '#536600'
  primary: '#536600'
  on-primary: '#ffffff'
  primary-container: '#c8f100'
  on-primary-container: '#586b00'
  inverse-primary: '#b0d500'
  secondary: '#496800'
  on-secondary: '#ffffff'
  secondary-container: '#b5f724'
  on-secondary-container: '#4e6e00'
  tertiary: '#286678'
  on-tertiary: '#ffffff'
  tertiary-container: '#afeaff'
  on-tertiary-container: '#2e6b7d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c9f305'
  primary-fixed-dim: '#b0d500'
  on-primary-fixed: '#171e00'
  on-primary-fixed-variant: '#3e4c00'
  secondary-fixed: '#b5f724'
  secondary-fixed-dim: '#9cd900'
  on-secondary-fixed: '#131f00'
  on-secondary-fixed-variant: '#364e00'
  tertiary-fixed: '#b4ebff'
  tertiary-fixed-dim: '#95cfe4'
  on-tertiary-fixed: '#001f27'
  on-tertiary-fixed-variant: '#004e5f'
  background: '#fafbe6'
  on-background: '#1a1d10'
  surface-variant: '#e2e4cf'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: '0'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  metric-xl:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system is built on the philosophy of **Radiant Precision**. It combines the high-energy pulse of generative AI with the clinical transparency required for personal finance. The aesthetic is rooted in **Minimalism** with a **High-Contrast** twist, utilizing a vast "Pure White" canvas to symbolize clarity, while "Electric Lime" serves as the high-visibility highlighter for insights, actions, and growth metrics.

The target audience consists of modern wealth-builders who value speed and data-driven confidence. The UI avoids the heavy, cluttered feel of traditional banking, opting instead for a lightweight, airy environment that feels more like a productivity tool than a ledger.

## Colors

The palette is designed to maximize legibility and focus. **Electric Lime (#C8F100)** is the singular high-frequency accent, reserved exclusively for active states, primary call-to-actions, and positive financial trends. **Deeper Lime (#A6E600)** provides necessary contrast for hover states and interactive depth.

The neutral scale is strictly enforced:
- **Pure White (#FFFFFF)**: The foundation for the entire viewport to ensure a "bright" psychological response.
- **Off-White (#F4F4F4)**: Used for card backgrounds and container differentiation to create subtle depth without shadows.
- **Grays**: Text follows a strict hierarchy from Deep Black for headings to Medium Gray for metadata, ensuring the user's eye is always drawn to the most critical data points first.

## Typography

This design system employs a tiered typographic strategy. **Hanken Grotesk** is used for headlines and large financial metrics; its sharp, contemporary terminals feel engineered and precise. **Inter** is the workhorse for all body copy and UI elements, providing industry-standard legibility at small sizes. 

For technical data, such as transaction IDs or AI-generated tags, **JetBrains Mono** is used in small, uppercase labels to inject a subtle "developer-tool" aesthetic, reinforcing the engine-like nature of the product.

## Layout & Spacing

The layout utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The system relies on a strict 8px rhythmic scale. Content containers use a standard 32px margin from the viewport edge to maintain an "airy" and expensive feel.

Information density is balanced by using 40px (lg) spacing between major sections and 24px (md) spacing within card clusters. This ensures that even data-heavy financial screens remain digestible.

## Elevation & Depth

To maintain the "Bright and Clean" requirement, this design system moves away from traditional shadows. Depth is achieved through **Tonal Layering**:
- **Level 0 (Floor)**: Pure White (#FFFFFF) viewport background.
- **Level 1 (Cards)**: Off-White (#F4F4F4) surfaces with a 1px solid border in Tertiary Gray (#E0E0E0).
- **Level 2 (Interaction)**: Elements that are hovered or active use a subtle 2px "Electric Lime" bottom-border or a very soft, high-diffusion shadow (0px 10px 30px rgba(0,0,0,0.04)) to indicate lift.

Glassmorphism is used sparingly, only for sticky navigation bars (Background: #FFFFFF with 80% opacity and 20px backdrop blur) to maintain context during scrolling.

## Shapes

The shape language is defined by extreme softness on the exterior and efficiency on the interior. 
- **Primary Containers**: Large cards must use a **24px corner radius**. 
- **Interactive Elements**: Buttons and input fields follow a **Pill-shaped** (fully rounded) geometry.
- **Nested Elements**: Elements inside cards (like progress bars or inner tags) should use a reduced **8px radius** to maintain visual harmony with the larger 24px parent containers.

## Components

### Buttons
Primary buttons are **Pill-shaped** with an **Electric Lime (#C8F100)** fill and Deep Black text. This high-contrast pairing ensures the primary action is impossible to miss. Secondary buttons are "Ghost" style with a 1px #E0E0E0 border.

### Cards
Cards are the primary organizational unit. They feature a #F4F4F4 background, a 24px corner radius, and no shadow by default. On hover, the border color transitions from #E0E0E0 to #C8F100.

### Input Fields
Inputs are pill-shaped with a white background and a subtle #E0E0E0 border. On focus, the border thickens to 2px and changes to Electric Lime.

### Icons
Icons must use **Thin-stroke (1px to 1.5px)** weights. They should never be filled unless they are in an "active" state, where they take on the Electric Lime color.

### Financial Metrics
Large numbers (Account balances, AI predictions) should always be rendered in **Hanken Grotesk Bold** with a negative 2% letter spacing to feel "dense" and substantial. Positive growth is highlighted with an Electric Lime underline.