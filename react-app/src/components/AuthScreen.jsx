export default function AuthScreen({ onLogin }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💰</div>
          <h1>Fin<span>Track</span></h1>
          <p>Tu control de finanzas personales</p>
        </div>
        <button className="btn-google" onClick={onLogin}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.3 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.3 6.5 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5.1l-6.3-5.3C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.5 39.6 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.3 5.3C37 37.1 44 32 44 24c0-1.3-.1-2.6-.4-3.9z"/>
          </svg>
          Continuar con Google
        </button>
        <p className="auth-note">Tus datos quedan asociados a tu cuenta Google y son accesibles desde cualquier dispositivo.</p>
      </div>
    </div>
  );
}
