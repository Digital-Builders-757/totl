# 08 - Monitoring & Performance Optimization

## 📊 Performance Health Score: 6/10 ⚠️

The TOTL Agency platform has good architectural foundations but requires optimization in several key areas to achieve production-grade performance.

## 🎯 Current Performance Metrics

### **Build & Bundle Analysis**
```yaml
build_time: "~30 seconds (36 pages)"
bundle_sizes:
  base: "101kB"
  largest_page: "207kB (choose-role)"
  average_page: "150kB"
  
static_generation: "60% of pages"
performance_score: "6/10"
optimization_opportunities: "High"
```

### **Page Load Performance**
```yaml
first_contentful_paint: "Not measured"
largest_contentful_paint: "Not measured"
cumulative_layout_shift: "Not measured"
time_to_interactive: "Not measured"

# Target metrics for optimization:
target_fcp: "<1.5s"
target_lcp: "<2.5s"
target_cls: "<0.1"
target_tti: "<3s"
```

## 🔧 Critical Performance Issues

### **1. Image Optimization Disabled** 🔴
```javascript
// Current configuration (PROBLEM)
// next.config.mjs
const nextConfig = {
  images: {
    unoptimized: true, // ❌ CRITICAL: Disables optimization
  },
};

// ✅ SOLUTION: Enable optimization
const nextConfig = {
  images: {
    unoptimized: false, // Enable optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/**'
      }
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

### **2. Missing Dynamic Imports** 🔴
```typescript
// Current loading (PROBLEM)
import AdminCharts from './admin-charts'; // Heavy component loaded synchronously

function AdminDashboard() {
  return (
    <div>
      <AdminCharts /> {/* Blocks initial render */}
    </div>
  );
}

// ✅ SOLUTION: Dynamic imports with loading states
import dynamic from 'next/dynamic';

const AdminCharts = dynamic(() => import('./admin-charts'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Skip SSR for heavy client components
});

const AdminReports = dynamic(() => import('./admin-reports'), {
  loading: () => <ReportsSkeleton />,
});

function AdminDashboard() {
  return (
    <div>
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminCharts />
        <AdminReports />
      </Suspense>
    </div>
  );
}
```

### **3. Missing React Optimizations** 🟡
```typescript
// Current component patterns (INEFFICIENT)
function GigList({ gigs, onGigSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Recreated on every render
  const filteredGigs = gigs.filter(gig => 
    gig.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Recreated on every render
  const handleGigClick = (gig) => {
    onGigSelect(gig);
  };
  
  return (
    <div>
      {filteredGigs.map(gig => (
        <GigCard key={gig.id} gig={gig} onClick={handleGigClick} />
      ))}
    </div>
  );
}

// ✅ SOLUTION: Optimized with memoization
import React, { useState, useMemo, useCallback } from 'react';

const GigList = React.memo(function GigList({ gigs, onGigSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Memoized expensive calculation
  const filteredGigs = useMemo(() => {
    return gigs.filter(gig => 
      gig.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [gigs, searchTerm]);
  
  // Memoized callback
  const handleGigClick = useCallback((gig) => {
    onGigSelect?.(gig);
  }, [onGigSelect]);
  
  return (
    <div>
      {filteredGigs.map(gig => (
        <MemoizedGigCard 
          key={gig.id} 
          gig={gig} 
          onClick={handleGigClick} 
        />
      ))}
    </div>
  );
});

const MemoizedGigCard = React.memo(GigCard);
```

## 🚀 Performance Optimization Implementation

### **Bundle Size Optimization**
```bash
# 1. Analyze current bundle
npm run build
npx @next/bundle-analyzer

# 2. Install webpack-bundle-analyzer for detailed analysis
npm install --save-dev webpack-bundle-analyzer

# 3. Add to package.json scripts
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "analyze:server": "BUNDLE_ANALYZE=server npm run build",
    "analyze:browser": "BUNDLE_ANALYZE=browser npm run build"
  }
}
```

```javascript
// next.config.mjs - Bundle analysis
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Existing config
  webpack: (config, { isServer }) => {
    // Optimize chunks
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    return config;
  },
});
```

### **Database Query Optimization**
```typescript
// Current query patterns (INEFFICIENT)
async function loadDashboardData() {
  // Multiple separate queries (N+1 problem)
  const gigs = await supabase.from('gigs').select('*');
  
  for (const gig of gigs) {
    const applications = await supabase
      .from('applications')
      .select('*')
      .eq('gig_id', gig.id);
  }
}

// ✅ SOLUTION: Optimized with joins and explicit columns
async function loadDashboardData() {
  // Single query with join and explicit columns
  const { data: gigsWithApplications } = await supabase
    .from('gigs')
    .select(`
      id,
      title,
      status,
      created_at,
      applications(
        id,
        status,
        created_at,
        talent_id
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50); // Limit results for performance
  
  return gigsWithApplications;
}
```

### **Caching Strategy Implementation**
```typescript
// Server Component with ISR caching
export const revalidate = 3600; // Revalidate every hour

async function CachedGigsList() {
  const supabase = await createSupabaseServerClient();
  
  const { data: gigs } = await supabase
    .from('gigs')
    .select('id,title,location,compensation,status')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  return <GigsList gigs={gigs} />;
}

// Client-side caching with SWR or React Query
'use client';
import useSWR from 'swr';

function ClientGigsList() {
  const { data: gigs, error, isLoading } = useSWR(
    '/api/gigs',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
      dedupingInterval: 10000, // Dedupe requests within 10 seconds
    }
  );
  
  if (isLoading) return <GigsSkeleton />;
  if (error) return <ErrorMessage />;
  
  return <GigsList gigs={gigs} />;
}
```

## 📈 Performance Monitoring Setup

### **Core Web Vitals Tracking**
```typescript
// lib/analytics.ts
export function reportWebVitals(metric: NextWebVitalsMetric) {
  const body = JSON.stringify(metric);
  const url = '/api/analytics/web-vitals';
  
  // Send to analytics service
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
}

// pages/_app.tsx or app/layout.tsx
export { reportWebVitals } from '@/lib/analytics';
```

```typescript
// app/api/analytics/web-vitals/route.ts
export async function POST(request: Request) {
  const metric = await request.json();
  
  // Log to monitoring service (e.g., Vercel Analytics, Google Analytics)
  console.log('Web Vital:', {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    timestamp: Date.now(),
  });
  
  // Send to external analytics if configured
  if (process.env.GA_MEASUREMENT_ID) {
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: metric.id,
        events: [{
          name: 'web_vital',
          params: {
            metric_name: metric.name,
            metric_value: metric.value,
          },
        }],
      }),
    });
  }
  
  return new Response('OK');
}
```

### **Real-time Performance Dashboard**
```typescript
// components/admin/performance-dashboard.tsx
'use client';
import dynamic from 'next/dynamic';

const PerformanceCharts = dynamic(() => import('./performance-charts'), {
  loading: () => <ChartsSkeleton />,
  ssr: false,
});

export function PerformanceDashboard() {
  const { data: metrics } = useSWR('/api/admin/performance-metrics', {
    refreshInterval: 60000, // Update every minute
  });
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MetricCard
        title="Average Page Load"
        value={metrics?.averagePageLoad}
        unit="ms"
        target={2000}
      />
      <MetricCard
        title="Core Web Vitals Score"
        value={metrics?.coreWebVitalsScore}
        unit="/100"
        target={90}
      />
      <div className="lg:col-span-2">
        <PerformanceCharts data={metrics?.chartData} />
      </div>
    </div>
  );
}
```

## 🔍 Performance Monitoring Tools

### **Vercel Analytics Integration**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### **Lighthouse CI Configuration**
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Next.js
        run: npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/admin/dashboard',
        'http://localhost:3000/gigs',
        'http://localhost:3000/talent',
      ],
      startServerCommand: 'npm start',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

## 🎯 Performance Optimization Roadmap

### **Phase 1: Critical Fixes (Week 1)**
1. **Enable Image Optimization**
   - Remove `unoptimized: true` from next.config.mjs
   - Configure proper image formats and sizes
   - **Impact**: 30-50% reduction in image payload

2. **Implement Dynamic Imports**
   - Admin dashboard components
   - Chart libraries
   - Heavy UI components
   - **Impact**: 20-30% reduction in initial bundle size

3. **React Component Optimization**
   - Add React.memo to list components
   - Implement useMemo for expensive calculations
   - Add useCallback for event handlers
   - **Impact**: 15-25% improvement in render performance

### **Phase 2: Advanced Optimization (Month 1)**
4. **Database Query Optimization**
   - Add strategic database indexes
   - Optimize N+1 query patterns
   - Implement query result caching
   - **Impact**: 40-60% improvement in data loading

5. **Bundle Splitting & Code Splitting**
   - Route-based code splitting
   - Vendor bundle optimization
   - Component-level splitting
   - **Impact**: 25-35% reduction in initial load time

6. **Caching Strategy**
   - ISR for semi-static content
   - Client-side caching with SWR
   - CDN optimization
   - **Impact**: 50-70% improvement in repeat visits

### **Phase 3: Advanced Features (Quarter 1)**
7. **Service Worker Implementation**
   - Offline functionality
   - Background sync
   - Push notifications
   - **Impact**: Enhanced user experience

8. **Edge Computing**
   - Vercel Edge Functions
   - Global data distribution
   - Edge-side rendering
   - **Impact**: Global performance improvement

## 📊 Performance Testing Scripts

### **Automated Performance Testing**
```bash
#!/bin/bash
# scripts/performance-test.sh

echo "🚀 Running TOTL Agency Performance Tests"

# Build the application
echo "Building application..."
npm run build

# Start the server
echo "Starting server..."
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 10

# Run Lighthouse tests
echo "Running Lighthouse tests..."
npx lighthouse http://localhost:3000 \
  --output html \
  --output-path ./reports/lighthouse-home.html \
  --chrome-flags="--headless"

npx lighthouse http://localhost:3000/admin/dashboard \
  --output html \
  --output-path ./reports/lighthouse-admin.html \
  --chrome-flags="--headless"

# Run bundle analyzer
echo "Analyzing bundle size..."
ANALYZE=true npm run build

# Cleanup
kill $SERVER_PID

echo "✅ Performance tests complete. Check ./reports/ for results."
```

---

**Performance Target**: 8/10 (achievable with optimizations)
**Critical Issues**: 3 (image optimization, dynamic imports, React memoization)
**Estimated Improvement**: 40-60% performance gain
**Implementation Time**: 2-3 weeks for all phases
**Last Updated**: 2025-01-17

*This optimization guide provides a clear roadmap to transform TOTL Agency from 6/10 to 8/10 performance score.*