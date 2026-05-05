// Review form — star picker + name + comment
const { useState: useStateRf } = React;

function ReviewForm() {
  const [stars, setStars] = useStateRf(0);
  const [hover, setHover] = useStateRf(0);
  const [name, setName] = useStateRf('');
  const [text, setText] = useStateRf('');
  const [errors, setErrors] = useStateRf({});
  const [done, setDone] = useStateRf(false);

  const labels = { 1: 'Leider nicht gut', 2: 'Geht so', 3: 'In Ordnung', 4: 'Gut', 5: 'Hervorragend' };
  const display = hover || stars;

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!stars) er.stars = 'Bitte Sterne wählen';
    if (!name.trim()) er.name = 'Bitte Namen angeben';
    if (!text.trim()) er.text = 'Bitte kurz beschreiben';
    if (Object.keys(er).length) { setErrors(er); return; }
    setDone(true);
  };

  if (done) {
    return (
      <div className="rf-card">
        <div style={{textAlign:'center', padding: '12px 0'}}>
          <div style={{width:48, height:48, borderRadius:'50%', background:'var(--ink)', color:'#fff', display:'grid', placeItems:'center', margin:'0 auto 14px'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h4 style={{fontSize:20, marginBottom:6}}>Vielen Dank, {name.split(' ')[0]}!</h4>
          <p style={{color:'var(--ink-soft)', fontSize:15}}>Ihre Bewertung ist bei uns angekommen.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="rf-card" onSubmit={submit} noValidate>
      <div className="field" style={{marginBottom: 18}}>
        <label>Ihre Bewertung</label>
        <div style={{display:'flex', alignItems:'center'}}>
          <div className="star-picker" onMouseLeave={() => setHover(0)}>
            {[1,2,3,4,5].map((n) => (
              <button
                key={n}
                type="button"
                className={display >= n ? 'on' : ''}
                onMouseEnter={() => setHover(n)}
                onClick={() => { setStars(n); setErrors((e) => ({...e, stars: null})); }}
                aria-label={`${n} Sterne`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>
            ))}
          </div>
          <span className="star-picker-label">{display ? labels[display] : 'Sterne wählen'}</span>
        </div>
        {errors.stars && <span style={{fontSize:13, color:'#DC2626', marginTop:4}}>{errors.stars}</span>}
      </div>

      <div className={`field ${errors.text ? 'error' : ''}`}>
        <label htmlFor="rf-text">Ihre Erfahrung</label>
        <textarea id="rf-text" rows="3" placeholder="Was hat Ihnen gefallen, was würden Sie verbessern?" value={text} onChange={(e) => { setText(e.target.value); if (errors.text) setErrors((er) => ({...er, text:null})); }}></textarea>
        {errors.text && <span className="err-msg" style={{display:'block'}}>{errors.text}</span>}
      </div>

      <div className={`field ${errors.name ? 'error' : ''}`}>
        <label htmlFor="rf-name">Ihr Name</label>
        <input id="rf-name" type="text" placeholder="Vor- und Nachname" value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((er) => ({...er, name:null})); }} />
        {errors.name && <span className="err-msg" style={{display:'block'}}>{errors.name}</span>}
      </div>

      <button type="submit" className="form-submit">
        Bewertung absenden
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>
    </form>
  );
}

const rfMount = document.getElementById('review-form-mount');
if (rfMount) ReactDOM.createRoot(rfMount).render(<ReviewForm />);
