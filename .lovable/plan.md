

## Plan: Build NoteHall Welcome / Landing Page

### Overview
Create a scroll-driven introductory landing page at `/welcome` route with particle background, scroll animations, and all requested sections. If `localStorage` key `notehall_intro_done` exists, redirect to `/login`.

### Files to Create

**1. `src/pages/Welcome.tsx`** — Main landing page orchestrating all sections
- Check `localStorage('notehall_intro_done')` on mount; if set, redirect to `/login`
- On "Get Started" click, set the localStorage key and navigate to `/signup`
- Compose all section components sequentially

**2. `src/components/welcome/FloatingParticles.tsx`** — Canvas-based particle background
- Full-screen fixed canvas with low-opacity glowing particles in NoteHall orange/gold
- Particles connect with thin lines when nearby
- Mouse repulsion effect
- Uses `useEffect` with `requestAnimationFrame` loop

**3. `src/components/welcome/ScrollProgress.tsx`** — Top progress bar
- Fixed top bar, listens to `scroll` event, fills width proportionally
- Orange gradient (`hsl(37 92% 50%)` → `hsl(45 96% 64%)`)

**4. `src/components/welcome/FloatingNav.tsx`** — Glassmorphism pill nav
- Appears after scrolling past hero (Intersection Observer)
- Links: Hero, Problem, Solution, How It Works, Community, Stats
- Mobile: hamburger menu
- Active section highlighting via Intersection Observer on each section

**5. `src/components/welcome/AnimatedText.tsx`** — Per-character 3D flip animation
- Framer Motion `motion.span` for each character with staggered `whileInView` animation

**6. `src/components/welcome/CountUp.tsx`** — Animated number counter
- Triggers count-up when in viewport using Intersection Observer
- Smooth easing from 0 to target value

**7. Sections built inline in `Welcome.tsx`** (or as sub-components):
- **HeroSection**: Logo with glow pulse, AnimatedText headline, subtitle, glowing CTA button, bouncing chevron
- **ProblemSection**: Two cards sliding in from left/right via Framer Motion
- **SolutionSection**: Three feature cards in responsive grid with gradient icon backgrounds and hover lift
- **CommunitySection**: "Learning Beyond Your Batch" — three highlight cards
- **HowItWorksSection**: Four-step horizontal flow with numbered circles, icons, connector lines; vertical on mobile
- **StatsSection**: Three CountUp stats (10,000+, 5,000+, 50+)
- **CTASection**: "Ready to Learn Smarter Together?" with pulsing glow button
- **Footer**: Logo, tagline, developer credit card with gradient border, copyright

### Route Update in `src/App.tsx`
- Import `Welcome` page
- Add route: `<Route path="/welcome" element={<Welcome />} />`
- Place it outside `AuthenticatedApp` (before `AuthProvider` or as a standalone route) since it's a public page

### Design Tokens
- Primary orange: `hsl(37 92% 50%)` / `#E89A1D`
- Gold accent: `hsl(45 96% 64%)` / `#F5C542`
- Warm beige bg: `#F8F4EC` → `#F3EDE3`
- Card bg: `hsl(60 9% 97%)`
- All animations use Framer Motion `whileInView` with `viewport={{ once: true }}`

### Mobile Responsiveness
- All grids collapse to single column
- FloatingNav becomes hamburger
- How It Works becomes vertical flow
- Large touch targets on all CTAs

