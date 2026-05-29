# Quick Start Guide - Licious Clone Next.js

## Installation & Setup

### 1. Install Dependencies
```bash
cd licious-clone-nextjs
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### 3. Build for Production
```bash
npm run build
npm start
```

## What Changed in Migration?

### From CRA to Next.js:

**Routing:**
- ❌ React Router (`<Route>`, `useNavigate`)
- ✅ Next.js App Router (file-based routing, `useRouter`, `<Link href="">`)

**Components:**
- All interactive components now have `'use client'` directive
- Server-side rendering ready

**File Structure:**
```
Old (CRA):                  New (Next.js):
src/                        app/
  App.js                      layout.js  (Root layout)
  components/                 page.js    (Home)
    Routes/                   chicken/page.js
      AllRoutes.jsx            [id]/page.js
                             login/page.js
                           components/  (Same structure)
```

**Navigation Updates:**
```jsx
// Old (React Router)
import { Link, useNavigate } from 'react-router-dom';
<Link to="/chicken">Products</Link>
const navigate = useNavigate();
navigate('/login');

// New (Next.js)
import Link from 'next/link';
import { useRouter } from 'next/navigation';
<Link href="/chicken">Products</Link>
const router = useRouter();
router.push('/login');
```

## Project Status

✅ All components migrated
✅ Routing converted to Next.js App Router
✅ Redux configured for SSR
✅ Styling preserved
✅ Dependencies updated

## Important Notes

- **Backend API**: Make sure backend services are accessible
- **Local Storage**: Used for authentication (client-side only)
- **Images**: Currently using external URLs and local public folder
- **CSS**: All original CSS files preserved

## Troubleshooting

**Port Already in Use:**
```bash
# Change port in package.json or use:
npm run dev -- -p 3001
```

**Build Errors:**
```bash
# Clear cache and reinstall:
rm -rf .next node_modules
npm install
```

**SSR Issues with window/localStorage:**
- All fixed with proper checks: `typeof window !== 'undefined'`
- Client components properly marked with `'use client'`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Next Steps

1. Test all pages and functionality
2. Update environment variables if needed
3. Configure backend API endpoints
4. Deploy to Vercel or other hosting platform

---

**Migration completed successfully! 🎉**

All business logic preserved - only framework-specific changes made.
