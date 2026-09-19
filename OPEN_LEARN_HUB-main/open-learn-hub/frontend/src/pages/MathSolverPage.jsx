import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import MathSolver from '../components/MathSolver/MathSolver'

export default function MathSolverPage() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Math Solver</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Back
          </button>
        </div>
        <MathSolver />
      </motion.div>
    </div>
  )
}