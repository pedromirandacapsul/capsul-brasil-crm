import { Hero } from '@/components/sections/hero'
import { Features } from '@/components/sections/features'
import { About } from '@/components/sections/about'
import { Contact } from '@/components/sections/contact'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <About />
      <Contact />
      <Footer />
    </main>
  )
}