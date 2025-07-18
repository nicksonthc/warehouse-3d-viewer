'use client'

import { useState } from 'react'
import Warehouse3DMain from '@/components/Warehouse3DMain'
import { Cube, Info, Github, ExternalLink } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                <Cube className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Warehouse 3D Viewer</h1>
                <p className="text-dark-400 text-sm">Interactive 3D warehouse SKU visualization</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="#about"
                className="flex items-center space-x-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
              >
                <Info className="w-4 h-4" />
                <span>About</span>
              </a>
              <a
                href="https://github.com/warehouse-3d-viewer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Warehouse3DMain />
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-700 bg-dark-800/50 backdrop-blur mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <p className="text-dark-400 text-sm">
              © 2024 Warehouse 3D Viewer. Built with Next.js and Three.js.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-dark-400 text-sm">
                Deployed on Vercel
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}