import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Shield, Zap, Target, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { Footer } from '@/components/layout/footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50/30 to-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-cyan-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                MergeCheck
              </span>
            </div>
            <Link href="/api/auth/github">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700">
                <Github className="w-5 h-5" />
                Sign in with GitHub
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <Badge className="mb-6 px-4 py-2 bg-cyan-100 text-cyan-700 border-cyan-300 hover:bg-cyan-200" variant="secondary">
            <Zap className="w-4 h-4 mr-1" />
            AI-Powered Code Reviews in Seconds
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Catch Bugs Before
            <br />
            <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
              They Reach Production
            </span>
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10">
            MergeCheck automatically reviews your Pull Requests for security vulnerabilities,
            performance issues, and code quality problems. Install once, protect forever.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/api/auth/github">
              <Button size="lg" className="gap-2 h-14 px-8 text-lg bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all">
                <Github className="w-5 h-5" />
                Add to GitHub
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-cyan-200 hover:bg-cyan-50">
              View Demo
            </Button>
          </div>

          <p className="text-sm text-slate-500 mt-6">
            Free forever • No credit card required • 2 minute setup
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 text-center border-2 border-cyan-100 hover:border-cyan-300 hover:shadow-lg transition-all">
            <div className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2">
              {'<10s'}
            </div>
            <div className="text-slate-600">Average Review Time</div>
          </Card>
          <Card className="p-8 text-center border-2 border-teal-100 hover:border-teal-300 hover:shadow-lg transition-all">
            <div className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              60%
            </div>
            <div className="text-slate-600">Faster Than Manual</div>
          </Card>
          <Card className="p-8 text-center border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-lg transition-all">
            <div className="text-4xl font-bold text-emerald-600 mb-2">$0</div>
            <div className="text-slate-600">Free Tier Forever</div>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-slate-600">Three simple steps to automated code reviews</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <Github className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">1. Install GitHub App</h3>
            <p className="text-slate-600">
              Connect MergeCheck to your repositories in just one click. Select which repos to monitor.
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">2. Open a Pull Request</h3>
            <p className="text-slate-600">
              Our AI instantly analyzes your code changes and identifies potential issues within seconds.
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">3. Get Instant Feedback</h3>
            <p className="text-slate-600">
              Receive inline comments on your PR with specific issues and suggested fixes.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-cyan-50/50 to-teal-50/50 rounded-3xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">What We Check</h2>
          <p className="text-xl text-slate-600">Comprehensive code analysis powered by AI</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8 hover:shadow-xl transition-shadow border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Security Vulnerabilities</h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    SQL Injection & XSS attacks
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Hardcoded secrets & API keys
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Authentication bypass risks
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-shadow border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Performance Issues</h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    N+1 query detection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Inefficient algorithms
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Memory leak warnings
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-shadow border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Code Quality</h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    High complexity warnings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Code duplication detection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Poor naming conventions
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-shadow border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Best Practices</h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Missing error handling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    TypeScript usage issues
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Deprecated API usage
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="p-12 text-center bg-gradient-to-r from-cyan-500 to-teal-600 border-0 shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            Start Catching Bugs Today
          </h2>
          <p className="text-xl text-cyan-100 mb-8">
            Join developers who ship code with confidence
          </p>
          <Link href="/api/auth/github">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg gap-2 shadow-lg hover:shadow-xl transition-all">
              <Github className="w-5 h-5" />
              Get Started Free
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
