# GBMarket Client — React + Vite

The React frontend for GBMarket, built with Vite, Tailwind CSS v4, and React Router DOM.

## Development

```bash
npm install
npm run dev       # Starts Vite dev server at http://localhost:5173
```

The dev server proxies API requests to `http://localhost:5000` (the Express backend). Make sure the server is running first.

## Production Build

```bash
npm run build     # Outputs to ./dist
```

The built `dist/` folder is served by the Express server in production at the same origin as the API. No separate hosting or `VITE_API_URL` configuration is needed — the client defaults to relative `/api` paths.

You can also build from the repo root:
```bash
cd ..
npm run build     # Installs deps in both client + server, then builds the client
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | API base URL. Only set this for development if the API is on a different host. In production (single-service deployment), leave it unset — relative paths work automatically. |

## Technology Stack

- **React 19** with functional components and hooks
- **Vite 8** for blazing-fast HMR and optimized builds
- **Tailwind CSS v4** for utility-first styling
- **React Router DOM v7** for client-side routing
- **Axios** for API communication
- **React Helmet Async** for dynamic `<head>` management (SEO)
- **Lucide React** for iconography
- **React Hot Toast** for notifications
