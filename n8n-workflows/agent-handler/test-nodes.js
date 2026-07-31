// Führt die jsCode-Felder der Code-Nodes mit Beispieldaten aus.
// Ersetzt keinen echten n8n-Lauf, prüft aber die Logik, die dort steckt.
const fs = require('fs');
const path = require('path');
const DIR = '/Users/janosch-1/AK-Assistance/n8n-workflows/agent-handler';

// --- Minimal-Mock von Luxon, so weit die Nodes es nutzen -------------------
function mkDt(ms) {
  return {
    ms,
    setZone() { return mkDt(this.ms); },
    plus(o) { return mkDt(this.ms + (o.days || 0) * 86400000); },
    toFormat(f) {
      const d = new Date(this.ms);
      const p = (n) => String(n).padStart(2, '0');
      if (f === 'yyyy-MM-dd') return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
      throw new Error('Format nicht gemockt: ' + f);
    },
  };
}
const DateTime = { fromISO: (s) => mkDt(Date.parse(s.length === 10 ? s + 'T00:00:00Z' : s)) };
const HEUTE = mkDt(Date.parse('2026-07-31T09:00:00Z'));

function ladeCode(datei, nodeName) {
  const wf = JSON.parse(fs.readFileSync(path.join(DIR, datei), 'utf8'));
  const n = wf.nodes.find((x) => x.name === nodeName);
  if (!n) throw new Error(`Node ${nodeName} nicht in ${datei}`);
  return n.parameters.jsCode;
}

function lauf(datei, nodeName, { items, env = {}, nodes = {} }) {
  const js = ladeCode(datei, nodeName);
  const $input = {
    first: () => items[0],
    all: () => items,
  };
  const $ = (name) => {
    if (!(name in nodes)) throw new Error(`Node "${name}" wurde nicht ausgeführt`);
    return { first: () => ({ json: nodes[name] }), item: { json: nodes[name] } };
  };
  const fn = new Function('$input', '$', '$env', '$now', 'DateTime',
    `${js}\n//# sourceURL=${datei}:${nodeName}`);
  return fn($input, $, env, HEUTE, DateTime);
}

let ok = 0, fehler = 0;
function pruefe(titel, bedingung, details) {
  if (bedingung) { ok++; console.log('  OK   ' + titel); }
  else { fehler++; console.log('  FEHL ' + titel + (details ? '  -> ' + JSON.stringify(details) : '')); }
}

const HANDLER = '01-ak-agent-handler.json';
const AUTH = 'Auth und Validierung';
const SECRET = { AK_WEBHOOK_SECRET: 'geheim-123' };

console.log('\n== Auth und Validierung ==');
{
  const r = lauf(HANDLER, AUTH, { items: [{ json: { headers: {}, body: {}, query: {} } }], env: SECRET })[0].json;
  pruefe('ohne Header -> 401 unauthorized', r.http_code === 401 && r.message === 'unauthorized', r);

  const r2 = lauf(HANDLER, AUTH, { items: [{ json: { headers: { 'x-ak-auth': 'falsch' }, body: {}, query: {} } }], env: SECRET })[0].json;
  pruefe('falsches Secret -> 401', r2.http_code === 401, r2);

  const r3 = lauf(HANDLER, AUTH, {
    items: [{ json: { headers: { 'x-ak-auth': 'geheim-123' }, query: {}, body: { kunde_id: 'a', agent_typ: 'b', action: 'check_availability' } } }],
    env: SECRET,
  })[0].json;
  pruefe('direktes Schema -> durchgelassen', r3.fehler_code === '' && r3.action === 'check_availability', r3);

  // Retell-Format
  const r4 = lauf(HANDLER, AUTH, {
    items: [{ json: {
      headers: { 'x-ak-auth': 'geheim-123' },
      query: { kunde_id: 'muster-bau', agent_typ: 'rezeption' },
      body: { name: 'book_appointment', args: { name: 'Meier', start: '2026-08-05T10:00:00Z' }, call: { call_id: 'c1', from_number: '+4917012345' } },
    } }], env: SECRET,
  })[0].json;
  pruefe('Retell { name, args, call } -> action/params/from_number',
    r4.action === 'book_appointment' && r4.params.name === 'Meier' && r4.from_number === '+4917012345' && r4.call_id === 'c1', r4);

  // Angriff: args-only, Body versucht fremde kunde_id
  const r5 = lauf(HANDLER, AUTH, {
    items: [{ json: {
      headers: { 'x-ak-auth': 'geheim-123' },
      query: { kunde_id: 'muster-bau', agent_typ: 'rezeption', action: 'send_sms' },
      body: { kunde_id: 'FREMDER-KUNDE', telefon: '+4917012345', textvorlage: 'x' },
    } }], env: SECRET,
  })[0].json;
  pruefe('Body kann kunde_id NICHT überschreiben', r5.kunde_id === 'muster-bau', r5);
  pruefe('flacher Payload -> params gefüllt, ohne Steuerfelder',
    r5.params.telefon === '+4917012345' && r5.params.kunde_id === undefined, r5.params);

  const r6 = lauf(HANDLER, AUTH, { items: [{ json: { headers: { 'x-ak-auth': 'x' }, body: {}, query: {} } }], env: {} })[0].json;
  pruefe('Secret gar nicht gesetzt -> 401 (fail-closed)', r6.http_code === 401, r6);

  const r7 = lauf(HANDLER, AUTH, {
    items: [{ json: { headers: { 'x-ak-auth': 'geheim-123' }, query: {}, body: { kunde_id: 'a', action: 'x' } } }], env: SECRET,
  })[0].json;
  pruefe('agent_typ fehlt -> invalid request', r7.message === 'invalid request', r7);
}

console.log('\n== Kunden-Config pruefen ==');
{
  const anfrage = { request_id: 'r1', kunde_id: 'muster-bau', agent_typ: 'rezeption', action: 'book_appointment', params: {}, fehler_code: '' };
  const zeile = {
    kunde_id: 'muster-bau', kunde_name: 'Muster Bau', aktiv: true, cal_event_type_id: '4711',
    cal_api_base: 'https://boeser-host.example/v2', sms_from: '+4915100000', crm_typ: 'sheets',
    system_endpoints: '{"auftragsstatus":"https://erp.muster.de/api"}', sms_vorlagen: '{"notfall":"x"}',
  };
  const N = { [AUTH]: anfrage };

  const r = lauf(HANDLER, 'Kunden-Config pruefen', { items: [{ json: zeile }], nodes: N, env: {} })[0].json;
  pruefe('gültige Zeile -> Config geladen', r.fehler_code === undefined || r.fehler_code === '', r.fehler_code);
  pruefe('cal_api_base NICHT aus Kundenzeile (kein Key-Leak an fremden Host)',
    r.config.cal_api_base === 'https://api.cal.com/v2', r.config.cal_api_base);
  pruefe('JSON-Felder geparst', r.config.system_endpoints.auftragsstatus === 'https://erp.muster.de/api', r.config.system_endpoints);

  const leer = lauf(HANDLER, 'Kunden-Config pruefen', { items: [{ json: {} }], nodes: N, env: {} })[0].json;
  pruefe('keine Zeile -> unknown kunde_id (kein Default-Kunde)', leer.message === 'unknown kunde_id', leer);

  const doppelt = lauf(HANDLER, 'Kunden-Config pruefen', { items: [{ json: zeile }, { json: zeile }], nodes: N, env: {} })[0].json;
  pruefe('zwei Zeilen -> config mehrdeutig', doppelt.fehler_code === 'config_mehrdeutig', doppelt);

  const inaktiv = lauf(HANDLER, 'Kunden-Config pruefen', { items: [{ json: { ...zeile, aktiv: false } }], nodes: N, env: {} })[0].json;
  pruefe('aktiv=false -> abgelehnt', inaktiv.fehler_code === 'kunde_inaktiv', inaktiv);

  const fremd = lauf(HANDLER, 'Kunden-Config pruefen', { items: [{ json: { ...zeile, kunde_id: 'anderer' } }], nodes: N, env: {} })[0].json;
  pruefe('Zeile eines anderen Kunden -> config mismatch', fremd.fehler_code === 'config_mismatch', fremd);

  const gesperrt = lauf(HANDLER, 'Kunden-Config pruefen', {
    items: [{ json: { ...zeile, erlaubte_actions: '["check_availability"]' } }], nodes: N, env: {},
  })[0].json;
  pruefe('action nicht in erlaubte_actions -> gesperrt', gesperrt.fehler_code === 'action_gesperrt', gesperrt);
}

console.log('\n== Antwort bauen (Handler) ==');
{
  const anfrage = { request_id: 'r1', start_ms: Date.now() - 120, kunde_id: 'k', agent_typ: 'a', action: 'book_appointment' };
  const N = { [AUTH]: anfrage };
  const sub = lauf(HANDLER, 'Antwort bauen', { items: [{ json: { success: true, data: { x: 1 }, message: 'ok' } }], nodes: N })[0].json;
  pruefe('Sub-Antwort wird durchgereicht', sub.success === true && sub.data.x === 1 && sub.http_code === 200, sub);

  const crash = lauf(HANDLER, 'Antwort bauen', { items: [{ json: { error: { message: 'boom' } } }], nodes: N })[0].json;
  pruefe('Sub-Absturz -> success:false, interner fehler', crash.success === false && crash.message === 'interner fehler', crash);

  const auth401 = lauf(HANDLER, 'Antwort bauen', { items: [{ json: { fehler_code: 'unauthorized', http_code: 401, message: 'unauthorized' } }], nodes: N })[0].json;
  pruefe('Auth-Fehler behält 401', auth401.http_code === 401 && auth401.success === false, auth401);

  const muell = lauf(HANDLER, 'Antwort bauen', { items: [{ json: { irgendwas: 1 } }], nodes: N })[0].json;
  pruefe('unerwartetes Item -> trotzdem valides Schema',
    muell.success === false && typeof muell.data === 'object' && typeof muell.message === 'string', muell);
}

console.log('\n== reschedule: Eingaben pruefen (der Kernbug) ==');
{
  const KTX = { config: { cal_event_type_id: '4711', kalender_typ: 'calcom' }, params: {}, kunde_id: 'k' };
  const r = lauf('05-ak-sub-reschedule_appointment.json', 'Eingaben pruefen', {
    items: [{ json: { ...KTX, from_number: '+4917012345', params: { neue_zeit: '2026-08-05T10:00:00Z', referenz: 'abc' } } }],
  })[0].json;
  pruefe('gültige ISO-Zeit -> KEIN Fehler', r.fehler === '', r.fehler);

  const r2 = lauf('05-ak-sub-reschedule_appointment.json', 'Eingaben pruefen', {
    items: [{ json: { ...KTX, params: { neue_zeit: 'morgen früh', referenz: 'abc' } } }],
  })[0].json;
  pruefe('Umgangssprache -> Fehler', r2.fehler === 'neue zeit fehlt oder ungueltig', r2.fehler);

  const r3 = lauf('05-ak-sub-reschedule_appointment.json', 'Eingaben pruefen', {
    items: [{ json: { ...KTX, config: { cal_event_type_id: '1', kalender_typ: 'google' }, params: { neue_zeit: '2026-08-05T10:00:00Z', referenz: 'a' } } }],
  })[0].json;
  pruefe('kalender_typ=google -> sauberer Abbruch', r3.fehler === 'kalender nicht unterstuetzt', r3.fehler);
}

console.log('\n== reschedule/cancel: Buchung waehlen (Identität + Mandant) ==');
{
  const datei = '06-ak-sub-cancel_appointment.json';
  const ktxBasis = { fehler: '', config: { cal_event_type_id: '4711' }, referenz: '', telefon: '', name_such: '' };
  const buchungen = (extra = {}) => ({ json: { statusCode: 200, body: { data: [
    { uid: 'BUCH-1', eventTypeId: 4711, start: '2026-08-02T08:00:00Z', attendees: [{ name: 'anna meier', phoneNumber: '+491701111111' }] },
    { uid: 'BUCH-2', eventTypeId: 4711, start: '2026-08-03T08:00:00Z', attendees: [{ name: 'anna meier', phoneNumber: '+491702222222' }] },
    ...(extra.zusatz || []),
  ] } } });

  const nurName = lauf(datei, 'Buchung waehlen', {
    items: [buchungen()], nodes: { 'Eingaben pruefen': { ...ktxBasis, name_such: 'anna meier' } },
  })[0].json;
  pruefe('nur Name genannt -> abgelehnt (fremder Termin absagbar wäre)', nurName.gefunden === false, nurName);

  const mitNummer = lauf(datei, 'Buchung waehlen', {
    items: [buchungen()], nodes: { 'Eingaben pruefen': { ...ktxBasis, telefon: '+491702222222', name_such: 'anna meier' } },
  })[0].json;
  pruefe('Anrufernummer passt -> richtige Buchung', mitNummer.gefunden === true && mitNummer.uid === 'BUCH-2', mitNummer);

  const refFalsch = lauf(datei, 'Buchung waehlen', {
    items: [buchungen()], nodes: { 'Eingaben pruefen': { ...ktxBasis, referenz: 'GIBTSNICHT', telefon: '+491702222222' } },
  })[0].json;
  pruefe('falsche Referenz -> Abbruch statt Rückfall auf Telefon', refFalsch.gefunden === false, refFalsch);

  const fremderTyp = lauf(datei, 'Buchung waehlen', {
    items: [{ json: { statusCode: 200, body: { data: [
      { uid: 'FREMD', eventTypeId: 9999, attendees: [{ phoneNumber: '+491702222222' }] },
    ] } } }],
    nodes: { 'Eingaben pruefen': { ...ktxBasis, telefon: '+491702222222' } },
  })[0].json;
  pruefe('Buchung eines anderen Betriebs -> abgelehnt', fremderTyp.gefunden === false, fremderTyp);

  const ohneTyp = lauf(datei, 'Buchung waehlen', {
    items: [{ json: { statusCode: 200, body: { data: [
      { uid: 'OHNE-TYP', attendees: [{ phoneNumber: '+491702222222' }] },
    ] } } }],
    nodes: { 'Eingaben pruefen': { ...ktxBasis, telefon: '+491702222222' } },
  })[0].json;
  pruefe('fehlende eventTypeId -> abgelehnt (fail-closed)', ohneTyp.gefunden === false, ohneTyp);

  const apiWeg = lauf(datei, 'Buchung waehlen', {
    items: [{ json: { error: { message: 'timeout' } } }],
    nodes: { 'Eingaben pruefen': { ...ktxBasis, telefon: '+491702222222' } },
  })[0].json;
  pruefe('Kalender nicht erreichbar -> sauberer Abbruch', apiWeg.gefunden === false, apiWeg);
}

console.log('\n== send_sms: Eingaben pruefen ==');
{
  const datei = '07-ak-sub-send_sms.json';
  const cfg = { sms_from: '+4915100000', twilio_account_sid: 'AC123', sms_vorlagen: { terminbestaetigung: 'Hallo {{name}}, Termin am {{zeit}}.' }, sms_prefixe: ['+49'] };

  const ok1 = lauf(datei, 'Eingaben pruefen', {
    items: [{ json: { config: cfg, params: { telefon: '0170 111 22 33', textvorlage: 'terminbestaetigung', werte: { name: 'Meier', zeit: 'Montag 9 Uhr' } } } }],
  })[0].json;
  pruefe('normale SMS -> Text gefüllt, kein Fehler',
    ok1.fehler === '' && ok1.text === 'Hallo Meier, Termin am Montag 9 Uhr.' && ok1.an === '+491701112233', ok1);

  const ausland = lauf(datei, 'Eingaben pruefen', {
    items: [{ json: { config: cfg, params: { telefon: '+15551234567', textvorlage: 'terminbestaetigung', werte: {} } } }],
  })[0].json;
  pruefe('Auslandsnummer -> abgelehnt', ausland.fehler === 'zielnummer nicht erlaubt', ausland);

  const proto = lauf(datei, 'Eingaben pruefen', {
    items: [{ json: { config: cfg, params: { telefon: '0170111', textvorlage: 'toString', werte: {} } } }],
  })[0].json;
  pruefe('Prototyp-Trick "toString" -> keine Vorlage', proto.fehler !== '' && !String(proto.text).includes('native code'), proto);

  const leerWert = lauf(datei, 'Eingaben pruefen', {
    items: [{ json: { config: cfg, params: { telefon: '0170 111 22 33', textvorlage: 'terminbestaetigung', werte: {} } } }],
  })[0].json;
  pruefe('fehlende Werte -> Platzhalter geleert, kein {{...}} im Text', !leerWert.text.includes('{{'), leerWert.text);
}

console.log('\n== check_availability: Zeitraum ==');
{
  const datei = '03-ak-sub-check_availability.json';
  const cfg = { cal_event_type_id: '4711', zeitzone: 'Europe/Berlin', kalender_typ: 'calcom' };

  const standard = lauf(datei, 'Eingaben pruefen', { items: [{ json: { config: cfg, params: {} } }] })[0].json;
  pruefe('ohne Angabe -> heute bis +14 Tage', standard.von === '2026-07-31' && standard.bis === '2026-08-14', standard);

  const dezember = lauf(datei, 'Eingaben pruefen', { items: [{ json: { config: cfg, params: { zeitraum_von: '2026-12-01' } } }] })[0].json;
  pruefe('"im Dezember?" -> Ende hängt am Start, kein Fehler',
    dezember.fehler === '' && dezember.von === '2026-12-01' && dezember.bis === '2026-12-15', dezember);

  const uebertrieben = lauf(datei, 'Eingaben pruefen', { items: [{ json: { config: cfg, params: { zeitraum_von: '2026-08-01', zeitraum_bis: '2027-08-01' } } }] })[0].json;
  pruefe('Jahresanfrage -> auf 60 Tage gedeckelt', uebertrieben.bis === '2026-09-30', uebertrieben);

  const vergangen = lauf(datei, 'Eingaben pruefen', { items: [{ json: { config: cfg, params: { zeitraum_von: '2020-01-01' } } }] })[0].json;
  pruefe('Vergangenheit -> auf heute gezogen', vergangen.von === '2026-07-31', vergangen);
}

console.log('\n== check_availability: Antwort ==');
{
  const datei = '03-ak-sub-check_availability.json';
  const N = { 'Eingaben pruefen': { fehler: '', config: { zeitzone: 'Europe/Berlin' } } };
  const antwort = lauf(datei, 'Antwort bauen', {
    items: [{ json: { statusCode: 200, body: { data: {
      '2026-08-03': [{ start: 'a1' }, { start: 'a2' }, { start: 'a3' }],
      '2026-08-04': [{ start: 'b1' }, { start: 'b2' }],
      '2026-08-05': [{ start: 'c1' }],
    } } } }], nodes: N,
  })[0].json;
  pruefe('max. 5 Zeiten, höchstens 2 pro Tag',
    antwort.data.verfuegbare_zeiten.length === 5 && antwort.data.verfuegbare_zeiten[0] === 'a1' && antwort.data.verfuegbare_zeiten[2] === 'b1', antwort.data);
  pruefe('Gesamtzahl bleibt korrekt', antwort.data.anzahl === 6, antwort.data);

  const leer = lauf(datei, 'Antwort bauen', { items: [{ json: { statusCode: 200, body: { data: {} } } }], nodes: N })[0].json;
  pruefe('keine Slots -> success:true mit leerer Liste', leer.success === true && leer.data.anzahl === 0, leer);

  const kaputt = lauf(datei, 'Antwort bauen', { items: [{ json: { statusCode: 500, body: {} } }], nodes: N })[0].json;
  pruefe('Kalender 500 -> success:false', kaputt.success === false, kaputt);
}

console.log('\n== identify_caller ==');
{
  const datei = '02-ak-sub-identify_caller.json';
  const N = (extra) => ({ 'Eingaben pruefen': { fehler: '', telefon: '+491701112233', telefon_kurz: '011122 33', config: { crm_typ: 'sheets' }, ...extra } });

  const ausfall = lauf(datei, 'Antwort bauen', {
    items: [{ json: { error: { message: 'sheet weg' } } }], nodes: N({}),
  })[0].json;
  pruefe('Sheets-Ausfall -> Fehler statt "neuer Kunde"',
    ausfall.success === false && ausfall.message === 'crm nicht erreichbar', ausfall);

  const treffer = lauf(datei, 'Antwort bauen', {
    items: [{ json: { name: 'Anna Meier', telefon: '0170 111 22 33', kundenstatus: 'bestand' } }], nodes: N({}),
  })[0].json;
  pruefe('Treffer über verschiedene Schreibweisen', treffer.data.ist_bekannt === true && treffer.data.name === 'Anna Meier', treffer.data);

  const keinTreffer = lauf(datei, 'Antwort bauen', {
    items: [{ json: { name: 'Wer Anders', telefon: '030 99999' } }], nodes: N({}),
  })[0].json;
  pruefe('kein Treffer -> ist_bekannt:false, success:true', keinTreffer.success === true && keinTreffer.data.ist_bekannt === false, keinTreffer.data);

  const keinCrm = lauf(datei, 'Antwort bauen', { items: [{ json: {} }], nodes: N({ fehler: 'kein crm konfiguriert' }) })[0].json;
  pruefe('kein CRM konfiguriert -> weich, Agent macht weiter', keinCrm.success === true && keinCrm.data.ist_bekannt === false, keinCrm);
}

console.log('\n== system_query ==');
{
  const datei = '09-ak-sub-system_query.json';
  const cfg = { system_endpoints: { auftragsstatus: 'https://erp.kunde.de/api' }, system_token_env: 'AK_SYS_MUSTER' };

  const ok1 = lauf(datei, 'Eingaben pruefen', {
    items: [{ json: { kunde_id: 'k', request_id: 'r1', config: cfg, params: { system: 'auftragsstatus', nummer: '4711', kunde_id: 'FREMD' } } }],
    env: { AK_SYS_MUSTER: 'token-xyz' },
  })[0].json;
  pruefe('bekanntes System -> Ziel gesetzt', ok1.fehler === '' && ok1.ziel === 'https://erp.kunde.de/api', ok1);
  pruefe('Token aus benannter Umgebungsvariable', ok1.system_token === 'token-xyz', ok1.system_token);
  pruefe('kunde_id aus params wird nicht durchgereicht',
    ok1.nutzlast.kunde_id === 'k' && ok1.nutzlast.params.kunde_id === undefined, ok1.nutzlast);

  const unbekannt = lauf(datei, 'Eingaben pruefen', {
    items: [{ json: { kunde_id: 'k', config: cfg, params: { system: 'lohnbuchhaltung' } } }], env: {},
  })[0].json;
  pruefe('unbekanntes System -> no system configured', unbekannt.fehler === 'no system configured', unbekannt);

  const httpZiel = lauf(datei, 'Eingaben pruefen', {
    items: [{ json: { kunde_id: 'k', config: { system_endpoints: { x: 'http://unverschluesselt.de' } }, params: { system: 'x' } } }], env: {},
  })[0].json;
  pruefe('http:// -> abgelehnt', httpZiel.fehler === 'no system configured', httpZiel);
}

console.log('\n== notify_dispatch ==');
{
  const datei = '08-ak-sub-notify_dispatch.json';
  const r = lauf(datei, 'Eingaben pruefen', {
    items: [{ json: { from_number: '+4917099', config: { dispatch_kanal: 'telegram', dispatch_ziel: '12345', kunde_name: 'Muster Bau' },
      params: { name: 'Meier', ort: 'Hauptstr 1', anliegen: 'Wasserrohrbruch' } } }],
  })[0].json;
  pruefe('Alarmtext serverseitig gebaut (keine Vorlage nötig)',
    r.fehler === '' && r.meldung.includes('Wasserrohrbruch') && r.meldung.includes('Muster Bau'), r.meldung);

  const ohne = lauf(datei, 'Eingaben pruefen', { items: [{ json: { config: {}, params: {} } }] })[0].json;
  pruefe('keine Bereitschaft konfiguriert -> klarer Fehler', ohne.fehler === 'keine bereitschaft konfiguriert', ohne);

  const smsOhneTwilio = lauf(datei, 'Eingaben pruefen', {
    items: [{ json: { config: { dispatch_kanal: 'sms', dispatch_ziel: '+4917011' }, params: {} } }],
  })[0].json;
  pruefe('SMS-Kanal ohne Twilio -> Fehler vor dem Senden', smsOhneTwilio.fehler === 'twilio nicht konfiguriert', smsOhneTwilio);
}

console.log(`\n===== ${ok} bestanden, ${fehler} fehlgeschlagen =====`);
process.exit(fehler === 0 ? 0 : 1);
