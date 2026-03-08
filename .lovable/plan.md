## Redesign Welcome Page -- CampusVoice Style, Light Theme

Adapt the clean, centered, immersive layout structure from CampusVoice while keeping NoteHall's warm light theme (beige/orange/gold).

### What Changes

**1. Hero Section -- More dramatic and centered**

- Full-viewport hero with larger logo (w-28/h-28 on desktop) and a warm golden radial glow behind it (using a `div` with radial gradient in orange/gold tones, not dark)
- Bigger, bolder title text (text-5xl to text-7xl) with tighter letter-spacing
- Gradient text effect on the main headline using `bg-clip-text text-transparent` with the orange-gold gradient
- Cleaner, more spacious layout with more vertical breathing room
- CTA button with a warm gradient background (`linear-gradient(135deg, hsl(37 92% 50%), hsl(45 96% 64%))`) and a soft golden glow shadow, similar to CampusVoice's prominent button

**2. Section cards -- Elevated glassmorphism (light version)**

- Cards get subtle warm-tinted backgrounds: `bg-white/70 backdrop-blur-sm` with softer `border-primary/10` borders
- On hover: warm golden shadow glow (`boxShadow: 0 12px 30px hsla(37, 92%, 50%, 0.15)`) instead of just translate
- Slightly larger border-radius (rounded-3xl)

**3. FloatingParticles -- Refined for light theme**

- Keep warm orange/gold particle colors but make them softer and more subtle
- Reduce connection line opacity slightly for a cleaner look
- Shapes use softer opacity values for light background harmony

**4. FloatingNav -- Polished light glass**

- Increase backdrop-blur, add subtle warm border tint
- Active state uses the full orange-gold gradient as background

**5. "How It Works" timeline**

- Replace the simple connector line with a gradient line (orange to gold)
- Step circles get a subtle warm glow on the border

**6. Stats section numbers**

- Apply gradient text effect to the stat numbers (orange-gold gradient)

**7. CTA section at bottom**

- Add a warm radial gradient background glow behind the section (subtle, like a spotlight)

**8. Footer**

- Add a subtle warm gradient top border instead of plain `border-t`

### Files to Edit

1. `**src/pages/Welcome.tsx**` -- Hero redesign, card styling, gradient text, section polish
2. `**src/components/welcome/FloatingParticles.tsx**` -- Softer particles tuned for light background
3. `src/components/welcome/FloatingNav.tsx` -- Light glass polish with gradient active pill  

&nbsp;

also add: our campus community with all 4 websites and their links 