import fs from 'fs'
import { tmpdir } from 'os'
import crypto from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import webp from 'node-webpmux'
import path from 'path'

const randomName = (ext = 'webp') =>
  path.join(tmpdir(), `${crypto.randomBytes(6).toString('hex')}.${ext}`)

// -------------------- IMAGE -> WEBP --------------------
export async function imageToWebp(media) {
  const input = randomName('jpg')
  const output = randomName()

  fs.writeFileSync(input, media)

  await new Promise((resolve, reject) => {
    ffmpeg(input)
      .on('error', reject)
      .on('end', resolve)
      .addOutputOptions([
        '-vcodec', 'libwebp',
        '-vf',
        "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0",
        '-loop', '0'
      ])
      .toFormat('webp')
      .save(output)
  })

  const buffer = fs.readFileSync(output)

  fs.unlinkSync(input)
  fs.unlinkSync(output)

  return buffer
}

// -------------------- VIDEO -> WEBP --------------------
export async function videoToWebp(media) {
  const input = randomName('mp4')
  const output = randomName()

  fs.writeFileSync(input, media)

  await new Promise((resolve, reject) => {
    ffmpeg(input)
      .on('error', reject)
      .on('end', resolve)
      .addOutputOptions([
        '-vcodec', 'libwebp',
        '-vf',
        "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15",
        '-loop', '0',
        '-t', '5',
        '-preset', 'default',
        '-an'
      ])
      .toFormat('webp')
      .save(output)
  })

  const buffer = fs.readFileSync(output)

  fs.unlinkSync(input)
  fs.unlinkSync(output)

  return buffer
}

// -------------------- EXIF WRITER --------------------
async function addExif(file, metadata = {}) {
  const sticker = new webp.Image()

  const json = {
    'sticker-pack-id': 'https://github.com/NannoBot',
    'sticker-pack-name': metadata.packname || 'Nanno',
    'sticker-pack-publisher': metadata.author || 'Nanno Team',
    emojis: metadata.categories || ['🦭']
  }

  const exifAttr = Buffer.from([
    0x49,0x49,0x2a,0x00,0x08,0x00,0x00,0x00,
    0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,
    0x00,0x00,0x16,0x00,0x00,0x00
  ])

  const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')

  const exif = Buffer.concat([exifAttr, jsonBuff])
  exif.writeUIntLE(jsonBuff.length, 14, 4)

  await sticker.load(file)
  sticker.exif = exif

  const out = randomName()
  await sticker.save(out)

  return out
}

// -------------------- MAIN WRAPPER --------------------
export async function writeExif(media, metadata = {}) {
  let webpBuffer

  if (Buffer.isBuffer(media.data)) {
    if (/image/.test(media.mimetype)) {
      webpBuffer = await imageToWebp(media.data)
    } else if (/video/.test(media.mimetype)) {
      webpBuffer = await videoToWebp(media.data)
    } else if (/webp/.test(media.mimetype)) {
      webpBuffer = media.data
    }
  } else {
    webpBuffer = media
  }

  const tmp = randomName()
  fs.writeFileSync(tmp, webpBuffer)

  const result = await addExif(tmp, metadata)

  fs.unlinkSync(tmp)

  return result
}

// -------------------- EXPORT DEFAULT --------------------
export default {
  imageToWebp,
  videoToWebp,
  writeExif
}