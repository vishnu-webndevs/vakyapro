'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react'

export default function WaitlistCTA() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubmitted(true)
      setTimeout(() => setIsSubmitted(false), 3000)
    }
  }

  return (
    <section id="waitlist" className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-600/10 to-purple-600/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_70%)]" />
      
      <div className="max-w-4xl mx-auto relative">
        <motion.div 
          className="bg-gradient-to-b from-gray-900/80 to-black/80 border border-cyan-500/20 rounded-3xl p-12 backdrop-blur-xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-full mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300">Limited Early Access</span>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Be the First to
              <span className="block bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                Use Vakyapro's Smart Interrogator
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join the Vakyapro waitlist and get early access to your interactive prompt mentor
              for professionals, creators, students, and small business owners. You'll also receive
              a free prompt engineering guide when we launch.
            </p>
          </motion.div>

          {/* Email Form */}
          <motion.form 
            onSubmit={handleSubmit}
            className="max-w-md mx-auto mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {!isSubmitted ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-4 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-white hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 group"
                >
                  <span>Join Waitlist</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <motion.div 
                className="flex items-center justify-center space-x-3 text-green-400"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-semibold">You're on the list!</span>
              </motion.div>
            )}
          </motion.form>

          {/* Benefits */}
          <motion.div 
            className="grid sm:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {[
              "Early bird pricing",
              "Exclusive features access", 
              "Free prompt guide"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center justify-center space-x-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-cyan-400" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </motion.div>

          {/* Trust Text */}
          <motion.p 
            className="text-center text-gray-400 text-sm mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            No spam, unsubscribe anytime. Built for professionals, creators, students, and small businesses.
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
