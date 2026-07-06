'use client'
import { ArrowRight, Sparkles, Zap, Brain, Star } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16">
      {/* Animated Background Elements */}
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-full mb-8">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-300">Interactive Prompt Mentor</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
          <span className="block text-white mb-2">Turn Raw Ideas</span>
          <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Into Pro-Level Prompts
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          <span className="text-cyan-400 font-semibold">Vakyapro</span> turns your simple ideas into
          <span className="text-blue-400 font-semibold"> structured Pro-Vakya prompts.</span>
          <br className="hidden sm:block" />
          Our Smart Interrogator asks 2-4 focused questions about role, goal, tone, and constraints
          so your AI finally understands what you really need.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <a
            href="#waitlist"
            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-white overflow-hidden transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center justify-center space-x-2">
              <span>Join the Waitlist</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </a>
          
          <a
            href="#how-it-works"
            className="px-8 py-4 border border-cyan-500/30 rounded-xl font-semibold text-cyan-300 hover:bg-cyan-500/10 transition-all backdrop-blur-sm flex items-center justify-center"
          >
            See How It Works
          </a>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-sm">Context-Rich Prompts</span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <span className="text-sm">Counter-Question Engine</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-purple-400" />
            <span className="text-sm">Built for Pros & Creators</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-cyan-500/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-cyan-400 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  )
}
