

## Plan: Fix Issues 2, 3, 4, 6, 7, 10 + Sidebar Logo + Dark Mode Podium

### Issues to Fix

**1. Pagination on Index page (Issue #2)** — Show 15 notes per page with page numbers and next/prev buttons. Search results remain unpaginated (show all matches).

- In `src/pages/Index.tsx`: Add `currentPage` state, slice `sortedNotes` to show 15 per page, reset page on filter/tab change, add pagination controls at bottom using the existing `Pagination` components.

**2. Client-side contribution score manipulation (Issue #3)** — Remove direct `increment()` calls on `stats.contributionScore` from client code in `firestoreService.ts`. Instead, keep the increments but add a comment noting this should move to Cloud Functions. (Full fix requires Firebase Cloud Functions which can't run in this environment, so we'll at minimum remove the download score increment which is most gameable.)

- In `src/services/firestoreService.ts`: Remove the `contributionScore: increment(1)` from `downloadNote` (line ~378) since downloading your own content for score is trivially gameable. Keep upload score increment as it has more friction.

**3. Auto-delete after 15 reports without review (Issue #4)** — Change from auto-delete to auto-hide. Instead of `deleteDoc`, set `isHidden: true` on the note so an admin can review later.

- In `src/services/firestoreService.ts` `reportNote`: Replace `deleteDoc` with `updateDoc` setting `isHidden: true, reportCount: newReportCount, reportedBy: arrayUnion(userId)`.

**4. Duplicate UserProfile types (Issue #6)** — Create a shared type in `src/types/user.ts`, then import it in both `AuthContext.tsx` and `firestoreService.ts`.

- Create `src/types/user.ts` with the canonical `UserProfile` interface (union of both definitions' fields).
- Update imports in `AuthContext.tsx` and `firestoreService.ts`.

**5. Refactor NoteCard (Issue #7)** — Extract the like/dislike/save/report logic into sub-components:
- `src/components/notes/NoteCardActions.tsx` — like, dislike, save, download, comment count, expand buttons
- `src/components/notes/NoteCardMedia.tsx` — video/image preview
- `src/components/notes/NoteReportDialog.tsx` — report dialog + delete confirm
- Slim down `NoteCard.tsx` to ~100 lines composing these pieces.

**6. Debounce online status writes (Issue #10)** — The activity event handlers (`click`, `keydown`, `scroll`) call `updateLastActiveDate` on every single event. Fix by:
- Remove the `click`/`keydown`/`scroll` listeners entirely. The 2-minute interval is sufficient for online status.
- Alternatively, throttle the activity handler to fire at most once every 5 minutes using a `lastUpdate` ref.

**7. Remove duplicate logo from Sidebar** — The logo appears in both Sidebar header and MainLayout top bar. Remove it from the Sidebar per user request.
- In `src/components/layout/Sidebar.tsx`: Remove the `<img src={logo}>` and show only the text "NoteHall" (or just the collapse button area).

**8. Fix Top Contributors card in dark mode** — The card uses a hardcoded beige gradient (`#F8F4EC` to `#F3EDE3`) which looks bad in dark mode. Fix by:
- In `src/components/home/TopContributorsPodium.tsx`: Replace the hardcoded `cardBg` with theme-aware classes: `bg-card` or `bg-muted` instead of inline style gradients.
- Update podium base colors and score text colors to use CSS variables / Tailwind classes that adapt to dark mode.
- Update `rankConfig` text colors to use `text-foreground` / `text-muted-foreground` where appropriate, keeping gold/silver/bronze accents on borders and crowns only.

### File Changes Summary

| File | Change |
|------|--------|
| `src/types/user.ts` | **New** — shared UserProfile type |
| `src/pages/Index.tsx` | Add pagination (15 per page) |
| `src/contexts/AuthContext.tsx` | Import shared type, throttle online status |
| `src/services/firestoreService.ts` | Import shared type, fix report auto-hide, remove download score |
| `src/components/notes/NoteCardActions.tsx` | **New** — extracted action buttons |
| `src/components/notes/NoteCardMedia.tsx` | **New** — extracted media preview |
| `src/components/notes/NoteReportDialog.tsx` | **New** — extracted report/delete dialogs |
| `src/components/notes/NoteCard.tsx` | Slim down, compose sub-components |
| `src/components/layout/Sidebar.tsx` | Remove logo image |
| `src/components/home/TopContributorsPodium.tsx` | Theme-aware colors for dark mode |

