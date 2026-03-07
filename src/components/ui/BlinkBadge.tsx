import { useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function BlinkBadge() {
  useEffect(() => {
    async function fetchBadge() {
      const { data, error } = await supabase
        .from('badges')
        .select('badge_eligible')
        .eq('project_id', 'esoterica-os-jhy3n3le')
        .single()

      console.log('Badge data from Supabase:', data, error)

      const script = document.createElement('script')
      script.src = 'https://blink.new/auto-engineer.js?projectId=esoterica-os-jhy3n3le'
      script.type = 'module'
      script.async = true
      document.body.appendChild(script)

      script.onload = () => {
        console.log('Blink loaded ✅')
        if (window.Blink?.init) {
          window.Blink.init({ projectId: 'esoterica-os-jhy3n3le' })
        }
      }
    }

    fetchBadge()
  }, [])

  return <div id="blink-badge-container"></div>
}