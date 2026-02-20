// src/components/layout/Footer.tsx — CREATE NEW
'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-3">EduExplorer</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              AI-powered learning platform. Explore any topic with instant lessons, quizzes, and flashcards.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: admin@eduexplorer.ai</li>
              <li>Support: support@eduexplorer.ai</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-6">
          {/* Meta/WhatsApp Business Compliance Section */}
          <div className="text-xs text-gray-500 space-y-1 mb-4">
            <p><strong className="text-gray-400">EduExplorer</strong></p>
            <p>Operated by: [Your Full Name or Company Name]</p>
            <p>Location: India</p>
            <p>Email: admin@eduexplorer.ai</p>
          </div>

          {/* Copyright */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>&copy; {currentYear} EduExplorer. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-gray-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-gray-300 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
