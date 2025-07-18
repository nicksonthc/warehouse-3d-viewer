'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Info, Box, BarChart3, PieChart } from 'lucide-react'
import Warehouse3DCube from './Warehouse3DCube'
import { WarehouseItem, GridSize, SkuDistribution } from '../types/warehouse'

const Warehouse3DMain = () => {
  // State management
  const [warehouseCubeData, setWarehouseCubeData] = useState<WarehouseItem[]>([])
  const [warehouseJsonInput, setWarehouseJsonInput] = useState('')
  const [warehouseJsonError, setWarehouseJsonError] = useState('')
  const [warehouseLoading, setWarehouseLoading] = useState(false)
  const [warehouseGridSize, setWarehouseGridSize] = useState<GridSize>({
    x: 10,
    y: 10,
    z: 16
  })

  // Sample data for demonstration
  const warehouseSampleData: WarehouseItem[] = [
    { level: 1, sku: 'SKU-3821', color: 'orange' },
    { level: 1, sku: 'SKU-7462', color: 'orange' },
    { level: 2, sku: 'SKU-1938', color: 'yellow' },
    { level: 3, sku: 'SKU-5287', color: 'yellow' },
    { level: 4, sku: 'SKU-6173', color: 'yellow' },
    { level: 5, sku: 'SKU-2946', color: 'teal' },
    { level: 6, sku: 'SKU-9841', color: 'teal' },
    { level: 7, sku: 'SKU-7634', color: 'purple' },
    { level: 8, sku: 'SKU-3152', color: 'brown' },
    { level: 9, sku: 'SKU-8409', color: 'brown' },
    { level: 10, sku: 'SKU-2093', color: 'brown' },
    { level: 11, sku: 'SKU-6754', color: 'lime' },
    { level: 12, sku: 'SKU-1587', color: 'lime' },
    { level: 13, sku: 'SKU-9025', color: 'lime' },
    { level: 14, sku: 'SKU-4310', color: 'lime' },
    { level: 15, sku: 'SKU-7246', color: 'lime' },
    { level: 16, sku: 'SKU-7246', color: 'lime' },
    { level: 16, sku: 'SKU-1111', color: 'lime' }
  ]

  // Computed properties
  const warehouseSampleFormat = useMemo(() => `[
  {
    "level": 1,
    "sku": "SKU-0001",
    "color": "red"
  },
  {
     "level": 2 ,
    "sku": "SKU-0002",
    "color": "blue"
  }
] `, [warehouseGridSize])

  const warehouseSkuDistribution = useMemo(() => {
    const skuCounts: { [key: string]: number } = {}
    const total = warehouseCubeData.length
    
    warehouseCubeData.forEach(item => {
      skuCounts[item.sku] = (skuCounts[item.sku] || 0) + 1
    })
    
    return Object.entries(skuCounts)
      .map(([sku, count]) => ({
        sku,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.count - a.count)
  }, [warehouseCubeData])

  // Watch for JSON input changes
  useEffect(() => {
    validateWarehouseJson(warehouseJsonInput)
  }, [warehouseJsonInput])

  // Methods
  const loadSampleWarehouseData = () => {
    setWarehouseLoading(true)
    // Simulate loading delay
    setTimeout(() => {
      setWarehouseCubeData([...warehouseSampleData])
      setWarehouseJsonInput(JSON.stringify(warehouseSampleData, null, 2))
      setWarehouseLoading(false)
    }, 1000)
  }

  const validateWarehouseJson = (jsonString: string) => {
    setWarehouseJsonError('')
    if (!jsonString.trim()) {
      return
    }
    
    try {
      const parsed = JSON.parse(jsonString)
      if (!Array.isArray(parsed)) {
        setWarehouseJsonError('Data must be an array')
        return
      }
      
      // Validate each item
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i]
        if (!item.level || !item.sku || !item.color) {
          setWarehouseJsonError(`Item ${i + 1} must have level, sku, and color properties`)
          return
        }
        if (typeof item.level !== 'number') {
          setWarehouseJsonError(`Item ${i + 1}: level must be a number`)
          return
        }
      }
    } catch (error) {
      setWarehouseJsonError('Invalid JSON format')
    }
  }

  const updateWarehouseCubeData = () => {
    if (warehouseJsonError || !warehouseJsonInput) return
    
    try {
      const parsed = JSON.parse(warehouseJsonInput)
      setWarehouseCubeData(parsed.sort((a: WarehouseItem, b: WarehouseItem) => a.level - b.level))
    } catch (error) {
      setWarehouseJsonError('Failed to parse JSON')
    }
  }

  const handleGridSizeChange = (dimension: 'x' | 'y' | 'z', value: number) => {
    setWarehouseGridSize(prev => ({
      ...prev,
      [dimension]: value
    }))
  }

  return (
    <div className="space-y-6">
      {/* 3D Warehouse Visualization Section */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Box className="w-6 h-6 text-primary-500" />
              <div>
                <h2 className="text-xl font-semibold text-white">3D Warehouse Visualization</h2>
                <p className="text-dark-400 text-sm mt-1">
                  Interactive 3D visualization of warehouse inventory levels. Click and drag to rotate, scroll to zoom, and click on levels to view details.
                </p>
              </div>
            </div>
            <button
              onClick={loadSampleWarehouseData}
              disabled={warehouseLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${warehouseLoading ? 'animate-spin' : ''}`} />
              <span>Load Sample Data</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Grid Size Controls */}
          <div className="mb-6">
            <div className="bg-dark-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-4">Grid Size Configuration</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">X Size</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={warehouseGridSize.x}
                    onChange={(e) => handleGridSizeChange('x', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Y Size</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={warehouseGridSize.y}
                    onChange={(e) => handleGridSizeChange('y', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Z Size (Levels)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={warehouseGridSize.z}
                    onChange={(e) => handleGridSizeChange('z', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Input Section */}
          <div className="mb-6">
            <div className="relative">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Warehouse Data (JSON)
              </label>
              <textarea
                value={warehouseJsonInput}
                onChange={(e) => setWarehouseJsonInput(e.target.value)}
                placeholder="Enter JSON data for warehouse levels..."
                rows={4}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
              <div className="absolute top-0 right-0 mt-1 mr-1">
                <div className="group relative">
                  <button className="p-2 text-dark-400 hover:text-white">
                    <Info className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-8 w-96 bg-dark-700 border border-dark-600 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="font-semibold text-white mb-2">Data Format</div>
                    <pre className="text-xs text-dark-300 whitespace-pre-wrap font-mono">
                      {warehouseSampleFormat}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
            {warehouseJsonError && (
              <p className="mt-2 text-red-400 text-sm">{warehouseJsonError}</p>
            )}
          </div>

          <div className="flex justify-end mb-6">
            <button
              onClick={updateWarehouseCubeData}
              disabled={!warehouseJsonInput || !!warehouseJsonError}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Update Visualization</span>
            </button>
          </div>

          {/* 3D Visualization */}
          <div className="h-[90vh]">
            {warehouseCubeData.length > 0 ? (
              <Warehouse3DCube 
                cubeData={warehouseCubeData} 
                gridSize={warehouseGridSize} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 bg-dark-700 rounded-lg">
                <Box className="w-16 h-16 text-dark-500 mb-4" />
                <div className="text-xl font-medium text-white mb-2">No warehouse data loaded</div>
                <div className="text-dark-400 text-center">
                  Load sample data or enter your own JSON data to view the 3D visualization
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Statistics Section */}
      {warehouseCubeData.length > 0 && (
        <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
          <div className="p-6 border-b border-dark-700">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-primary-500" />
              <h2 className="text-xl font-semibold text-white">Warehouse Statistics</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-dark-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {warehouseGridSize.x}×{warehouseGridSize.y}×{warehouseGridSize.z}
                </div>
                <div className="text-sm text-dark-300">Grid Size</div>
              </div>
              <div className="bg-dark-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {warehouseGridSize.x * warehouseGridSize.y * warehouseGridSize.z}
                </div>
                <div className="text-sm text-dark-300">Total Cells</div>
              </div>
              <div className="bg-dark-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {warehouseGridSize.x * warehouseGridSize.y}
                </div>
                <div className="text-sm text-dark-300">Total XY Stack</div>
              </div>
              <div className="bg-dark-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">
                  {warehouseCubeData.length}
                </div>
                <div className="text-sm text-dark-300">Unique SKUs</div>
              </div>
            </div>

            {/* SKU Distribution Summary */}
            {warehouseSkuDistribution.length > 0 && (
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <PieChart className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-medium text-white">SKU Distribution Summary</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium text-white mb-2">
                      <strong>Top SKUs by Count:</strong>
                    </div>
                    <div className="space-y-2">
                      {warehouseSkuDistribution.slice(0, 5).map((item, index) => (
                        <div key={item.sku} className="flex justify-between items-center">
                          <span className="text-sm text-dark-300">
                            {index + 1}. {item.sku}
                          </span>
                          <span className="text-sm">
                            <span className="text-orange-400">{item.count}</span>
                            {' '}
                            <span className="text-green-400">({item.percentage}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white mb-2">
                      <strong>Distribution Stats:</strong>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-dark-300">Total SKUs:</span>
                        <span className="text-sm text-purple-400">{warehouseSkuDistribution.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-dark-300">Total Items:</span>
                        <span className="text-sm text-blue-400">{warehouseCubeData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-dark-300">Avg per SKU:</span>
                        <span className="text-sm text-lime-400">
                          {warehouseCubeData.length > 0 ? (warehouseCubeData.length / warehouseSkuDistribution.length).toFixed(1) : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Warehouse3DMain