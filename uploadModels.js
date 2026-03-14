import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const MODELS_DIR = "./public/models"
const BUCKET = "models"

async function uploadModel(filePath) {
  const fileName = path.basename(filePath)
  const fileBuffer = fs.readFileSync(filePath)

  console.log("Uploading:", fileName)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, fileBuffer, { upsert: true })

  if (error) {
    console.error("Upload error:", error.message)
    return null
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)

  return data.publicUrl
}

async function main() {
  if (!fs.existsSync(MODELS_DIR)) {
    console.error("❌ Folder not found:", MODELS_DIR)
    process.exit(1)
  }

  const files = fs.readdirSync(MODELS_DIR).filter(f => f.endsWith(".glb"))

  if (files.length === 0) {
    console.log("⚠️ No .glb files found")
    return
  }

  const links = {}

  for (const file of files) {
    const fullPath = path.join(MODELS_DIR, file)
    const url = await uploadModel(fullPath)

    if (url) {
      links[file] = url
      console.log("✅", file, "→", url)
    }
  }

  fs.writeFileSync("models_links.json", JSON.stringify(links, null, 2))

  console.log("")
  console.log("🔥 Upload complete")
  console.log("Links saved to models_links.json")
}

main()