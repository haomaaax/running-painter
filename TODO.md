# TODO - Route Generation Improvements

## Critical Issues (Priority 1)

### Route Shape Accuracy
- [ ] **Problem**: Generated routes don't accurately represent the input text/shape
  - Current: Route follows real roads but loses the original shape completely
  - Example: "2026" text generates a route that doesn't look like "2026" when running
  - Blue dashed line (ideal path) shows correct shape, green solid line (actual route) is unrecognizable

- [ ] **Root Cause Analysis**
  - Investigate why route snapping algorithm deviates so much from ideal path
  - Check if waypoint placement is optimal
  - Review segment division strategy in `src/lib/routing/segmentation.ts`
  - Analyze how Directions API chooses paths between waypoints

- [ ] **Fix Route Snapping Algorithm** (`src/lib/routing/routeSnapper.ts`)
  - Current algorithm may be using too few waypoints
  - Consider adding more intermediate waypoints to force route closer to ideal path
  - Experiment with different waypoint densities
  - Test alternative approach: Use more waypoints with walking mode instead of cycling

- [ ] **Improve Path Simplification** (`src/lib/vectorization/pathSimplifier.ts`)
  - Current simplification may be too aggressive
  - Find balance between simplicity and accuracy
  - Test different tolerance values for Ramer-Douglas-Peucker algorithm
  - Consider preserving critical shape features (corners, curves)

## Algorithm Improvements (Priority 2)

### Smart Waypoint Placement
- [ ] Add waypoint density controls based on shape complexity
- [ ] Implement corner detection to place waypoints at critical points
- [ ] Add straight-line segment detection (fewer waypoints needed)
- [ ] Consider road network density when placing waypoints

### Distance Optimization
- [ ] Current distance optimizer (`src/lib/routing/distanceOptimizer.ts`) may need tuning
- [ ] Review loop insertion strategy - may be distorting shape
- [ ] Test alternative distance matching approaches
- [ ] Add constraints to prevent loops in wrong locations

### Route Quality Scoring
- [ ] Implement shape similarity metric (compare ideal vs actual route)
- [ ] Add Hausdorff distance calculation between ideal and actual path
- [ ] Show shape accuracy percentage to user
- [ ] Allow users to regenerate with different parameters if accuracy is low

## Testing & Validation (Priority 3)

### Test Different Scenarios
- [ ] Test simple shapes (circle, triangle) vs complex text
- [ ] Test in different urban layouts (grid vs organic streets)
- [ ] Test different distances (3km, 5km, 10km)
- [ ] Document what works best and update user guidance

### Compare Different Approaches
- [ ] Try walking mode vs cycling mode in Directions API
- [ ] Test with different waypoint limits (Google allows max 25 waypoints)
- [ ] Experiment with alternative APIs (Mapbox, GraphHopper)
- [ ] Consider offline routing with OSM data

## UI/UX Improvements (Priority 4)

### User Feedback
- [ ] Show shape accuracy score before generation
- [ ] Add "Preview Route Quality" before calling expensive Directions API
- [ ] Allow users to adjust waypoint density slider
- [ ] Show estimated API cost before generation

### Better Guidance
- [ ] Update README with realistic expectations
- [ ] Add examples of good vs bad results
- [ ] Provide tips for choosing locations (grid streets work best)
- [ ] Suggest optimal text length and shape complexity

## Research & Experiments

### Alternative Approaches to Consider
- [ ] Research Strava art / GPS art techniques used by experienced runners
- [ ] Study how existing GPS art apps solve this problem
- [ ] Consider hybrid approach: manual waypoint adjustment
- [ ] Explore constraint-based routing algorithms

### Advanced Features (Future)
- [ ] Multiple route options with different trade-offs (accuracy vs distance)
- [ ] Manual waypoint editing mode
- [ ] Route optimization using genetic algorithms
- [ ] Machine learning to predict good waypoint placement

## Documentation

- [ ] Document algorithm decisions and trade-offs
- [ ] Add inline comments explaining complex logic
- [ ] Create ARCHITECTURE.md explaining system design
- [ ] Add troubleshooting guide for common issues

## Known Working Scenarios

Document what currently works well:
- Shape mode without route snapping (ideal path rendering)
- Text-to-path conversion (works perfectly)
- GPX export and Google Maps URL generation
- Distance calculations
- UI and state management

## Notes from Testing (2024-02-24)

**Test Case**: Text "2026", Distance 7km, Location: Taipei
- **Result**: Route generated but shape unrecognizable
- **Observations**:
  - Ideal path (blue dashed) shows correct "2026" shape
  - Actual route (green solid) doesn't resemble text at all
  - Route follows real roads but takes wrong paths between waypoints
  - Distance accuracy: 154% of target (10.8km vs 7km target) - too much
  - 1071 route points generated

**Hypotheses**:
1. Too few waypoints causing route to take wrong paths
2. Loop insertion for distance matching distorts shape
3. Directions API choosing "optimal" paths instead of shape-preserving paths
4. Need to prioritize shape accuracy over route optimality

## Quick Wins to Try Tomorrow

1. **Increase waypoint density** - add 2-3x more waypoints
2. **Disable loop insertion** - test without distance optimization
3. **Try walking mode** - may give more direct paths
4. **Reduce path simplification tolerance** - preserve more detail
5. **Test with simpler shapes** - start with circle or triangle

---

**Last Updated**: 2024-02-24
**Status**: Core features complete, route accuracy needs major improvement
**Next Session Goal**: Fix route shape accuracy to make routes recognizable when running
