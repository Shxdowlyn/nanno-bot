import fs from "fs"
import path from "path"
import chalk from "chalk"
import { fileURLToPath } from "url"
import { parse } from "@babel/parser"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global.comandos = new Map()

const commandsFolder = path.join(__dirname, "../../commands")

let reloading = false

// ==========================
// LOAD COMMANDS
// ==========================
export async function loadCommands(dir = commandsFolder) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)

    if (fs.lstatSync(full).isDirectory()) {
      await loadCommands(full)
      continue
    }

    if (!file.endsWith(".js")) continue

    const code = fs.readFileSync(full, "utf8")

    try {
      parse(code, {
        sourceType: "module",
        plugins: ["topLevelAwait"]
      })
    } catch (err) {
      console.log(chalk.red(`❌ Syntax error: ${file}`))
      continue
    }

    try {
      const mod = await import(`${full}?update=${Date.now()}`)
      const plugin = mod.default
      if (!plugin) continue

      const name = file.replace(".js", "")

      if (!plugin.command || typeof plugin.run !== "function") continue

      for (const cmd of plugin.command) {
        global.comandos.set(cmd.toLowerCase(), {
          name,
          run: plugin.run,
          category: plugin.category || "uncategorized",
          owner: plugin.owner || false,
          admin: plugin.admin || false,
          botAdmin: plugin.botAdmin || false
        })
      }

      console.log(chalk.green(`✔ Loaded: ${file}`))

    } catch (e) {
      console.log(chalk.red(`❌ Error loading: ${file}`))
      console.log(e.message)
    }
  }
}

// ==========================
// RELOAD SINGLE FILE (SAFE)
// ==========================
export async function reloadFile(filename) {
  if (!filename.endsWith(".js")) return
  if (reloading) return

  reloading = true

  try {
    const full = path.join(commandsFolder, filename)

    if (!fs.existsSync(full)) {
      global.comandos.clear()
      await loadCommands()
      reloading = false
      return
    }

    const code = fs.readFileSync(full, "utf8")

    parse(code, {
      sourceType: "module",
      plugins: ["topLevelAwait"]
    })

    await import(`${full}?update=${Date.now()}`)

    global.comandos.clear()
    await loadCommands()

    console.log(chalk.green(`♻ Reloaded: ${filename}`))

  } catch (e) {
    console.log(chalk.red(`❌ Reload error: ${filename}`))
    console.log(e.message)
  } finally {
    reloading = false
  }
}