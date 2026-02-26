'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">

          {/* Brand */}
          <div>
            <h3 className="text-white font-semibold mb-2">EduExplorer</h3>
            <p className="text-sm leading-relaxed mb-3">
              AI-powered learning platform. Explore any topic with instant lessons, quizzes, and flashcards.
            </p>
            <p className="text-xs">
              Email:{' '}
              <a
                href="mailto:admin@eduexplorer.ai"
                className="hover:text-white transition-colors"
              >
                admin@eduexplorer.ai
              </a>
            </p>
          </div>

          {/* Legal links */}
          <div className="sm:text-right">
            <h3 className="text-white font-semibold mb-2">Legal</h3>
            <ul className="space-y-1.5 text-sm">
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
        </div>

        <div className="border-t border-gray-800 pt-4 text-xs text-gray-600">
          <p>&copy; {currentYear} EduExplorer. All rights reserved. Operated by Usha Sree, India.</p>
        </div>
      </div>
    </footer>
  );
}
