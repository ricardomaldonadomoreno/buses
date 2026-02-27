@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================================
   BusesApp Design System — Gold × Dark Luxury
   Primary: Gold #D4AF37  |  Dark: #333333  |  Light: #F5F3EE
   ============================================================ */

@layer base {
  :root {
    /* ── Backgrounds ── */
    --background: 40 20% 96%;          /* #F5F3EE warm off-white */
    --foreground: 0 0% 20%;            /* #333333 */

    --card: 0 0% 100%;
    --card-foreground: 0 0% 20%;

    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 20%;

    /* ── Primary = Gold ── */
    --primary: 46 62% 52%;             /* #D4AF37 */
    --primary-foreground: 0 0% 10%;    /* near-black text on gold */

    /* ── Secondary = Dark charcoal ── */
    --secondary: 0 0% 20%;            /* #333333 */
    --secondary-foreground: 0 0% 100%;

    /* ── Muted ── */
    --muted: 40 15% 92%;
    --muted-foreground: 0 0% 45%;

    /* ── Accent = subtle gold tint ── */
    --accent: 46 50% 88%;
    --accent-foreground: 0 0% 20%;

    /* ── Destructive ── */
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 98%;

    /* ── Borders & inputs ── */
    --border: 40 15% 82%;
    --input: 40 15% 82%;
    --ring: 46 62% 52%;                /* gold focus ring */

    /* ── Border radius — luxury soft ── */
    --radius: 0.875rem;                /* 14px base */

    /* ── Sidebar ── */
    --sidebar-background: 0 0% 12%;
    --sidebar-foreground: 0 0% 90%;
    --sidebar-primary: 46 62% 52%;
    --sidebar-primary-foreground: 0 0% 10%;
    --sidebar-accent: 0 0% 20%;
    --sidebar-accent-foreground: 0 0% 90%;
    --sidebar-border: 0 0% 25%;
    --sidebar-sidebar: 0 0% 12%;
    --sidebar-ring: 46 62% 52%;

    /* ── Shadows — gold-tinted ── */
    --shadow-2xs: 0 1px 2px 0 rgba(212, 175, 55, 0.08);
    --shadow-xs:  0 2px 4px 0 rgba(212, 175, 55, 0.12);
    --shadow-sm:  0 4px 8px 0 rgba(212, 175, 55, 0.15);
    --shadow:     0 8px 16px 0 rgba(212, 175, 55, 0.18);
    --shadow-md:  0 12px 24px 0 rgba(212, 175, 55, 0.20);
    --shadow-lg:  0 20px 40px 0 rgba(212, 175, 55, 0.22);
    --shadow-xl:  0 28px 56px 0 rgba(212, 175, 55, 0.25);
    --shadow-2xl: 0 40px 80px 0 rgba(212, 175, 55, 0.28);

    /* Gold glow for interactive elements */
    --shadow-gold-sm: 0 0 12px rgba(212, 175, 55, 0.25);
    --shadow-gold:    0 0 24px rgba(212, 175, 55, 0.35);
    --shadow-gold-lg: 0 0 48px rgba(212, 175, 55, 0.45);

    /* ── Typography ── */
    --font-sans: 'Montserrat', ui-sans-serif, system-ui, -apple-system, sans-serif;
    --font-serif: 'Cormorant Garamond', ui-serif, Georgia, serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;

    /* ── Charts ── */
    --chart-1: 46 62% 52%;
    --chart-2: 46 62% 65%;
    --chart-3: 0 0% 20%;
    --chart-4: 0 0% 40%;
    --chart-5: 40 20% 85%;
  }

  /* ── DARK MODE ── */
  .dark {
    --background: 0 0% 8%;            /* #141414 near-black */
    --foreground: 40 20% 92%;         /* warm white */

    --card: 0 0% 11%;
    --card-foreground: 40 20% 92%;

    --popover: 0 0% 11%;
    --popover-foreground: 40 20% 92%;

    --primary: 46 62% 52%;            /* gold stays gold */
    --primary-foreground: 0 0% 8%;

    --secondary: 0 0% 18%;
    --secondary-foreground: 40 20% 92%;

    --muted: 0 0% 16%;
    --muted-foreground: 0 0% 58%;

    --accent: 0 0% 18%;
    --accent-foreground: 46 62% 65%;   /* lighter gold on dark */

    --destructive: 0 63% 45%;
    --destructive-foreground: 0 0% 98%;

    --border: 0 0% 20%;
    --input: 0 0% 20%;
    --ring: 46 62% 52%;

    --sidebar-background: 0 0% 6%;
    --sidebar-foreground: 40 20% 85%;
    --sidebar-primary: 46 62% 52%;
    --sidebar-primary-foreground: 0 0% 8%;
    --sidebar-accent: 0 0% 14%;
    --sidebar-accent-foreground: 40 20% 85%;
    --sidebar-border: 0 0% 16%;
    --sidebar-ring: 46 62% 52%;
    --sidebar: 0 0% 6%;

    --shadow-2xs: 0 1px 3px 0 rgba(0, 0, 0, 0.4);
    --shadow-xs:  0 2px 6px 0 rgba(0, 0, 0, 0.45);
    --shadow-sm:  0 4px 10px 0 rgba(0, 0, 0, 0.5);
    --shadow:     0 8px 20px 0 rgba(0, 0, 0, 0.55);
    --shadow-md:  0 12px 28px 0 rgba(0, 0, 0, 0.6);
    --shadow-lg:  0 20px 44px 0 rgba(0, 0, 0, 0.65);
    --shadow-xl:  0 28px 60px 0 rgba(0, 0, 0, 0.7);
    --shadow-2xl: 0 40px 80px 0 rgba(0, 0, 0, 0.75);
  }
}

/* ============================================================
   BASE ELEMENT STYLES
   ============================================================ */
@layer base {
  * {
    @apply border-border;
    box-sizing: border-box;
  }

  html {
    @apply scroll-smooth;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    /* Prevent horizontal overflow on mobile */
    overflow-x: hidden;
    max-width: 100vw;
  }

  /* ── Headings use serif display font ── */
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-serif);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  h1 { @apply text-4xl md:text-5xl lg:text-6xl; }
  h2 { @apply text-3xl md:text-4xl; }
  h3 { @apply text-2xl md:text-3xl; }
  h4 { @apply text-xl md:text-2xl; }

  /* ── Links ── */
  a {
    color: hsl(var(--primary));
    text-decoration: none;
    transition: color 0.15s ease, opacity 0.15s ease;
  }
  a:hover { opacity: 0.85; }

  /* ── Focus visible ── */
  :focus-visible {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 3px;
    border-radius: 4px;
  }

  /* ── Images ── */
  img, video {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* ── Inputs & buttons ── */
  input, button, select, textarea {
    font-family: var(--font-sans);
    font-size: inherit;
  }

  /* ── Scrollbar (webkit) ── */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: hsl(var(--muted)); }
  ::-webkit-scrollbar-thumb {
    background: hsl(var(--primary) / 0.5);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover { background: hsl(var(--primary)); }
}

/* ============================================================
   UTILITY CLASSES — Gold Brand
   ============================================================ */
@layer utilities {

  /* ── Text gold gradient ── */
  .text-gold-gradient {
    background: linear-gradient(135deg, #D4AF37 0%, #EFBF04 50%, #B8962E 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Gold gradient backgrounds ── */
  .bg-gold-gradient {
    background: linear-gradient(135deg, #D4AF37 0%, #EFBF04 100%);
  }
  .bg-gold-gradient-subtle {
    background: linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(239,191,4,0.06) 100%);
  }

  /* ── Gold glow ── */
  .shadow-gold-sm { box-shadow: var(--shadow-gold-sm); }
  .shadow-gold    { box-shadow: var(--shadow-gold); }
  .shadow-gold-lg { box-shadow: var(--shadow-gold-lg); }

  /* ── Glass card (dark mode) ── */
  .glass {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(212,175,55,0.15);
  }
  .dark .glass {
    background: rgba(0,0,0,0.25);
  }

  /* ── Serif display text ── */
  .font-display {
    font-family: var(--font-serif);
    letter-spacing: 0.02em;
  }

  /* ── Luxury tracking ── */
  .tracking-luxury { letter-spacing: 0.08em; }
  .tracking-luxury-wide { letter-spacing: 0.15em; }

  /* ── Responsive container fix ── */
  .container-safe {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }

  /* ── Mobile tap highlight remove ── */
  .no-tap-highlight {
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Truncate multiline ── */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* ============================================================
   COMPONENT OVERRIDES — shadcn/ui gold skin
   ============================================================ */
@layer components {

  /* ── Primary button — gold ── */
  .btn-gold {
    @apply inline-flex items-center justify-center gap-2;
    @apply font-semibold text-sm;
    background: linear-gradient(135deg, #D4AF37 0%, #EFBF04 100%);
    color: #1a1a1a;
    border-radius: var(--radius);
    padding: 0.625rem 1.5rem;
    transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(212,175,55,0.3);
  }
  .btn-gold:hover {
    box-shadow: 0 6px 20px rgba(212,175,55,0.45);
    transform: translateY(-1px);
  }
  .btn-gold:active { transform: translateY(0); }

  /* ── Outline gold button ── */
  .btn-gold-outline {
    @apply inline-flex items-center justify-center gap-2;
    @apply font-semibold text-sm;
    background: transparent;
    color: hsl(var(--primary));
    border: 1.5px solid hsl(var(--primary));
    border-radius: var(--radius);
    padding: 0.625rem 1.5rem;
    transition: all 0.2s ease;
  }
  .btn-gold-outline:hover {
    background: hsl(var(--primary) / 0.1);
    box-shadow: 0 0 16px rgba(212,175,55,0.2);
  }

  /* ── Card luxury ── */
  .card-luxury {
    @apply bg-card rounded-2xl;
    border: 1px solid hsl(var(--border));
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  .card-luxury:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  /* ── Section eyebrow label ── */
  .eyebrow {
    @apply text-xs font-bold uppercase;
    color: hsl(var(--primary));
    letter-spacing: 0.15em;
  }

  /* ── Divider gold ── */
  .divider-gold {
    height: 1px;
    background: linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent);
  }
}

/* ============================================================
   RESPONSIVE FIXES — Mobile first
   ============================================================ */

/* Prevent any element from causing horizontal scroll */
*, *::before, *::after {
  max-width: 100%;
}

/* Tables */
table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }

/* Safe area for notched phones */
.safe-top    { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }

/* ── Header sticky — mobile aware ── */
header.sticky {
  top: 0;
  top: env(safe-area-inset-top, 0);
}

/* ── Touch targets — minimum 44px ── */
button, a, [role="button"], input[type="submit"], input[type="button"] {
  min-height: 44px;
}
/* Exception for icon-only decorative elements */
button.icon-only { min-height: unset; }

/* ── Fix select on iOS ── */
select {
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23D4AF37' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px !important;
}

/* ── Popover & dropdown — proper z-index on mobile ── */
[data-radix-popper-content-wrapper] { z-index: 9999 !important; }

/* ── Dialog/sheet — safe insets ── */
[data-radix-dialog-content],
[data-vaul-drawer] {
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}

/* ── Calendar ── */
.rdp { margin: 0 !important; }

/* ============================================================
   ANIMATIONS
   ============================================================ */
@keyframes accordion-down {
  from { height: 0; opacity: 0; }
  to { height: var(--radix-accordion-content-height); opacity: 1; }
}
@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); opacity: 1; }
  to { height: 0; opacity: 0; }
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes gold-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
  50% { box-shadow: 0 0 0 8px rgba(212,175,55,0.15); }
}
@keyframes shimmer {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}

.animate-fade-in { animation: fade-in 0.4s ease forwards; }
.animate-gold-pulse { animation: gold-pulse 2s ease infinite; }

/* Shimmer skeleton */
.animate-shimmer {
  background: linear-gradient(90deg,
    hsl(var(--muted)) 25%,
    hsl(var(--accent)) 50%,
    hsl(var(--muted)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease infinite;
}
