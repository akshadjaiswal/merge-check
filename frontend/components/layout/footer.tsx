import Link from 'next/link';
import { Shield, Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
              MergeCheck
            </span>
          </div>

          {/* Credits & Social */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="text-slate-600 text-sm">
              Made with ❤️ by <span className="font-semibold text-slate-900">Akshad</span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/akshadjaiswal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-cyan-600 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </Link>
              <Link
                href="https://x.com/akshad_999"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-cyan-600 transition-colors"
                aria-label="X (Twitter)"
              >
                <Twitter className="w-5 h-5" />
              </Link>
              <Link
                href="https://linkedin.com/in/akshadsantoshjaiswal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-cyan-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} MergeCheck. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
