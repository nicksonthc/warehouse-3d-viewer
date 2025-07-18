export interface WarehouseItem {
  level: number
  sku: string
  color: string
  x?: number
  y?: number
  z?: number
  empty?: boolean
  position?: string
}

export interface GridSize {
  x: number
  y: number
  z: number
}

export interface CameraPosition {
  x: number
  y: number
  z: number
}

export interface CellInfo {
  data: WarehouseItem & {
    x: number
    y: number
    z: number
  }
  position: THREE.Vector3
  color: string
  isEmpty: boolean
}

export interface WarehouseLevelStat {
  level: number
  uniqueSKUs: number
  percentage: string
}

export interface SkuDistribution {
  sku: string
  count: number
  percentage: string
}

export type ViewMode = 'normal' | 'x-axis' | 'y-axis'

export type OpacityMode = 'super-transparent' | 'normal' | 'solid'

export interface AxisHighlight {
  highlightMesh: THREE.Mesh
  wireframeMesh: THREE.Mesh
  type: string
}