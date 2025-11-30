# HealthMate Frontend - Deployment Guide for Render

This guide will help you deploy the HealthMate frontend application to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your backend API URL (currently: `https://healthmatebackend-875662263.development.catalystserverless.com`)

## Deployment Steps

### Option 1: Deploy via Render Dashboard (Recommended)

1. **Connect your repository** to Render
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Select the repository containing this code

2. **Configure the service:**
   - **Name**: `healthmate-frontend` (or any name you prefer)
   - **Root Directory**: `healthmate_frontend` (if your repo root is one level up)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid plan if needed)

3. **Set Environment Variables:**
   - Click on "Environment" tab
   - Add the following:
     - `NODE_ENV` = `production`
     - `VITE_API_ENDPOINT` = `https://healthmatebackend-875662263.development.catalystserverless.com`
     - `PORT` = `3000` (Render will auto-assign, but you can set default)

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app

### Option 2: Deploy via render.yaml

1. **Update render.yaml**:
   - Open `render.yaml`
   - Update the `VITE_API_ENDPOINT` value with your backend URL
   - Commit and push to your repository

2. **Deploy from Render Dashboard**:
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect and use `render.yaml`

## Important Notes

### SPA Routing

The application uses React Router for client-side routing. The `server.js` file is configured to:
- Serve static files from the `dist` directory
- Proxy API requests from `/api` to your backend
- Fallback to `index.html` for all routes (required for SPA routing)

### Environment Variables

**Required:**
- `VITE_API_ENDPOINT`: Your backend API URL (without `/healthmate`)

**Optional:**
- `PORT`: Port number (Render will auto-assign if not set)
- `NODE_ENV`: Should be `production` for production deployments

### Troubleshooting

1. **Routes not working (404 errors)**
   - Ensure `server.js` is being used (check start command: `npm start`)
   - Verify the server is serving `index.html` for all routes

2. **API calls failing**
   - Check that `VITE_API_ENDPOINT` is set correctly
   - Verify the backend URL is accessible from Render
   - Check server logs for proxy errors

3. **Build failures**
   - Check build logs in Render dashboard
   - Ensure all dependencies are listed in `package.json`
   - Verify Node.js version compatibility

4. **Static files not loading**
   - Ensure build completed successfully
   - Check that `dist` directory exists after build
   - Verify file paths in `index.html`

## Local Testing

Before deploying, test the production build locally:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start the production server
npm start
```

Visit `http://localhost:3000` and verify:
- App loads correctly
- Routes work (try `/profile`, `/reports`)
- API calls are proxied correctly

## Support

For issues or questions, check:
- Render documentation: https://render.com/docs
- Application logs in Render dashboard
- Server logs in Render dashboard

