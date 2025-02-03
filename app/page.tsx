import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { Heart, Map, Utensils } from 'lucide-react'
import AnimatedHero from './components/animated-hero'

export default async function Home() {
  const supabase = createServerComponentClient<Database>({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white text-black w-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5"></div>
        
        {/* Animated Food Vectors */}
        <AnimatedHero />

        <div className="w-full px-4 pt-32 pb-20 md:pt-40 md:pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 animate-scale-in">
              Your Personal Restaurant Journey Starts Here
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Track, discover, and share your favorite dining spots. Create your own curated collection of must-visit restaurants.
            </p>
            <div className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {!user ? (
                <Link
                  href="/auth"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 rounded-lg font-medium transition-all transform hover:scale-105 relative overflow-hidden group"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 animate-shimmer"></div>
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 rounded-lg font-medium transition-all transform hover:scale-105 relative overflow-hidden group"
                >
                  <span className="relative z-10">Go to Dashboard</span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 animate-shimmer"></div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="w-full px-4 py-20 bg-gray-50">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-500">
          Everything You Need to Track Your Food Adventures
        </h2>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature Cards */}
          <div className="bg-white shadow-lg rounded-xl p-6 hover:border-yellow-500/50 transition-all border border-gray-100">
            <div className="bg-yellow-400/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Map className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">Track Locations</h3>
            <p className="text-zinc-600">
              Save and organize your favorite restaurants with detailed information and personal notes.
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-xl p-6 hover:border-yellow-500/50 transition-all border border-gray-100">
            <div className="bg-yellow-400/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">Personal Collections</h3>
            <p className="text-zinc-600">
              Create your own curated lists of favorite restaurants and must-try dishes.
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-xl p-6 hover:border-yellow-500/50 transition-all border border-gray-100">
            <div className="bg-yellow-400/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Utensils className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">Dish Recommendations</h3>
            <p className="text-zinc-600">
              Keep track of must-try dishes and share recommendations with friends.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
