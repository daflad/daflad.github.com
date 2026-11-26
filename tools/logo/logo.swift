// logo <font.ttf> <out-prefix> <hex-colour> <png-width> <align:left|center> <line>...
// Draws the lines in Archivo at width 62 (extra condensed) and weight 900, uppercase as given,
// letter-spacing -0.005em, line-height 0.86em. Writes <prefix>.svg (outlines, no font needed)
// and <prefix>.png (transparent), both cropped tight to the letters.
import Foundation
import CoreText
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let a = CommandLine.arguments
let fontURL = URL(fileURLWithPath: a[1]), prefix = a[2], hex = a[3]
let pngW = Double(a[4])!, align = a[5], lines = Array(a[6...])

let descs = CTFontManagerCreateFontDescriptorsFromURL(fontURL as CFURL) as! [CTFontDescriptor]
let size: CGFloat = 1000
func tag(_ s: String) -> Int { s.unicodeScalars.reduce(0) { ($0 << 8) | Int($1.value) } }
let varAttrs: [CFString: Any] = [kCTFontVariationAttribute: [tag("wdth"): 62, tag("wght"): 900]]
let desc = CTFontDescriptorCreateCopyWithAttributes(descs[0], varAttrs as CFDictionary)
let font = CTFontCreateWithFontDescriptor(desc, size, nil)

// Lay out each line, collect glyph outlines.
let lineGap = size * 0.86
var linePaths: [CGMutablePath] = []
for line in lines {
  let attr = NSAttributedString(string: line, attributes: [
    NSAttributedString.Key(kCTFontAttributeName as String): font,
    NSAttributedString.Key(kCTKernAttributeName as String): -0.005 * size,
  ])
  let ctLine = CTLineCreateWithAttributedString(attr)
  let path = CGMutablePath()
  for run in CTLineGetGlyphRuns(ctLine) as! [CTRun] {
    let n = CTRunGetGlyphCount(run)
    var glyphs = [CGGlyph](repeating: 0, count: n), pos = [CGPoint](repeating: .zero, count: n)
    CTRunGetGlyphs(run, CFRange(location: 0, length: n), &glyphs)
    CTRunGetPositions(run, CFRange(location: 0, length: n), &pos)
    let runFont = (CTRunGetAttributes(run) as Dictionary)[kCTFontAttributeName] as! CTFont
    for i in 0..<n {
      if let g = CTFontCreatePathForGlyph(runFont, glyphs[i], nil) {
        path.addPath(g, transform: CGAffineTransform(translationX: pos[i].x, y: pos[i].y))
      }
    }
  }
  linePaths.append(path)
}
// Stack lines (y up), align by ink bounds.
let widths = linePaths.map { $0.boundingBoxOfPath.width }
let maxW = widths.max()!
let all = CGMutablePath()
for (i, p) in linePaths.enumerated() {
  let b = p.boundingBoxOfPath
  let dx = (align == "center" ? (maxW - b.width) / 2 : 0) - b.minX
  let dy = -CGFloat(i) * lineGap
  all.addPath(p, transform: CGAffineTransform(translationX: dx, y: dy))
}
let bb = all.boundingBoxOfPath
// Normalise: origin at top-left of ink, y down.
var flip = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: -bb.minX, ty: bb.maxY)
let norm = all.copy(using: &flip)!
let W = bb.width, H = bb.height

// SVG
var d = ""
func f(_ v: CGFloat) -> String { String(format: "%.1f", v) }
norm.applyWithBlock { el in
  let p = el.pointee.points
  switch el.pointee.type {
  case .moveToPoint: d += "M\(f(p[0].x)) \(f(p[0].y))"
  case .addLineToPoint: d += "L\(f(p[0].x)) \(f(p[0].y))"
  case .addQuadCurveToPoint: d += "Q\(f(p[0].x)) \(f(p[0].y)) \(f(p[1].x)) \(f(p[1].y))"
  case .addCurveToPoint: d += "C\(f(p[0].x)) \(f(p[0].y)) \(f(p[1].x)) \(f(p[1].y)) \(f(p[2].x)) \(f(p[2].y))"
  case .closeSubpath: d += "Z"
  @unknown default: break
  }
}
let title = lines.joined(separator: " ").capitalized
let svg = """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 \(f(W)) \(f(H))" width="\(f(W / 10))" height="\(f(H / 10))" role="img" aria-label="\(title)"><title>\(title)</title><path fill="#\(hex)" d="\(d)"/></svg>

"""
try! svg.write(toFile: prefix + ".svg", atomically: true, encoding: .utf8)

// PNG, transparent, with a little padding.
let pad = 0.04 * H
let scale = (pngW - 2 * pad) / W
let pw = Int(pngW.rounded()), ph = Int((H * scale + 2 * pad).rounded())
let ctx = CGContext(data: nil, width: pw, height: ph, bitsPerComponent: 8, bytesPerRow: 0,
                    space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
let r = CGFloat(Int(hex.prefix(2), radix: 16)!) / 255, g = CGFloat(Int(hex.dropFirst(2).prefix(2), radix: 16)!) / 255, b = CGFloat(Int(hex.suffix(2), radix: 16)!) / 255
ctx.setFillColor(CGColor(red: r, green: g, blue: b, alpha: 1))
ctx.translateBy(x: pad, y: CGFloat(ph) - pad)
ctx.scaleBy(x: scale, y: -scale)
ctx.addPath(norm)
ctx.fillPath()
let img = ctx.makeImage()!
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: prefix + ".png") as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, img, nil)
CGImageDestinationFinalize(dest)
print("\(prefix): svg \(Int(W))x\(Int(H)) units, png \(pw)x\(ph)")
