import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function update() {
  const { error } = await supabase.rpc('increment_points', {
    username: 'rohith',
    value: 10
  })

  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.log('Points updated')
}

update()