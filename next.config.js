/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
```

---

### **FILE 3: `.gitignore`** (Root of project)
```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuild
next-env.d.ts
```

---

## **YOUR PROJECT STRUCTURE SHOULD BE:**
```
your-project/
├── components/
│   └── IOSBaselineAssessment.jsx
├── pages/
│   ├── assessment.jsx
│   └── index.jsx (if you have a home page)
├── public/
├── package.json          ← CREATE THIS
├── next.config.js        ← CREATE THIS
├── .gitignore           ← CREATE THIS
└── README.md (optional)
