'use client'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Sparkles, Zap } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Drop Your Raw Idea",
      description: "Simply type your basic concept or goal. No need to be specific - we'll help you refine it.",
      icon: Sparkles,
      gradient: "from-cyan-400 to-blue-500"
    },
    {
      number: "2", 
      title: "Answer Smart Questions",
      description: "Respond to 2-4 targeted questions about context, tone, and your specific requirements.",
      icon: Zap,
      gradient: "from-blue-500 to-purple-600"
    },
    {
      number: "3",
      title: "Get Your Pro-Vakya",
      description: "Receive an expert-level prompt that delivers exactly what you need, every time.",
      icon: CheckCircle,
      gradient: "from-purple-600 to-pink-500"
    }
  ]

  return (
    <section id="how-it-works" className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05),transparent_70%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            How It <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Three simple steps to turn raw ideas into Pro-Vakya prompts your AI can actually follow
          </p>
        </motion.div>

        {/* Steps Layout */}
        <div className="grid lg:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className="bg-gradient-to-b from-gray-900/60 to-black/60 border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/40 transition-all group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center">
                      <span className="text-sm font-semibold text-cyan-300">Step {step.number}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  </div>
                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 group-hover:scale-110 transition-transform">
                    <step.icon className={`w-5 h-5 bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`} />
                  </div>
                </div>

                <p className="text-gray-400 leading-relaxed mb-6">{step.description}</p>

                <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-2">Example:</div>
                  <div className="text-sm text-gray-300">
                    {index === 0 && "\"Mujhe business ke liye email likhna hai\""}
                    {index === 1 && "\"From the founder to existing customers about a price update\""}
                    {index === 2 && "\"Draft a concise, professional email from the founder announcing a price update to existing customers, with a clear call-to-action and reassuring tone...\""}
                  </div>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="lg:hidden flex justify-center my-8">
                  <ArrowRight className="w-6 h-6 text-cyan-500" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-600/10 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-xl max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Transform Your AI Interactions?
            </h3>
            <p className="text-gray-300 mb-6">
              Join thousands of users who've already elevated their prompt game
            </p>
            <button className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold text-white hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105">
              Start Your Journey
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
