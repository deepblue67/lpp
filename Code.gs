/**
 * LPP Suivi CA — doGet()
 * Projet Apps Script « LPP Suivi CA » — copie locale de référence.
 *
 * Branches disponibles :
 *   ?                  → HISTORIQUE CA HT + Calendrier       (dashboard_ht, dashboard_moy_jour)
 *   ?type=ttc          → Ventilation CA TTC, agrégat MENSUEL (dashboard_ttc)
 *   ?type=traiteur     → Ventilation CA TTC, détail JOURNALIER, colonnes S et Y
 *                                                            (dashboard_traiteur)
 *
 * Historique :
 *   09/11/2026 — ajout de la branche `?type=traiteur` et extraction de la lecture
 *                du Calendrier dans readCalendrier(). Version précédente conservée
 *                en local sous Code_v1_avant_traiteur.gs.
 *
 * ⚠️ Un seul doGet() par projet : toute évolution REMPLACE le contenu de Code.gs,
 *    ne jamais l'ajouter comme fichier supplémentaire.
 *
 * ⚠️ Après toute modification : Ctrl+S, puis Déployer → Gérer les déploiements →
 *    crayon → Version : Nouvelle version → Déployer. L'URL publique reste identique.
 *
 * ℹ️ Tant que cette version n'est pas déployée, dashboard_traiteur.html fonctionne
 *    quand même : il bascule automatiquement sur l'export CSV de l'onglet.
 */

function doGet(e) {
  const type = (e && e.parameter && e.parameter.type) || 'historique';
  const ss = SpreadsheetApp.openById('1jh3Mce91LvENKRVGDsfAru1hRGvo7Uz1Ge2FsHYSw-k');

  /* ──────────────────────────────────────────────────────────────────────────
     NOUVEAU — type=traiteur : détail JOUR PAR JOUR de l'activité traiteur
     Colonne S (index 18) = Traiteur cuisine — total 5 magasins
     Colonne Y (index 24) = Traiteur magasins — total 5 magasins
     Colonne AL (index 37) = TOTAL GÉNÉRAL — sert à savoir si le jour est saisi
     ────────────────────────────────────────────────────────────────────────── */
  if (type === 'traiteur') {
    const ws = ss.getSheetByName('Ventilation CA TTC');
    if (!ws) return json({error:'Onglet Ventilation CA TTC introuvable'});
    const vals = ws.getDataRange().getValues();

    const MOIS_UP = {
      'JANVIER':1,'FEVRIER':2,'FÉVRIER':2,'MARS':3,'AVRIL':4,'MAI':5,'JUIN':6,
      'JUILLET':7,'AOUT':8,'AOÛT':8,'SEPTEMBRE':9,'OCTOBRE':10,'NOVEMBRE':11,
      'DECEMBRE':12,'DÉCEMBRE':12
    };
    const n = v => {
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      const s = String(v === null || v === undefined ? '' : v)
                 .replace(/ | |\s/g,'').replace(/€/g,'').replace(/,/g,'.');
      if (s === '' || s === '-' || s === '–' || s === '—') return 0;
      const f = parseFloat(s);
      return isNaN(f) ? 0 : f;
    };

    const CUIS_SITES = [13,14,15,16,17];  // N O P Q R
    const CUIS_TOT   = 18;                // S
    const MAG_SITES  = [19,20,21,22,23];  // T U V W X
    const MAG_TOT    = 24;                // Y
    const GRAND      = 37;                // AL
    // 1re colonne magasin de chacune des 6 catégories de CA : la somme donne
    // le CA TTC du jour POUR UN magasin (sert à compter ses jours travaillés).
    const CAT_STARTS = [1,7,13,19,25,31];

    const out = [];
    let cur = null;
    for (const row of vals) {
      const a = String(row[0] === null || row[0] === undefined ? '' : row[0]).trim();
      const m = /^([A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]+)\s+(\d{4})$/.exec(a.toUpperCase());
      if (m && MOIS_UP[m[1]] !== undefined) { cur = {y:parseInt(m[2],10), m:MOIS_UP[m[1]]}; continue; }
      if (!cur) continue;
      if (!/^\d{1,2}$/.test(a)) continue;               // ignore 'Jour', 'TOTAL', vides…
      const d = parseInt(a,10);
      if (d < 1 || d > 31) continue;
      if (d > new Date(cur.y, cur.m, 0).getDate()) continue;
      out.push({
        y: cur.y, m: cur.m, d: d,
        cuisine: n(row[CUIS_TOT]),
        magasin: n(row[MAG_TOT]),
        grand:   n(row[GRAND]),
        cuisineSites: CUIS_SITES.map(function(i){ return n(row[i]); }),
        magasinSites: MAG_SITES.map(function(i){ return n(row[i]); }),
        siteTotals:   [0,1,2,3,4].map(function(i){
          return CAT_STARTS.reduce(function(a,c){ return a + n(row[c+i]); }, 0);
        })
      });
    }
    return json({status:'ok', kind:'traiteur', data:out, calendrier:readCalendrier(ss)});
  }

  /* ───────────────────────── type=ttc (inchangé) ──────────────────────────── */
  if (type === 'ttc') {
    const ws = ss.getSheetByName('Ventilation CA TTC');
    if (!ws) return json({error:'Onglet Ventilation CA TTC introuvable'});
    const vals = ws.getDataRange().getValues();
    const SITES = ['Lingo','Stras','Eckbo','Schilic','Illkirch'];
    const CATS = [
      {key:'midi',             cols:[1,2,3,4,5],   tot:6},
      {key:'livraison',        cols:[7,8,9,10,11], tot:12},
      {key:'traiteur_cuisine', cols:[13,14,15,16,17], tot:18},
      {key:'traiteur_magasin', cols:[19,20,21,22,23], tot:24},
      {key:'traiteur_az',      cols:[25,26,27,28,29], tot:30},
      {key:'commande_az',      cols:[31,32,33,34,35], tot:36},
      {key:'offerts',          cols:[39,40,41,42,43], tot:44},
    ];
    const n = v => { const f=parseFloat(String(v).replace(',','.')); return isNaN(f)?0:f; };
    const rows = []; let acc = null; let skip = 0; let reading = false;
    for (const row of vals) {
      const a = String(row[0]||'').trim();
      if (/^[A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ]+\s+\d{4}$/.test(a)) {
        if (acc && acc.grandTotal > 0) rows.push(acc);
        const parts = a.split(' ');
        const mn = parts[0].charAt(0) + parts[0].slice(1).toLowerCase();
        acc = {monthYear:mn+' '+parts[1], year:parseInt(parts[1]), monthName:mn, grandTotal:0};
        CATS.forEach(c => { acc[c.key]={total:0}; SITES.forEach(s=>acc[c.key][s]=0); });
        skip=2; reading=false; continue;
      }
      if (skip>0) { skip--; if(skip===0)reading=true; continue; }
      if (!reading||!acc) continue;
      if (!a||a==='TOTAL') { if(a==='TOTAL')reading=false; continue; }
      const d=parseInt(a);
      if (!isNaN(d)&&d>=1&&d<=31) {
        CATS.forEach(c => {
          c.cols.forEach((ci,si)=>{ acc[c.key][SITES[si]]+=n(row[ci]); });
          acc[c.key].total+=n(row[c.tot]);
        });
        acc.grandTotal+=n(row[37]);
      }
    }
    if (acc && acc.grandTotal > 0) rows.push(acc);
    return json({status:'ok', data:rows});
  }

  /* ─────────────────── défaut : HISTORIQUE CA HT (inchangé) ───────────────── */
  const ws = ss.getSheetByName('HISTORIQUE CA HT');
  if (!ws) return json({error:'Onglet HISTORIQUE introuvable'});
  const vals = ws.getDataRange().getValues();
  const MOIS_FISCAL = {'octobre':0,'novembre':1,'décembre':2,'janvier':3,'février':4,'mars':5,'avril':6,'mai':7,'juin':8,'juillet':9,'août':10,'septembre':11};
  const rows = []; let yr = null;
  for (const row of vals) {
    const a=String(row[0]||'').trim(); const al=a.toLowerCase();
    if (al.startsWith('année ')) { yr=a.replace(/^[Aa]nnée\s+/,''); }
    else if (yr&&al!=='mois'&&!al.startsWith('total')&&!al.includes('historique')&&a!=='') {
      const mk=al.split(' ')[0];
      if (MOIS_FISCAL[mk]!==undefined) {
        const n=v=>{const f=parseFloat(String(v).replace(',','.'));return isNaN(f)?0:f;};
        rows.push({year:yr,mois:a,moisKey:mk,fiscalIdx:MOIS_FISCAL[mk],
          nb_jours:n(row[1]),Lingo:n(row[2]),Stras:n(row[3]),Eckbo:n(row[4]),
          Schilic:n(row[5]),Illkirch:n(row[6]),total:n(row[7]),cumul:n(row[8]),moy:n(row[9])});
      }
    }
  }
  return json({status:'ok', data:rows, calendrier:readCalendrier(ss)});
}

/** Lecture de l'onglet Calendrier → {novembre:{'2026':20}, …} */
function readCalendrier(ss) {
  const MOIS_MAP = {
    'Janvier':'janvier','Février':'février','Mars':'mars','Avril':'avril',
    'Mai':'mai','Juin':'juin','Juillet':'juillet','Août':'août',
    'Septembre':'septembre','Octobre':'octobre','Novembre':'novembre','Décembre':'décembre'
  };
  const calendrier = {};
  const calSheet = ss.getSheetByName('Calendrier');
  if (!calSheet) return calendrier;
  const calVals = calSheet.getDataRange().getValues();
  const years = calVals[0].slice(1);
  for (let i = 1; i < calVals.length; i++) {
    const moisFr  = String(calVals[i][0] || '').trim();
    const moisKey = MOIS_MAP[moisFr];
    if (!moisKey) continue;
    calendrier[moisKey] = {};
    years.forEach((y, j) => {
      const v = calVals[i][j + 1];
      if (v !== '' && v !== null && v !== undefined && !isNaN(Number(v)) && Number(v) > 0) {
        calendrier[moisKey][String(Math.round(y))] = Number(v);
      }
    });
  }
  return calendrier;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
