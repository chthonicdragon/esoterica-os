# Altar Feature Spec

## Purpose
The `Altars` module is a combined system for:
- visual altar construction in 3D,
- ritual session tracking,
- XP progression and unlocks,
- altar base progression (`Bases` tab) and object unlocks.

Primary entrypoint: `src/pages/Altars.tsx`.

## Current Architecture

### UI and orchestration
- `src/pages/Altars.tsx`
- Owns page-level state: layouts, active layout, selected object, pending placement, ritual session, progression, create-form, active tab, fullscreen.
- Coordinates all panels and scene.

### Domain types
- `src/altar/types.ts`
- Core entities:
  - `AltarLayout` with `baseId`, `theme`, objects and timestamps.
  - `PlacedObject` transform data.
  - `Progression` with total points, level, streak and XP source buckets.
  - `RitualSession` runtime ritual state.

### Catalogs and unlock content
- `src/altar/catalog.ts`
- `ALTAR_BASES`: altar base options (GLB url, unlock level, visual tuning).
- `CATALOG`: placeable objects with category, geometry/model, unlock level and points.
- `ALTAR_THEMES`: lighting/fog/ambient presets used by scene atmosphere.

### Persistence and progression logic
- `src/altar/altarStore.ts`
- Local state source of truth in `localStorage` (`esoterica_altar_v2`).
- Normalizes legacy layouts and injects default `baseId`.
- XP and level logic:
  - `addProgressPoints`
  - `completeRitual`
  - `getLevelFromPoints`
- Syncs profile aggregates to Supabase:
  - initiation level,
  - practice streak,
  - total rituals,
  - last practice date.

### 3D rendering
- `src/altar/AltarScene3D.tsx`
- Renders lights/fog/mist/ritual ring/ground contact and base/table.
- Base model is selected by `layout.baseId` and auto-fitted:
  - normalized,
  - centered,
  - aligned so top surface lands at object placement height.
- Safe render fallback for unstable/mobile/heavy scenes.

- `src/altar/AltarObject3D.tsx`
- Renders object instances.
- Supports primitive geometry and external GLB models.
- Per-model error boundary fallback to avoid whole-scene crash.

### Side panels
- `src/altar/ObjectPanel.tsx`: object categories and placement selection.
- `src/altar/BasePanel.tsx`: base switching with level/XP lock indicators.
- `src/altar/RitualPanel.tsx`: ritual setup, strict/soft mode and active timer controls.
- `src/altar/ProgressionPanel.tsx`: level, XP bar, source breakdown, next unlock hint.

## User Flow
1. Open `Altars` page.
2. Load local altar state and progression; merge with DB progression snapshot.
3. Create altar:
   - enter name,
   - pick unlocked base,
   - layout created with mapped atmosphere theme,
   - XP awarded for creation.
4. Customize:
   - switch base in `Bases`,
   - pick object in `Objects`, place in scene, rotate/scale/delete selected object,
   - XP awarded for altar interactions.
5. Run ritual:
   - choose duration and mode,
   - strict mode interrupts on tab/app leave,
   - completion grants weighted XP and streak updates.
6. Track progression in `Progress` tab.

## Progression and Unlock Rules
- Level is derived from `points` against `LEVEL_THRESHOLDS`.
- Bases unlock by `unlockLevel` in `ALTAR_BASES`.
- Objects unlock by `unlockLevel` in `CATALOG`.
- XP sources are tracked separately (`ritualXp`, `altarXp`, `journalXp`, `knowledgeXp`) to support balancing and analytics.

## Current Known Constraints
- Object drag movement in 3D is not fully implemented (rotation/scale/delete are present).
- Theme still exists in layout while base is now primary; theme is effectively derived from base mapping.
- Full layout cloud sync is not implemented; only profile aggregates sync to Supabase.
- Some scene constants are hardcoded (placement plane `Y=0.05`, position clamps, camera limits).

## Extension Points

### Add new altar base
1. Add optimized model to `public/models/`.
2. Add entry to `ALTAR_BASES` in `src/altar/catalog.ts`:
   - `id`, labels, `modelUrl`, `unlockLevel`, `targetSpan`, visual tint.
3. Update base->theme mapping in `getThemeForBase` (`src/pages/Altars.tsx`) if needed.

### Add new placeable object
1. Add model to `public/models/` (optional, primitive is also allowed).
2. Add `CATALOG` entry in `src/altar/catalog.ts`.
3. Pick `category`, unlock level, points and visual/effect settings.

### Rebalance progression
- Adjust thresholds in `src/altar/types.ts` (`LEVEL_THRESHOLDS`).
- Adjust ritual reward curve in `completeRitual` (`src/altar/altarStore.ts`).
- Adjust altar interaction rewards in `ACTION_POINTS`.

### Add achievement-based unlocks
- Extend unlock checks in:
  - `src/altar/BasePanel.tsx`
  - `src/altar/ObjectPanel.tsx`
  - `changeBase` and placement gating in `src/pages/Altars.tsx`
- Add requirement structure to catalog entries (e.g. streak, ritual count, category mastery).

## Recommended Roadmap

### Phase 1 (stability + UX)
- Consolidate base-first UX (done mostly).
- Add preview thumbnail assets for bases and object models.
- Add quick filters in `ObjectPanel` (new/unlocked/locked/effects).

### Phase 2 (interaction depth)
- Implement drag-and-drop object movement in scene.
- Add grid snap and collision-safe placement zones.
- Add undo/redo stack for object/base operations.

### Phase 3 (meta progression)
- Add achievements and multi-condition unlocks.
- Add altar presets/loadouts.
- Add seasonal or deity-specific base variants.

### Phase 4 (cloud + social)
- Cloud sync for full layouts.
- Share/export altar builds.
- Optional collaborative or showcase mode.

## Analytics Events (suggested)
Track at minimum:
- `altar_created` (baseId, level, points)
- `altar_base_changed` (from, to, level)
- `altar_object_placed` (catalogId, category, level)
- `altar_object_removed` (catalogId)
- `ritual_started` (duration, mode)
- `ritual_completed` (duration, mode, points)
- `ritual_interrupted` (mode, elapsed)

## Testing Checklist
- Create altar with only initial unlocked bases.
- Switch base in existing altar and verify visual replacement and object height alignment.
- Verify locked bases cannot be selected.
- Place/remove/rotate/scale objects and verify persistence after reload.
- Run ritual in soft and strict modes; verify interruption logic.
- Verify XP increments and level-up unlock behavior for both bases and objects.
- Verify safe render mode behavior on mobile/heavy object counts.

## Notes for Future Contributors
- Treat `baseId` as primary user-facing altar style control.
- Keep model normalization in scene/object loaders consistent to avoid scale regressions.
- Prefer adding new unlock content via catalogs, not hardcoded UI branches.
