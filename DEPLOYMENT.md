# 🚀 Deployment Guide - Encounters POC

## 📋 **Deployment Architecture**

- **Frontend**: Netlify (Next.js)
- **Backend**: Convex (already deployed)
- **WebRTC**: LiveKit (already deployed)

## 🔧 **Netlify Deployment Steps**

### **1. Connect Repository**
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Select the `Encounters` repository

### **2. Build Settings**
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: `18`

### **3. Environment Variables**
Add these environment variables in Netlify dashboard:

```
NEXT_PUBLIC_CONVEX_URL=https://perceptive-pika-647.convex.cloud
NEXT_PUBLIC_LIVEKIT_URL=wss://encounters-zfsea02u.livekit.cloud
```

### **4. Deploy**
1. Click "Deploy site"
2. Netlify will automatically install dependencies and build
3. Your site will be live at `https://your-site-name.netlify.app`

## 🔗 **Backend Services (Already Deployed)**

### **Convex**
- **URL**: `https://perceptive-pika-647.convex.cloud`
- **Status**: ✅ Deployed and running

### **LiveKit**
- **URL**: `wss://encounters-zfsea02u.livekit.cloud`
- **Status**: ✅ Deployed and running

## 🧪 **Testing Deployment**

### **Provider Access**
- **URL**: `https://your-site-name.netlify.app/provider/login`
- **Email**: `provider@demo.test`
- **Password**: `demo123`

### **Patient Access**
- Use the OIT URLs from the provider dashboard
- Example: `https://your-site-name.netlify.app/demo-room/oit_xxx`

## 🔍 **Troubleshooting**

### **Build Issues**
- Ensure Node.js version is 18+
- Check that all environment variables are set
- Verify repository permissions

### **Runtime Issues**
- Check browser console for errors
- Verify Convex and LiveKit URLs are correct
- Ensure HTTPS is enabled (required for WebRTC)

## 📊 **Performance**

- **First Load JS**: ~82KB
- **Dynamic Routes**: 3 pages
- **Static Pages**: 4 pages
- **Build Time**: ~30-60 seconds

## 🔒 **Security**

- All environment variables are prefixed with `NEXT_PUBLIC_`
- HTTPS required for WebRTC functionality
- CORS configured for Convex and LiveKit domains
