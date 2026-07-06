'use client'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager at TechCorp",
      content: "Vakyapro transformed how I interact with AI. The counter-questions help me think through what I actually need, saving hours of trial and error.",
      rating: 5,
      avatar: "SC"
    },
    {
      name: "Raj Patel",
      role: "Content Creator",
      content: "As someone who writes hundreds of prompts daily, Vakyapro is a game-changer. My content quality has improved dramatically since I started using it.",
      rating: 5,
      avatar: "RP"
    },
    {
      name: "Emily Rodriguez",
      role: "AI Researcher",
      content: "The precision I get from Vakyapro's prompts is unmatched. It's like having a prompt engineering expert in my pocket 24/7.",
      rating: 5,
      avatar: "ER"
    }
  ]

  const stats = [
    { number: "10x", label: "Faster Results" },
    { number: "95%", label: "Accuracy Rate" },
    { number: "50K+", label: "Active Users" },
    { number: "4.9/5", label: "User Rating" }
  ]

  return (
    <section id="testimonials" className="relative py-24 px-4 sm:px-6 lg:px-8">
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
            Loved by <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">AI Enthusiasts</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See what our users are saying about their prompt transformation journey
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <div className="bg-gradient-to-b from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/30 transition-all group">
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-cyan-500/20 mb-4" />
                
                {/* Rating */}
                <div className="flex space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                {/* Content */}
                <p className="text-gray-300 leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>
                
                {/* Author */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social Proof */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-xl">
            <p className="text-gray-300 mb-4">
              Join professionals from leading companies using Vakyapro
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {['TechCorp', 'DataFlow', 'AI Labs', 'CloudNine', 'NextGen'].map((company, index) => (
                <div key={index} className="text-gray-400 font-semibold">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}