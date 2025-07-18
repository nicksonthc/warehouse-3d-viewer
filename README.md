# Warehouse 3D Viewer

A standalone React application for interactive 3D warehouse SKU visualization, built with Next.js and Three.js.

## Features

- **Interactive 3D Visualization**: Click, drag to rotate, scroll to zoom
- **SKU Management**: Load and visualize warehouse inventory data
- **Grid Configuration**: Adjustable warehouse dimensions (X, Y, Z)
- **Cell Analysis**: Click on cells to view detailed information
- **Axis Views**: Visualize X-rows, Y-columns, and Z-levels
- **Fullscreen Mode**: Immersive 3D experience
- **Real-time Camera Position**: Track camera coordinates
- **Statistics Dashboard**: Comprehensive warehouse analytics
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **3D Graphics**: Three.js for WebGL rendering
- **Styling**: Tailwind CSS with custom dark theme
- **Icons**: Lucide React icons
- **Deployment**: Vercel-optimized build

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
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

- **Cell Selection**: Click on any cube to view details
- **Camera Reset**: Return to optimal viewing position
- **Axis Views**: Highlight X-rows, Y-columns, or Z-levels
- **Fullscreen**: Immersive 3D experience

## Project Structure

```
warehouse-3d-viewer/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Warehouse3DMain.tsx    # Main warehouse component
│   └── Warehouse3DCube.tsx    # 3D visualization component
├── types/                 # TypeScript definitions
│   └── warehouse.ts       # Warehouse data types
├── public/               # Static assets
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── vercel.json          # Vercel deployment config
└── package.json         # Dependencies and scripts
```

## Key Components

### Warehouse3DMain
- Main container component
- Handles data management and UI controls
- Manages grid configuration and statistics

### Warehouse3DCube  
- Core 3D visualization component
- Three.js scene management
- Camera controls and interaction handling
- Cell selection and axis highlighting

## Performance Optimizations

- **InstancedMesh**: Efficient rendering of thousands of cubes
- **Frustum Culling**: Only render visible objects
- **Texture Caching**: Reuse materials and geometries
- **Animation Frame Optimization**: 60fps rendering loop
- **Memory Management**: Proper cleanup of Three.js objects

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

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+

WebGL support is required for 3D visualization.

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
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide**: Beautiful icon collection