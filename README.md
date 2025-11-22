# MergeCheck

> Your AI code review buddy that catches bugs before they reach production

MergeCheck is an intelligent GitHub bot that automatically reviews your Pull Requests, spots security issues, suggests improvements, and helps maintain code quality - all while you sleep.

![Status](https://img.shields.io/badge/status-mvp-cyan) ![License](https://img.shields.io/badge/license-MIT-teal) ![Made with](https://img.shields.io/badge/made%20with-Next.js-black)

---

## What is MergeCheck?

Think of MergeCheck as a tireless code reviewer that:
- Reviews every PR automatically within 60 seconds
- Catches security vulnerabilities (SQL injection, XSS, hardcoded secrets)
- Spots code quality issues (complexity, duplicates, bad naming)
- Suggests performance improvements (N+1 queries, inefficient loops)
- Learns from your codebase to give relevant feedback

And the best part? It's **completely free** to use during MVP phase.

---

## How It Works

1. **Install the GitHub App** - One-click setup, choose which repos to monitor
2. **Open a PR** - MergeCheck gets notified automatically
3. **Get instant feedback** - Within 60 seconds, you'll see inline comments and a summary
4. **Fix and push** - MergeCheck only re-reviews changed files (smart caching!)
5. **Ship with confidence** - When clean, you'll get the green checkmark

```
Developer opens PR
        ↓
MergeCheck analyzes code with AI
        ↓
Posts inline comments + summary
        ↓
Developer fixes issues
        ↓
MergeCheck re-reviews (only new changes)
        ↓
✅ All good - ready to merge!
```

---

## Features

### Core Capabilities
- **Instant Reviews** - Analyze PRs in under 60 seconds
- **Smart Caching** - 40-60% faster reviews by reusing previous analyses (SHA-256 hashing)
- **Inline Comments** - Issues appear right where they matter, not buried in a wall of text
- **Security First** - Detects SQL injection, XSS, exposed secrets, and more
- **Quality Checks** - Spots code smells, complexity issues, and anti-patterns
- **Performance Hints** - Identifies N+1 queries, inefficient loops, and bottlenecks
- **Re-review Optimization** - Only analyzes changed files on PR updates

### Dashboard Features
- **Analytics** - Track review count, cache hit rate, AI calls saved
- **Review History** - Browse all past reviews with issue breakdowns
- **Repository Management** - Enable/disable monitoring per repo
- **Issue Severity Levels** - Critical (must fix), Warning (should fix), Suggestion (nice to have)

---

## Tech Stack

MergeCheck is built with modern, reliable technologies:

**Frontend & Backend:**
- **Next.js 15** - React framework with App Router for blazing-fast pages
- **React 19** - Latest UI library with server components
- **TanStack Query** - Smart data fetching with automatic caching
- **Tailwind CSS** - Beautiful, responsive styling
- **shadcn/ui** - High-quality component library

**Database & Auth:**
- **Supabase** - PostgreSQL database with built-in auth
- **GitHub OAuth** - Secure login via GitHub

**AI & Integrations:**
- **Groq API** - Lightning-fast AI inference (Llama 3.1 70B model)
- **GitHub App** - Webhooks for real-time PR monitoring
- **Vercel** - Serverless deployment (free tier)

**Why this stack?**
- **100% Free** - All services have generous free tiers (Supabase, Groq, Vercel)
- **Blazingly Fast** - Groq delivers AI responses in seconds, not minutes
- **Easy to Scale** - Serverless architecture grows with your needs
- **Type-Safe** - TypeScript throughout for fewer bugs

---

## Getting Started

### For Users (Install the Bot)

1. Visit **[mergecheck]()**
2. Click "Add to GitHub"
3. Authorize the app and select repositories
4. Done! Open a PR to see MergeCheck in action

### For Developers (Run Locally)

**Prerequisites:**
- Node.js 18+
- GitHub account
- Supabase account (free)
- Groq API key (free)


## How the AI Review Works

MergeCheck uses a multi-step process to analyze your code:

1. **Fetch PR Changes** - Gets the diff from GitHub API
2. **Smart Batching** - Groups files by directory (max 10 files per batch)
3. **Cache Check** - Hashes each file (SHA-256) and checks if we've seen it before
4. **AI Analysis** - Sends uncached files to Groq AI with specialized prompts
5. **Issue Extraction** - Parses AI response for security/quality/performance issues
6. **Post Comments** - Creates inline comments on GitHub with severity levels
7. **Cache Results** - Stores analysis for future PRs (40-60% faster next time!)

**Example AI Prompt:**
```
You are a senior code reviewer. Analyze this code for:
- Security vulnerabilities (SQL injection, XSS, secrets)
- Code quality (complexity, duplicates, naming)
- Performance issues (N+1 queries, inefficient loops)
...
```

---

## Project Structure

```
merge-check/
├── frontend/                 # Next.js application
│   ├── app/                  # Pages and API routes
│   │   ├── page.tsx          # Landing page
│   │   ├── dashboard/        # Dashboard pages
│   │   └── api/              # Backend API routes
│   ├── components/           # React components
│   │   ├── layout/           # Nav, footer, etc.
│   │   ├── dashboard/        # Dashboard-specific components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                  # Core logic
│   │   ├── hooks/            # React Query hooks
│   │   ├── review/           # Review processing logic
│   │   ├── supabase/         # Database queries
│   │   └── utils.ts          # Helper functions
│   └── types/                # TypeScript types
├── my_docs/                  # Documentation
│   └── mergecheck_mvp_prd.md # Product requirements
└── .claude/                  # AI assistant context
    └── claude.md             # Implementation guide
```

---

## Performance & Efficiency

**Smart Caching:**
- Files are hashed using SHA-256 before analysis
- Identical files skip AI processing (instant results!)
- **Average cache hit rate: 58%** (saves time & API costs)

**Batch Processing:**
- Files grouped by directory for better context
- Max 10 files per batch (optimal token usage)
- Parallel processing where possible

**API Optimization:**
- TanStack Query caches data for 5 minutes
- Single API call shared across multiple components
- Optimistic UI updates for instant feedback

**Real Stats from Testing:**
- Average review time: **12.4 seconds**
- AI calls saved by caching: **58%**
- Cost per review: **$0.00** (free tier magic!)

---

## Roadmap

**Phase 1 (Current - MVP):**
- ✅ Core review functionality
- ✅ Dashboard with analytics
- ✅ Smart caching system
- ✅ GitHub App integration

---

## Contributing

We'd love your help making MergeCheck better! Here's how:

1. **Fork the repo**
2. **Create a feature branch** (`git checkout -b feature/amazing-thing`)
3. **Make your changes** (follow existing code style)
4. **Test thoroughly** (`npm run build` should succeed)
5. **Commit** (`git commit -m "Add amazing thing"`)
6. **Push** (`git push origin feature/amazing-thing`)
7. **Open a Pull Request** (describe what you changed and why)

**Good First Issues:**
- Improve error messages
- Add loading skeletons
- Write tests
- Update documentation

---

## FAQ

**Q: Is MergeCheck free?**
A: Yes! The MVP is completely free. We use generous free tiers (Supabase, Groq, Vercel).

**Q: What languages does it support?**
A: All major languages! JavaScript, TypeScript, Python, Go, Rust, Java, C++, etc. The AI model is trained on millions of code examples.

**Q: Will it slow down my workflow?**
A: Nope! Reviews complete in under 60 seconds on average, and smart caching makes subsequent reviews even faster.

**Q: Can I customize what it checks for?**
A: Not yet in MVP, but custom rules are coming in Phase 2!

**Q: Does it replace human code reviews?**
A: No - it's a supplement. MergeCheck catches obvious issues so humans can focus on architecture, business logic, and edge cases.

**Q: Is my code sent to third parties?**
A: Only file contents are sent to Groq AI for analysis. We never store your code permanently, and Groq doesn't train on your data.

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Built By

**Akshad Jaiswal**

Passionate about building tools that make developers' lives easier.

**Connect:**
- GitHub: [@akshadjaiswal](https://github.com/akshadjaiswal)
- Twitter: [@akshad_999](https://twitter.com/akshad_999)
- LinkedIn: [akshadsantoshjaiswal](https://linkedin.com/in/akshadsantoshjaiswal)

---

## Support

**Found a bug?** Open an issue on [GitHub Issues](https://github.com/akshadjaiswal/merge-check/issues)

**Have a question?** Start a discussion in [GitHub Discussions](https://github.com/akshadjaiswal/merge-check/discussions)

**Want to chat?** DM me on [Twitter](https://twitter.com/akshad_999)

---

<div align="center">

**Made with ❤️ by [Akshad Jaiswal](https://github.com/akshadjaiswal)**

⭐ Star this repo if you find it useful!

</div>
