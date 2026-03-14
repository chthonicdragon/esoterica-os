import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: ".env.local" })

const rawUrl = process.env.SUPABASE_URL || ""
const supabaseUrl = rawUrl.trim().replaceAll("`", "").replaceAll("\"", "").replaceAll(" ", "")
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabase = createClient(supabaseUrl, supabaseKey)
const bucket = "models"
const baseDir = "public/models_optimized"
const files = [
  "anubis.glb",
  "book_of_runes___odins_hidden_grimoire.glb",
  "idol.glb",
  "magic_book_set.glb",
  "mortar_pestle.glb",
  "runes_stone.glb",
  "sarmatian_skull_no._2.glb",
]

const result = {}

for (const file of files) {
  const filePath = path.join(baseDir, file)
  if (!fs.existsSync(filePath)) {
    console.log(`MISS ${file}`)
    continue
  }
  const data = fs.readFileSync(filePath)
  const { error } = await supabase.storage.from(bucket).upload(file, data, {
    upsert: true,
    contentType: "model/gltf-binary",
  })
  if (error) {
    console.log(`ERR ${file} ${error.message}`)
    continue
  }
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(file)
  const { data: signedData, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(file, 60 * 60)
  result[file] = {
    publicUrl: publicData.publicUrl,
    signedUrl: signedError ? null : signedData.signedUrl,
  }
  console.log(`OK ${file}`)
}

fs.writeFileSync("models_links_remaining.json", JSON.stringify(result, null, 2))
console.log(`DONE ${Object.keys(result).length}`)
