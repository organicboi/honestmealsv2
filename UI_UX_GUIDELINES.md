# Honest Meals UI/UX Design Guidelines

This document serves as the source of truth for the design system of the Honest Meals application. It is intended for AI assistants and developers to ensure consistency across all pages, focusing on a **mobile-first, app-like experience**.

## 1. Design Philosophy

*   **Mobile-First**: Design for small screens first. The web app should feel like a native mobile application.
*   **App-Like Navigation**: Use sticky headers, bottom navigation, and floating action bars.
*   **Touch-Friendly**: Large tap targets (min 44px), rounded corners (`rounded-3xl`), and clear visual feedback.
*   **Clean & Airy**: Use `bg-gray-50` for the app background and `bg-white` for content cards to create separation.
*   **Vibrant & Engaging**: Use rich gradients for hero sections and colored shadows to create depth.

## 2. Color System

We use Tailwind CSS classes.

### Primary Colors
*   **Brand Green**: `bg-green-600` (Primary Actions), `text-green-700` (Text Highlights), `bg-green-50` (Light Backgrounds).
*   **Brand Orange**: `bg-orange-500` (Calories/Food), `text-orange-600`.
*   **Brand Blue**: `bg-blue-500` (Hydration), `text-blue-600`.

### Gradients (Hero Sections)
*   **Green (Progress/General)**: `bg-linear-to-br from-green-500 to-emerald-700`.
*   **Orange (Calories/Food)**: `bg-linear-to-br from-orange-400 to-red-500`.
*   **Blue (Hydration)**: `bg-linear-to-br from-blue-400 to-blue-600`.

### Backgrounds
*   **App Background**: `bg-gray-50` (Main page background).
*   **Card Background**: `bg-white` (Content containers).
*   **Glassmorphism**: `bg-white/80 backdrop-blur-md` (Sticky headers, overlays).

### Text Colors
*   **Headings**: `text-gray-900` (Black/Dark Gray).
*   **Body**: `text-gray-600` (Medium Gray).
*   **Subtitles/Meta**: `text-gray-500` or `text-gray-400`.
*   **On Gradients**: `text-white` (Primary), `text-white/90` or `text-green-100` (Secondary).

### Shadows
*   **Standard**: `shadow-sm` (Cards).
*   **Floating**: `shadow-xl` (FABs, Modals).
*   **Colored Glow**: `shadow-green-300`, `shadow-orange-200` (Used on buttons or hero elements to create a "glow" effect).

## 3. Typography

*   **Font Family**: Geist Sans (Default Next.js font).
*   **Hero Stats**: `text-4xl` or `text-5xl` font-bold (often white on gradient).
*   **Page Titles**: `text-xl font-bold text-gray-900`.
*   **Section Headers**: `text-lg font-bold text-gray-900`.
*   **Card Titles**: `font-bold text-gray-900` (text-sm to text-lg).
*   **Form Labels**: `text-xs font-bold text-gray-500 uppercase tracking-wider`.

## 4. Layout Patterns

### Page Structure
```tsx
<div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
    {/* Sticky Header (Optional) */}
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100...">
        {/* ... */}
    </div>

    {/* Main Content */}
    <main className="max-w-md mx-auto px-4 py-4 space-y-6">
        {/* Hero Section */}
        {/* Grid Section */}
        {/* List Section */}
    </main>

    {/* Floating Action Button (Optional) */}
    <div className="fixed bottom-24 right-6 z-20">
        {/* ... */}
    </div>
</div>
```

### Hero Card Pattern
Used at the top of main dashboards (Health, Progress).
```tsx
<div className="bg-linear-to-br from-green-500 to-emerald-700 rounded-3xl p-6 text-white shadow-lg shadow-green-200">
    <div className="flex justify-between items-start mb-2">
        <h2 className="text-green-100 font-medium">Title</h2>
        <Icon className="text-green-100" />
    </div>
    <div className="text-5xl font-bold mb-1">Value</div>
    <div className="text-green-100 text-sm">Subtitle</div>
</div>
```

### Split Cards (Grid)
Used for secondary metrics (Hydration, Streak, Goal Weight).
```tsx
<div className="grid grid-cols-2 gap-4">
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
        {/* Content */}
    </div>
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
        {/* Content */}
    </div>
</div>
```

## 5. Components

### Cards
*   **Style**: `bg-white rounded-3xl shadow-sm border border-gray-100`.
*   **Hover**: `hover:shadow-md transition-shadow duration-200`.

### Buttons
*   **Primary**: `bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200`.
*   **Floating Action Button (FAB)**: `h-16 w-16 rounded-full bg-green-600 text-white shadow-xl shadow-green-300`.
*   **Secondary**: `bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl`.
*   **Icon Button**: `p-2 rounded-full hover:bg-gray-100 transition-colors`.

### Inputs
*   **Style**: `bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent`.
*   **Height**: `h-12` for better touch targets.

### Modals & Overlays
*   **Backdrop**: `bg-black/60 backdrop-blur-sm`.
*   **Container**: `bg-white rounded-3xl p-6`.
*   **Animation**: Slide up from bottom (`y: 20` -> `y: 0`) or Scale (`scale: 0.9` -> `scale: 1`).
*   **Z-Index**: Ensure overlays are `z-[60]` or higher to cover Bottom Nav (`z-50`).

### Charts (Recharts)
*   **Style**: Minimalist. Hide axes lines (`axisLine={false}`, `tickLine={false}`).
*   **Colors**: Use gradients in `<defs>` matching the theme.
*   **Tooltip**: Custom rounded tooltip (`borderRadius: '12px'`, `boxShadow`).

## 6. Animations

Use `framer-motion` for smooth interactions.

### Page Entrance
```tsx
<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
>
    {/* Content */}
</motion.div>
```

### Staggered Lists
Use `variants` for container and items to stagger list entrances.

## 7. Icons

*   **Library**: `lucide-react`.
*   **Size**: `w-5 h-5` (Standard), `w-6 h-6` (Navigation/FAB), `w-8 h-8` (Hero).
*   **Stroke**: Default (2px).

## 8. Checklist for New Pages

1.  [ ] Is the main container `rounded-3xl`?
2.  [ ] Are shadows colored where appropriate (e.g., `shadow-green-200`)?
3.  [ ] Is the primary action button `h-12` or larger?
4.  [ ] Are gradients used for the primary visual element (Hero)?
5.  [ ] Is the z-index correct for overlays (covering nav)?
6.  [ ] Are animations smooth and not overwhelming?
