'use client'

import { BurgerVector, PizzaVector, NoodlesVector, SushiVector, CoffeeVector, IceCreamVector } from '@/components/animated/food-vectors'

export default function AnimatedHero() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Left side vectors */}
      <div className="absolute top-20 left-[10%] text-yellow-400 animate-bounce-slow" style={{ animationDelay: '0s' }}>
        <BurgerVector />
      </div>
      <div className="absolute top-40 left-[20%] text-yellow-500 animate-swing" style={{ animationDelay: '-1s' }}>
        <PizzaVector />
      </div>
      <div className="absolute bottom-20 left-[15%] text-yellow-400 animate-wobble" style={{ animationDelay: '-2s' }}>
        <NoodlesVector />
      </div>

      {/* Right side vectors */}
      <div className="absolute top-32 right-[15%] text-yellow-500 animate-swing" style={{ animationDelay: '-1.5s' }}>
        <SushiVector />
      </div>
      <div className="absolute top-60 right-[25%] text-yellow-400 animate-bounce-slow" style={{ animationDelay: '-0.5s' }}>
        <CoffeeVector />
      </div>
      <div className="absolute bottom-32 right-[20%] text-yellow-500 animate-wobble" style={{ animationDelay: '-3s' }}>
        <IceCreamVector />
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20 pointer-events-none"></div>
    </div>
  )
}
