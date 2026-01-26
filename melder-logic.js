import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://cbbfwriktcdcmmhbpubp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiYmZ3cmlrdGNkY21taGJwdWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mjk1NTcsImV4cCI6MjA3ODAwNTU1N30.jFMS63ilrepPnstVtBGDd1jjEkd9lrmRMmtVYMBJ8Ok';
const supabase = createClient(supabaseUrl, supabaseKey);

const sound = new Audio('meldeton.wav');

// === Realtime Listener für neue Einsätze ===
supabase
  .channel('einsaetze_channel')
  .on(
    'postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'einsaetze' }, 
    (payload) => {
      const einsatz = payload.new;
      const einsatzZeit = new Date(`${einsatz.datum}T${einsatz.uhrzeit}`);

      const displayPanel = document.getElementById('displayPanel');
      if (displayPanel) {
        displayPanel.style.backgroundColor = '#37b837ff'; // z.B. grün
      }
      document.getElementById('displayText1').textContent = einsatz.stichwort;
      document.getElementById('displayText2').textContent = einsatz.ort;
      document.getElementById('displayText3').textContent = einsatz.datum;
      document.getElementById('displayText4').textContent = einsatz.uhrzeit;      
      document.getElementById('bootImage').style.display = 'none';
      sound.currentTime = 0;
      sound.play().catch(err => console.error('Fehler beim Abspielen:', err));

      console.log('Neuer Einsatz (Realtime):', einsatz);
    }
  )
  .subscribe();

console.log('Realtime Listener aktiv!');
