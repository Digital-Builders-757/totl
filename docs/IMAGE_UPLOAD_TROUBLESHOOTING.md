# 📸 Image Upload Troubleshooting Guide

**Last Updated:** October 22, 2025

## 🚨 Common Issues & Solutions

### **Issue 1: "Body exceeded 1 MB limit" Error**

**What it means:** Your image file is too large for upload.

**Solution:**
1. **Compress your image** before uploading
2. **Use a smaller file** (under 1MB)
3. **Try a different format** (JPG is usually smaller than PNG)

---

## 🛠️ How to Compress Images

### **Option 1: Online Tools (Easiest)**
1. **TinyPNG** - https://tinypng.com/
   - Drag & drop your image
   - Download compressed version
   - Usually reduces size by 60-80%

2. **Squoosh** (Google) - https://squoosh.app/
   - Upload image
   - Adjust quality slider
   - Download optimized version

3. **Compressor.io** - https://compressor.io/
   - Upload image
   - Choose compression level
   - Download result

### **Option 2: Built-in Tools**

**Windows:**
1. Right-click image → "Edit with Paint 3D"
2. Click "Menu" → "Save as"
3. Choose JPG format
4. Adjust quality to reduce file size

**Mac:**
1. Open image in Preview
2. File → Export
3. Choose JPEG format
4. Adjust Quality slider

**iPhone/Android:**
1. Use built-in photo editor
2. Export/Save with lower quality
3. Or use apps like "Image Size" or "Photo Compress"

---

## 📏 Recommended Image Sizes

### **Profile Avatars:**
- **Size:** 200x200 pixels
- **Format:** JPG or PNG
- **File size:** Under 1MB
- **Quality:** 80-90% (good balance of size vs quality)

### **Portfolio Images:**
- **Size:** 800x600 pixels (or similar ratio)
- **Format:** JPG for photos, PNG for graphics
- **File size:** Under 1MB each
- **Quality:** 85-95%

---

## ⚡ Quick Tips

### **Before Uploading:**
1. **Check file size** - Right-click → Properties (Windows) or Get Info (Mac)
2. **Use JPG for photos** - Usually 50% smaller than PNG
3. **Resize if needed** - Large images waste space and bandwidth
4. **Test compression** - Try different quality levels

### **If Upload Still Fails:**
1. **Clear browser cache** - Press Ctrl+Shift+R
2. **Try different browser** - Chrome, Firefox, Safari
3. **Check internet connection** - Slow uploads can timeout
4. **Try smaller file** - Even if under 1MB, try 500KB

---

## 🔧 Technical Details

### **Current Limits:**
- **Max file size:** 1MB (1,048,576 bytes)
- **Supported formats:** JPG, PNG, GIF
- **Server limit:** Next.js Server Actions body size limit

### **Why 1MB Limit?**
- **Performance:** Faster uploads and processing
- **Storage:** Saves server space and costs
- **User experience:** Quicker page loads
- **Mobile friendly:** Works well on slower connections

---

## 📱 Mobile Users

### **iPhone:**
1. **Settings** → **Camera** → **Formats** → **Most Compatible**
2. Use **Photos app** to edit and compress
3. **Share** → **Save to Files** → Choose smaller size

### **Android:**
1. Use **Google Photos** to compress
2. **Gallery** → **Edit** → **Resize**
3. **File Manager** → Check file size before upload

---

## 🆘 Still Having Issues?

### **Check These:**
- [ ] File is under 1MB
- [ ] File is JPG, PNG, or GIF
- [ ] Internet connection is stable
- [ ] Browser cache is cleared
- [ ] You're logged in to the app

### **Contact Support:**
If you've tried everything and still can't upload:
1. **Note the exact error message**
2. **Check file size and format**
3. **Try a different image**
4. **Report the issue** with details

---

## 💡 Pro Tips

1. **Batch compress** multiple images at once using online tools
2. **Save originals** before compressing
3. **Use consistent sizing** for portfolio images
4. **Test upload** with a small image first
5. **Keep backups** of your original high-quality images

---

## 🔄 Future Improvements

We're working on:
- **Automatic compression** during upload
- **Larger file size limits** for premium users
- **Bulk upload** for portfolio images
- **Image optimization** suggestions

---

*Need help? Check our main troubleshooting guide or contact support.*
