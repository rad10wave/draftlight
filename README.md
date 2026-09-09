# 📐 Draftlight — Architectural Concept & Floor Plan Studio

> **Transform your spatial ideas into scaled, professional architectural floor plans in seconds — right from your browser.**

**Draftlight** is a modern, web-native CAD and floor plan drafting application designed to bridge the gap between simple napkin sketches and complex, intimidating professional CAD software. Whether you are an absolute beginner remodeling a room, an interior designer laying out client concepts, a real estate professional preparing floor plans, or an architect exploring early schematic options, Draftlight gives you professional precision with zero learning curve.

---

## ✨ Why Draftlight? (Built for Beginners & Pros Alike)

Traditional CAD tools like AutoCAD or Revit require weeks of training, expensive licenses, and heavy desktop software installations. Draftlight runs instantly in any modern web browser with:

- 🚀 **Zero Setup Required**: No downloads, no plugins, and no complicated menus. Open the app and start drawing immediately.
- 🎯 **Magnetic Snapping & Smart Guides**: Never worry about crooked lines or disjointed corners. Walls, doors, windows, and furniture automatically snap to grid increments and align with existing geometry.
- 📏 **Real-World Measurements**: Everything is calculated in real units (meters, centimeters, feet, and inches). You always know the exact length of a wall, width of a door, and area of a room in square meters or square feet.
- 🎨 **Boutique Visual Polish**: Clean, architectural aesthetics with customizable themes (Architectural White, Dark Blueprint, and Midnight Slate Trace Mode).

---

## 🚀 Key Features

### 1. Precision Wall & Room Drafting
- **Wall Tool (`W`)**: Click and drag to create walls with customizable thickness (partition vs. structural load-bearing), real-time length readouts, and angle constraints.
- **Room Tool (`R`)**: Draw entire rectangular rooms in a single drag. Draftlight automatically generates connected perimeter walls and computes the total floor area.
- **Door Cut Tool (`O`)**: Hover over any wall to see an interactive knockout preview. Click to seamlessly slice the wall and insert a door with jamb endcaps and customizable swing arcs ($90^\circ, 45^\circ, 30^\circ$, or sliding).
- **Window Cut Tool (`U`)**: Magnetically cut glass openings with sill indicators and custom widths.
- **Measure Tool (`D`)**: Dimension check clearance, walkways, and distances across any two points.
- **Redline & Review Markups (`M`)**: Draw freehand revision clouds, callouts, and notes for collaborative reviews.

### 2. Industry-Standard 2D Architectural Furniture Library
- **Scaled Furniture Library (`F`)**: Access hundreds of scaled architectural items across Living, Bedroom, Dining, Kitchen, Bathroom, Office, and Openings.
- **Authentic Architectural Vector Symbols**: Unlike generic flat boxes, Draftlight renders realistic CAD symbols — tufted sofa cushions, bed pillows with duvet folds, bathroom fixtures with faucets and drainage basins, and dining sets with clearance circles.
- **Custom Block Studio**: Create your own custom furniture and architectural fixtures with custom dimensions, colors, and shape archetypes.

### 3. Integrated AI Drafting Assistant (Powered by Gemini)
- **Natural Language Floor Plan Generation**: Simply describe what you need:
  - *"Draft a 60 sqm modern 1-bedroom apartment with an open-concept kitchen, island, and balcony access."*
  - *"Create a cozy coffee shop layout with an espresso bar, restroom, and 6 seating zones."*
- **Non-Destructive Ghost Sketches**: The AI returns a transparent, cyan **Ghost Sketch overlay** directly onto your canvas. You can inspect the suggested layout, make adjustments, and merge it with a single click — without ever losing your existing work.
- **Design Variations in Tabs**: Ask the AI to generate multiple options and open them side-by-side in separate design tabs.

### 4. Interactive 3D Isometric View & Daylight Solar Study
- **3D Isometric Mode**: Switch from 2D floor plan view to an interactive 3D extruded view to inspect wall heights, door openings, and furniture volume.
- **Solar & Shadow Analysis**: Simulate sunlight penetration and shadows based on room orientation and sun altitude/azimuth.
- **Cost & Material Estimator**: Instantly estimate framing, drywall, flooring, and furnishing costs based on live computed wall lengths and floor square footage.

---

## 🔄 Frictionless Sharing & Universal Collaboration

Sharing CAD designs has traditionally been painful due to incompatible file formats (`.dwg`, `.rvt`, `.dxf`) and missing fonts or assets. Draftlight solves this completely:

### 📁 The `.draftlight.json` Universal Project File
- **1-Click Export (`Ctrl + S` / `⌘ + S`)**: Download your entire project as a lightweight `.draftlight.json` file containing all design tabs, walls, openings, furniture, scales, and review markups.
- **Instant Import**: Drag and drop any `.draftlight.json` file into Draftlight on any computer. The full interactive design loads in milliseconds with 100% fidelity.
- **Zero Lock-in**: Share your file with clients, contractors, or friends — they can open and view it in their browser without registering or installing software.

### 🖨️ Presentation & Print Exports
- **High-Resolution PNG**: Export crisp floor plan graphics for presentations, listings, or social media.
- **Vector SVG**: Export infinite-resolution scalable vectors for graphic design tools like Illustrator or Figma.
- **Scale Blueprint PDF**: Print to standard paper sizes (`A4`, `A3`, `Letter`, `Tabloid`) with title blocks, graphic scale bars, and north arrows ready for permit reviews.

---

## ⌨️ Essential Keyboard Shortcuts

| Key | Action |
|---|---|
| `V` | **Select Tool** — Move, rotate, and inspect elements |
| `W` | **Wall Tool** — Draw walls by clicking and dragging |
| `R` | **Room Tool** — Draw complete rectangular rooms |
| `O` | **Door Tool** — Cut door openings into walls |
| `U` | **Window Tool** — Cut window openings into walls |
| `D` | **Measure Tool** — Measure point-to-point distances |
| `F` | **Furniture Library** — Open architectural catalog |
| `C` | **Calibrate Scale** — Calibrate plan from known distance |
| `A` | **AI Assistant** — Open AI prompt dialog |
| `M` | **Redline Markup** — Freehand review markups |
| `Delete` / `Backspace` | Delete selected element |
| `Ctrl` / `⌘` + `Z` | Undo |
| `Ctrl` / `⌘` + `Shift` + `Z` | Redo |
| `Ctrl` / `⌘` + `D` | Duplicate selected furniture |
| `Ctrl` / `⌘` + `S` | Save / Export `.draftlight.json` |
| `?` | Show all keyboard shortcuts |

---

## 🛠️ Technology Stack

- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Intelligence**: Google Gemini API (`@google/genai`)
- **Graphics Engine**: Scaled SVG coordinate space with matrix transforms, sub-millimeter snapping, and geometric wall-opening clipping algorithms

---

## 💡 Quick Start Guide for Beginners

1. **Draw Your First Room**: Press `R` on your keyboard, then click and drag across the canvas. You'll see the walls and floor area form immediately.
2. **Add an Entrance**: Press `O` for the Door tool, hover over any wall until you see the snap highlight, and click to drop a door. Use the right-hand Inspector to flip the swing direction.
3. **Drop Furniture**: Press `F` to open the catalog, choose a bed, sofa, or desk, and click to drop it into your room. Click and drag its circular handle to rotate it.
4. **Try the AI**: Press `A`, enter a description of a layout you want to explore, and watch the AI propose a scaled blueprint overlay.
5. **Save & Share**: Press `Ctrl + S` to save your work. Send the `.draftlight.json` file to anyone to let them open, inspect, and continue editing!

---

*Crafted with precision for designers, makers, and dreamers.*
