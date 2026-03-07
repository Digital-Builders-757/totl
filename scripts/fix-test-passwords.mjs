import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
// Service role key from supabase status output
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testAccounts = [
  { email: 'test@totl.local', password: 'Password123!' },
  { email: 'qa.admin@thetotlagency.local', password: 'Password123!' },
  { email: 'lumen.media@thetotlagency.local', password: 'Password123!' },
]

async function fixPasswords() {
  for (const account of testAccounts) {
    try {
      const { data, error } = await supabase.auth.admin.updateUserById(
        // We need to get the user ID first
        '00000000-0000-0000-0000-000000000000', // placeholder
        { password: account.password }
      )
      
      // Alternative: Just use direct API
      console.log(`Attempting to update password for ${account.email}`)
      
      // Get user by email first
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
      
      if (userError) {
        console.error(`Error listing users:`, userError)
        continue
      }
      
      const user = userData.users.find(u => u.email === account.email)
      
      if (!user) {
        console.error(`User not found: ${account.email}`)
        continue
      }
      
      // Update password
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: account.password }
      )
      
      if (updateError) {
        console.error(`Error updating ${account.email}:`, updateError)
      } else {
        console.log(`✓ Updated password for ${account.email}`)
      }
      
    } catch (err) {
      console.error(`Exception updating ${account.email}:`, err)
    }
  }
}

fixPasswords().then(() => {
  console.log('Done!')
  process.exit(0)
})
