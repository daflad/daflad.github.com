// strip <out-dir> <image>...  Writes a copy of each image with no EXIF, GPS, TIFF, IPTC or XMP
// metadata into out-dir, without re-encoding the pixels. The colour profile is kept.
import Foundation
import ImageIO

let args = CommandLine.arguments
guard args.count >= 3 else { print("usage: strip <out-dir> <image>..."); exit(2) }
let outDir = URL(fileURLWithPath: args[1], isDirectory: true)
var failed = false
for p in args.dropFirst(2) {
  let url = URL(fileURLWithPath: p)
  guard let src = CGImageSourceCreateWithURL(url as CFURL, nil), let type = CGImageSourceGetType(src) else {
    print("FAIL can't read \(p)"); failed = true; continue
  }
  let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any] ?? [:]
  if let o = props[kCGImagePropertyOrientation] as? Int, o != 1 {
    print("FAIL \(p) is rotated by metadata (orientation \(o)); not stripping"); failed = true; continue
  }
  let out = outDir.appendingPathComponent(url.lastPathComponent)
  guard let dst = CGImageDestinationCreateWithURL(out as CFURL, type, 1, nil) else {
    print("FAIL can't write \(out.path)"); failed = true; continue
  }
  let opts: [CFString: Any] = [
    kCGImageDestinationMetadata: CGImageMetadataCreateMutable(),
    kCGImageDestinationMergeMetadata: false,
    kCGImageMetadataShouldExcludeGPS: true,
    kCGImageMetadataShouldExcludeXMP: true,
  ]
  var err: Unmanaged<CFError>?
  if CGImageDestinationCopyImageSource(dst, src, opts as CFDictionary, &err) {
    print("ok \(url.lastPathComponent)")
  } else {
    print("FAIL \(p): \(err?.takeRetainedValue().localizedDescription ?? "unknown")"); failed = true
  }
}
exit(failed ? 1 : 0)
