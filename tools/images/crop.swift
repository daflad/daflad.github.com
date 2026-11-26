// crop <in> <out.jpg> <x> <y> <w> <h> <outW> <outH> [quality]
// x,y from the top-left, in source pixels.
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let a = CommandLine.arguments
guard a.count >= 9 else { print("usage: crop in out x y w h outW outH [q]"); exit(2) }
let n = a[3...8].map { Int($0)! }
let q = a.count > 9 ? Double(a[9])! : 0.86
let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil)!
let img = CGImageSourceCreateImageAtIndex(src, 0, nil)!
let cropped = img.cropping(to: CGRect(x: n[0], y: n[1], width: n[2], height: n[3]))!
let ctx = CGContext(data: nil, width: n[4], height: n[5], bitsPerComponent: 8, bytesPerRow: 0,
                    space: CGColorSpace(name: CGColorSpace.sRGB)!,
                    bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
ctx.interpolationQuality = .high
ctx.draw(cropped, in: CGRect(x: 0, y: 0, width: n[4], height: n[5]))
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, UTType.jpeg.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, ctx.makeImage()!, [kCGImageDestinationLossyCompressionQuality: q] as CFDictionary)
CGImageDestinationFinalize(dest)
