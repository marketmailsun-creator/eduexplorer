'use client';

import { useState } from 'react';
import { 
  BookOpen, 
  Headphones, 
  Presentation, 
  Layers, 
  Brain, 
  BarChart3, 
  Network,
  ArrowRight,
  Search,
  Sparkles
} from 'lucide-react';

export function LearningBlueprint() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const steps = [
    {
      id: 1,
      icon: Search,
      title: "Your Query",
      description: "Ask any question",
      color: "from-blue-500 to-cyan-500",
      example: '"Explain quantum computing"'
    },
    {
      id: 2,
      icon: Sparkles,
      title: "AI Research",
      description: "Web search & analysis",
      color: "from-purple-500 to-pink-500",
      example: "10+ sources analyzed"
    },
  ];

  const outputs = [
    {
      icon: BookOpen,
      title: "Article",
      description: "Comprehensive explanation",
      color: "from-blue-500 to-cyan-500",
      time: "~30 sec"
    },
    {
      icon: Headphones,
      title: "Audio",
      description: "Voice narration",
      color: "from-purple-500 to-pink-500",
      time: "~15 sec"
    },
    {
      icon: Presentation,
      title: "Slides",
      description: "Visual presentation",
      color: "from-orange-500 to-red-500",
      time: "~20 sec"
    },
    {
      icon: Layers,
      title: "Flashcards",
      description: "Study cards",
      color: "from-green-500 to-emerald-500",
      time: "~10 sec"
    },
    {
      icon: Brain,
      title: "Quiz",
      description: "Practice questions",
      color: "from-indigo-500 to-purple-500",
      time: "~15 sec"
    },
    {
      icon: BarChart3,
      title: "Diagrams",
      description: "Visual charts",
      color: "from-yellow-500 to-orange-500",
      time: "~20 sec"
    },
    {
      icon: Network,
      title: "Concept Map",
      description: "Mind map",
      color: "from-teal-500 to-cyan-500",
      time: "Instant"
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-8">
      <div className="relative">
        {/* Input Steps */}
        <div className="flex justify-center items-center gap-6 mb-12">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-6">
              {/* Step Card */}
              <div
                className="relative group cursor-pointer"
                onMouseEnter={() => setHoveredStep(step.id)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div className={`w-48 h-32 rounded-2xl bg-gradient-to-br ${step.color} p-0.5 shadow-lg hover:shadow-2xl transition-all duration-300 ${hoveredStep === step.id ? 'scale-105' : ''}`}>
                  <div className="bg-white rounded-2xl h-full p-4 flex flex-col items-center justify-center text-center">
                    <step.icon className="h-8 w-8 text-gray-700 mb-2" />
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-gray-600">{step.description}</p>
                    <p className="text-xs text-gray-400 mt-1 italic">{step.example}</p>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              {idx < steps.length - 1 && (
                <ArrowRight className="h-8 w-8 text-gray-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Center Arrow Down */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-0.5 h-12 bg-gradient-to-b from-purple-400 to-blue-400" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <ArrowRight className="h-4 w-4 text-white rotate-90" />
            </div>
            <div className="w-0.5 h-12 bg-gradient-to-b from-blue-400 to-purple-400" />
          </div>
        </div>

        {/* Output Grid */}
        <div className="relative">
          {/* Connection Lines Background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#60a5fa', stopOpacity: 0.3 }} />
              </linearGradient>
            </defs>
            {/* Radiating lines from center */}
            {outputs.map((_, idx) => {
              const totalOutputs = outputs.length;
              const cols = Math.min(4, totalOutputs);
              const row = Math.floor(idx / cols);
              const col = idx % cols;
              
              const startX = 50;
              const startY = 10;
              const endX = (col + 0.5) * (100 / cols);
              const endY = 30 + row * 35;

              return (
                <line
                  key={idx}
                  x1={`${startX}%`}
                  y1={`${startY}%`}
                  x2={`${endX}%`}
                  y2={`${endY}%`}
                  stroke="url(#line-gradient)"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
              );
            })}
          </svg>

          {/* Output Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative" style={{ zIndex: 1 }}>
            {outputs.map((output, idx) => (
              <div
                key={idx}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredStep(100 + idx)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div className={`relative bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-200 ${hoveredStep === 100 + idx ? 'scale-105' : ''}`}>
                  {/* Colored top border */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${output.color} rounded-t-xl`} />
                  
                  <div className="flex flex-col items-center text-center mt-2">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${output.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <output.icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{output.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">{output.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      {output.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-gradient-to-r from-purple-100 to-blue-100 px-6 py-3 rounded-full">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Total Generation Time:</span> ~2 minutes for complete learning package
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
