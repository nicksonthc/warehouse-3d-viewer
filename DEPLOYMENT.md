# Deployment Guide

## Quick Deploy to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Warehouse 3D Viewer"
   git branch -M main
   git remote add origin https://github.com/yourusername/warehouse-3d-viewer.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js and configure the build
   - Click "Deploy"

### Option 2: Deploy with Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

## Manual Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd warehouse-3d-viewer
npm install
```

### 2. Environment Configuration

Create `.env.local` (optional):
```env
NEXT_PUBLIC_APP_NAME="Warehouse 3D Viewer"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### 3. Development

```bash
npm run dev
```

Visit: http://localhost:3000

### 4. Build for Production

```bash
npm run build
```

### 5. Test Production Build

```bash
npm run start
```

## Vercel Configuration

The project includes optimized Vercel configuration:

**vercel.json**:
- Static export enabled
- Security headers configured
- Node.js 18 runtime
- Optimized for SFO region

**next.config.js**:
- Static export enabled
- Three.js compatibility
- Image optimization disabled for static export

## Performance Optimizations

### Enabled Features:
- ✅ Static site generation (SSG)
- ✅ Three.js WebGL optimization
- ✅ Tailwind CSS purging
- ✅ TypeScript optimization
- ✅ Image optimization (disabled for static export)
- ✅ Automatic code splitting

### Browser Caching:
- Static assets cached for 1 year
- HTML cached for 1 hour
- API responses cached appropriately

## Troubleshooting

### Common Issues:

1. **Three.js Canvas Issues**:
   - Ensure WebGL is supported in target browsers
   - Check for hardware acceleration

2. **Build Errors**:
   - Verify Node.js version (18+)
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

3. **Performance Issues**:
   - Reduce warehouse grid size for better performance
   - Enable hardware acceleration in browser settings

### Debug Commands:

```bash
# Check build output
npm run build

# Analyze bundle
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

## Production Checklist

- [ ] All TypeScript errors resolved
- [ ] Build completes successfully
- [ ] 3D visualization renders correctly
- [ ] Mouse controls work properly
- [ ] Fullscreen mode functions
- [ ] Sample data loads correctly
- [ ] Statistics display properly
- [ ] Mobile responsive design verified
- [ ] Performance acceptable on target devices

## Monitoring

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor Core Web Vitals
- Track user engagement metrics

### Error Reporting
- Consider adding error boundary components
- Implement client-side error logging
- Monitor Three.js WebGL errors

## Scaling Considerations

### For Large Warehouses:
- Implement virtual scrolling for large cell lists
- Add LOD (Level of Detail) for distant objects
- Consider server-side data processing for very large datasets
- Implement data streaming for real-time updates

### Performance Targets:
- First Contentful Paint: < 2s
- Largest Contentful Paint: < 3s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms