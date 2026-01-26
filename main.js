import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 🔁 HIER deine echten Daten eintragen:
const supabaseUrl = 'https://cbbfwriktcdcmmhbpubp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYmZ3cmlrdGNkY21taGJwdWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mjk1NTcsImV4cCI6MjA3ODAwNTU1N30.jFMS63ilrepPnstVtBGDd1jjEkd9lrmRMmtVYMBJ8Ok';
const supabase = createClient(supabaseUrl, supabaseKey)

const form = document.getElementById('login-form')
const errorEl = document.getElementById('error')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    errorEl.textContent = "Fehler: " + error.message
  } else {
    // Login erfolgreich → Weiterleitung
    window.location.href = "index.html"
  }
})
