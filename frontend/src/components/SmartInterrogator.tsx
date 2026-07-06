'use client'
import { motion } from 'framer-motion'
import { MessageSquare, Target, Lightbulb, CheckCircle, ArrowRight } from 'lucide-react'

export default function SmartInterrogator() {
  const features = [
    {
      icon: MessageSquare,
      title: "Use-Case Clarity",
      description: "We capture your use case, audience, and background so prompts never feel generic",
      color: "from-cyan-400 to-blue-500"
    },
    {
      icon: Target,
      title: "Role & Goal Mapping",
      description: "Lock in the exact persona and outcome your AI should focus on",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: Lightbulb,
      title: "Tone & Constraints",
      description: "Dial in tone, length, and format so every response fits your context",
      color: "from-purple-600 to-pink-500"
    }
  ]

  return (
    <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            The <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Smart Interrogator</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our interactive counter-question engine captures role, goal, tone, and constraints before your prompt is generated.
          </p>
        </motion.div>

        {/* Main Feature Card */}
        <motion.div 
          className="relative mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-3xl p-8 sm:p-12 backdrop-blur-xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6 text-white">
                  From Vague Ideas to <span className="text-cyan-400">Crystal Clear</span> Prompts
                </h3>
                <p className="text-gray-300 mb-8 leading-relaxed">
                  Unlike basic prompt tools that give you generic templates, Vakyapro acts as your personal 
                  prompt engineering assistant. We ask 2-4 strategic questions about:
                </p>
                
                <div className="space-y-4">
                  {[
                    "Your specific goal and expected outcome",
                    "Target audience and context",
                    "Preferred tone and communication style",
                    "Technical requirements and constraints"
                  ].map((item, index) => (
                    <motion.div 
                      key={index}
                      className="flex items-start space-x-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                    >
                      <CheckCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-200">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Interactive Demo Visual */}
              <div className="relative">
                <div className="bg-black/50 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                      <p className="text-sm text-cyan-300 mb-2">Your Raw Idea:</p>
                      <p className="text-white">"Write about marketing"</p>
                    </div>
                    
                    <motion.div 
                      className="flex justify-center"
                      animate={{ y: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ArrowRight className="w-6 h-6 text-cyan-400" />
                    </motion.div>
                    
                    <div className="space-y-3">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-sm text-blue-300">What's your target audience?</p>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                        <p className="text-sm text-purple-300">What type of marketing content?</p>
                      </div>
                      <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3">
                        <p className="text-sm text-pink-300">What tone should it have?</p>
                      </div>
                    </div>
                    
                    <motion.div 
                      className="flex justify-center"
                      animate={{ y: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ArrowRight className="w-6 h-6 text-cyan-400" />
                    </motion.div>
                    
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
                      <p className="text-sm text-green-300 mb-2">Expert Prompt:</p>
                      <p className="text-white text-sm leading-relaxed">
                        "Create a comprehensive social media marketing strategy for B2B SaaS companies targeting CTOs, focusing on LinkedIn content with a professional yet engaging tone..."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <div className="bg-gradient-to-b from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/30 transition-all group">
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
