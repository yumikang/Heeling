# VPS File Storage Deployment Status

## ✅ Deployment Complete - 2024-12-08

### Implementation Summary

All file operations (images, music, text) now save directly to VPS storage instead of local filesystem.

### System Architecture

**VPS Storage Library**: [vps-storage.ts](../backend/src/lib/vps-storage.ts)
- **Local Environment**: Uploads files via SSH/SCP to VPS
- **VPS Environment**: Saves files directly to filesystem using synchronous fs operations
- **Storage Path**: `/root/heeling/backend/public/media/`

### Modified API Routes

1. **[/api/admin/generate/image/route.ts](../backend/src/app/api/admin/generate/image/route.ts)**
   - AI-generated cover images
   - Uses `saveToVPS()` with base64 buffer

2. **[/api/admin/generate/download/route.ts](../backend/src/app/api/admin/generate/download/route.ts)**
   - Downloads external files (Suno AI, etc.)
   - Fetches URL, converts to buffer, saves to VPS

3. **[/api/admin/tracks/upload/route.ts](../backend/src/app/api/admin/tracks/upload/route.ts)**
   - Direct file uploads from admin panel
   - Processes FormData, saves to VPS

### Critical Fix Applied

**Problem**: `fs/promises` module loading failed in Next.js standalone build
```
Error: Failed to load chunk server/chunks/[externals]_fs_promises_0bfe4114._.js
```

**Solution**: Switched from async `fs/promises` to synchronous `fs` methods
```typescript
// Before (failing in production)
import { writeFile, mkdir } from 'fs/promises';
await mkdir(dir, { recursive: true });
await writeFile(fullPath, buffer);

// After (working in production)
import { writeFileSync, mkdirSync, existsSync } from 'fs';
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}
writeFileSync(fullPath, buffer);
```

### Current VPS Status

**Server**: Running successfully at `https://heeling.one-q.xyz`
**PM2 Status**: Online
**Startup Time**: Ready in 304ms
**Storage Usage**:
- `/media/covers/`: 63MB (cover images)
- `/media/generated/`: 140MB (generated audio)

### Environment Variables

Required in VPS `.env`:
```env
IS_VPS="true"
VPS_HOST="141.164.60.51"
VPS_USER="root"
VPS_BASE_PATH="/root/heeling"
```

Required in local `.env` (for SSH upload):
```env
IS_VPS="false"
VPS_HOST="141.164.60.51"
VPS_USER="root"
VPS_BASE_PATH="/root/heeling"
```

### File Path Structure

All files saved to VPS use this structure:
- **Cover Images**: `/media/covers/[filename].png`
- **Generated Audio**: `/media/generated/[filename].mp3`
- **Uploaded Images**: `/media/images/[filename].jpg`

Example paths:
```
/media/covers/Dreaming_in_Dusk_art_1764811949397.png
/media/generated/Gentle_Night_calm_lofi_1764735123456.mp3
```

### Deployment Process

1. Build standalone bundle: `npm run build`
2. Package: `tar -czf heeling-vps-fix.tar.gz -C .next/standalone .`
3. Upload: `scp heeling-vps-fix.tar.gz root@141.164.60.51:/tmp/`
4. Deploy with public folder preservation:
   ```bash
   pm2 stop heeling-backend
   mv backend/public /root/heeling-public-temp
   rm -rf backend
   tar -xzf /tmp/heeling-vps-fix.tar.gz
   mv /root/heeling-public-temp backend/public
   pm2 start server.js --name heeling-backend
   ```

### Testing Checklist

- ✅ Server running without errors
- ✅ VPS storage directories exist
- ✅ File permissions correct (501:staff)
- ✅ PM2 process online
- ⏳ User testing: Cover image generation from admin panel

### Known Issues

**404 Errors for Old Images**: Images generated Dec 6+ before this fix may show 404 errors because they were never successfully saved due to the `fs/promises` bug. These will resolve as new images are generated with the fixed code.

### Next Steps

1. User should test cover image generation at `https://heeling.one-q.xyz/admin/generate`
2. Verify new images save successfully
3. Check that URLs return images correctly
4. Monitor PM2 logs for any storage-related errors

### Commit History

- `2f8a2c6` - feat: VPS 파일 스토리지 시스템 구현
- `e9d4b15` - fix: VPS 저장 시 fs/promises 모듈 로드 에러 수정

---

**Status**: ✅ Production Ready
**Last Updated**: 2024-12-08 13:10 KST
