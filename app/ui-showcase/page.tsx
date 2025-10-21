import { Star, Check, AlertCircle, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function UIShowcasePage() {
  return (
    <div className="min-h-screen bg-[var(--oklch-bg)] text-[var(--oklch-text-primary)] py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 text-gradient-glow">
            OKLCH Color System
          </h1>
          <p className="text-xl text-[var(--oklch-text-secondary)]">
            Premium Back-Lit UI Components
          </p>
        </div>

        {/* Demo Grid */}
        <div className="space-y-16">
          
          {/* 1. Frosted Glass Panels */}
          <section>
            <h2 className="text-3xl font-bold mb-6">1. Frosted Glass Panels</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="panel-frosted p-8">
                <h3 className="text-xl font-semibold mb-2">Frosted Panel</h3>
                <p className="text-[var(--oklch-text-secondary)]">
                  Premium elevated surface with backdrop blur and subtle grain texture.
                </p>
              </div>
              <div className="panel-frosted grain-texture relative p-8">
                <h3 className="text-xl font-semibold mb-2 relative z-10">With Grain Texture</h3>
                <p className="text-[var(--oklch-text-secondary)] relative z-10">
                  Adds subtle film grain for that premium feel.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Back-Lit Cards */}
          <section>
            <h2 className="text-3xl font-bold mb-6">2. Back-Lit Cards</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="card-backlit p-6">
                <Star className="h-8 w-8 mb-3 text-[var(--oklch-brand-3)]" />
                <h3 className="text-lg font-semibold mb-2">Inner Glow</h3>
                <p className="text-sm text-[var(--oklch-text-secondary)]">
                  Subtle inner ring creates depth
                </p>
              </div>
              <div className="card-backlit p-6">
                <Check className="h-8 w-8 mb-3 text-[var(--oklch-success)]" />
                <h3 className="text-lg font-semibold mb-2">Outer Bloom</h3>
                <p className="text-sm text-[var(--oklch-text-secondary)]">
                  Soft outer glow on hover
                </p>
              </div>
              <div className="card-backlit p-6">
                <Info className="h-8 w-8 mb-3 text-[var(--oklch-info)]" />
                <h3 className="text-lg font-semibold mb-2">Hover Me!</h3>
                <p className="text-sm text-[var(--oklch-text-secondary)]">
                  See the bloom effect intensify
                </p>
              </div>
            </div>
          </section>

          {/* 3. Premium Buttons */}
          <section>
            <h2 className="text-3xl font-bold mb-6">3. Glow Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <button className="button-glow">
                Apply Now
              </button>
              <button className="button-glow px-8 py-3 text-lg">
                Book Talent
              </button>
              <button className="button-glow">
                Post a Gig
              </button>
            </div>
            <p className="mt-4 text-sm text-[var(--oklch-text-tertiary)]">
              Notice the inner ring, outer bloom, and hover glow intensification
            </p>
          </section>

          {/* 4. Status Badges */}
          <section>
            <h2 className="text-3xl font-bold mb-6">4. Status Badges (OKLCH)</h2>
            <div className="flex flex-wrap gap-3">
              <span className="badge-status-new">New</span>
              <span className="badge-status-review">Under Review</span>
              <span className="badge-status-shortlist">Shortlisted</span>
              <span className="badge-status-accepted">Accepted</span>
              <span className="badge-status-rejected">Rejected</span>
            </div>
            <p className="mt-4 text-sm text-[var(--oklch-text-tertiary)]">
              Consistent lightness (68-75%), varying hues for distinction
            </p>
          </section>

          {/* 5. Text Colors */}
          <section>
            <h2 className="text-3xl font-bold mb-6">5. Text Hierarchy</h2>
            <div className="space-y-2 bg-[var(--oklch-panel)] p-6 rounded-2xl">
              <p className="text-lg text-[var(--oklch-text-primary)]">
                Primary Text - oklch(98% 0 0) - Maximum readability
              </p>
              <p className="text-lg text-[var(--oklch-text-secondary)]">
                Secondary Text - oklch(75% 0.01 258) - Muted white
              </p>
              <p className="text-lg text-[var(--oklch-text-tertiary)]">
                Tertiary Text - oklch(55% 0.02 258) - Subtle gray
              </p>
              <p className="text-lg text-[var(--oklch-text-muted)]">
                Muted Text - oklch(40% 0.02 258) - Very subtle
              </p>
            </div>
          </section>

          {/* 6. Brand Accent Ramp */}
          <section>
            <h2 className="text-3xl font-bold mb-6">6. Brand "Back-Light" Ramp</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[var(--oklch-brand-1)] p-6 rounded-xl text-center">
                <p className="text-sm font-semibold text-black">Brand 1</p>
                <p className="text-xs text-black/70">Soft Purple-Blue</p>
              </div>
              <div className="bg-[var(--oklch-brand-2)] p-6 rounded-xl text-center">
                <p className="text-sm font-semibold text-black">Brand 2</p>
                <p className="text-xs text-black/70">Vivid Blue</p>
              </div>
              <div className="bg-[var(--oklch-brand-3)] p-6 rounded-xl text-center">
                <p className="text-sm font-semibold text-black">Brand 3</p>
                <p className="text-xs text-black/70">Bright Glow ⭐</p>
              </div>
              <div className="bg-[var(--oklch-brand-4)] p-6 rounded-xl text-center">
                <p className="text-sm font-semibold text-white">Brand 4</p>
                <p className="text-xs text-white/70">Deep Blue</p>
              </div>
            </div>
          </section>

          {/* 7. Semantic Colors */}
          <section>
            <h2 className="text-3xl font-bold mb-6">7. Semantic Colors</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[var(--oklch-success)] p-4 rounded-xl">
                <p className="font-semibold text-black flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Success - Application Accepted
                </p>
              </div>
              <div className="bg-[var(--oklch-warning)] p-4 rounded-xl">
                <p className="font-semibold text-black flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Warning - Action Required
                </p>
              </div>
              <div className="bg-[var(--oklch-error)] p-4 rounded-xl">
                <p className="font-semibold text-white flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Error - Something Went Wrong
                </p>
              </div>
              <div className="bg-[var(--oklch-info)] p-4 rounded-xl">
                <p className="font-semibold text-black flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Info - New Feature Available
                </p>
              </div>
            </div>
          </section>

          {/* 8. Usage Examples */}
          <section className="panel-frosted p-8">
            <h2 className="text-3xl font-bold mb-6">8. How to Use</h2>
            <div className="space-y-4 text-sm">
              <div className="bg-[var(--oklch-surface)] p-4 rounded-lg">
                <p className="font-mono text-[var(--oklch-brand-3)] mb-2">
                  {`<div className="bg-oklch-panel text-oklch-text-primary">`}
                </p>
                <p className="text-[var(--oklch-text-secondary)]">
                  Use Tailwind utilities with OKLCH colors
                </p>
              </div>
              
              <div className="bg-[var(--oklch-surface)] p-4 rounded-lg">
                <p className="font-mono text-[var(--oklch-brand-3)] mb-2">
                  {`<div className="panel-frosted">`}
                </p>
                <p className="text-[var(--oklch-text-secondary)]">
                  Or use pre-built utility classes
                </p>
              </div>
              
              <div className="bg-[var(--oklch-surface)] p-4 rounded-lg">
                <p className="font-mono text-[var(--oklch-brand-3)] mb-2">
                  {`<button className="button-glow">Click Me</button>`}
                </p>
                <p className="text-[var(--oklch-text-secondary)]">
                  Premium components with one className
                </p>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <section className="text-center">
            <Link href="/">
              <Button variant="outline" className="mr-4">
                Back to Home
              </Button>
            </Link>
            <Link href="/talent">
              <Button className="button-glow border-0">
                See It In Action
              </Button>
            </Link>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-[var(--oklch-border)] text-center">
          <p className="text-[var(--oklch-text-tertiary)]">
            ✨ OKLCH Color System implemented • Modern, perceptually uniform, accessible
          </p>
          <p className="text-xs text-[var(--oklch-text-muted)] mt-2">
            All colors maintain 4.5:1 contrast ratio for WCAG AA compliance
          </p>
        </div>
      </div>
    </div>
  );
}

