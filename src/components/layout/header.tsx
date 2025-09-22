'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Capsul Brasil
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="#sobre"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Sobre
            </Link>
            <Link
              href="#servicos"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Serviços
            </Link>
            <Link
              href="#contato"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Contato
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="#contato">
              <Button>Fale Conosco</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link
                href="#sobre"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sobre
              </Link>
              <Link
                href="#servicos"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Serviços
              </Link>
              <Link
                href="#contato"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contato
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                <Link href="/admin">
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="#contato">
                  <Button className="w-full">Fale Conosco</Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}