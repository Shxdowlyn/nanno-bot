import { Low } from 'lowdb'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../database.json')

const defaultData = {
  users: {},
  chats: {},
  settings: {},
  stats: {
    totalCommands: 0,
    startTime: Date.now()
  }
}

// JSONFile manual (ESTABLE en Termux)
class JSONFile {
  constructor(filename) {
    this.filename = filename
  }

  async read() {
    try {
      return JSON.parse(fs.readFileSync(this.filename, 'utf-8'))
    } catch {
      return null
    }
  }

  async write(data) {
    fs.writeFileSync(this.filename, JSON.stringify(data, null, 2))
  }
}

// Adapter
const adapter = new JSONFile(dbPath)
const db = new Low(adapter, defaultData)

// INIT DB
async function initDB() {
  try {
    await db.read()

    db.data ||= defaultData
    db.data.users ||= {}
    db.data.chats ||= {}
    db.data.settings ||= {}
    db.data.stats ||= defaultData.stats

    await db.write()

    console.log(
      chalk.greenBright('[DATABASE] ✔ Base de datos iniciada correctamente')
    )
  } catch (err) {
    console.log(
      chalk.red('[DATABASE ERROR INIT]'),
      err.message
    )
  }
}

await initDB()

export const database = {
  data: db.data,

  async read() {
    await db.read()
    this.data = db.data
  },

  async save() {
    await db.write()
  },

  async reset() {
    db.data = structuredClone(defaultData)
    await db.write()
    this.data = db.data

    console.log(
      chalk.yellowBright('[DATABASE] ⚠ Base de datos reseteada')
    )
  }
}

export default database