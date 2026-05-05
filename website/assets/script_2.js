// Contact form — interactive React component with validation + success state
const { useState } = React;

function ContactForm() {
  const [data, setData] = useState({ name: '', telefon: '', email: '', nachricht: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const update = (k) => (e) => {
    setData((d) => ({ ...d, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: null }));
  };

  const validate = () => {
    const er = {};
    if (!data.name.trim()) er.name = 'Bitte Namen angeben';
    if (!data.telefon.trim()) er.telefon = 'Bitte Telefonnummer angeben';
    else if (!/^[\d\s+\-()/]{6,}$/.test(data.telefon.trim())) er.telefon = 'Telefonnummer prüfen';
    if (!data.email.trim()) er.email = 'Bitte E-Mail angeben';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) er.email = 'E-Mail prüfen';
    if (!data.nachricht.trim()) er.nachricht = 'Kurz beschreiben, worum es geht';
    return er;
  };

  const submit = (e) => {
    e.preventDefault();
    const er = validate();
    if (Object.keys(er).length) { setErrors(er); return; }
    setSubmitting(true);

    const subject = encodeURIComponent('Beratungsanfrage von ' + data.name);
    const body = encodeURIComponent(
      'Name: ' + data.name + '\n' +
      'Telefon: ' + data.telefon + '\n' +
      'E-Mail: ' + data.email + '\n\n' +
      'Nachricht:\n' + data.nachricht
    );
    window.location.href = 'mailto:AK-Assistance@protonmail.com?subject=' + subject + '&body=' + body;

    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
    }, 900);
  };

  if (done) {
    return (
      <div className="form-card">
        <div className="form-success">
          <span className="check">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <h4>Vielen Dank, {data.name.split(' ')[0]}!</h4>
          <p>Wir haben Ihre Nachricht erhalten und melden uns innerhalb eines Werktags bei Ihnen.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate>
      <div className={`field ${errors.name ? 'error' : ''}`}>
        <label htmlFor="name">Name <span className="req">*</span></label>
        <input id="name" type="text" placeholder="Max Mustermann" value={data.name} onChange={update('name')} autoComplete="name" />
        {errors.name && <span className="err-msg">{errors.name}</span>}
      </div>

      <div className="form-row">
        <div className={`field ${errors.telefon ? 'error' : ''}`}>
          <label htmlFor="telefon">Telefonnummer <span className="req">*</span></label>
          <input id="telefon" type="tel" placeholder="+49 30 12 34 56 78" value={data.telefon} onChange={update('telefon')} autoComplete="tel" />
          {errors.telefon && <span className="err-msg">{errors.telefon}</span>}
        </div>
        <div className={`field ${errors.email ? 'error' : ''}`}>
          <label htmlFor="email">E-Mail <span className="req">*</span></label>
          <input id="email" type="email" placeholder="max@beispiel.de" value={data.email} onChange={update('email')} autoComplete="email" />
          {errors.email && <span className="err-msg">{errors.email}</span>}
        </div>
      </div>

      <div className={`field ${errors.nachricht ? 'error' : ''}`}>
        <label htmlFor="nachricht">Nachricht <span className="req">*</span></label>
        <textarea id="nachricht" rows="4" placeholder="Erzählen Sie kurz, was Sie machen und wie viele Anrufe Sie pro Woche bekommen." value={data.nachricht} onChange={update('nachricht')}></textarea>
        {errors.nachricht && <span className="err-msg">{errors.nachricht}</span>}
      </div>

      <button type="submit" className="form-submit" disabled={submitting}>
        {submitting ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{animation:'spin 0.9s linear infinite'}}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
            </svg>
            Wird gesendet…
          </>
        ) : (
          <>
            Beratung anfragen
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </>
        )}
      </button>
      <p className="form-note">Ihre Daten werden nur zur Bearbeitung Ihrer Anfrage verwendet.</p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}

ReactDOM.createRoot(document.getElementById('form-mount')).render(<ContactForm />);
