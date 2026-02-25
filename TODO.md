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

## Progress Log

### 2024-02-25 Session 2

**Improvements Implemented:**
1. ✅ **Y-axis flip fix** - Text no longer upside down (pathToGeo.ts line 66)
2. ✅ **Increased waypoints**: 40 → 144 total (8 segments × 18 waypoints)
3. ✅ **Disabled distance optimization** - No more shape-distorting loops
4. ✅ **Reduced angle threshold**: 20° → 10°
5. ✅ **Reduced distance interval**: 500m → 250m
6. ✅ **GPS optional** - Can select location manually
7. ✅ **Click-to-select** location on map

**Test Results (2024-02-25):**
- **Test Case**: Text "2026", Distance 7km, Location: Taipei
- **Result**: STILL NOT WORKING
- **Observations**:
  - ✅ Text preview now right-side up (Y-flip fixed)
  - ❌ Route distance: 23.0km vs 7km target (329% - WORSE!)
  - ❌ Shape completely unrecognizable
  - Green route spread across huge area
  - 2098 route points generated

**NEW Root Cause Analysis:**

The fundamental problem is **SCALE**. Even with 144 waypoints, they're spread too far apart:

1. **Path too large**: 7km target means "2026" is ~2-3km wide. With 144 waypoints, that's ~20-50 meters between waypoints. Google Directions takes massive detours between waypoints.

2. **Waypoint distribution**: Waypoints may not be evenly distributed. Dense in some areas, sparse in others.

3. **Google Directions behavior**: When waypoints are far apart (>20m), Google optimizes for walking efficiency, not shape accuracy.

4. **Travel mode limitation**: WALKING mode may not have enough flexibility for complex shapes.

## CRITICAL Next Steps (High Priority)

### Immediate Fixes Needed:

1. **REDUCE SCALE DRAMATICALLY**
   - Current: 7km target → ~2-3km text width → 20-50m between waypoints
   - Solution: Make text MUCH smaller (500m-1km total size max)
   - Or: Increase waypoints to 500-1000 (but API limits are 25 per segment)
   - File: `src/lib/routing/pathToGeo.ts` - adjust scale calculation

2. **INVESTIGATE WAYPOINT DISTRIBUTION**
   - Check if waypoints are evenly spaced along path
   - Current extraction may cluster waypoints at corners, leave gaps on straight sections
   - File: `src/lib/routing/segmentation.ts` - analyze `extractKeyPoints()`

3. **TRY BICYCLING MODE**
   - Bicycling might follow roads better than walking
   - File: `src/lib/routing/routeSnapper.ts` line 66 - change `WALKING` → `BICYCLING`

4. **ALTERNATIVE: Use Roads API instead of Directions API**
   - Instead of routing between waypoints, snap each point to nearest road
   - More accurate but won't guarantee navigable route
   - Would require major refactor

5. **ADD DEBUG VISUALIZATION**
   - Show waypoints as markers on map
   - Color-code waypoint density
   - Display distance between consecutive waypoints
   - This will reveal if waypoint distribution is the problem

### Testing Strategy:

**Test 1: Smaller scale**
- Input: "2026", Distance: 2km (not 7km)
- Expected: Waypoints closer together, better shape accuracy

**Test 2: Simpler shape**
- Input: Circle or Triangle shape, Distance: 3km
- Expected: Should work better than complex text

**Test 3: Bicycling mode**
- Same as current but with BICYCLING instead of WALKING
- Expected: May follow roads more closely

**Test 4: Maximum waypoints**
- Try 8 segments × 24 waypoints = 192 total (close to API limit)
- Expected: More guidance for Google Directions

## Research Needed

1. **Study existing GPS art**
   - How do Strava artists create recognizable shapes?
   - What distances work best? (Hypothesis: much smaller than we're using)
   - Do they manually plan routes or use algorithms?

2. **Google Directions API limitations**
   - What's the maximum waypoints for shape accuracy?
   - How does waypoint spacing affect route quality?
   - Is there a "prefer exact path" option?

3. **Alternative routing approaches**
   - Mapbox Directions API - any better?
   - GraphHopper - supports more waypoints?
   - Custom A* pathfinding on road network?

---

**Last Updated**: 2024-02-25
**Status**: Major improvements made, but route shape accuracy still CRITICAL ISSUE
**Next Session Goal**: Fix scale/waypoint distribution to make shapes actually recognizable
