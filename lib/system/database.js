import { JSONFile } from 'lowdb/node'
import path from 'path'
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

// Adapter LowDB
const adapter = new JSONFile(dbPath)
const db = new Low(adapter, defaultData)

// Inicializar DB
async function initDB() {
  try {
    await db.read()

    // Si está vacío, aplicar estructura base
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
    try {
      await db.read()
      this.data = db.data
    } catch (err) {
      console.log(chalk.red('[DATABASE READ ERROR]'), err.message)
    }
  },

  async save() {
    try {
      await db.write()
    } catch (err) {
      console.log(chalk.red('[DATABASE SAVE ERROR]'), err.message)
    }
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