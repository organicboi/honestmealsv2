# Honest Meals UI/UX Design Guidelines

This document serves as the source of truth for the design system of the Honest Meals application. It is intended for AI assistants and developers to ensure consistency across all pages, focusing on a **mobile-first, app-like experience**.

## 1. Design Philosophy

*   **Mobile-First**: Design for small screens first. The web app should feel like a native mobile application.
*   **App-Like Navigation**: Use sticky headers, bottom navigation, and floating action bars.
*   **Touch-Friendly**: Large tap targets (min 44px), rounded corners, and clear visual feedback.
*   **Clean & Airy**: Use `bg-gray-50` for the app background and `bg-white` for content cards to create separation.
*   **Playful yet Professional**: Use soft colors, rounded shapes (`rounded-2xl`, `rounded-full`), and smooth animations.

## 2. Color System

We use Tailwind CSS classes.

### Primary Colors
*   **Brand Green**: `bg-green-600` (Primary Actions), `text-green-700` (Text Highlights), `bg-green-50` (Light Backgrounds).
*   **Gradients**: `bg-linear-to-br from-green-400 to-emerald-600` (Hero sections, Avatars).

### Backgrounds
*   **App Background**: `bg-gray-50` (Main page background).
*   **Card Background**: `bg-white` (Content containers).
*   **Input Background**: `bg-gray-50` or `bg-gray-100` (Form fields).

### Text Colors
*   **Headings**: `text-gray-900` (Black/Dark Gray).
*   **Body**: `text-gray-600` (Medium Gray).
*   **Subtitles/Meta**: `text-gray-500` or `text-gray-400`.
*   **Labels**: `text-gray-500 uppercase tracking-wider`.

### Semantic Colors (Badges & Icons)
*   **Info/Personal**: `bg-blue-50 text-blue-600`.
*   **Health/Danger/Love**: `bg-red-50 text-red-600`.
*   **Food/Ratings**: `bg-amber-50 text-amber-600` or `text-orange-500`.
*   **Vegetarian**: `text-green-600` / `bg-green-100`.
*   **Non-Vegetarian**: `text-red-600` / `bg-red-100`.

## 3. Typography

*   **Font Family**: Geist Sans (Default Next.js font).
*   **Page Titles**: `text-xl font-bold text-gray-900`.
*   **Section Headers**: `text-lg font-bold text-gray-900`.
*   **Card Titles**: `font-bold text-gray-900` (text-sm to text-lg).
*   **Form Labels**: `text-xs font-bold text-gray-500 uppercase tracking-wider`.
*   **Price/Stats**: `font-bold` (often colored).

## 4. Layout Patterns

### Page Structure
```tsx
<div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
    {/* Sticky Header (Optional) */}
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100...">
        {/* ... */}
    </div>

    {/* Main Content */}
    <main className="max-w-7xl mx-auto px-4 py-4">
        {/* ... */}
    </main>

    {/* Floating Action Bar (Optional) */}
    <div className="fixed bottom-20 left-4 right-4...">
        {/* ... */}
    </div>
</div>
```

### Mobile Lists (Settings/Menu)
Use for navigation or settings pages.
```tsx
<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
    <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 border-b border-gray-50">
        <div className="p-2 rounded-full bg-blue-50">
            <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 text-left">
            <h3 className="font-semibold text-gray-900 text-sm">Title</h3>
            <p className="text-xs text-gray-500">Subtitle</p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-300" />
    </button>
</div>
```

## 5. Components

### Cards
*   **Style**: `bg-white rounded-2xl shadow-sm border-0`.
*   **Hover**: `hover:shadow-md transition-shadow duration-200`.

### Buttons
*   **Primary**: `bg-green-600 hover:bg-green-700 text-white rounded-full font-bold shadow-sm`.
*   **Secondary**: `bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full`.
*   **Icon Button**: `p-2 rounded-full hover:bg-gray-100 transition-colors`.
*   **Selection Button (Radio replacement)**:
    *   Selected: `border-green-500 bg-green-50 text-green-700`.
    *   Unselected: `border-gray-200 bg-gray-50 text-gray-600`.

### Inputs
*   **Style**: `bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent`.
*   **Height**: `h-11` or `h-12` for touch targets.

### Badges
*   **Style**: `rounded-full px-2 py-1 text-xs font-medium`.
*   **Default**: `bg-gray-100 text-gray-600`.
*   **Success**: `bg-green-50 text-green-700`.

## 6. Animations

Use `framer-motion` for smooth entrances.

### Page/List Entrance
```tsx
<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
>
    {/* Content */}
</motion.div>
```

### Sub-View Transitions
```tsx
<motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
>
    {/* Content */}
</motion.div>
```

## 7. Icons

*   **Library**: `lucide-react`.
*   **Size**: Standard `h-5 w-5` or `h-4 w-4`.
*   **Stroke**: Default (2px).

## 8. Checklist for New Pages

1.  [ ] Is the background `bg-gray-50`?
2.  [ ] Are containers `rounded-2xl`?
3.  [ ] Is the primary action color `green-600`?
4.  [ ] Are tap targets large enough for mobile?
5.  [ ] Is there a sticky header or clear navigation?
6.  [ ] Are inputs styled with `rounded-xl` and `bg-gray-50`?
7.  [ ] Is `framer-motion` used for entrance animations?
