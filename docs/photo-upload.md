# Item photos — implementation preparation

> Current consolidated status: [PROJE_DURUMU.md](../PROJE_DURUMU.md). This document retains technical/historical detail; earlier status statements may be superseded.


Status: account photo selection, resizing, metadata stripping, preview, upload-on-Save and signed-URL rendering are implemented. The owner applied the Storage migration and reported “Success. No rows returned”. Live upload and RLS tests remain pending. See PROJE_DURUMU.md for the current checkpoint.

## Approved product behavior

- English interface only. User-entered content retains its language.
- One optional cover photo per object initially, gallery selection with a preview.
- Selection alone never uploads. Save explicitly uploads to the signed-in account, then saves its path on the item.
- Account photos referenced by public catalog items are readable by other users. Communicate this before Save.
- Failed upload/save preserves the form and selected photo. No automatic retry, no local-data upload/delete, no replacement of an existing cover until item save succeeds.
- Device-only photo persistence requires a separate durable local-file implementation; do not silently turn a device save into an account upload.

## Reviewable next dependency step

Expo SDK 57-compatible `expo-image-picker` and `expo-image-manipulator` were installed with owner authorization. Use the existing local Expo CLI with Node 22 to add the SDK-compatible `expo-image-picker` version, inspect package/lock diffs, then rebuild the existing development client for the physical Seeker. Do not upgrade existing dependencies, run audit fix, start an emulator, commit or push.

Owner approved the photo dependencies and physical Seeker rebuild. Camera/microphone permissions are disabled in the picker plugin and generated Android manifest; gallery selection does not request them.

Reference: https://docs.expo.dev/versions/latest/sdk/imagepicker/

## Storage contract

Migration: `supabase/migrations/20260920000000_item_photo_storage.sql` (owner reported successful execution).

- Private `item-images` bucket, 6 MiB/file; JPEG, PNG, WebP only.
- Unique paths: `<account UUID>/<unique draft identifier>.<extension>`; upsert disabled.
- Insert/delete and draft reads limited to the account's path prefix.
- Public reads only when `items.cover_path` references the path and the item owner matches its account prefix.
- Display through short-lived signed URLs; keep storage paths, not expiring URLs, in SQL.
- Never use a service-role key in the app.
- Upload bytes as ArrayBuffer, not React Native FormData/Blob.
- A failed item save may leave an unreferenced private photo; retain its path in the draft for retry. Orphan cleanup is separate explicit work, not silent deletion of user data.
- Images are re-encoded as JPEG at quality 0.72 with longest edge capped at 1600 px; EXIF/XMP/IPTC/comments are removed before upload. Client size checks supplement bucket enforcement.

## Remaining verification

Verify owner upload/read, denial of cross-account write/delete, anonymous draft denial, published read, unsupported MIME/oversize rejection, cancel behavior, save failure preservation and signed-URL refresh. Live SQL and physical-device checks remain pending.
