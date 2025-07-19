# Warehouse 3D Viewer

A modern React application for interactive 3D warehouse SKU visualization, built with Next.js 15.4 and Three.js. Features advanced analytics, row highlighting, and a philosophical perspective on time and automation.

## Features

### 🎯 Core Visualization
- **Interactive 3D Visualization**: Click, drag to rotate, scroll to zoom
- **SKU Management**: Load and visualize warehouse inventory data
- **Grid Configuration**: Adjustable warehouse dimensions (X, Y, Z)
- **Cell Analysis**: Click on cells to view detailed information with pulse animation
- **Fullscreen Mode**: Immersive 3D experience with escape key support

### 📊 Advanced Analytics
- **SKU Distribution by Level**: Real-time analysis of unique SKUs per warehouse level
- **80/20 Distribution Analysis**: Automatic calculation based on Z-level depth
- **Row Highlighting**: Interactive X-row and Y-row visualization
- **Cell Details**: Comprehensive information with position, level, SKU, and color
- **Statistics Dashboard**: Comprehensive warehouse analytics

### 🎨 User Experience
- **Camera Position Tracking**: Real-time camera coordinates display
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Custom dark mode with beautiful gradients
- **Collapsible Data Input**: Clean UI with expandable configuration
- **Life Countdown**: Philosophical About page with 30,000-day life perspective

### 🔧 Technical Features
- **Row Transparency**: Non-highlighted cells become transparent during row highlighting
- **Cell Selection Animation**: Pulsing animation with white wireframe highlights
- **Mouse Controls**: Drag to rotate, scroll to zoom, click to select
- **Real-time Updates**: Dynamic calculations and visual updates

## Technology Stack

- **Frontend**: Next.js 15.4 with TypeScript
- **React**: React 19.1 with modern hooks and patterns
- **3D Graphics**: Three.js for WebGL rendering with InstancedMesh optimization
- **Styling**: Tailwind CSS with custom dark theme
- **Icons**: Lucide React icons (latest version)
- **Deployment**: Vercel-optimized static export

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nicksonthc/warehouse-3d-viewer.git
cd warehouse-3d-viewer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

### Building for Production

```bash
npm run build
# or
yarn build
```

## Usage

### Loading Sample Data

1. Click "Load Sample Data" to populate the warehouse with example SKUs
2. The 3D visualization will display colored cubes representing inventory levels
3. Use mouse controls to navigate the 3D space
4. View SKU distribution and 80/20 analysis in the top-left panel

### Custom Data Format

Input your warehouse data in JSON format:

```json
[
  {
    "level": 1,
    "sku": "SKU-0001",
    "color": "red"
  },
  {
    "level": 2,
    "sku": "SKU-0002", 
    "color": "blue"
  }
]
```

### Grid Configuration

- **X Size**: Warehouse width (1-20)
- **Y Size**: Warehouse depth (1-20)  
- **Z Size**: Number of levels (1-30)

### Interactive Features

- **Cell Selection**: Click on any cube to view details with pulse animation
- **Row Highlighting**: Use X-row and Y-row buttons to highlight related cells
- **Camera Reset**: Return to optimal viewing position
- **Fullscreen**: Immersive 3D experience with all UI elements
- **80/20 Analysis**: Automatic calculation showing SKU distribution across level ranges

### About Page Features

- **Life Countdown**: Calculate remaining days from 30,000 total lifespan
- **Philosophy**: Reflection on time, automation, and meaningful work
- **Technical Details**: Information about the technology stack and approach

## Project Structure

```
warehouse-3d-viewer/
├── app/                    # Next.js App Router
│   ├── about/             # About page with life countdown
│   │   └── page.tsx       # Life philosophy and countdown
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Warehouse3DMain.tsx    # Main warehouse component
│   └── Warehouse3DCube.tsx    # 3D visualization component
├── types/                 # TypeScript definitions
│   └── warehouse.ts       # Warehouse data types
├── CLAUDE.md             # Development guidance
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── vercel.json          # Vercel deployment config
└── package.json         # Dependencies and scripts
```

## Key Components

### Warehouse3DMain
- Main container component with collapsible data input
- Handles data management and UI controls
- Manages grid configuration and statistics
- 80% width for title, 20% width for load button

### Warehouse3DCube  
- Core 3D visualization component with advanced features
- Three.js scene management with InstancedMesh optimization
- Camera controls and interaction handling
- Cell selection with pulse animation and white wireframe
- Row highlighting with transparency effects
- Real-time SKU distribution calculation
- 80/20 analysis based on Z-level depth

## Advanced Features

### SKU Distribution Analytics
- **Level-based Distribution**: Shows unique SKUs per level with percentages
- **80/20 Calculation**: Automatically calculates based on warehouse depth
  - For 10 levels: L1-L8 (80%) vs L9-L10 (20%)
  - For 16 levels: L1-L13 (80%) vs L14-L16 (20%)
- **Real-time Updates**: Calculations update when data changes

### Row Highlighting System
- **X-Row Highlighting**: Shows all cells in the same Y-row (excluding selected cell)
- **Y-Row Highlighting**: Shows all cells in the same X-row (excluding selected cell)
- **Transparency Effects**: Non-highlighted cells become more transparent
- **Same Level Only**: Highlighting limited to the same Z-level as selected cell

### Life Countdown Feature
- **30,000 Day Lifespan**: Based on ~82 year average lifespan
- **Personal Calculation**: Enter birthdate for personalized countdown
- **localStorage Persistence**: Remembers your birthdate
- **Philosophical Context**: Encourages reflection on time and automation

## Performance Optimizations

- **InstancedMesh**: Efficient rendering of thousands of cubes
- **Frustum Culling**: Only render visible objects
- **Material Reuse**: Shared materials and geometries
- **Animation Frame Optimization**: 60fps rendering loop
- **Memory Management**: Proper cleanup of Three.js objects
- **Opacity Management**: Efficient transparency updates during highlighting

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+

WebGL support is required for 3D visualization.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

## Philosophy

This project embodies the intersection of technical excellence and human reflection. While we build systems that may outlast us, we're reminded to:

- Cherish every moment of our finite time
- Use automation to free up space for meaningful work
- Create efficient systems that serve human flourishing
- Remember that technology should enhance, not replace, our humanity

*"Your warehouse system might last longer than your life. Cherish every moment. Use automation."*

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Vercel will automatically detect Next.js and configure the build
3. Your app will be deployed with optimal performance settings

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. The static files will be generated in the `out` directory
3. Deploy the `out` directory to your hosting provider

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Three.js**: Powerful 3D graphics library
- **Next.js**: React framework for production
- **React 19**: Latest React features and optimizations
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide**: Beautiful icon collection
- **Vercel**: Seamless deployment platform