'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { 
  RotateCcw, 
  Fullscreen, 
  X, 
  ArrowLeftRight, 
  ArrowUpDown, 
  Layers, 
  Eye, 
  Opacity 
} from 'lucide-react'
import { 
  WarehouseItem, 
  GridSize, 
  CameraPosition, 
  CellInfo, 
  WarehouseLevelStat, 
  ViewMode, 
  OpacityMode,
  AxisHighlight 
} from '@/types/warehouse'

interface Warehouse3DCubeProps {
  cubeData: WarehouseItem[]
  gridSize: GridSize
}

const Warehouse3DCube: React.FC<Warehouse3DCubeProps> = ({ cubeData, gridSize }) => {
  // Refs for Three.js
  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const currentContainerRef = useRef<HTMLDivElement | null>(null)

  // State
  const [selectedLevel, setSelectedLevel] = useState<CellInfo | null>(null)
  const [fullscreenDialog, setFullscreenDialog] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('normal')
  const [opacityMode, setOpacityMode] = useState<OpacityMode>('solid')
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>({ x: 0, y: 0, z: 0 })
  const [axisCells, setAxisCells] = useState<CellInfo[]>([])
  const [columnCells, setColumnCells] = useState<CellInfo[]>([])

  // Three.js objects
  const [instancedMesh, setInstancedMesh] = useState<THREE.InstancedMesh | null>(null)
  const [cellDataMap, setCellDataMap] = useState<Map<string, CellInfo>>(new Map())
  const [warehouseLevelStats, setWarehouseLevelStats] = useState<WarehouseLevelStat[]>([])
  const [axisHighlights, setAxisHighlights] = useState<AxisHighlight[]>([])
  const [axisElements, setAxisElements] = useState<THREE.Object3D[]>([])

  // Mouse controls
  const [mouseControls, setMouseControls] = useState({
    isMouseDown: false,
    mouseX: 0,
    mouseY: 0,
    lastWheelTime: 0
  })

  // Initial camera position
  const initialCameraPosition = { x: -15, y: 15, z: 20 }

  // Calculate optimal camera position based on warehouse size
  const calculateOptimalCameraPosition = useCallback(() => {
    const width = gridSize.x * 2
    const depth = gridSize.y * 2
    const height = gridSize.z * 2

    // Calculate warehouse diagonal for camera distance
    const warehouseDiagonal = Math.sqrt(width * width + depth * depth + height * height)

    // Calculate minimum distance needed to fit warehouse in view
    const fovRadians = (75 * Math.PI) / 180
    const minDistance = (warehouseDiagonal / 2) / Math.tan(fovRadians / 2) * 1.2

    const baseDistance = Math.max(minDistance, 15)
    const cameraDistance = baseDistance * 1.5

    // Position camera at optimal distance on a sphere around warehouse center
    const theta = Math.PI / 4 // 45° horizontal angle
    const phi = Math.PI / 3   // 60° vertical angle (elevated view)

    const position = {
      x: cameraDistance * Math.sin(phi) * Math.cos(theta),
      y: cameraDistance * Math.cos(phi),
      z: cameraDistance * Math.sin(phi) * Math.sin(theta)
    }

    return position
  }, [gridSize])

  // Initialize Three.js scene
  const initThreeJS = useCallback(() => {
    if (!containerRef.current) return

    // CREATE SCENE - This is the 3D world container
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a1a)
    sceneRef.current = scene

    // CREATE CAMERA - This defines the viewer's perspective
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    
    // Set adaptive camera position
    const optimalCameraPosition = calculateOptimalCameraPosition()
    camera.position.set(optimalCameraPosition.x, optimalCameraPosition.y, optimalCameraPosition.z)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // CREATE RENDERER - This draws the 3D scene to a 2D canvas
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x1a1a1a, 1)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer
    currentContainerRef.current = containerRef.current

    // CREATE LIGHTING SYSTEM
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // CREATE FLOOR GRID HELPER
    const gridHelper = new THREE.GridHelper(
      Math.max(gridSize.x, gridSize.y) * 2,
      Math.max(gridSize.x, gridSize.y),
      0x444444,
      0x444444
    )
    gridHelper.position.y = -1
    scene.add(gridHelper)

    // Setup mouse controls
    addMouseControls()

    // Start animation loop
    animate()

    return () => {
      // Cleanup
      removeMouseControls()
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [gridSize, calculateOptimalCameraPosition])

  // Create warehouse cubes using InstancedMesh for performance
  const createWarehouseCubes = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) return

    // Clear existing cubes
    if (instancedMesh) {
      sceneRef.current.remove(instancedMesh)
    }

    // Clear existing cell data
    const newCellDataMap = new Map<string, CellInfo>()

    // Create instanced geometry for performance
    const cubeGeometry = new THREE.BoxGeometry(1.8, 1.8, 1.8)
    const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 })
    const maxInstances = gridSize.x * gridSize.y * gridSize.z

    const mesh = new THREE.InstancedMesh(cubeGeometry, cubeMaterial, maxInstances)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.castShadow = true
    mesh.receiveShadow = true

    let instanceIndex = 0
    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()

    // Create cubes for each grid position
    for (let x = 0; x < gridSize.x; x++) {
      for (let y = 0; y < gridSize.y; y++) {
        for (let z = 1; z <= gridSize.z; z++) {
          const key = `${x},${y},${z}`
          
          // Find data for this position
          const dataItem = cubeData.find(item => item.level === z)
          const isEmpty = !dataItem

          // Set position
          const posX = (x - (gridSize.x - 1) / 2) * 2
          const posY = (gridSize.z - z) * 2
          const posZ = ((gridSize.y - 1) / 2 - y) * 2

          matrix.setPosition(posX, posY, posZ)
          mesh.setMatrixAt(instanceIndex, matrix)

          // Set color
          if (isEmpty) {
            color.setHex(0x333333) // Empty cell color
          } else {
            color.setStyle(dataItem.color)
          }
          mesh.setColorAt(instanceIndex, color)

          // Store cell info
          const cellInfo: CellInfo = {
            data: {
              ...dataItem,
              x,
              y,
              z,
              level: z,
              sku: dataItem?.sku || '',
              color: dataItem?.color || '#333333',
              empty: isEmpty,
              position: `(${x},${y},${z})`
            },
            position: new THREE.Vector3(posX, posY, posZ),
            color: dataItem?.color || '#333333',
            isEmpty
          }

          newCellDataMap.set(key, cellInfo)
          instanceIndex++
        }
      }
    }

    // Update instance count
    mesh.count = instanceIndex

    // Update matrices and colors
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }

    sceneRef.current.add(mesh)
    setInstancedMesh(mesh)
    setCellDataMap(newCellDataMap)

    // Calculate warehouse level stats
    const levelStats = calculateWarehouseLevelStats(cubeData)
    setWarehouseLevelStats(levelStats)
  }, [cubeData, gridSize, instancedMesh])

  // Calculate warehouse level statistics
  const calculateWarehouseLevelStats = useCallback((data: WarehouseItem[]): WarehouseLevelStat[] => {
    const levelCounts: { [key: number]: Set<string> } = {}
    const totalItems = data.length

    data.forEach(item => {
      if (!levelCounts[item.level]) {
        levelCounts[item.level] = new Set()
      }
      levelCounts[item.level].add(item.sku)
    })

    return Object.entries(levelCounts).map(([level, skus]) => ({
      level: parseInt(level),
      uniqueSKUs: skus.size,
      percentage: totalItems > 0 ? ((skus.size / totalItems) * 100).toFixed(1) : '0'
    })).sort((a, b) => a.level - b.level)
  }, [])

  // Mouse control handlers
  const addMouseControls = useCallback(() => {
    if (!currentContainerRef.current || !rendererRef.current) return

    const canvas = rendererRef.current.domElement

    const handleMouseDown = (event: MouseEvent) => {
      setMouseControls(prev => ({
        ...prev,
        isMouseDown: true,
        mouseX: event.clientX,
        mouseY: event.clientY
      }))
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseControls.isMouseDown || !cameraRef.current) return

      const deltaX = event.clientX - mouseControls.mouseX
      const deltaY = event.clientY - mouseControls.mouseY

      // Spherical camera rotation
      const spherical = new THREE.Spherical()
      spherical.setFromVector3(cameraRef.current.position)
      spherical.theta -= deltaX * 0.01
      spherical.phi += deltaY * 0.01
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))

      cameraRef.current.position.setFromSpherical(spherical)
      cameraRef.current.lookAt(0, 8, 0)

      setMouseControls(prev => ({
        ...prev,
        mouseX: event.clientX,
        mouseY: event.clientY
      }))
    }

    const handleMouseUp = () => {
      setMouseControls(prev => ({
        ...prev,
        isMouseDown: false
      }))
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (!cameraRef.current) return

      const now = Date.now()
      if (now - mouseControls.lastWheelTime < 50) return

      setMouseControls(prev => ({
        ...prev,
        lastWheelTime: now
      }))

      const scale = event.deltaY > 0 ? 1.1 : 0.9
      cameraRef.current.position.multiplyScalar(scale)
      cameraRef.current.position.clampLength(10, 100)
    }

    const handleClick = (event: MouseEvent) => {
      // Handle cell selection
      handleCellSelection(event)
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel)
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('click', handleClick)
    }
  }, [mouseControls])

  const removeMouseControls = useCallback(() => {
    // Mouse controls cleanup is handled by the return function in addMouseControls
  }, [])

  // Handle cell selection with raycasting
  const handleCellSelection = useCallback((event: MouseEvent) => {
    if (!cameraRef.current || !instancedMesh || !rendererRef.current) return

    const canvas = rendererRef.current.domElement
    const rect = canvas.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, cameraRef.current)

    const intersects = raycaster.intersectObject(instancedMesh)
    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId
      if (instanceId !== undefined) {
        // Find the cell info for this instance
        const cellInfoArray = Array.from(cellDataMap.values())
        if (cellInfoArray[instanceId]) {
          setSelectedLevel(cellInfoArray[instanceId])
        }
      }
    }
  }, [instancedMesh, cellDataMap])

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return

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

  // Reset camera to optimal position
  const resetCameraView = useCallback(() => {
    if (!cameraRef.current) return

    const optimalPosition = calculateOptimalCameraPosition()
    const targetPosition = new THREE.Vector3(
      optimalPosition.x,
      optimalPosition.y,
      optimalPosition.z
    )

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
  }, [calculateOptimalCameraPosition])

  // Fullscreen functionality
  const openFullscreen = useCallback(() => {
    if (!fullscreenContainerRef.current || !rendererRef.current) return

    // Remove mouse controls from current container
    removeMouseControls()

    // Move renderer to fullscreen container
    fullscreenContainerRef.current.appendChild(rendererRef.current.domElement)
    currentContainerRef.current = fullscreenContainerRef.current

    // Re-add mouse controls to new container
    addMouseControls()

    // Resize for fullscreen
    const width = window.innerWidth
    const height = window.innerHeight - 64 // Account for toolbar

    if (cameraRef.current) {
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
    }

    rendererRef.current.setSize(width, height)
  }, [removeMouseControls, addMouseControls])

  const closeFullscreen = useCallback(() => {
    if (!containerRef.current || !rendererRef.current) return

    // Move renderer back to normal container
    containerRef.current.appendChild(rendererRef.current.domElement)
    currentContainerRef.current = containerRef.current

    // Resize back to normal size
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    if (cameraRef.current) {
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
    }

    rendererRef.current.setSize(width, height)
    setFullscreenDialog(false)
  }, [])

  // Axis view functionality
  const showXAxisCells = useCallback(() => {
    if (!selectedLevel) return

    setViewMode('x-axis')
    setAxisCells([])
    setColumnCells([])

    const selectedX = selectedLevel.data.x
    const selectedY = selectedLevel.data.y
    const selectedZ = selectedLevel.data.z

    const axisCellsData: CellInfo[] = []
    const columnCellsData: CellInfo[] = []

    // Show all cells along the X-axis
    for (let x = 0; x < gridSize.x; x++) {
      const key = `${x},${selectedY},${selectedZ}`
      const cellInfo = cellDataMap.get(key)
      if (cellInfo) {
        axisCellsData.push(cellInfo)
      }
    }

    // Show vertical column through Z levels
    for (let z = 1; z <= gridSize.z; z++) {
      if (z !== selectedZ) {
        const key = `${selectedX},${selectedY},${z}`
        const cellInfo = cellDataMap.get(key)
        if (cellInfo) {
          columnCellsData.push(cellInfo)
        }
      }
    }

    setAxisCells(axisCellsData)
    setColumnCells(columnCellsData)
  }, [selectedLevel, gridSize, cellDataMap])

  const showYAxisCells = useCallback(() => {
    if (!selectedLevel) return

    setViewMode('y-axis')
    setAxisCells([])
    setColumnCells([])

    const selectedX = selectedLevel.data.x
    const selectedY = selectedLevel.data.y
    const selectedZ = selectedLevel.data.z

    const axisCellsData: CellInfo[] = []
    const columnCellsData: CellInfo[] = []

    // Show all cells along the Y-axis
    for (let y = 0; y < gridSize.y; y++) {
      const key = `${selectedX},${y},${selectedZ}`
      const cellInfo = cellDataMap.get(key)
      if (cellInfo) {
        axisCellsData.push(cellInfo)
      }
    }

    // Show vertical column through Z levels
    for (let z = 1; z <= gridSize.z; z++) {
      if (z !== selectedZ) {
        const key = `${selectedX},${selectedY},${z}`
        const cellInfo = cellDataMap.get(key)
        if (cellInfo) {
          columnCellsData.push(cellInfo)
        }
      }
    }

    setAxisCells(axisCellsData)
    setColumnCells(columnCellsData)
  }, [selectedLevel, gridSize, cellDataMap])

  const resetAxisView = useCallback(() => {
    setViewMode('normal')
    setAxisCells([])
    setColumnCells([])
  }, [])

  // Effects
  useEffect(() => {
    const cleanup = initThreeJS()
    return cleanup
  }, [initThreeJS])

  useEffect(() => {
    createWarehouseCubes()
  }, [createWarehouseCubes])

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
        <div ref={containerRef} className="threejs-container h-96 bg-dark-700 rounded-lg relative">
          {/* Summary Statistics Overlay - Top Left */}
          {warehouseLevelStats.length > 0 && (
            <div className="absolute top-4 left-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 max-w-xs">
              <div className="text-sm font-medium text-white mb-2">SKU Distribution</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Total SKUs:</span>
                  <span className="text-white">{cubeData.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Total Levels:</span>
                  <span className="text-white">{warehouseLevelStats.length}</span>
                </div>
              </div>
              <div className="mt-2 max-h-24 overflow-y-auto">
                {warehouseLevelStats.slice(0, 5).map(stat => (
                  <div key={stat.level} className="flex justify-between text-xs text-dark-300">
                    <span>Z{stat.level}:</span>
                    <span>{stat.uniqueSKUs} ({stat.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Camera Position Display - Bottom Left (Regular View Only) */}
          {!fullscreenDialog && (
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
          )}

          {/* Cell Details Overlay - Top Right */}
          {selectedLevel && (
            <div className="absolute top-4 right-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 min-w-[200px]">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium text-white">Cell Details</div>
                <button
                  onClick={() => setSelectedLevel(null)}
                  className="text-dark-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Position:</span>
                  <span className="text-white font-mono">{selectedLevel.data.position}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-dark-300">Level:</span>
                  <span className="text-white">{selectedLevel.data.level}</span>
                </div>
                {!selectedLevel.data.empty ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-300">SKU:</span>
                    <span className="text-white">{selectedLevel.data.sku}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs">
                    <span className="text-dark-300">Status:</span>
                    <span className="text-dark-400">Empty</span>
                  </div>
                )}
                {selectedLevel.data.color && (
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-dark-300">Color:</span>
                    <div className="flex items-center space-x-1">
                      <div 
                        className="w-3 h-3 rounded-sm border border-dark-500"
                        style={{ backgroundColor: selectedLevel.data.color }}
                      />
                      <span className="text-white">{selectedLevel.data.color}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={showXAxisCells}
                  className="w-full flex items-center justify-center space-x-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>X-Row</span>
                </button>
                <button
                  onClick={showYAxisCells}
                  className="w-full flex items-center justify-center space-x-2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>Y-Column</span>
                </button>
                <button
                  onClick={resetAxisView}
                  disabled={viewMode === 'normal'}
                  className="w-full flex items-center justify-center space-x-2 px-2 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600/50 text-white rounded text-xs"
                >
                  <Eye className="w-3 h-3" />
                  <span>Normal</span>
                </button>
              </div>
            </div>
          )}

          {/* Organized Cell Lists for X/Y Axis Views */}
          {viewMode !== 'normal' && (axisCells.length > 0 || columnCells.length > 0) && (
            <div className="absolute bottom-4 right-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 max-w-sm max-h-64 overflow-y-auto">
              {/* Axis Cells Section */}
              {axisCells.length > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-primary-400">
                      {viewMode === 'x-axis' ? 'X-Row' : 'Y-Column'} Cells
                    </span>
                    <span className="text-xs text-primary-400 bg-primary-400/20 px-2 py-1 rounded">
                      {axisCells.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {axisCells.slice(0, 3).map((cell, index) => (
                      <div key={index} className="flex justify-between text-xs border-l-2 border-blue-500 pl-2">
                        <span className="text-dark-300">{cell.data.position}</span>
                        <span className="text-white">
                          {cell.data.empty ? 'Empty' : cell.data.sku}
                        </span>
                      </div>
                    ))}
                    {axisCells.length > 3 && (
                      <div className="text-xs text-dark-400 text-center">
                        +{axisCells.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Column Cells Section */}
              {columnCells.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-cyan-400">Z-Column Cells</span>
                    <span className="text-xs text-cyan-400 bg-cyan-400/20 px-2 py-1 rounded">
                      {columnCells.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {columnCells.slice(0, 3).map((cell, index) => (
                      <div key={index} className="flex justify-between text-xs border-l-2 border-cyan-500 pl-2">
                        <span className="text-dark-300">{cell.data.position}</span>
                        <span className="text-white">
                          {cell.data.empty ? 'Empty' : cell.data.sku}
                        </span>
                      </div>
                    ))}
                    {columnCells.length > 3 && (
                      <div className="text-xs text-dark-400 text-center">
                        +{columnCells.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
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
            <h2 className="text-lg font-semibold text-white">3D Warehouse SKU Visualization - Fullscreen</h2>
            <button
              onClick={closeFullscreen}
              className="text-dark-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 relative">
            <div ref={fullscreenContainerRef} className="w-full h-full bg-dark-700">
              {/* Summary Statistics Overlay - Top Left in Fullscreen */}
              {warehouseLevelStats.length > 0 && (
                <div className="absolute top-4 left-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 max-w-xs">
                  <div className="text-sm font-medium text-white mb-2">SKU Distribution</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-dark-300">Total SKUs:</span>
                      <span className="text-white">{cubeData.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-dark-300">Total Levels:</span>
                      <span className="text-white">{warehouseLevelStats.length}</span>
                    </div>
                  </div>
                  <div className="mt-2 max-h-24 overflow-y-auto">
                    {warehouseLevelStats.slice(0, 5).map(stat => (
                      <div key={stat.level} className="flex justify-between text-xs text-dark-300">
                        <span>Z{stat.level}:</span>
                        <span>{stat.uniqueSKUs} ({stat.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cell Details Overlay - Top Right in Fullscreen */}
              {selectedLevel && (
                <div className="absolute top-4 right-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 min-w-[200px]">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium text-white">Cell Details</div>
                    <button
                      onClick={() => setSelectedLevel(null)}
                      className="text-dark-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-dark-300">Position:</span>
                      <span className="text-white font-mono">{selectedLevel.data.position}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-dark-300">Level:</span>
                      <span className="text-white">{selectedLevel.data.level}</span>
                    </div>
                    {!selectedLevel.data.empty ? (
                      <div className="flex justify-between text-xs">
                        <span className="text-dark-300">SKU:</span>
                        <span className="text-white">{selectedLevel.data.sku}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-xs">
                        <span className="text-dark-300">Status:</span>
                        <span className="text-dark-400">Empty</span>
                      </div>
                    )}
                    {selectedLevel.data.color && (
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-dark-300">Color:</span>
                        <div className="flex items-center space-x-1">
                          <div 
                            className="w-3 h-3 rounded-sm border border-dark-500"
                            style={{ backgroundColor: selectedLevel.data.color }}
                          />
                          <span className="text-white">{selectedLevel.data.color}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    <button
                      onClick={showXAxisCells}
                      className="w-full flex items-center justify-center space-x-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>X-Row</span>
                    </button>
                    <button
                      onClick={showYAxisCells}
                      className="w-full flex items-center justify-center space-x-2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span>Y-Column</span>
                    </button>
                    <button
                      onClick={resetAxisView}
                      disabled={viewMode === 'normal'}
                      className="w-full flex items-center justify-center space-x-2 px-2 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600/50 text-white rounded text-xs"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Normal</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Organized Cell Lists for X/Y Axis Views in Fullscreen */}
              {viewMode !== 'normal' && (axisCells.length > 0 || columnCells.length > 0) && (
                <div className="absolute bottom-4 right-4 bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-3 max-w-sm max-h-64 overflow-y-auto">
                  {/* Axis Cells Section */}
                  {axisCells.length > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-primary-400">
                          {viewMode === 'x-axis' ? 'X-Row' : 'Y-Column'} Cells
                        </span>
                        <span className="text-xs text-primary-400 bg-primary-400/20 px-2 py-1 rounded">
                          {axisCells.length}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {axisCells.slice(0, 3).map((cell, index) => (
                          <div key={index} className="flex justify-between text-xs border-l-2 border-blue-500 pl-2">
                            <span className="text-dark-300">{cell.data.position}</span>
                            <span className="text-white">
                              {cell.data.empty ? 'Empty' : cell.data.sku}
                            </span>
                          </div>
                        ))}
                        {axisCells.length > 3 && (
                          <div className="text-xs text-dark-400 text-center">
                            +{axisCells.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Column Cells Section */}
                  {columnCells.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-cyan-400">Z-Column Cells</span>
                        <span className="text-xs text-cyan-400 bg-cyan-400/20 px-2 py-1 rounded">
                          {columnCells.length}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {columnCells.slice(0, 3).map((cell, index) => (
                          <div key={index} className="flex justify-between text-xs border-l-2 border-cyan-500 pl-2">
                            <span className="text-dark-300">{cell.data.position}</span>
                            <span className="text-white">
                              {cell.data.empty ? 'Empty' : cell.data.sku}
                            </span>
                          </div>
                        ))}
                        {columnCells.length > 3 && (
                          <div className="text-xs text-dark-400 text-center">
                            +{columnCells.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Camera Position Display in Fullscreen - Bottom Left (Fullscreen View Only) */}
              {fullscreenDialog && (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Warehouse3DCube