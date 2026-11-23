import { useRef, useState } from 'react'
import { readStore, writeStore } from '../lib/storage'

const backupKeys = ['habits', 'todos', 'focusSessions', 'focusTimerSettings', 'focusPreferences']
export default function SettingsPage() {
  const fileRef = useRef(null)
  const [message, setMessage] = useState('')
  const [preferences, setPreferences] = useState(() => readStore('focusPreferences', {}))
  const updatePreference = (key, value) => {
    setPreferences((current) => { const next = { ...current, [key]: value }; writeStore('focusPreferences', next); return next })
  }
  const exportData = () => {
    const data = Object.fromEntries(backupKeys.map((key) => [key, readStore(key, ['habits', 'todos', 'focusSessions'].includes(key) ? [] : {})]))
    const backup = { format: 'focus-app-backup', version: 1, exportedAt: new Date().toISOString(), data }
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url; link.download = `focus-app-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Sauvegarde téléchargée. Conservez le fichier dans un endroit sûr.')
  }
  const importData = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 5_000_000) { setMessage('Le fichier est trop volumineux.'); return }
    try {
      const backup = JSON.parse(await file.text())
      if (backup.format !== 'focus-app-backup' || !backup.data || !Array.isArray(backup.data.habits) || !Array.isArray(backup.data.todos) || !Array.isArray(backup.data.focusSessions)) throw new Error('invalid')
      if (!window.confirm('Restaurer cette sauvegarde remplacera les données enregistrées sur cet appareil. Continuer ?')) return
      backupKeys.forEach((key) => key in backup.data ? localStorage.setItem(key, JSON.stringify(backup.data[key])) : localStorage.removeItem(key))
      setMessage('Sauvegarde restaurée. Rechargement…')
      setTimeout(() => window.location.reload(), 700)
    } catch { setMessage('Ce fichier ne ressemble pas à une sauvegarde Focus App valide.') }
  }
  const enableNotifications = async (event) => {
    if (!event.target.checked) { updatePreference('completionNotification', false); return }
    if (!('Notification' in window)) { setMessage('Les notifications ne sont pas disponibles dans ce navigateur.'); return }
    const permission = await Notification.requestPermission()
    updatePreference('completionNotification', permission === 'granted')
    setMessage(permission === 'granted' ? 'Notifications de fin de session activées.' : 'Autorisation de notification non accordée.')
  }
  return <div className="page-enter">
    <header className="page-header"><div><div className="eyebrow"><span className="eyebrow-line"/> CONTRÔLE DE VOTRE ESPACE</div><h1>Vos préférences<span className="accent-text">.</span></h1><p className="page-subtitle">Tout reste enregistré sur cet appareil. Vous gardez la main sur vos données.</p></div></header>
    <section className="settings-grid">
      <article className="panel settings-card"><div className="eyebrow">CONFIDENTIALITÉ</div><h2>Vos données restent les vôtres.</h2><p>Habitudes, tâches et historique sont stockés localement dans ce navigateur. Une sauvegarde vous permet de les déplacer ou de les restaurer.</p><div className="settings-actions"><button className="button button-primary" onClick={exportData}>↓ Télécharger ma sauvegarde</button><button className="button button-secondary" onClick={() => fileRef.current?.click()}>↑ Restaurer un fichier</button><input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={importData}/></div>{message && <div className="toast" role="status">{message}</div>}</article>
      <article className="panel settings-card"><div className="eyebrow">RAPPELS</div><h2>Fin de session</h2><p>Recevoir une notification du navigateur quand un minuteur se termine. La permission est demandée uniquement si vous activez cette option.</p><label className="settings-toggle"><span><strong>Notification de fin</strong><small>Fonctionne lorsque le navigateur autorise les notifications.</small></span><input type="checkbox" checked={Boolean(preferences.completionNotification)} onChange={enableNotifications}/></label><label className="settings-toggle"><span><strong>Signal sonore</strong><small>Deux sons discrets à la fin d’une session.</small></span><input type="checkbox" checked={Boolean(preferences.completionSound)} onChange={(event) => updatePreference('completionSound', event.target.checked)}/></label></article>
      <article className="panel settings-card settings-wide"><div className="eyebrow">À SAVOIR</div><h2>Mode privé, sans compte</h2><p>Les données ne se synchronisent pas entre appareils. Pour changer de téléphone ou restaurer tes habitudes ailleurs, télécharge une sauvegarde ici puis restaure-la sur l’autre appareil. La sauvegarde contient tes tâches, habitudes, statistiques et réglages du minuteur.</p><div className="settings-note">La sauvegarde est un fichier personnel : garde-le dans un endroit privé.</div></article>
    </section>
  </div>
}