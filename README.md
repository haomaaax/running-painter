# Running Route Painter

A web application that generates GPS running routes in the shape of user-specified text or graphics.

## Features (Planned)

- **Text-to-Route**: Convert any text into a running route shape
- **Shape Library**: Pre-built shapes (heart, star, smiley, etc.)
- **Distance Targeting**: Generate routes matching specified distance (±10% tolerance)
- **Location-Aware**: Routes generated around your current GPS location
- **Google Maps Export**: Export routes as GPX files or Google Maps URLs

## Current Status

✅ **Phase 1 Complete**: Basic Setup
- Project infrastructure with Vite + React + TypeScript
- Google Maps integration
- User geolocation tracking
- Basic UI layout

✅ **Phase 2 Complete**: Text/Shape Vectorization
- Text-to-path conversion with opentype.js
- 5 pre-defined shapes (heart, star, smiley, circle, triangle)
- Path simplification algorithms
- Interactive input form with live preview
- Shape preview canvas

✅ **Phase 3 Complete**: Coordinate Mapping
- Path-to-geographic conversion with custom algorithms
- Distance calculations using Haversine formula
- Ideal path overlay on map (dashed blue line)
- Auto-zoom to fit route
- Route statistics display

✅ **Phase 4 Complete**: Route Snapping
- Google Directions API integration
- Smart route snapping algorithm (segments & waypoints)
- Distance optimization with loop insertion
- Progress tracking during generation
- Navigable routes on real roads

✅ **Phase 5 Complete**: Export Functionality
- GPX file generation and download
- Google Maps URL generation
- Copy-to-clipboard functionality
- Export instructions modal
- Multi-platform support (iOS, Android, Desktop)

🎉 **All Core Features Complete!** Ready to use for running!

## Setup Instructions

### Prerequisites

- Node.js 20.2.0 or higher
- npm 9.6.6 or higher
- Google Maps API key

### Getting a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "Running Painter"
3. Enable billing (includes $200/month free credit)
4. Navigate to "APIs & Services" > "Library"
5. Enable these APIs:
   - Maps JavaScript API
   - Directions API
6. Go to "APIs & Services" > "Credentials"
7. Click "Create Credentials" > "API Key"
8. Copy the API key
9. (Recommended) Restrict the key:
   - Application restrictions: HTTP referrers
   - Add: `localhost:5173/*`
   - API restrictions: Maps JavaScript API, Directions API
   - Set daily quota: 100 requests/day

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd /Users/max_chen/sparkler/running-painter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your Google Maps API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser to `http://localhost:5173`

7. Allow location access when prompted

8. **(Required for text mode)** Add a font file for text-to-path conversion:
   ```bash
   # See FONT_SETUP.md for detailed instructions
   # Quick option: Download Roboto Bold from Google Fonts
   # Copy it to public/fonts/Roboto-Bold.ttf
   ```

   **Note**: Shape mode works without any font files. Text mode requires a .ttf font.

## How to Use

### 1. Design Your Route
- Choose between **Text** or **Shape** mode
- Text: Enter any text (e.g., "2026", "LOVE", "RUN")
- Shape: Select from heart, star, smiley, circle, or triangle
- Set target distance (1-50 km)

### 2. Preview
- See your shape rendered on the canvas
- Blue dashed line shows ideal path on map
- Check distance accuracy

### 3. Generate Route
- Click "Generate Running Route"
- Watch progress as route is created
- Route snaps to real roads and paths
- Green solid line shows final navigable route

### 4. Export & Run!
- **Download GPX**: Import to GPS devices/apps (Garmin, Strava, etc.)
- **Open in Google Maps**: Navigate on your phone
- **Copy URL**: Share with friends

### Tips for Best Results
- **Simple shapes work best**: Hearts and circles are more recognizable than complex text
- **Urban areas**: Grid-like street patterns produce better results
- **Shorter text**: 2-4 characters (e.g., "LOVE") work better than long words
- **Test first**: Walk/drive the route to verify before running
- **Distance**: 3-10 km is ideal for most shapes

## Project Structure

```
running-painter/
├── public/              # Static assets
│   ├── fonts/          # Fonts for text rendering
│   └── shapes/         # Pre-defined SVG shapes
├── src/
│   ├── components/     # React components
│   │   ├── Map/       # Map-related components
│   │   ├── InputForm/ # User input components
│   │   └── Export/    # Export functionality
│   ├── lib/           # Core business logic
│   │   ├── vectorization/  # Text/shape to path
│   │   ├── routing/        # Route generation
│   │   ├── export/         # GPX/URL export
│   │   └── utils/          # Helper functions
│   ├── hooks/         # Custom React hooks
│   ├── store/         # Zustand state management
│   └── types/         # TypeScript definitions
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technology Stack

- **Build Tool**: Vite
- **Framework**: React 18 + TypeScript
- **State Management**: Zustand
- **Mapping**: Google Maps JavaScript API + @vis.gl/react-google-maps
- **Text Vectorization**: opentype.js
- **Path Processing**: Custom Ramer-Douglas-Peucker algorithm
- **Geospatial Math**: @turf/turf (Phase 3)

## Development Roadmap

### Phase 1: Project Setup ✅ COMPLETE
- [x] Initialize Vite + React + TypeScript
- [x] Install dependencies
- [x] Configure environment variables
- [x] Basic folder structure
- [x] Google Maps integration
- [x] User geolocation
- [x] Basic UI layout

### Phase 2: Text/Shape Vectorization ✅ COMPLETE
- [x] Text-to-path conversion (opentype.js)
- [x] Shape library (5 SVG shapes)
- [x] Path simplification
- [x] Input form UI
- [x] Shape preview

### Phase 3: Coordinate Mapping ✅ COMPLETE
- [x] Path-to-geographic conversion
- [x] Distance calculations
- [x] Ideal path overlay on map
- [x] Auto-zoom to fit route
- [x] Route statistics display

### Phase 4: Route Snapping ✅ COMPLETE
- [x] Google Directions API integration
- [x] Smart route snapping algorithm
- [x] Distance optimization
- [x] Progress tracking UI
- [x] Route generation button

### Phase 5: Export Functionality ✅ COMPLETE
- [x] GPX file generation
- [x] Google Maps URL generation
- [x] Export UI and instructions
- [x] Copy-to-clipboard
- [x] Multi-platform support

### Phase 6: Polish & Optimization
- [ ] Mobile responsive design
- [ ] Error handling
- [ ] Performance optimization
- [ ] Testing

## License

MIT

## Contributing

This is a personal project. Feel free to fork and modify for your own use.
