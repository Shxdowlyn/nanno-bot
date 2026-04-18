import fs from "fs"
import path from "path"
import chalk from "chalk"
import { fileURLToPath } from "url"
import { parse } from "@babel/parser"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global.comandos = new Map()
global.plugins = {}

const commandsFolder = path.join(__dirname, "../../commands")

let reloading = false

async function loadCommands(dir = commandsFolder) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)

    if (fs.lstatSync(full).isDirectory()) {
      await loadCommands(full)
      continue
    }

    if (!file.endsWith(".js")) continue

    const code = fs.readFileSync(full, "utf8")

    // validación de sintaxis
    try {
      parse(code, {
        sourceType: "module",
        plugins: ["topLevelAwait"]
      })
    } catch (err) {
      console.log(chalk.red(`❌ Syntax error: ${file}`))
      console.log(err.message)
      continue
    }

    try {
      const mod = await import(`${full}?v=${Date.now()}`)
      const plugin = mod.default
      const name = file.replace(".js", "")

      global.plugins[name] = mod

      if (!plugin?.command || typeof plugin.run !== "function") continue

      for (const cmd of plugin.command) {
        global.comandos.set(cmd.toLowerCase(), {
          name,
          run: plugin.run,
          category: plugin.category || "uncategorized",
          owner: plugin.owner || false,
          admin: plugin.admin || false,
          botAdmin: plugin.botAdmin || false,
          before: mod.before || null,
          after: mod.after || null
        })
      }

    } catch (e) {
      console.log(chalk.red(`❌ Error loading plugin: ${file}`))
      console.log(e)
    }
  }
}

async function reloadFile(filename) {
  if (!filename.endsWith(".js")) return
  if (reloading) return

  reloading = true

  try {
    const full = path.join(commandsFolder, filename)

    if (!fs.existsSync(full)) {
      delete global.plugins[filename.replace(".js", "")]
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

    const mod = await import(`${full}?v=${Date.now()}`)

    global.plugins[filename.replace(".js", "")] = mod

    global.comandos.clear()
    await loadCommands()

    console.log(chalk.green(`♻ Reload: ${filename}`))

  } catch (e) {
    console.log(chalk.red(`❌ Reload error: ${filename}`))
    console.log(e)
  } finally {
    reloading = false
  }
}

// watcher
fs.watch(commandsFolder, { recursive: true }, (event, file) => {
  if (file) reloadFile(file)
})

export default loadCommands