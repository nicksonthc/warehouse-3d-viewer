'use client'

import { useState, useEffect } from 'react'
import { Box, Clock, Heart, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  const [birthDate, setBirthDate] = useState<string>('')
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Try to load birth date from localStorage
    const savedBirthDate = localStorage.getItem('userBirthDate')
    if (savedBirthDate) {
      setBirthDate(savedBirthDate)
      calculateDaysRemaining(savedBirthDate)
    }
  }, [])

  const calculateDaysRemaining = (birth: string) => {
    if (!birth) return

    const birthDateObj = new Date(birth)
    const currentDate = new Date()
    const ageInDays = Math.floor((currentDate.getTime() - birthDateObj.getTime()) / (1000 * 60 * 60 * 24))
    const remaining = Math.max(0, 30000 - ageInDays)
    setDaysRemaining(remaining)
  }

  const handleBirthDateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (birthDate) {
      localStorage.setItem('userBirthDate', birthDate)
      calculateDaysRemaining(birthDate)
    }
  }

  const formatDaysToYears = (days: number) => {
    const years = Math.floor(days / 365.25)
    const remainingDays = Math.floor(days % 365.25)
    return `${years} years, ${remainingDays} days`
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">About Warehouse 3D Viewer</h1>
                <p className="text-dark-400 text-sm">Life perspective & automation philosophy</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center space-x-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Viewer</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Life Countdown Section */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
            <div className="p-6 border-b border-dark-700">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-semibold text-white">Life Countdown</h2>
              </div>
            </div>
            
            <div className="p-6">
              {!daysRemaining ? (
                <form onSubmit={handleBirthDateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Enter your birth date to see your life countdown
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Calculate Remaining Days
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-6">
                  <div className="bg-gradient-to-br from-red-900/50 to-orange-900/50 rounded-lg p-8 border border-red-800/30">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <Heart className="w-8 h-8 text-red-400 animate-pulse" />
                      <Calendar className="w-8 h-8 text-orange-400" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">
                      {daysRemaining.toLocaleString()}
                    </div>
                    <div className="text-lg text-red-300 mb-1">
                      Days Remaining
                    </div>
                    <div className="text-sm text-dark-400">
                      ({formatDaysToYears(daysRemaining)})
                    </div>
                    <div className="mt-4 text-xs text-dark-500">
                      *Based on an estimated 30,000 day lifespan (~82 years)
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setDaysRemaining(null)
                      setBirthDate('')
                      localStorage.removeItem('userBirthDate')
                    }}
                    className="text-sm text-dark-400 hover:text-white underline"
                  >
                    Reset calculation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Philosophy Section */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
            <div className="p-6 border-b border-dark-700">
              <div className="flex items-center space-x-3">
                <Box className="w-6 h-6 text-primary-500" />
                <h2 className="text-xl font-semibold text-white">Time & Automation</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <blockquote className="text-center py-8 px-6 bg-gradient-to-br from-primary-900/30 to-purple-900/30 rounded-lg border border-primary-800/30">
                <div className="text-2xl font-light text-white mb-4 italic leading-relaxed">
                  "Your warehouse system might last longer than your life.<br />
                  Cherish every moment. Use automation."
                </div>
                <div className="text-sm text-dark-400">
                  — A reminder about perspective and efficiency
                </div>
              </blockquote>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Why This Matters</h3>
                  <ul className="space-y-2 text-sm text-dark-300">
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Time is finite, but our systems can outlive us</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Automation frees us for meaningful moments</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Efficient systems create space for human connection</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Every optimization is a gift to your future self</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">About This Tool</h3>
                  <p className="text-sm text-dark-300 leading-relaxed">
                    This 3D warehouse visualization tool represents the intersection of efficiency and insight. 
                    By automating complex data visualization, we free up mental energy for strategic thinking 
                    and human connection.
                  </p>
                  <p className="text-sm text-dark-300 leading-relaxed">
                    While we build systems that may outlast us, let's remember to step back, 
                    appreciate the present moment, and use technology to enhance rather than replace 
                    our humanity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Section */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
            <div className="p-6 border-b border-dark-700">
              <div className="flex items-center space-x-3">
                <Box className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold text-white">Technical Details</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">Built With</h4>
                  <ul className="text-sm text-dark-300 space-y-1">
                    <li>• Next.js 15.4</li>
                    <li>• React 19</li>
                    <li>• Three.js</li>
                    <li>• TypeScript</li>
                    <li>• Tailwind CSS</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Features</h4>
                  <ul className="text-sm text-dark-300 space-y-1">
                    <li>• Interactive 3D visualization</li>
                    <li>• Real-time SKU analytics</li>
                    <li>• 80/20 distribution analysis</li>
                    <li>• Row highlighting</li>
                    <li>• Fullscreen mode</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Philosophy</h4>
                  <ul className="text-sm text-dark-300 space-y-1">
                    <li>• Automation over repetition</li>
                    <li>• Insight over data</li>
                    <li>• Simplicity over complexity</li>
                    <li>• Human connection over isolation</li>
                    <li>• Present moment awareness</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-700 bg-dark-800/50 backdrop-blur mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-dark-400 text-sm">
              Remember: Every day is a chance to create something meaningful. 
              {isClient && daysRemaining && (
                <span className="text-red-400 ml-2">
                  You have {daysRemaining.toLocaleString()} days left to make them count.
                </span>
              )}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}