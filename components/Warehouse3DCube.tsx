'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { X, RotateCcw, Fullscreen } from 'lucide-react'
import { WarehouseItem, GridSize, CellInfo } from '../types/warehouse'

interface Warehouse3DCubeProps {
  cubeData: WarehouseItem[]
  gridSize: GridSize
}

const Warehouse3DCube: React.FC<Warehouse3DCubeProps> = ({ cubeData, gridSize }) => {
  // Three.js refs
  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const currentContainerRef = useRef<HTMLDivElement | null>(null)

  // State
  const [selectedCell, setSelectedCell] = useState<CellInfo | null>(null)
  const [highlightedRow, setHighlightedRow] = useState<{type: 'x' | 'y' | null, value: number | null, cells: CellInfo[]}>({type: null, value: null, cells: []})
  const [fullscreenDialog, setFullscreenDialog] = useState(false)
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 0 })

  // Compute level-based SKU distribution
  const levelSkuDistribution = useMemo(() => {
    const levelData: { [level: number]: Set<string> } = {}
    const allUniqueSKUs = new Set<string>()

    // Collect all unique SKUs and organize by level
    cubeData.forEach(item => {
      if (item.sku) {
        allUniqueSKUs.add(item.sku)
        if (!levelData[item.level]) {
          levelData[item.level] = new Set()
        }
        levelData[item.level].add(item.sku)
      }
    })

    const totalUniqueSKUs = allUniqueSKUs.size
    
    // Calculate percentage for each level
    return Object.entries(levelData)
      .map(([level, skuSet]) => ({
        level: parseInt(level),
        uniqueSKUs: skuSet.size,
        percentage: totalUniqueSKUs > 0 ? ((skuSet.size / totalUniqueSKUs) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => a.level - b.level)
  }, [cubeData])

  // Calculate 80/20 SKU distribution based on Z-level depth
  const eightyTwentyDistribution = useMemo(() => {
    const maxLevel = gridSize.z
    const eightyPercentLevels = Math.ceil(maxLevel * 0.8) // 80% of levels (top levels)
    const twentyPercentLevels = maxLevel - eightyPercentLevels // 20% of levels (bottom levels)
    
    const eightyPercentSKUs = new Set<string>()
    const twentyPercentSKUs = new Set<string>()
    
    cubeData.forEach(item => {
      if (item.sku) {
        if (item.level <= eightyPercentLevels) {
          eightyPercentSKUs.add(item.sku)
        } else {
          twentyPercentSKUs.add(item.sku)
        }
      }
    })
    
    return {
      eightyPercent: {
        levels: `L1-L${eightyPercentLevels}`,
        uniqueSKUs: eightyPercentSKUs.size,
        levelCount: eightyPercentLevels
      },
      twentyPercent: {
        levels: `L${eightyPercentLevels + 1}-L${maxLevel}`,
        uniqueSKUs: twentyPercentSKUs.size,
        levelCount: twentyPercentLevels
      }
    }
  }, [cubeData, gridSize.z])

  // Store cube meshes for raycasting
  const cubesRef = useRef<THREE.Mesh[]>([])
  const cellDataRef = useRef<Map<THREE.Mesh, CellInfo>>(new Map())
  const highlightMeshesRef = useRef<THREE.Mesh[]>([])
  const selectedCellHighlightRef = useRef<THREE.Group | null>(null)
  const animationTimeRef = useRef<number>(0)
  const mouseControlsCleanupRef = useRef<(() => void) | null>(null)

  // Mouse controls
  const mouseControlsRef = useRef({
    isMouseDown: false,
    mouseX: 0,
    mouseY: 0,
    lastWheelTime: 0
  })

  // Initialize Three.js scene
  const initThreeJS = useCallback(() => {
    if (!containerRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a1a)
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    
    // Position camera to view the grid
    const distance = Math.max(gridSize.x, gridSize.y, gridSize.z) * 3
    camera.position.set(distance, distance, distance)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    console.log(containerRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x1a1a1a, 1)
    
    // Ensure canvas fills the container
    const canvas = renderer.domElement
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.zIndex = '1'
    
    containerRef.current.appendChild(canvas)
    rendererRef.current = renderer
    currentContainerRef.current = containerRef.current

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = false
    scene.add(directionalLight)

    // Add coordinate axes with labels
    addCoordinateAxes()

    // Setup mouse controls
    addMouseControls()

    // Start animation loop
    animate()

    return () => {
      removeMouseControls()
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [gridSize])

  // Create warehouse cubes
  const createCubes = useCallback(() => {
    if (!sceneRef.current) return

    // Clear existing cubes and highlights
    cubesRef.current.forEach(cube => {
      sceneRef.current?.remove(cube)
    })
    highlightMeshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh)
    })
    if (selectedCellHighlightRef.current) {
      sceneRef.current?.remove(selectedCellHighlightRef.current)
      selectedCellHighlightRef.current = null
    }
    cubesRef.current = []
    cellDataRef.current.clear()
    highlightMeshesRef.current = []

    const verticalOffset = - (gridSize.z * 2) / 2

    // Create cubes for each grid position
    for (let x = 0; x < gridSize.x; x++) {
      for (let y = 0; y < gridSize.y; y++) {
        for (let z = 0; z < gridSize.z; z++) {
          // Position cube with corrected coordinates
          // X: normal (x0 at left, x9 at right)
          const posX = (x - (gridSize.x - 1) / 2) * 2
          // Y: inverted so y0 is at front, y9 is at back
          const posZ = -((y - (gridSize.y - 1) / 2) * 2)
          // Z: Level 1 at top, Level 16 at bottom (top to bottom)
          const posY = (gridSize.z - 1 - z) * 2 + verticalOffset

          // Find data for this position (level 1 = top, level 16 = bottom)
          const dataItem = cubeData.find(item => item.level === z + 1)
          const isEmpty = !dataItem

          // Create cube geometry and material
          const geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8)
          const material = new THREE.MeshLambertMaterial({
            color: isEmpty ? 0x333333 : dataItem.color || 0x666666,
            transparent: true,
            opacity: isEmpty ? 0.3 : 1.0
          })

          const cube = new THREE.Mesh(geometry, material)
          cube.position.set(posX, posY, posZ)
          cube.castShadow = true
          cube.receiveShadow = true

          // Store cell info with corrected coordinates
          const cellInfo: CellInfo = {
            data: {
              x: x,                   // Normal X coordinate (x0 at left, x9 at right)
              y: y,                   // Normal Y coordinate (y0 at front, y9 at back)
              z: z + 1,               // Level (1 = top, 16 = bottom)
              level: z + 1,
              sku: dataItem?.sku || '',
              color: dataItem?.color || '#333333',
              empty: isEmpty,
              position: `(${x},${y},${z + 1})`
            },
            position: new THREE.Vector3(posX, posY, posZ),
            color: dataItem?.color || '#333333',
            isEmpty
          }

          cellDataRef.current.set(cube, cellInfo)
          cubesRef.current.push(cube)
          sceneRef.current.add(cube)
        }
      }
    }
  }, [cubeData, gridSize])

  // Add coordinate axes with labels
  const addCoordinateAxes = useCallback(() => {
    if (!sceneRef.current) return
     const verticalOffset = - (gridSize.z * 2) / 2
    // X-axis (left to right) - Red line - positioned at back beside the grid
    const xAxisMaterial = new THREE.LineBasicMaterial({ color: '#ffffff', linewidth: 3 })
    const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-(gridSize.x - 1), 0 + verticalOffset, (gridSize.y - 1) + 2),
      new THREE.Vector3(gridSize.x - 1, 0 + verticalOffset, (gridSize.y - 1) + 2)
    ])
    const xAxisLine = new THREE.Line(xAxisGeometry, xAxisMaterial)
    sceneRef.current.add(xAxisLine)

    // Y-axis (front to back) - Blue line - positioned beside the grid
    const yAxisMaterial = new THREE.LineBasicMaterial({ color: '#ffffff', linewidth: 3 })
    const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-(gridSize.x - 1) - 2, 0 + verticalOffset, -(gridSize.y - 1)),
      new THREE.Vector3(-(gridSize.x - 1) - 2, 0 + verticalOffset, gridSize.y - 1)
    ])
    const yAxisLine = new THREE.Line(yAxisGeometry, yAxisMaterial)
    sceneRef.current.add(yAxisLine)

    // Add X-axis labels (0, 1, 2, ... gridSize.x-1)
    for (let x = 0; x < gridSize.x; x++) {
      const posX = (x - (gridSize.x - 1) / 2) * 2
      
      // Create text label
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) continue
      
      canvas.width = 32
      canvas.height = 32
      context.font = '20px Arial'
      context.fillStyle = '#ffffff'
      context.textAlign = 'center'
      context.fillText(`X${x}`, 16, 20)
      
      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(material)
      sprite.scale.set(1, 1, 1)
      sprite.position.set(posX, 0 + verticalOffset, (gridSize.y - 1) + 3 )  // Position labels at back (opposite side)
      
      sceneRef.current.add(sprite)
    }

    // Add Y-axis labels (0, 1, 2, ... gridSize.y-1)
    for (let y = 0; y < gridSize.y; y++) {
      const posZ = -((y - (gridSize.y - 1) / 2) * 2)
      
      // Create text label
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) continue
      
      canvas.width = 32
      canvas.height = 32
      context.font = '20px Arial'
      context.fillStyle = '#ffffff'
      context.textAlign = 'center'
      context.fillText(`Y${y}`, 16, 20)
      
      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(material)
      sprite.scale.set(1, 1, 1)
      sprite.position.set(-(gridSize.x - 1) - 3, 0 + verticalOffset , posZ)  // Position labels beside the grid
      
      sceneRef.current.add(sprite)
    }

    // Add Z-axis (depth/level) labels (1, 2, 3, ... gridSize.z) - from top to bottom
    for (let z = 0; z < gridSize.z; z++) {
      const posY = (gridSize.z - 1 - z) * 2  // Level 1 at top, Level 16 at bottom
      
      // Create text label
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) continue
      
      canvas.width = 32
      canvas.height = 32
      context.font = '20px Arial'
      context.fillStyle = '#ffffff'
      context.textAlign = 'center'
      context.fillText(`${z + 1}`, 16, 20)  // Level 1, 2, 3, etc.
      
      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(material)
      sprite.scale.set(1, 1, 1)
      sprite.position.set(-(gridSize.x - 1) - 3, posY + verticalOffset , (gridSize.y - 1) + 3)  // Position at back-left corner
      
      sceneRef.current.add(sprite)
    }
  }, [gridSize])

  // Update cell opacity based on highlighting state
  const updateCellOpacity = useCallback((highlightedCells: CellInfo[] = []) => {
    cubesRef.current.forEach(cube => {
      const cellInfo = cellDataRef.current.get(cube)
      if (cellInfo && cube.material instanceof THREE.MeshLambertMaterial) {
        const isHighlighted = highlightedCells.some(hCell => 
          hCell.data.x === cellInfo.data.x && 
          hCell.data.y === cellInfo.data.y && 
          hCell.data.z === cellInfo.data.z
        )
        
        if (highlightedCells.length > 0) {
          // When there are highlighted cells
          if (isHighlighted) {
            // Highlighted cells: more opaque
            cube.material.opacity = cellInfo.isEmpty ? 0.5 : 0.9
          } else {
            // Non-highlighted cells: very transparent
            cube.material.opacity = cellInfo.isEmpty ? 0.1 : 0.2
          }
        } else {
          // No highlighting: normal opacity
          cube.material.opacity = cellInfo.isEmpty ? 0.3 : 1.0
        }
        
        // Ensure material is marked as needing update
        cube.material.needsUpdate = true
      }
    })
  }, [])

  // Row highlighting functions
  const highlightRow = useCallback((type: 'x' | 'y', selectedCellX: number, selectedCellY: number) => {
    if (!sceneRef.current || !selectedCell) return

    // Clear existing highlights
    highlightMeshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh)
    })
    highlightMeshesRef.current = []

    // Find all cells in the row/column (excluding the selected cell, same Z level only)
    const rowCells: CellInfo[] = []
    const selectedCellZ = selectedCell.data.z
    
    cellDataRef.current.forEach((cellInfo, mesh) => {
      let shouldHighlight = false
      
      if (type === 'x') {
        // For X-row: show all cells with same Y and Z coordinates but different X (excluding selected cell)
        shouldHighlight = cellInfo.data.y === selectedCellY && 
                         cellInfo.data.z === selectedCellZ && 
                         cellInfo.data.x !== selectedCellX
      } else {
        // For Y-row: show all cells with same X and Z coordinates but different Y (excluding selected cell)
        shouldHighlight = cellInfo.data.x === selectedCellX && 
                         cellInfo.data.z === selectedCellZ && 
                         cellInfo.data.y !== selectedCellY
      }
      
      if (shouldHighlight) {
        rowCells.push(cellInfo)

        // Create highlight mesh for this cell
        const highlightGeometry = new THREE.BoxGeometry(2.0, 2.0, 2.0)
        const highlightMaterial = new THREE.MeshBasicMaterial({
          color: type === 'x' ? 0xff6b6b : 0x4ecdc4,
          transparent: true,
          opacity: 0.3,
          wireframe: false
        })
        
        const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial)
        highlightMesh.position.copy(cellInfo.position)
        sceneRef.current?.add(highlightMesh)
        highlightMeshesRef.current.push(highlightMesh)
      }
    })

    // Sort cells by position for better display
    rowCells.sort((a, b) => {
      if (type === 'x') {
        // For X-row, sort by X coordinate
        return a.data.x - b.data.x
      } else {
        // For Y-row, sort by Y coordinate
        return a.data.y - b.data.y
      }
    })

    const rowType = type === 'x' ? 'Y' : 'X'
    const rowValue = type === 'x' ? selectedCellY : selectedCellX
    setHighlightedRow({ type, value: rowValue, cells: rowCells })
    
    // Update cell opacity to make non-highlighted cells more transparent
    updateCellOpacity(rowCells)
  }, [selectedCell, updateCellOpacity])

  // Create selected cell highlight with pulsing animation
  const createSelectedCellHighlight = useCallback((cellInfo: CellInfo) => {
    if (!sceneRef.current) return

    // Remove existing highlight
    if (selectedCellHighlightRef.current) {
      sceneRef.current.remove(selectedCellHighlightRef.current)
      selectedCellHighlightRef.current = null
    }

    // Create highlight group
    const highlightGroup = new THREE.Group()

    // Create larger, brighter highlight mesh
    const highlightGeometry = new THREE.BoxGeometry(2.2, 2.2, 2.2)
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      wireframe: false
    })
    const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial)
    highlightGroup.add(highlightMesh)

    // Create bright white wireframe
    const wireframeGeometry = new THREE.BoxGeometry(2.3, 2.3, 2.3)
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      wireframe: true
    })
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial)
    highlightGroup.add(wireframeMesh)

    // Position the highlight group
    highlightGroup.position.copy(cellInfo.position)

    // Add to scene
    sceneRef.current.add(highlightGroup)
    selectedCellHighlightRef.current = highlightGroup
  }, [])

  const clearRowHighlight = useCallback(() => {
    if (!sceneRef.current) return

    // Clear highlight meshes
    highlightMeshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh)
    })
    highlightMeshesRef.current = []
    setHighlightedRow({ type: null, value: null, cells: [] })
    
    // Restore normal opacity for all cells
    updateCellOpacity([])
  }, [updateCellOpacity])

  // Mouse control handlers
  const addMouseControls = useCallback(() => {
    if (!currentContainerRef.current || !rendererRef.current) return

    const canvas = rendererRef.current.domElement

    const handleMouseDown = (event: MouseEvent) => {
      mouseControlsRef.current = {
        ...mouseControlsRef.current,
        isMouseDown: true,
        mouseX: event.clientX,
        mouseY: event.clientY
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseControlsRef.current.isMouseDown || !cameraRef.current) return

      const deltaX = event.clientX - mouseControlsRef.current.mouseX
      const deltaY = event.clientY - mouseControlsRef.current.mouseY

      // Spherical camera rotation
      const spherical = new THREE.Spherical()
      spherical.setFromVector3(cameraRef.current.position)
      spherical.theta -= deltaX * 0.01
      spherical.phi += deltaY * 0.01
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))

      cameraRef.current.position.setFromSpherical(spherical)
      cameraRef.current.lookAt(0, 0, 0)

      mouseControlsRef.current = {
        ...mouseControlsRef.current,
        mouseX: event.clientX,
        mouseY: event.clientY
      }
    }

    const handleMouseUp = () => {
      mouseControlsRef.current = {
        ...mouseControlsRef.current,
        isMouseDown: false
      }
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (!cameraRef.current) return

      const now = Date.now()
      if (now - mouseControlsRef.current.lastWheelTime < 50) return

      mouseControlsRef.current = {
        ...mouseControlsRef.current,
        lastWheelTime: now
      }

      const scale = event.deltaY > 0 ? 1.1 : 0.9
      cameraRef.current.position.multiplyScalar(scale)
      cameraRef.current.position.clampLength(5, 100)
    }

    const handleClick = (event: MouseEvent) => {
      if (!cameraRef.current || !rendererRef.current) return

      const canvas = rendererRef.current.domElement
      const rect = canvas.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, cameraRef.current)

      const intersects = raycaster.intersectObjects(cubesRef.current)
      if (intersects.length > 0) {
        const intersectedCube = intersects[0].object as THREE.Mesh
        const cellInfo = cellDataRef.current.get(intersectedCube)
        if (cellInfo) {
          setSelectedCell(cellInfo)
          createSelectedCellHighlight(cellInfo)
        }
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel)
    canvas.addEventListener('click', handleClick)

    const cleanup = () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('click', handleClick)
    }

    // Store cleanup function for manual removal
    mouseControlsCleanupRef.current = cleanup
    return cleanup
  }, [])

  const removeMouseControls = useCallback(() => {
    if (mouseControlsCleanupRef.current) {
      mouseControlsCleanupRef.current()
      mouseControlsCleanupRef.current = null
    }
  }, [])

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return

    // Update animation time
    animationTimeRef.current += 0.02

    // Update selected cell highlight animation
    if (selectedCellHighlightRef.current) {
      const pulseScale = 1 + Math.sin(animationTimeRef.current * 3) * 0.1
      const pulseOpacity = 0.3 + Math.sin(animationTimeRef.current * 4) * 0.2
      
      selectedCellHighlightRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          child.scale.setScalar(pulseScale)
          if (child.material instanceof THREE.MeshBasicMaterial) {
            if (index === 0) {
              // Highlight mesh
              child.material.opacity = pulseOpacity
            } else {
              // Wireframe mesh
              child.material.opacity = 0.6 + Math.sin(animationTimeRef.current * 5) * 0.3
            }
          }
        }
      })
    }

    // Update camera position display
    const roundedX = Math.round(cameraRef.current.position.x * 10) / 10
    const roundedY = Math.round(cameraRef.current.position.y * 10) / 10
    const roundedZ = Math.round(cameraRef.current.position.z * 10) / 10

    setCameraPosition(prev => {
      if (prev.x !== roundedX || prev.y !== roundedY || prev.z !== roundedZ) {
        return { x: roundedX, y: roundedY, z: roundedZ }
      }
      return prev
    })

    // Render the scene
    rendererRef.current.render(sceneRef.current, cameraRef.current)

    // Schedule next frame
    animationIdRef.current = requestAnimationFrame(animate)
  }, [])

  // Reset camera view
  const resetCameraView = useCallback(() => {
    if (!cameraRef.current) return

    const distance = Math.max(gridSize.x, gridSize.y, gridSize.z) * 3
    const targetPosition = new THREE.Vector3(distance, distance, distance)

    // Create smooth transition
    const startPosition = cameraRef.current.position.clone()
    const animationDuration = 800
    const startTime = performance.now()

    const animateCamera = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / animationDuration, 1)

      // Easing function
      const easedProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      // Interpolate position
      if (cameraRef.current) {
        cameraRef.current.position.lerpVectors(startPosition, targetPosition, easedProgress)
        cameraRef.current.lookAt(0, 0, 0)
      }

      if (progress < 1) {
        requestAnimationFrame(animateCamera)
      }
    }

    requestAnimationFrame(animateCamera)
  }, [gridSize])

  // Fullscreen functionality
  const openFullscreen = useCallback(() => {
    if (!fullscreenContainerRef.current || !rendererRef.current) return

    // Remove mouse controls from current container
    removeMouseControls()

    // Move renderer to fullscreen container
    fullscreenContainerRef.current.appendChild(rendererRef.current.domElement)
    currentContainerRef.current = fullscreenContainerRef.current

    // Resize for fullscreen
    const width = window.innerWidth
    const height = window.innerHeight - 64

    if (cameraRef.current) {
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
    }

    rendererRef.current.setSize(width, height)

    // Re-add mouse controls to new container with a small delay to ensure DOM is updated
    requestAnimationFrame(() => {
      addMouseControls()
    })
  }, [removeMouseControls, addMouseControls])

  const closeFullscreen = useCallback(() => {
    if (!containerRef.current || !rendererRef.current) return

    // Remove mouse controls from fullscreen container
    removeMouseControls()

    // Move renderer back to normal container
    containerRef.current.appendChild(rendererRef.current.domElement)
    currentContainerRef.current = containerRef.current

    // Re-add mouse controls to normal container
    addMouseControls()

    // Resize back to normal size
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    if (cameraRef.current) {
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
    }

    rendererRef.current.setSize(width, height)
    setFullscreenDialog(false)
  }, [removeMouseControls, addMouseControls])

  // Effects
  useEffect(() => {
    const cleanup = initThreeJS()
    return cleanup
  }, [initThreeJS])

  // Escape key handler for fullscreen
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fullscreenDialog) {
        closeFullscreen()
      }
    }

    if (fullscreenDialog) {
      document.addEventListener('keydown', handleEscapeKey)
      return () => document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [fullscreenDialog, closeFullscreen])

  useEffect(() => {
    createCubes()
  }, [createCubes])

  useEffect(() => {
    if (fullscreenDialog) {
      openFullscreen()
    }
  }, [fullscreenDialog, openFullscreen])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !currentContainerRef.current) return

      const width = fullscreenDialog ? window.innerWidth : currentContainerRef.current.clientWidth
      const height = fullscreenDialog ? window.innerHeight - 64 : currentContainerRef.current.clientHeight

      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [fullscreenDialog])

  return (
    <div className="warehouse-cube-container">
      <div className="threejs-wrapper">
        {/* <div ref={containerRef} className="threejs-container h-96 bg-dark-700 rounded-lg relative overflow-hidden"> */}
        <div ref={containerRef} className="threejs-container h-[75vh] bg-dark-700 rounded-lg relative overflow-hidden">

          {/* SKU Distribution Summary - Top Left */}
          {!fullscreenDialog && levelSkuDistribution.length > 0 && (
            <div className="absolute top-4 left-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 max-w-[250px] z-10 pointer-events-none">
              <div className="text-xs font-medium text-white mb-2">SKU Distribution by Level</div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {levelSkuDistribution.map((item) => (
                  <div key={item.level} className="flex justify-between text-xs">
                    <span className="text-dark-300">L{item.level}:</span>
                    <span className="text-white">
                      <span className="text-orange-400">{item.uniqueSKUs}</span>
                      <span className="text-dark-400 mx-1">SKUs</span>
                      <span className="text-green-400">({item.percentage}%)</span>
                    </span>
                  </div>
                ))}
              </div>
              
              {/* 80/20 Distribution Summary */}
              <div className="mt-3 pt-3 border-t border-dark-600">
                <div className="text-xs font-medium text-white mb-2">80/20 SKU Distribution</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-300">80% ({eightyTwentyDistribution.eightyPercent.levels}):</span>
                    <span className="text-cyan-400">{eightyTwentyDistribution.eightyPercent.uniqueSKUs} SKUs</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-300">20% ({eightyTwentyDistribution.twentyPercent.levels}):</span>
                    <span className="text-yellow-400">{eightyTwentyDistribution.twentyPercent.uniqueSKUs} SKUs</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Camera Position Display - Bottom Left */}
          {!fullscreenDialog && (
            <div className="absolute bottom-4 left-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 min-w-[140px] z-10 pointer-events-none">
              <div className="text-xs font-medium text-white mb-2">Camera Position</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">X:</span>
                  <span className="text-white font-mono">{cameraPosition.x}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Y:</span>
                  <span className="text-white font-mono">{cameraPosition.y}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Z:</span>
                  <span className="text-white font-mono">{cameraPosition.z}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cell Details Overlay - Top Right */}
          {selectedCell && (
            <div className="absolute top-4 right-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 w-[350px] z-10 pointer-events-auto">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium text-white">Cell Details</div>
                <button
                  onClick={() => {
                    setSelectedCell(null)
                    if (selectedCellHighlightRef.current && sceneRef.current) {
                      sceneRef.current.remove(selectedCellHighlightRef.current)
                      selectedCellHighlightRef.current = null
                    }
                  }}
                  className="text-dark-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Position:</span>
                  <span className="text-white font-mono">{selectedCell.data.position}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Level:</span>
                  <span className="text-white">{selectedCell.data.level}</span>
                </div>
                {!selectedCell.isEmpty ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-300">SKU:</span>
                    <span className="text-white">{selectedCell.data.sku}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-300">Status:</span>
                    <span className="text-orange-400">Empty</span>
                  </div>
                )}
                {selectedCell.color && selectedCell.color !== '#333333' && (
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-dark-300">Color:</span>
                    <div className="flex items-center space-x-1">
                      <div 
                        className="w-3 h-3 rounded-sm border border-dark-500"
                        style={{ backgroundColor: selectedCell.color }}
                      />
                      <span className="text-white">{selectedCell.color}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Row Highlight Buttons */}
              <div className="mt-3 pt-3 border-t border-dark-600">
                <div className="text-xs font-medium text-white mb-2">Highlight Row</div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => highlightRow('x', selectedCell.data.x, selectedCell.data.y)}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex-1"
                  >
                    X-Row (Y={selectedCell.data.y})
                  </button>
                  <button
                    onClick={() => highlightRow('y', selectedCell.data.x, selectedCell.data.y)}
                    className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs flex-1"
                  >
                    Y-Row (X={selectedCell.data.x})
                  </button>
                </div>
                {highlightedRow.type && (
                  <button
                    onClick={clearRowHighlight}
                    className="mt-2 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs w-full"
                  >
                    Clear Highlight
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Row Information Card */}
          {highlightedRow.type && (
            <div className="absolute top-4 right-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 w-[350px] z-10 pointer-events-auto mt-[280px]">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium text-white">
                  {highlightedRow.type === 'x' ? `Y=${highlightedRow.value} Row` : `X=${highlightedRow.value} Row`} Details
                </div>
                <button
                  onClick={clearRowHighlight}
                  className="text-dark-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Total Cells:</span>
                  <span className="text-white">{highlightedRow.cells.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Occupied:</span>
                  <span className="text-white">{highlightedRow.cells.filter(cell => !cell.isEmpty).length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Empty:</span>
                  <span className="text-orange-400">{highlightedRow.cells.filter(cell => cell.isEmpty).length}</span>
                </div>
                
                {/* Row cells list */}
                <div className="mt-3 max-h-64 overflow-y-auto">
                  <div className="text-xs font-medium text-white mb-1">
                    {highlightedRow.type === 'x' ? `Y=${highlightedRow.value} Row` : `X=${highlightedRow.value} Row`} {selectedCell ? `(L${selectedCell.data.z})` : ''}:
                  </div>
                  <div className="space-y-1">
                    {highlightedRow.cells.map((cell, index) => (
                      <div key={index} className="flex justify-between items-center text-xs py-1 px-2 bg-dark-700/50 rounded hover:bg-dark-600/50 cursor-pointer transition-colors"
                           onClick={() => {
                             setSelectedCell(cell)
                             createSelectedCellHighlight(cell)
                           }}>
                        <span className="text-dark-300">{cell.data.position}</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-dark-400">L{cell.data.level}</span>
                          {!cell.isEmpty ? (
                            <>
                              <div 
                                className="w-2 h-2 rounded-sm border border-dark-500"
                                style={{ backgroundColor: cell.color }}
                              />
                              <span className="text-white text-xs truncate max-w-[60px]">{cell.data.sku}</span>
                            </>
                          ) : (
                            <span className="text-orange-400">Empty</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={resetCameraView}
            className="flex items-center space-x-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset View</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFullscreenDialog(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg text-sm"
          >
            <Fullscreen className="w-4 h-4" />
            <span>Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Dialog */}
      {fullscreenDialog && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-dark-800 border-b border-dark-700">
            <h2 className="text-lg font-semibold text-white">3D Warehouse Visualization - Fullscreen</h2>
            <button
              onClick={closeFullscreen}
              className="text-dark-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 relative">
            <div ref={fullscreenContainerRef} className="w-full h-full bg-dark-700">
            </div>
            
            {/* SKU Distribution Summary - Fullscreen */}
            {levelSkuDistribution.length > 0 && (
              <div className="absolute top-4 left-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 max-w-[250px] z-20">
                <div className="text-xs font-medium text-white mb-2">SKU Distribution by Level</div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {levelSkuDistribution.map((item) => (
                    <div key={item.level} className="flex justify-between text-xs">
                      <span className="text-dark-300">L{item.level}:</span>
                      <span className="text-white">
                        <span className="text-orange-400">{item.uniqueSKUs}</span>
                        <span className="text-dark-400 mx-1">SKUs</span>
                        <span className="text-green-400">({item.percentage}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* 80/20 Distribution Summary */}
                <div className="mt-3 pt-3 border-t border-dark-600">
                  <div className="text-xs font-medium text-white mb-2">80/20 SKU Distribution</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-dark-300">80% ({eightyTwentyDistribution.eightyPercent.levels}):</span>
                      <span className="text-cyan-400">{eightyTwentyDistribution.eightyPercent.uniqueSKUs} SKUs</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-dark-300">20% ({eightyTwentyDistribution.twentyPercent.levels}):</span>
                      <span className="text-yellow-400">{eightyTwentyDistribution.twentyPercent.uniqueSKUs} SKUs</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Cell Details in Fullscreen */}
            {selectedCell && (
              <div className="absolute top-4 right-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 w-[350px] z-20">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium text-white">Cell Details</div>
                    <button
                      onClick={() => {
                        setSelectedCell(null)
                        if (selectedCellHighlightRef.current && sceneRef.current) {
                          sceneRef.current.remove(selectedCellHighlightRef.current)
                          selectedCellHighlightRef.current = null
                        }
                      }}
                      className="text-dark-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-dark-300">Position:</span>
                      <span className="text-white font-mono">{selectedCell.data.position}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-dark-300">Level:</span>
                      <span className="text-white">{selectedCell.data.level}</span>
                    </div>
                    {!selectedCell.isEmpty ? (
                      <div className="flex justify-between text-xs">
                        <span className="text-dark-300">SKU:</span>
                        <span className="text-white">{selectedCell.data.sku}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-xs">
                        <span className="text-dark-300">Status:</span>
                        <span className="text-orange-400">Empty</span>
                      </div>
                    )}
                    {selectedCell.color && selectedCell.color !== '#333333' && (
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-dark-300">Color:</span>
                        <div className="flex items-center space-x-1">
                          <div 
                            className="w-3 h-3 rounded-sm border border-dark-500"
                            style={{ backgroundColor: selectedCell.color }}
                          />
                          <span className="text-white">{selectedCell.color}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Row Highlight Buttons */}
                  <div className="mt-3 pt-3 border-t border-dark-600">
                    <div className="text-xs font-medium text-white mb-2">Highlight Row</div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => highlightRow('x', selectedCell.data.x, selectedCell.data.y)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex-1"
                      >
                        X-Row (Y={selectedCell.data.y})
                      </button>
                      <button
                        onClick={() => highlightRow('y', selectedCell.data.x, selectedCell.data.y)}
                        className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs flex-1"
                      >
                        Y-Row (X={selectedCell.data.x})
                      </button>
                    </div>
                    {highlightedRow.type && (
                      <button
                        onClick={clearRowHighlight}
                        className="mt-2 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs w-full"
                      >
                        Clear Highlight
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Row Information Card - Fullscreen */}
              {highlightedRow.type && (
                <div className="absolute top-4 right-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 w-[350px] mt-[280px]">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium text-white">
                      {highlightedRow.type === 'x' ? `Y=${highlightedRow.value} Row` : `X=${highlightedRow.value} Row`} Details
                    </div>
                    <button
                      onClick={clearRowHighlight}
                      className="text-dark-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-dark-300">Total Cells:</span>
                      <span className="text-white">{highlightedRow.cells.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-dark-300">Occupied:</span>
                      <span className="text-white">{highlightedRow.cells.filter(cell => !cell.isEmpty).length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-dark-300">Empty:</span>
                      <span className="text-orange-400">{highlightedRow.cells.filter(cell => cell.isEmpty).length}</span>
                    </div>
                    
                    {/* Row cells list */}
                    <div className="mt-3 max-h-64 overflow-y-auto">
                      <div className="text-xs font-medium text-white mb-1">
                        {highlightedRow.type === 'x' ? `Y=${highlightedRow.value} Row` : `X=${highlightedRow.value} Row`} {selectedCell ? `(L${selectedCell.data.z})` : ''}:
                      </div>
                      <div className="space-y-1">
                        {highlightedRow.cells.map((cell, index) => (
                          <div key={index} className="flex justify-between items-center text-xs py-1 px-2 bg-dark-700/50 rounded hover:bg-dark-600/50 cursor-pointer transition-colors"
                               onClick={() => {
                             setSelectedCell(cell)
                             createSelectedCellHighlight(cell)
                           }}>
                            <span className="text-dark-300">{cell.data.position}</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-dark-400">L{cell.data.level}</span>
                              {!cell.isEmpty ? (
                                <>
                                  <div 
                                    className="w-2 h-2 rounded-sm border border-dark-500"
                                    style={{ backgroundColor: cell.color }}
                                  />
                                  <span className="text-white text-xs truncate max-w-[60px]">{cell.data.sku}</span>
                                </>
                              ) : (
                                <span className="text-orange-400">Empty</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Camera Position in Fullscreen */}
              <div className="absolute bottom-4 left-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 min-w-[140px]">
                <div className="text-xs font-medium text-white mb-2">Camera Position</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-300">X:</span>
                    <span className="text-white font-mono">{cameraPosition.x}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-300">Y:</span>
                    <span className="text-white font-mono">{cameraPosition.y}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-300">Z:</span>
                    <span className="text-white font-mono">{cameraPosition.z}</span>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
      )}
    </div>
  )
}

export default Warehouse3DCube