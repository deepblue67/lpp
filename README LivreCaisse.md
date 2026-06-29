# La Petite Pause — Projet Dashboards CA

## Vue d'ensemble

Projet de **tableaux de bord pour 5 magasins La Petite Pause**, permettant le suivi du chiffre d'affaires en temps réel depuis n'importe quel navigateur. Les données viennent d'un **Google Sheet central**, exposées par un **Apps Script** en JSON, et consommées par **3 dashboards HTML statiques** hébergés sur GitHub Pages.

**Magasins suivis :**

| Clé interne | Nom complet | Couleur |
|-------------|-------------|---------|
| `Lingo` | Lingolsheim | `#3B5998` bleu |
| `Stras` | Strasbourg | `#E84393` rose |
| `Eckbo` | Eckbolsheim | `#FF8C00` orange |
| `Schilic` | Schiltigheim | `#28A745` vert |
| `Illkirch` | Illkirch | `#8B5CF6` violet |

---

## 1. Google Sheet — Source de vérité unique

**ID :** `1jh3Mce91LvENKRVGDsfAru1hRGvo7Uz1Ge2FsHYSw-k`
**URL :** https://docs.google.com/spreadsheets/d/1jh3Mce91LvENKRVGDsfAru1hRGvo7Uz1Ge2FsHYSw-k

C'est le **point de départ de tout le projet**. Toutes les données transitent par ce Google Sheet. Les dashboards ne lisent jamais directement les fichiers locaux.

### Onglets du Google Sheet

---

#### Onglets magasins : `Lingo`, `Stras`, `Eckbo`, `Schilic`, `Illkirch`

Cinq onglets identiques en structure, un par magasin. Contiennent les **données de caisse journalières**.

**Structure interne :**
- Les données sont organisées par mois avec un en-tête de mois (ex: `JUIN`) à la ligne du mois
- Chaque jour est une ligne, identifié par son numéro (1, 2, 3…) en colonne A
- **26 colonnes de données** par ligne, de la colonne B à la colonne AA

**Mapping des 26 colonnes (B à AA) :**

| Col GS | Contenu | Type | Protégée |
|--------|---------|------|----------|
| B | Jour (numéro) | Saisie | |
| C | CAISSE TTC (total encaissé) | **Saisie** ← valeur brute de caisse, ne pas mettre de formule | |
| D | TVA 20% | Saisie | |
| E | TVA 5,5% | Saisie | |
| F | TVA 10% | Saisie | 🔒 |
| G | **CA HT** ← valeur principale utilisée dans les dashboards | Saisie | |
| H | Virement | Saisie | |
| I | **ESPECES** | Formule `=C-J-K-L-H-M-P-N-O` | 🔒 |
| J | Ticket Restaurant | Saisie | |
| K | Chèque | Saisie | |
| L | CB | Saisie | |
| M | TR2 | Saisie | |
| N | CB2 | Saisie | |
| O | Carte TR | Saisie | |
| P | Deliveroo | Saisie | |
| Q | **VIDE** ← colonne vide dans GS, n'existe pas dans le fichier xlsb source | | |
| R | Caisse | Saisie | |
| S | **FOND DE CAISSE** | Formule `=I-Q-R` | 🔒 |
| T | Fond de caisse cumulé | Saisie | 🔒 |
| U | Fond de caisse 2 | Saisie | |
| V | BQ Espèces | Saisie | |
| W | BQ Chèques | Saisie | |
| X | CONNECT | Saisie | |
| Y | **VIDE** ← colonne vide dans GS, n'existe pas dans le fichier xlsb source | | |
| Z | Libellé | Saisie | |
| AA | Montant | Saisie | |
| AB | Date référence | Saisie | |

> ⚠️ **Point critique pour la maintenance :** Les colonnes Q et Y du Google Sheet sont vides et n'ont pas d'équivalent dans le fichier Excel source (`.xlsb`). Tout script d'import doit gérer ce décalage (voir section 5 — Workflow mensuel).

> ⚠️ **Colonne C (CAISSE TTC) = saisie obligatoire.** Ne jamais y mettre une formule comme `=H+I+J+...` — cela crée une dépendance circulaire avec la colonne I (ESPECES) qui est calculée à partir de C. La colonne C est la valeur brute lue sur la caisse.

> 🔒 **Colonnes protégées (mode strict)** sur les 5 onglets magasins : **F, I, S, T**. Seul le propriétaire du GSheet peut les modifier. Les formules des colonnes I et S ont été ajoutées via `fixColonnesICS.gs`.

---

#### Onglet `SYNTHESE CA HT`

> 🔒 **Onglet entièrement protégé (mode strict).** Seul le propriétaire peut modifier. Protégé via `protectFormules.gs`.

---

#### Onglet `HISTORIQUE CA HT`

> 🔒 **Onglet entièrement protégé (mode strict).** Seul le propriétaire peut modifier. Protégé via `protectFormules.gs`.

**Rôle :** Agrégat mensuel par magasin. C'est **l'onglet source des 3 dashboards**. Il est lu à chaque chargement d'un dashboard via l'Apps Script.

**Structure :**
- Organisé par **année fiscale** (octobre → septembre), chaque année précédée d'une ligne `Année XXXX-XXXX`
- Une ligne par mois avec les colonnes suivantes :

| Col | Contenu |
|-----|---------|
| A | Nom du mois (ex: `Juin 2026`) |
| B | `nb_jours` — nombre de jours travaillés avec CA enregistré |
| C | CA HT Lingolsheim |
| D | CA HT Strasbourg |
| E | CA HT Eckbolsheim |
| F | CA HT Schiltigheim |
| G | CA HT Illkirch |
| H | Total CA HT (tous magasins) |
| I | Cumul depuis début d'année fiscale |
| J | Moyenne journalière (tous magasins) |

> ℹ️ Le `nb_jours` reflète le nombre de jours **déjà saisis** dans le mois, pas le total prévu. En cours de mois, il augmente à chaque mise à jour.

---

#### Onglet `Ventilation CA TTC`

**Rôle :** Détail du CA TTC par **catégorie d'activité** et par magasin, mois par mois. Utilisé exclusivement par `dashboard_ttc.html`.

**Structure :**
- Organisé par mois avec un en-tête `MOIS ANNÉE` en majuscules (ex: `JUIN 2026`)
- 2 lignes de sous-en-têtes après l'en-tête de mois, puis les lignes journalières
- Une ligne par jour, avec 43 colonnes de données (7 catégories × 5 magasins + totaux + grand total)

**7 catégories (dans l'ordre des colonnes) :**

| Catégorie | Clé | Couleur dashboard |
|-----------|-----|------------------|
| Total midi | `midi` | `#4472C4` bleu |
| Livraison | `livraison` | `#70AD47` vert |
| Traiteur cuisine | `traiteur_cuisine` | `#ED7D31` orange |
| Traiteur magasin | `traiteur_magasin` | `#9966CC` violet |
| Traiteur AZ | `traiteur_az` | `#FFC000` jaune |
| Commande AZ | `commande_az` | `#FF6666` rouge |
| Offerts | `offerts` | `#A6A6A6` gris |

**Ordre des colonnes dans le Google Sheet :**

| Colonnes | Contenu | Protégée |
|----------|---------|----------|
| B–F | Total midi (Lingo, Stras, Eckbo, Schilic, Illkirch) | |
| G | Total midi | 🔒 Formule |
| H–L | Livraison (Lingo, Stras, Eckbo, Schilic, Illkirch) | |
| M | Total livraison | 🔒 Formule |
| N–R | Traiteur cuisine (Lingo, Stras, Eckbo, Schilic, Illkirch) | |
| S | Total traiteur cuisine | 🔒 Formule |
| T–X | Traiteur magasin (Lingo, Stras, Eckbo, Schilic, Illkirch) | |
| Y | Total traiteur magasin | 🔒 Formule |
| Z–AD | Traiteur AZ (Lingo, Stras, Eckbo, Schilic, Illkirch) | |
| AE | Total traiteur AZ | 🔒 Formule |
| AF–AJ | Commande AZ (Lingo, Stras, Eckbo, Schilic, Illkirch) | |
| AK | Total commande AZ | 🔒 Formule |
| AL | **TOTAL GÉNÉRAL** = `G+M+S+Y+AE+AK` (exclut les Offerts) | 🔒 Formule |
| AM | Libellé "Offerts" | |
| AN–AR | Offerts (Lingo, Stras, Eckbo, Schilic, Illkirch) | |
| AS | Total offerts | 🔒 Formule |

> ℹ️ **Restructuration juin 2026 :** Le bloc Offerts a été déplacé après le TOTAL GÉNÉRAL. Avant : AL–AQ = Offerts, AR = TOTAL GÉNÉRAL. Après : AL = TOTAL GÉNÉRAL (sans Offerts), AM = libellé, AN–AS = Offerts. Le TOTAL GÉNÉRAL n'inclut **pas** les Offerts.

> 🔒 **Colonnes protégées (mode strict)** sur l'onglet Ventilation CA TTC : **G, M, S, Y, AE, AK, AQ, AR**.

---

#### Onglet `Calendrier`

**Rôle :** Référentiel des **jours travaillés prévus** par mois et par année. Permet de calculer dans `dashboard_moy_jour.html` le bloc "CA/j à réaliser" en fin de mois.

**Structure (Option A — tableau croisé) :**

| Mois | 2024 | 2025 | 2026 | 2027 |
|------|------|------|------|------|
| Janvier | | 21 | 23 | |
| Février | | 20 | | |
| … | | | | |
| Juin | | **20** | **21** | |
| … | | | | |

> ⚠️ **À maintenir manuellement en début de mois.** Tous les magasins partagent le même calendrier. Si une cellule est vide pour un mois/année, le dashboard affiche "Renseigner l'onglet Calendrier".

**Valeur pré-remplie connue :** Juin 2025 = 20 jours (source : `nb_jours` N-1 visible dans le dashboard).

---

## 2. Apps Script — Backend JSON

**Projet Apps Script :** "LPP Suivi CA"
**URL déployée :** `https://script.google.com/macros/s/AKfycbycKoHGdiUe0MREknK8zrduuIou2yqfRMyLo8MSEPN0xxe4F4W3m0w23Y1dT-of9PBU/exec`

Cette URL est **identique pour les 3 dashboards**. Le paramètre `type` détermine quelles données sont retournées.

### Fichiers dans l'éditeur Apps Script

| Fichier | Rôle | Statut |
|---------|------|--------|
| `Code.gs` | Fonction `doGet()` — sert les données aux dashboards | **Actif, à modifier si évolution** |
| `histo.gs` | Fonctions complémentaires (historique) | Actif |
| `updateJuin2026.gs` | Import Juin 2026 dans les 7 onglets | ✅ Déjà exécuté — ne pas relancer |
| `createCalendrier.gs` | Création de l'onglet Calendrier | ✅ Déjà exécuté — ne pas relancer |

### Fonctionnement de `doGet()` (Code.gs)

**Appel sans paramètre (ou `type=historique`) :**
- Lit l'onglet `HISTORIQUE CA HT`
- Lit l'onglet `Calendrier`
- Retourne `{ status:'ok', data: [...], calendrier: {...} }`
- Utilisé par : `dashboard_moy_jour.html` et `dashboard_ht.html`

**Appel avec `?type=ttc` :**
- Lit l'onglet `Ventilation CA TTC`
- Retourne `{ status:'ok', data: [...] }`
- Utilisé par : `dashboard_ttc.html`

### Structure JSON retournée — branche historique

```json
{
  "status": "ok",
  "data": [
    {
      "year": "2025-2026",
      "mois": "Juin 2026",
      "moisKey": "juin",
      "fiscalIdx": 8,
      "nb_jours": 9,
      "Lingo": 10239.26,
      "Stras": 10343.70,
      "Eckbo": 15459.83,
      "Schilic": 20459.65,
      "Illkirch": 15402.63,
      "total": 71905.07,
      "cumul": 123456.00,
      "moy": 7989.45
    }
  ],
  "calendrier": {
    "juin":    { "2025": 20, "2026": 21 },
    "janvier": { "2025": 21, "2026": 22 }
  }
}
```

> **`moisKey`** : nom du mois en minuscules sans espace (ex: `juin`, `février`). Sert de clé de jointure entre les données et le Calendrier.
> **`fiscalIdx`** : 0=octobre, 1=novembre, …, 8=juin, …, 11=septembre. Sert au tri fiscal.

### Structure JSON retournée — branche TTC

```json
{
  "status": "ok",
  "data": [
    {
      "monthYear": "Juin 2026",
      "year": 2026,
      "monthName": "Juin",
      "grandTotal": 87654.32,
      "midi":             { "Lingo": 520.81, "Stras": 1014.96, ..., "total": 5732.03 },
      "livraison":        { "Lingo": 500.80, ..., "total": 3236.09 },
      "traiteur_cuisine": { ... },
      "traiteur_magasin": { ... },
      "traiteur_az":      { ... },
      "commande_az":      { ... },
      "offerts":          { ... }
    }
  ]
}
```

### Redéployer après modification de Code.gs

> ⚠️ **Obligatoire après toute modification.** Modifier et sauvegarder sans redéployer n'a aucun effet sur l'URL publique.

1. Sauvegarder (Ctrl+S)
2. **Déployer → Gérer les déploiements**
3. Icône crayon → **Modifier**
4. Version : **Nouvelle version**
5. **Déployer** — l'URL reste identique

---

## 3. Dashboards HTML

**Dépôt GitHub :** https://github.com/deepblue67/lpp
**GitHub Pages :** https://deepblue67.github.io/lpp/

3 fichiers HTML autonomes — aucun framework, aucune dépendance serveur. Chaque fichier contient son propre CSS, son propre JavaScript, et fetchent directement l'Apps Script URL au chargement.

**Dépendances communes (CDN) :**
- Google Fonts Inter : `fonts.googleapis.com`
- Chart.js 4.4.0 : `cdn.jsdelivr.net/npm/chart.js@4.4.0`

---

### `dashboard_moy_jour.html` — Suivi CA HT Moy/Jour

**URL publique :** https://deepblue67.github.io/lpp/dashboard_moy_jour.html
**Source Apps Script :** `?` (sans paramètre → type=historique)
**Données utilisées :** `HISTORIQUE CA HT` + `Calendrier`

**Objectif :** Suivre l'avancement du mois en cours pour chaque magasin, comparer à l'année N-1, et savoir quel CA journalier est nécessaire pour atteindre l'objectif.

#### Filtre

- **Période** : 6 / 12 / 18 / 24 derniers mois (glissants depuis aujourd'hui)

#### Structure d'un bloc magasin

Chaque magasin est affiché dans un bloc indépendant avec deux panneaux :

**Panneau gauche (270px) — Jauge + métriques**

_En-tête :_
- Nom du magasin + point coloré
- Mois en cours + badge "X jours travaillés (N)"
- Badge "Xj N-1" (référence même mois année précédente)

_Jauge de progression (SVG) :_
- Style compteur segmenté, 14 segments couleur rouge→orange→jaune→vert
- Plage 0% à 150% (100% = objectif atteint, marqué par une ligne blanche pointillée)
- Badge pourcentage en HTML (overlay sur le SVG) avec infobulle CSS au survol

_6 métriques avec infobulles ℹ :_

| Métrique | Formule | Comportement visuel |
|----------|---------|---------------------|
| **% badge jauge** | `CA réel N ÷ Objectif N × 100` | Rouge<100%, vert≥100% |
| **Moy/j N-1** | `CA HT mois N-1 ÷ nb_jours N-1` | Fond bleu pâle |
| **Moy/j N** | `CA HT mois N ÷ nb_jours N` | Fond bleu pâle |
| **Objectif N** | `Moy/j N-1 × nb_jours N` | Fond + bordure couleur du magasin |
| **CA réel N** | Source : HISTORIQUE CA HT | Fond bleu pâle |
| **Écart vs objectif** | `CA réel N − Objectif N` (€ et %) | Fond vert si positif, rouge si négatif |

_Bloc "CA/j à réaliser" (fond bleu marine) :_

| Donnée | Source |
|--------|--------|
| Objectif fin de mois | `Moy/j N-1 × total jours prévus` (onglet Calendrier) |
| CA manquant | `Objectif fin de mois − CA réel N` |
| Jours restants | `total jours prévus (Calendrier) − nb_jours N` |
| **CA/j nécessaire** | `CA manquant ÷ jours restants` |

États possibles du bloc :
- Valeur affichée si Calendrier renseigné + données disponibles
- "Renseigner l'onglet Calendrier" si le mois est absent du Calendrier
- "Mois terminé" si jours restants ≤ 0
- "Données insuffisantes" si N-1 ou CA réel manquant

**Panneau droit — Graphique historique**

- Barres ou courbes (toggle)
- CA total ou Moy/jour (toggle)
- N-1 en grisé clair (référence), N en couleur du magasin
- Badges % N vs N-1 au-dessus de chaque barre : vert ≥+2%, rouge ≤-2%, orange entre
- Tooltip au survol : CA total, jours travaillés, moy/jour, objectif, écart N vs N-1

#### Variables JavaScript clés

```javascript
const APPS_SCRIPT_URL = '...'; // URL Apps Script
let rawData = [];              // Données HISTORIQUE CA HT enrichies
let calendrier = {};           // { "juin": { "2026": 21 }, ... }
let CHARTS = {};               // Instances Chart.js par magasin
```

#### Fonctions principales

| Fonction | Rôle |
|----------|------|
| `loadData()` | Fetch Apps Script, stocke rawData et calendrier, appelle applyFilters() |
| `enrich(data)` | Ajoute calYear, monthNum, sortKey à chaque ligne |
| `buildMonthSlots(n)` | Génère n sortKeys consécutifs jusqu'au mois courant |
| `renderAll(n)` | Orchestre le rendu de tous les magasins |
| `buildBlock(site,...)` | Génère le HTML d'un bloc magasin (jauge + métriques + graphique) |
| `makeGaugeSVG(pct, color)` | Génère la jauge SVG + badge HTML overlay |
| `renderChart(site,...)` | Génère le graphique Chart.js d'un magasin |

---

### `dashboard_ht.html` — Analyse CA HT

**URL publique :** https://deepblue67.github.io/lpp/dashboard_ht.html
**Source Apps Script :** `?` (sans paramètre → type=historique)
**Données utilisées :** `HISTORIQUE CA HT` uniquement (n'utilise pas le Calendrier)

**Objectif :** Analyse approfondie du CA HT sur plusieurs années fiscales, avec comparaisons inter-années, classements et tableaux détaillés.

#### Filtres

- **Magasins** : multi-sélection (tous par défaut)
- **Années fiscales** : multi-sélection (2024-25 et 2025-26 présélectionnées par défaut)
- Barre de filtres actifs affichée si sélection partielle

#### Contenu du dashboard

**5 KPI cards :**

| KPI | Calcul |
|-----|--------|
| CA HT Total | Somme de tous les CA sur la période filtrée |
| Meilleur mois | Mois avec le CA total le plus élevé |
| Moy/jour | CA total ÷ total jours travaillés (pondérée) |
| Évolution | % entre la dernière et l'avant-dernière année |
| Mois analysés | Nombre de mois dans la sélection |

**8 graphiques :**

| Graphique | Type | Description |
|-----------|------|-------------|
| Évolution mensuelle par année fiscale | Barres ou courbes (toggle) | Même mois comparés d'une année à l'autre (Octobre→Septembre) |
| Évolution chronologique | Courbes | CA HT par magasin sur toute la période, vue linéaire |
| Répartition par magasin | Donut | Part de CA HT cumulé par magasin |
| Jours travaillés par mois | Barres groupées | nb_jours par mois comparé entre années |
| Moy/jour par mois | Courbes | CA HT ÷ nb_jours par mois et par année |
| Progression cumulée | Courbes aire | Cumul CA HT d'octobre à septembre par année |
| Variation N vs N-1 (%) | Courbes | Écart % entre chaque mois et le même mois N-1 |
| Évolution moy/jour | Courbes | Moy/jour par mois et par année |

**4 tableaux :**

| Tableau | Description |
|---------|-------------|
| Classement des magasins | CA HT total + barre relative + rang médaille |
| Top 10 meilleurs mois | Classement des mois avec le plus haut CA |
| Synthèse moy/jour | Moy/jour par mois et par année, avec badge % évolution |
| Tableau détaillé | CA HT mensuel par année fiscale + évolution % vs N-1 |
| Analyse par magasin | CA HT + jours + moy/jour par magasin, une table par année |

#### Années fiscales connues

`['2020-21','2021-22','2022-23','2023-24','2024-25','2025-26']`

**Couleurs par année :**

| Année | Couleur |
|-------|---------|
| 2020-21 | `#AED6F1` bleu clair |
| 2021-22 | `#82E0AA` vert clair |
| 2022-23 | `#FAD7A0` orange clair |
| 2023-24 | `#D7BDE2` violet clair |
| 2024-25 | `#F9E79F` jaune |
| 2025-26 | `#F1948A` rose |

---

### `dashboard_ttc.html` — Ventilation CA TTC

**URL publique :** https://deepblue67.github.io/lpp/dashboard_ttc.html
**Source Apps Script :** `?type=ttc`
**Données utilisées :** `Ventilation CA TTC` uniquement

**Objectif :** Analyser la répartition du CA TTC par type d'activité (midi, livraison, traiteur…) et par magasin.

#### Filtres

- **Magasins** : multi-sélection
- **Mois/Année** : multi-sélection (ex: "Juin 2026", "Mai 2026"…)
- **Activité** : multi-sélection des 7 catégories

#### Contenu du dashboard

**5 KPI cards :**

| KPI | Calcul |
|-----|--------|
| CA TTC Total | Somme sur la période et activités filtrées |
| Meilleur mois | Mois avec le CA TTC le plus élevé |
| Activité dominante | Catégorie avec le CA total le plus élevé |
| Magasin leader | Magasin avec le CA total le plus élevé |
| Nb activités actives | Nombre de catégories dans la sélection |

**4 graphiques :**

| Graphique | Type | Description |
|-----------|------|-------------|
| Évolution mensuelle par activité | Barres groupées ou empilées (toggle) | CA TTC mensuel par catégorie |
| Évolution par magasin | Courbes | CA TTC mensuel par magasin |
| Répartition par magasin | Donut | Part de CA TTC par magasin |
| Répartition par activité | Donut | Part de chaque catégorie dans le total |

**4 tableaux :**

| Tableau | Description |
|---------|-------------|
| Classement des activités | CA TTC total par catégorie + barre relative |
| Mois × Activité | CA TTC mensuel par catégorie + % du total du mois |
| Mois × Magasin | CA TTC mensuel par magasin |
| Matrice Magasin × Activité | Croisement magasin/activité sur toute la période |

---

## 4. Fichiers locaux de travail

Tous dans `C:\Users\cdesmottes\Downloads\20260612\`

| Fichier | Type | Rôle | État |
|---------|------|------|------|
| `LIVRE CAISSE 2025-2026.xlsb` | Excel binaire | Source des données de caisse mensuelle | Fichier source mensuel |
| `gen_script.py` | Python | Lit `stores_all.json` → génère `updateJuin2026.gs` | Réutiliser chaque mois |
| `stores_all.json` | JSON | Données 5 magasins extraites du xlsb, 26 valeurs/jour | Intermédiaire Python |
| `stores_juin2026.json` | JSON | Version partielle (archive) | Archive |
| `stores_full_juin2026.json` | JSON | Version complète (archive) | Archive |
| `store_data_block.txt` | Texte | Bloc brut (archive) | Archive |
| `updateJuin2026.gs` | Apps Script | Import Juin 2026 dans les 7 onglets GS | ✅ Exécuté — ne pas relancer |
| `updateJuin2026_J12_25.gs` | Apps Script | Import Juin 2026 jours 12–25 (5 magasins + Ventilation CA TTC) | ✅ Exécuté — ne pas relancer |
| `createCalendrier.gs` | Apps Script | Création de l'onglet Calendrier | ✅ Exécuté — ne pas relancer |
| `fixColonnesICS.gs` | Apps Script | Fige la colonne C en valeur, ajoute formules I et S sur tous les mois | ✅ Exécuté — ne pas relancer |
| `fixProtectMagasins.gs` | Apps Script | Corrige les protections des 5 onglets magasins (cols F, I, S, T) | ✅ Exécuté — relancer si protections perdues |
| `protectFormules.gs` | Apps Script | Protège SYNTHESE CA HT, HISTORIQUE CA HT et cols G,M,S,Y,AE,AK,AQ,AR de Ventilation CA TTC | ✅ Exécuté — relancer si protections perdues |
| `restructureVentilationTTC.gs` | Apps Script | Déplace le bloc Offerts après TOTAL GÉNÉRAL dans Ventilation CA TTC | ✅ Exécuté — ne pas relancer |
| `fixFormatOfferts.gs` | Apps Script | Corrige le formatage du bloc Offerts (AM-AS) après restructuration | ✅ Exécuté — relancer si formatage perdu |
| `Code.gs` | Apps Script | Copie locale du doGet() de Apps Script | Référence pour maintenance |
| `snippet_doGet_calendrier.gs` | Apps Script | Archive du snippet Calendrier ajouté à doGet() | Référence uniquement |
| `dashboard_moy_jour.html` | HTML | Dashboard principal Moy/Jour | Déployer sur GitHub Pages |
| `dashboard_ht.html` | HTML | Dashboard Analyse CA HT | Déployer sur GitHub Pages |
| `dashboard_ttc.html` | HTML | Dashboard Ventilation CA TTC | Déployer sur GitHub Pages |
| `README.md` | Markdown | Ce fichier de documentation | À maintenir |

---

## 5. Workflow mensuel de mise à jour des données

À faire chaque fin de mois quand les données de caisse sont disponibles.

### Prérequis

```bash
pip install pyxlsb
```

### Étape 1 — Extraire les données du fichier .xlsb

Le fichier source : `LIVRE CAISSE 2025-2026.xlsb`

**Structure des onglets magasins dans le xlsb :**
- En-tête du mois (ex: `JUIN`) : ligne 297
- Données journalières : à partir de la ligne 301
- Colonnes utiles : 1 à 26 (avec décalages vs GS — voir ci-dessous)

**⚠️ Décalage critique xlsb → Google Sheet :**

```
xlsb cols 1–15  → GS cols B–P   (identique)
xlsb col 16     → IGNORÉE       (colonne Q vide dans GS, n'existe pas dans xlsb)
xlsb cols 17–23 → GS cols R–X
                  GS col Y      INSÉRER '' (colonne vide GS, absente dans xlsb)
xlsb cols 24–26 → GS cols Z–AB
```

**Code Python de mapping dans gen_script.py :**
```python
vals  = [fv(c) for c in range(1, 16)]   # GS B-P  (15 valeurs)
vals += [fv(c) for c in range(17, 24)]  # GS R-X  (7 valeurs, skip col 16 xlsb)
vals += ['']                             # GS Y    (vide GS)
vals += [fv(c) for c in range(24, 27)]  # GS Z-AB (3 valeurs)
# Total : 26 valeurs → GS colonnes B à AA
```

### Étape 2 — Générer le script Apps Script

```bash
cd C:\Users\cdesmottes\Downloads\20260612
python gen_script.py
```

Génère `updateJuillet2026.gs` (adapter le nom du fichier dans `gen_script.py`).

### Étape 3 — Exécuter le script dans Apps Script

1. Ouvrir le Google Sheet → **Extensions → Apps Script**
2. Créer un nouveau fichier `.gs` (ex: `updateJuillet2026.gs`)
3. Coller le contenu généré
4. Sélectionner la fonction du script → **Exécuter**
5. Vérifier le **Journal d'exécution** :
   - `OK Lingo : X jours mis à jour`
   - `OK Stras : X jours mis à jour`
   - `OK HISTORIQUE CA HT ligne XX`
   - `OK Ventilation CA TTC : X jours mis à jour`
   - `=== TERMINÉ ===`

Le script met à jour **7 onglets** :
- 5 onglets magasins (données journalières cols B–AA)
- `HISTORIQUE CA HT` (agrégat mensuel)
- `Ventilation CA TTC` (détail par catégorie)

### Étape 4 — Mettre à jour l'onglet Calendrier

Dans l'onglet `Calendrier` du Google Sheet, renseigner le nombre de jours travaillés **prévus** pour le nouveau mois.

### Étape 5 — Actualiser les dashboards

Cliquer sur **↻ Actualiser** dans chaque dashboard. Les données apparaissent immédiatement.

> ℹ️ Aucun redéploiement Apps Script nécessaire si seules les données ont changé. Le redéploiement n'est nécessaire que si `Code.gs` est modifié.

---

## 6. Points d'attention pour la maintenance

### ⚠️ Mapping colonnes xlsb ↔ GS — le piège principal

Deux colonnes créent un décalage entre le fichier Excel local et le Google Sheet :
1. **Col 16 du xlsb (Q dans xlsb) est vide** et **n'existe pas dans GS** → à sauter dans l'extraction
2. **Col Y du GS est vide** et **n'existe pas dans xlsb** → insérer `''` à cette position

Si ce mapping est mal appliqué, toutes les colonnes à partir de R ou Y seront décalées **sans erreur apparente** — les données s'écrivent mais dans les mauvaises colonnes. Toujours vérifier 2-3 colonnes après la mise à jour.

### ⚠️ Scripts one-shot — ne jamais relancer

`updateJuin2026.gs`, `updateJuin2026_J12_25.gs`, `createCalendrier.gs`, `fixColonnesICS.gs` et `restructureVentilationTTC.gs` ont déjà été exécutés. Les relancer écraserait des données existantes ou re-restructurerait des colonnes déjà en place. Pour un nouveau mois, créer un nouveau fichier (ex: `updateJuillet2026.gs`).

### ⚠️ Colonne C (CAISSE TTC) — ne jamais mettre de formule

La colonne C des onglets magasins est une **valeur saisie**. Si on y met une formule du type `=H+I+J+...`, cela crée une dépendance circulaire avec la colonne I (ESPECES = `=C-J-K-L-H-M-P-N-O`). Le GSheet affiche alors `#REF!` sur toutes les lignes. Corriger en restaurant une version précédente via **Fichier → Historique des versions**.

### ℹ️ Protections — récapitulatif

| Onglet | Ce qui est protégé | Script |
|--------|-------------------|--------|
| Lingo, Stras, Eckbo, Schilic, Illkirch | Colonnes **F, I, S, T** | `fixProtectMagasins.gs` |
| SYNTHESE CA HT | Onglet entier | `protectFormules.gs` |
| HISTORIQUE CA HT | Onglet entier | `protectFormules.gs` |
| Ventilation CA TTC | Colonnes **G, M, S, Y, AE, AK, AQ, AR** | `protectFormules.gs` |

Protection en mode **strict** : les non-propriétaires reçoivent un message de blocage et ne peuvent pas modifier.

### ⚠️ Redéploiement Apps Script obligatoire après modification de Code.gs

Toute modification de `Code.gs` dans l'éditeur Apps Script **doit être suivie d'un nouveau déploiement** (nouvelle version). Sans ça, l'URL publique continue de servir l'ancienne version.

### ℹ️ Onglet Calendrier — maintenance mensuelle

Renseigner le Calendrier **avant** la fin du mois pour que le bloc "CA/j à réaliser" soit actif. La valeur représente le nombre total de jours travaillés **prévus** pour le mois entier (pas seulement les jours déjà écoulés).

### ℹ️ N-1 absent = jauge vide

Si l'onglet `HISTORIQUE CA HT` ne contient pas de données pour le même mois de l'année N-1, la jauge, l'Objectif N, l'Écart et le CA/j à réaliser affichent `—`. Les données historiques doivent remonter au moins à l'année précédente pour que le dashboard soit fonctionnel.

### ℹ️ nb_jours évolue en cours de mois

Le champ `nb_jours` dans `HISTORIQUE CA HT` représente le nombre de jours **déjà saisis**, pas le total prévu. Il augmente à chaque mise à jour des données. L'Objectif N dans le dashboard est donc un "objectif glissant" qui évolue avec le nombre de jours travaillés, pas un objectif fixe de fin de mois. C'est le Calendrier qui fournit la cible fixe de fin de mois.

### ℹ️ Accès public Apps Script (CORS)

Le `doGet()` est déployé avec accès **"Tout le monde"** (anonyme). C'est nécessaire pour que les dashboards HTML puissent le fetcher sans authentification. Ne pas restreindre l'accès aux utilisateurs connectés — les dashboards cessent de fonctionner.

---

## 7. Évolutions futures possibles

- **Alertes** : envoyer un email automatique si le CA/j nécessaire dépasse un seuil défini
- **Objectif personnalisé** : permettre de saisir un objectif manuel par mois, indépendant du calcul N-1
- **Dashboard consolidé** : vue globale tous magasins sur une seule page avec une jauge synthétique
- **Prévision fin de mois** : projeter le CA total si le rythme Moy/j N se maintient (extrapolation linéaire)
- **Comparaison N vs N-2** : ajouter une deuxième référence historique
- **Mobile** : la grille 270px + chart est responsive à partir de 1000px, à améliorer pour smartphone
- **Export PDF** : bouton d'impression formatée pour les réunions de direction

---

*Dernière mise à jour : 29 juin 2026*
*Magasins : Lingolsheim · Strasbourg · Eckbolsheim · Schiltigheim · Illkirch*
