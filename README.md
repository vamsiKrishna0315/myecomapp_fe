# Licious Clone - Next.js

This is a migrated version of the Licious Clone e-commerce application built with **Next.js 14** (App Router).

## Migration Summary

The original Create React App project has been successfully migrated to Next.js with the following changes:

### Key Changes:
- **Routing**: React Router replaced with Next.js App Router file-based routing
- **Components**: All interactive components now use `'use client'` directive
- **Navigation**: `useNavigate` and `<Link to="">` replaced with Next.js `useRouter` and `<Link href="">`
- **Redux**: Redux store updated to handle SSR (server-side rendering) with window checks
- **Layout**: Navbar and Footer moved to root layout for persistent display
- **Project Structure**: Migrated from `src/` to Next.js `app/` directory structure

### Routes Mapping:
- `/` → Home page (LandingPage/HomePage)
- `/signup` → User registration
- `/login` → User login
- `/chicken` → Product listing page
- `/chicken/[id]` → Dynamic product details page
- `/checkout` → Payment/checkout page
- `/checkout/otp` → OTP verification page

## Getting Started

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
## Environment

Set these variables in `.env.local` to connect the frontend to your backend and assets:

- `NEXT_PUBLIC_BACKEND_BASE_URL`: Your Laravel host base. Example: `http://laravel_project.test`
- `NEXT_PUBLIC_API_TYPE`: API namespace segment. Example: `customer`
- `NEXT_PUBLIC_ASSET_BASE_URL` (optional): If media paths (e.g., `products/...`) need a different base than the backend, set it here. Otherwise, the backend base is used.

The home page triggers a single fetch to `${NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/${NEXT_PUBLIC_API_TYPE}/site/site-data`, caches it in `localStorage` for 10 minutes, and uses:

- `data.banners` for the hero slider
- `data.categories` for the category tiles


### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
licious-clone-nextjs/
├── app/
│   ├── layout.js          # Root layout with providers
│   ├── page.js            # Home page
│   ├── chicken/
│   │   ├── page.js        # Products listing
│   │   └── [id]/
│   │       └── page.js    # Product details (dynamic route)
│   ├── signup/
│   │   └── page.js
│   ├── login/
│   │   └── page.js
│   └── checkout/
│       ├── page.js
│       └── otp/
│           └── page.js
├── components/            # All React components (with 'use client')
├── redux/                # Redux store and reducers
├── styles/               # Global CSS files
├── public/               # Static assets
└── next.config.js        # Next.js configuration
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Chakra UI** - Component library
- **Redux & Redux Thunk** - State management
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **React Slick** - Carousel component

## Features

- 🛒 Product browsing and filtering
- 🔐 User authentication (login/signup)
- 🛍️ Shopping cart functionality
- 💳 Checkout process with OTP verification
- 📱 Responsive design
- 🎨 Chakra UI component library
- 🔄 Redux state management

## Important Notes

1. **Client Components**: Most components use `'use client'` directive as they require interactivity (useState, useEffect, event handlers)
2. **Backend API**: The app connects to external APIs - ensure backend services are running
3. **Redux DevTools**: Redux DevTools are available in development mode
4. **Image Optimization**: Consider using Next.js Image component for better performance
5. **Environment Variables**: Create `.env.local` for any environment-specific configurations

## Migration Benefits

✅ Better performance with automatic code splitting
✅ Improved SEO capabilities
✅ Server-side rendering support
✅ Optimized image loading
✅ Built-in routing system
✅ Better developer experience with Fast Refresh

## Future Enhancements

- Convert more components to server components where possible
- Implement Next.js Image component
- Add loading and error states for pages
- Implement ISR (Incremental Static Regeneration) for product pages
- Add metadata and SEO optimization

## Original Project

This is a migrated version of the Create React App-based Licious Clone. All business logic and component functionality remain unchanged.

## License

This project is for educational purposes.
