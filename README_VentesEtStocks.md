# La Petite Pause — Documentation technique du projet CRM/Dashboard

> Document de référence pour la maintenance et l'évolution du projet.
> Rédigé en juin 2026 après audit et correction du bug "perte du vendredi".

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Inventaire des fichiers](#2-inventaire-des-fichiers)
3. [Architecture des données](#3-architecture-des-données)
4. [Le Dashboard HTML](#4-le-dashboard-html)
5. [Les scripts Google Apps Script](#5-les-scripts-google-apps-script)
6. [Problèmes rencontrés et solutions appliquées](#6-problèmes-rencontrés-et-solutions-appliquées)
7. [Points d'attention pour la maintenance](#7-points-dattention-pour-la-maintenance)
8. [Procédures utiles](#8-procédures-utiles)
9. [Pistes d'évolution](#9-pistes-dévolution)

---

## 1. Vue d'ensemble

Le projet "La Petite Pause" est un système de reporting multi-magasins composé de :

- **5 fichiers Google Sheets "magasin"** — un par franchise, saisi manuellement par les équipes
- **1 fichier Google Sheets central** ("lapetitepause") — agrège les données de tous les magasins via `IMPORTRANGE`
- **1 fichier Google Sheets "Transferts"** — trace les échanges de produits entre magasins
- **1 dashboard HTML** (`dashboard_ventes_stock.html`) — visualisation interactive, hébergeable localement ou via GitHub Pages
- **Plusieurs scripts Google Apps Script** — setup de l'architecture, corrections, déclencheurs, et API pour le dashboard

### Flux de données

```
[Magasin 1..5] ──IMPORTRANGE──► [Onglets _FR_0.._FR_4 (cachés)]
                                         │
                                         ▼
                               [Onglets mensuels (Janvier…Décembre)]
                                         │
                                         ▼
                               [Onglet DATA (export plat)]
                                         │
                              Apps Script doGet()
                                         │
                               [Dashboard HTML]
```

---

## 2. Inventaire des fichiers

### Fichiers Google Sheets

| Rôle | Nom | ID Spreadsheet |
|------|-----|----------------|
| Fichier central | La Petite Pause | `1bHK0dRN5A_ELfqCTOFa5fpdSZlqAO9P-VwUb06gZLLc` |
| Magasin Lingolsheim | — | `1JA5s-FXxLLA8j0B329I_3Jhajb07qlHxr2Lf-q7u5kQ` |
| Magasin Strasbourg | — | `11toAvOPl-0aQ5AIPYVUfcblJsmY8FOcs44i0x9RtKCM` |
| Magasin Eckbolsheim | — | `1kFTMcvQRjEGtRCfPLw0jCLBWEzodPHI0Zqg5yP3DfGg` |
| Magasin Schiltigheim | — | `1KR4ntgkx5KGknwe4aLooDm5rRjnAJR4yyP9IN4Jjq_A` |
| Magasin Illkirch | — | `1mpnyMH7DWUyKpJ5cr_93T-HkMMU-NZKYMnwim4cTTSY` |
| Transferts inter-magasins | Registre Transferts | `1HE_bXUlYGXAgbzuNNnjkZN--ryx49SiSrqgm4D7Sk2w` |

### Fichiers scripts (dans le projet Apps Script du fichier central)

| Fichier | Rôle | État |
|---------|------|------|
| `centralimportange.gs` | Setup complet de l'architecture IMPORTRANGE | Actif — NE PAS relancer sans précaution |
| `fix_perte_vendredi.gs` | Audit et correction ciblée des formules `_FR_x` | Actif — outil de maintenance |
| `declencheur.gs` | Trigger sur le fichier Transferts | Actif |
| `Vendredi HS.gs` | Ancienne correction partielle (uniquement `_FR_3`) | Hors service / obsolète |

### Fichiers locaux / GitHub

| Fichier | Rôle |
|---------|------|
| `dashboard_ventes_stock.html` | Dashboard interactif tout-en-un |

---

## 3. Architecture des données

### 3.1 Structure des fichiers magasin

Chaque fichier magasin contient **12 onglets mensuels** nommés exactement `Janvier`, `Février`, `Mars`, `Avril`, `Mai`, `Juin`, `Juillet`, `Août`, `Septembre`, `Octobre`, `Novembre`, `Décembre`.

Chaque onglet mensuel du magasin couvre la plage `A1:AA50` (27 colonnes × 50 lignes).

La colonne **AA** (colonne 27) correspond à la **perte du vendredi** (PDJ).

### 3.2 Structure du fichier central

#### Onglets cachés de staging `_FR_0` à `_FR_4`

Un onglet caché par franchise (ordre : Lingolsheim=0, Strasbourg=1, Eckbolsheim=2, Schiltigheim=3, Illkirch=4).

Chaque onglet `_FR_x` contient **12 blocs IMPORTRANGE** empilés (un par mois), chaque bloc important `MoisName!A1:AA50` depuis le fichier magasin correspondant.

La taille d'un bloc = 50 lignes (`STAGING_BLOCK = 50`).

Bloc `mi` (0=Janvier) commence à la ligne : `mi * 50 + 1`.

```
_FR_0!A1:AA50    → Janvier  du magasin Lingolsheim
_FR_0!A51:AA100  → Février  du magasin Lingolsheim
...
_FR_0!A551:AA600 → Décembre du magasin Lingolsheim
```

#### Onglets mensuels (Janvier → Décembre)

Chaque onglet mensuel du fichier central référence les cellules des `_FR_x` via des formules directes `='_FR_x'!<col><row>`.

**Constantes structurelles clés** (définies dans `centralimportange.gs`) :

```javascript
WSR = [8, 45, 82, 119, 156]   // Week Start Rows — ligne de début de chaque semaine
RPF = 7                         // Rows Per Franchise — lignes par magasin par semaine
DAY_COL_STARTS = [3,8,13,18,23] // Colonnes de départ Stock pour Lundi→Vendredi (C,H,M,R,W)
```

**Structure d'une ligne par magasin et par jour :**

| Offset | Colonne dans l'onglet mensuel | Données |
|--------|-------------------------------|---------|
| dc+0 | Stock | Stock initial |
| dc+1 | Vente | Ventes du jour |
| dc+2 | Reste | Stock restant |
| dc+3 | CmdJ+1 | Commande pour le lendemain |
| dc+4 | Perte | Pertes (colonne AA pour le vendredi) |

**Règle invariante :** toute formule `='_FR_x'!<col><row>` dans un onglet mensuel doit utiliser **exactement la même lettre de colonne** que la cellule elle-même. Exemple : si la cellule est en colonne AA, la formule doit référencer `_FR_x!AA<row>`.

#### Onglet DATA

Export plat utilisé par le dashboard. Colonnes attendues :

```
Date | Franchise | Produit | Stock | Vente | Reste | CmdJ1 | Perte
```

Cet onglet est lu par le Apps Script `doGet()` et servi en CSV au dashboard.

### 3.3 Fichier Transferts inter-magasins

Fichier ID : `1HE_bXUlYGXAgbzuNNnjkZN--ryx49SiSrqgm4D7Sk2w`

Onglet `Transferts` — colonnes attendues par le dashboard :

```
date | produit | quantite | donneur | receveur | note
```

Le `declencheur.gs` surveille ce fichier (trigger `onChange` sur éditions manuelles de l'onglet "Transferts").

---

## 4. Le Dashboard HTML

### Fichier : `dashboard_ventes_stock.html`

Dashboard autonome (single-file HTML+JS+CSS) sans dépendance backend autre que Google Apps Script.

### 4.1 Dépendances externes

- **Chart.js 4.4.0** (CDN jsDelivr) — graphiques
- **Google Fonts — Inter** — typographie
- **Google Apps Script** (déployé comme Web App) — API de données

### 4.2 URL Apps Script active

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyDqicU_NwYNbyiC78nsWxqYeXBC0bjH05u2P4bAorxqhPTmpiZ80aZ53aguq0y__2E/exec';
```

Cette URL est définie **ligne ~323** du fichier HTML. Elle pointe vers le Apps Script déployé dans le fichier central.

### 4.3 Stratégie de chargement des données (fetchCSV)

Le dashboard tente les sources dans cet ordre de priorité :

1. **Apps Script URL** (résout le problème CORS) — recommandé
2. **Accès direct Google Sheets** (fonctionne depuis un serveur HTTPS)
3. **Proxies CORS publics** (corsproxy.io, allorigins.win, thingproxy, cors.sh) — fallback depuis `file://`

Si tout échoue, le dashboard affiche un guide d'installation Apps Script avec le code à copier-coller.

### 4.4 Fonctionnalités du dashboard

**Onglet Ventes & Stock :**
- KPI : Ventes totales, Stock entrant, Taux d'écoulement, Pertes réelles
- Graphique : Ventes par magasin (barres)
- Graphique : Répartition par produit (donut)
- Graphique : Évolution hebdomadaire ventes + pertes (courbes)
- Tableau : Classement détaillé des 5 magasins (ventes, stock, taux écoulement, pertes, statut)
- Tableau : Analyse par produit (ventes, % CA, pertes)
- Tableau : Alertes & Signaux automatiques

**Onglet Transferts :**
- KPI : Unités transférées, Nb opérations, Magasin donneur top, Produit le plus échangé
- Graphique : Balance Donné/Reçu par magasin (barres groupées)
- Matrice : Flux donneur × receveur (tableau heatmap)
- Top produits transférés
- Détail chronologique des transferts

**Filtres :**
- Multiselect magasins (tous par défaut, filtrés individuellement)
- Multiselect produits
- Plage de dates (initialisée sur la semaine en cours lundi→vendredi)
- Bouton reset dates
- Barre d'alertes de filtres actifs
- Bouton Actualiser (rechargement depuis la source)

### 4.5 Méthodologie de calcul des pertes

> Règle importante pour éviter les doubles comptages :

- Le **Plat du Jour (PDJ)** non vendu devient le **Plat de la Veille (PDV)** du lendemain → le "Reste PDJ" n'est **pas** une perte, c'est un recyclage.
- **Pertes réelles = Perte PDJ (vendredis uniquement, colonne `Perte`) + Reste PDV (invendus réels, colonne `Reste` pour le PDV)**
- Le stock entrant **exclut** le PDV (pour éviter de compter deux fois la même production).

### 4.6 Couleurs des magasins

```javascript
LINGOLSHEIM:  '#F4A261'  (orange clair)
STRASBOURG:   '#E76F51'  (orange-rouge)
ECKBOLSHEIM:  '#2D6A4F'  (vert foncé)
SCHILTIGHEIM: '#F9C74F'  (jaune)
ILLKIRCH:     '#52B788'  (vert clair)
```

### 4.7 Comment ouvrir le dashboard

**Option 1 (recommandée) — depuis GitHub Pages ou tout serveur HTTPS :**
Aucune configuration supplémentaire. Le dashboard charge via l'URL Apps Script.

**Option 2 — en local avec Python :**
```bash
cd "chemin/vers/dossier"
python -m http.server 8080
# Puis ouvrir : http://localhost:8080/dashboard_ventes_stock.html
```

**Option 3 — directement en `file://` dans Chrome :**
Fonctionne uniquement si l'URL Apps Script est renseignée (ce qui est déjà le cas).

---

## 5. Les scripts Google Apps Script

### 5.1 `centralimportange.gs` — Setup de l'architecture

**ATTENTION : script lourd, à ne lancer qu'en cas de reconstruction complète.**

Fonctions principales :
- `setupImportRange()` — point d'entrée unique, appelle les 3 fonctions ci-dessous
- `createStagingSheets()` — crée les onglets `_FR_0` à `_FR_4` et y place les formules IMPORTRANGE
- `rebuildCentralFormulas()` — écrit les formules `='_FR_x'!<col><row>` dans les onglets mensuels
- `setImportRangeFormulas()` — fonction complémentaire de setup

Constantes importantes :
```javascript
SPREADSHEET_ID = '1bHK0dRN5A_ELfqCTOFa5fpdSZlqAO9P-VwUb06gZLLc'
FR_SS_IDS = [Lingolsheim, Strasbourg, Eckbolsheim, Schiltigheim, Illkirch]  // dans cet ordre
STAGING_BLOCK = 50
WSR = [8, 45, 82, 119, 156]
RPF = 7
DAY_COL_STARTS = [3, 8, 13, 18, 23]
```

Fonction utilitaire clé :
```javascript
stagingRef(fi, mi, frRow, frCol)
// → ="'_FR_"+fi+"'!"+colLetter(frCol)+stagRow
// où stagRow = mi*STAGING_BLOCK + frRow
```

### 5.2 `fix_perte_vendredi.gs` — Outil d'audit et correction

**Script de maintenance léger et ciblé. Sans risque. Peut être relancé à tout moment.**

Localisation : `C:\Users\cdesmottes\Claude\ClaudeCode\fix_perte_vendredi.gs`

Fonctions :
- `auditFRReferences()` — scanne les 12 onglets mensuels, génère l'onglet `Audit_FR_References` listant toutes les cellules avec une lettre de colonne incorrecte (rien n'est modifié)
- `fixFRReferences()` — applique les corrections identifiées par l'audit (à lancer uniquement après vérification du rapport)

Plage de scan bornée explicitement :
```javascript
SCAN_FIRST_ROW = 1,  SCAN_LAST_ROW = 200
SCAN_FIRST_COL = 1,  SCAN_LAST_COL = 27  // A à AA
```

Règle de correction : pour toute formule `='_FR_x'!<COL><row>` en cellule colonne `C`, `COL` doit être `C`. Sinon c'est une anomalie.

Pattern de détection : `/^='(_FR_\d+)'!([A-Z]+)(\d+)$/`

### 5.3 `declencheur.gs` — Déclencheur Transferts

Trigger installé sur le fichier Transferts (`1HE_bXUl...`).
Se déclenche uniquement sur éditions manuelles de l'onglet "Transferts" (pas les modifications programmatiques).
N'affecte pas le fichier central.

### 5.4 `Vendredi HS.gs` — Script obsolète

Ancienne tentative de correction, ciblant uniquement `_FR_3` (Schiltigheim) et uniquement la colonne AL→AA.
Portée trop étroite. Remplacé par `fix_perte_vendredi.gs`. Peut être supprimé.

### 5.5 Code Apps Script embarqué dans le dashboard

Le dashboard contient le code `doGet()` à coller dans un Apps Script :

```javascript
function doGet(e) {
  var ss = SpreadsheetApp.openById('1bHK0dRN5A_ELfqCTOFa5fpdSZlqAO9P-VwUb06gZLLc');
  if (e && e.parameter && e.parameter.format === 'csv') {
    // Retourne l'onglet DATA en CSV
    var sheet = ss.getSheetByName('DATA');
    var data = sheet.getDataRange().getValues();
    var csv = data.map(row => row.map(cell => {
      var s = String(cell);
      return (s.includes(',') || s.includes('"'))
        ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
    return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.TEXT);
  }
  // Sinon retourne le dashboard HTML (si hébergé dans Apps Script)
  return HtmlService.createHtmlOutputFromFile('dashboard').setTitle('La Petite Pause Dashboard');
}
```

Pour les transferts, le dashboard appelle `?type=transferts` et attend :
```json
{ "status": "ok", "data": [{ "date":"YYYY-MM-DD", "produit":"...", "quantite":N, "donneur":"...", "receveur":"...", "note":"..." }] }
```

---

## 6. Problèmes rencontrés et solutions appliquées

### 6.1 Bug "perte du vendredi" — colonnes erronées dans les onglets mensuels

**Symptôme :** La valeur "perte du vendredi" (colonne AA) affichait 0 ou était vide pour 3 magasins (Lingolsheim, Eckbolsheim, Illkirch) alors que les données étaient bien présentes dans les fichiers magasin.

**Cause racine :** Une exécution antérieure de `setupImportRange()` avait dépassé la limite d'exécution de **6 minutes** (limite Google Apps Script sur compte consommateur) et s'était interrompue en plein milieu. Résultat : certaines cellules des onglets mensuels référençaient `='_FR_x'!AW<row>` ou `='_FR_x'!AL<row>` au lieu de `='_FR_x'!AA<row>`, pointant vers des colonnes inexistantes dans les onglets de staging (qui ne vont que jusqu'à AA=colonne 27).

**Anomalies trouvées lors de l'audit :**

| Franchise | Onglet staging | Colonne référencée (erronée) | Colonne attendue |
|-----------|---------------|------------------------------|------------------|
| Lingolsheim | `_FR_0` | AW | AA |
| Eckbolsheim | `_FR_2` | AL | AA |
| Illkirch | `_FR_4` | AL | AA |
| Strasbourg | `_FR_1` | — (correct) | — |
| Schiltigheim | `_FR_3` | — (correct) | — |

**Solution appliquée :** `fix_perte_vendredi.gs` — script léger qui scanne uniquement la plage bornée, détecte les incohérences colonne attendue vs colonne référencée, et corrige cellule par cellule (sans reconstruire toute l'architecture).

### 6.2 Timeout Apps Script à 6 minutes

Tout script Apps Script sur compte Google consommateur est limité à **6 minutes d'exécution**.

`setupImportRange()` fait des milliers d'appels `setFormula()` individuels → dépasse systématiquement cette limite si le fichier est complet.

**Règles à respecter pour tout nouveau script :**
- Préférer `setValues()` en une seule fois sur un bloc (batch write) plutôt que des `setFormula()` un par un
- Éviter `getLastRow()` / `getLastColumn()` sur des feuilles avec mise en forme étendue (résultat faussé + lent)
- Ne pas utiliser `insertSheet()` / `deleteSheet()` dans des scripts qui tournent longtemps : ces opérations peuvent déclencher des triggers `onChange` installés, provoquant des exécutions en cascade et ralentissant encore l'exécution

### 6.3 Problème CORS du dashboard en `file://`

Chrome bloque les requêtes vers des APIs externes quand le fichier HTML est ouvert depuis le disque local (`file://`).

**Solutions par ordre de préférence :**
1. URL Apps Script (déjà configurée, contourne CORS)
2. Serveur Python local (`python -m http.server 8080`)
3. GitHub Pages

---

## 7. Points d'attention pour la maintenance

### 7.1 Ne jamais relancer `setupImportRange()` à la légère

Ce script réécrit toutes les formules de tous les onglets mensuels du fichier central. Il dépasse la limite de 6 minutes et laissera l'état du fichier dans un état partiel/incohérent. Si une correction ponctuelle est nécessaire, utiliser `fix_perte_vendredi.gs` à la place.

### 7.2 L'onglet DATA doit correspondre au format attendu

Le dashboard s'attend à des colonnes précises dans l'onglet DATA du fichier central :
`Date | Franchise | Produit | Stock | Vente | Reste | CmdJ1 | Perte`

Toute modification de la structure de cet onglet cassera le dashboard. Les noms de colonnes sont parsés par le `parseCSV()` du dashboard qui mappe directement les entêtes.

### 7.3 Les noms des magasins sont sensibles à la casse

Le dashboard et les formules distinguent `LINGOLSHEIM` (majuscules, dans l'onglet DATA) de `Lingolsheim` (mixte, dans le module Transferts). Les deux coexistent dans le code. Si un nouveau magasin est ajouté, vérifier la cohérence dans :
- `MAGASIN_ORDER` du dashboard (ligne ~328)
- `COLORS` du dashboard
- `MAG_COLORS_TR` du dashboard (section transferts)
- `FR_SS_IDS` de `centralimportange.gs`

### 7.4 L'URL Apps Script doit être mise à jour si le déploiement est recréé

L'URL `APPS_SCRIPT_URL` dans le dashboard (ligne ~323) est liée à un déploiement spécifique. Si le Apps Script est supprimé et redéployé, une nouvelle URL sera générée — il faudra mettre à jour le dashboard et le republier.

### 7.5 La "perte du vendredi" est la seule colonne Perte réellement utilisée

Dans la structure actuelle, la colonne `Perte` n'est alimentée que le **vendredi** (colonnes W à AA, offset +4). Les autres jours, la perte est nulle ou non renseignée. C'est un choix métier : les pertes sont constatées en fin de semaine le vendredi.

### 7.6 Le Plat de la Veille est un cas spécial dans les calculs

Le PDV est le seul produit pour lequel "perte réelle = colonne `Reste`" (et non colonne `Perte`). Cette logique est implémentée dans le dashboard (voir `renderDashboard`) et doit être préservée si de nouveaux produits sont ajoutés.

### 7.7 Vérifier les autorisations IMPORTRANGE après ajout d'un nouveau magasin

Toute nouvelle formule `IMPORTRANGE` vers un fichier tiers nécessite une autorisation manuelle dans Google Sheets (le propriétaire du fichier central doit cliquer "Autoriser l'accès" lors de la première ouverture).

---

## 8. Procédures utiles

### Vérifier l'intégrité des formules `_FR_x` (audit)

1. Ouvrir [script.google.com](https://script.google.com/)
2. Sélectionner le projet attaché au fichier central
3. Lancer la fonction `auditFRReferences()` de `fix_perte_vendredi.gs`
4. Consulter l'onglet `Audit_FR_References` créé dans le fichier central
5. Si des anomalies sont listées, lancer `fixFRReferences()`
6. Supprimer l'onglet `Audit_FR_References` une fois terminé

### Forcer le rechargement du dashboard

Cliquer le bouton **Actualiser** en haut à droite — le dashboard recharge les données depuis Apps Script sans recharger la page. Utile après une correction dans Google Sheets.

### Ajouter un nouveau magasin

1. Créer le fichier Google Sheets du nouveau magasin avec les 12 onglets mensuels en `A1:AA50`
2. Ajouter son ID dans `FR_SS_IDS` de `centralimportange.gs`
3. Mettre à jour `MAGASIN_ORDER`, `COLORS`, `MAG_COLORS_TR` dans le dashboard HTML
4. Recréer les onglets staging `_FR_x` et les formules (via `setupImportRange()` — attention au timeout)
5. Republier le dashboard HTML

### Redéployer le Apps Script (si URL expirée)

1. Ouvrir le projet Apps Script du fichier central
2. Déployer → Gérer les déploiements → Créer un nouveau déploiement
3. Type : Application Web / Accès : Tout le monde
4. Copier la nouvelle URL
5. Mettre à jour `APPS_SCRIPT_URL` dans `dashboard_ventes_stock.html` (ligne ~323)
6. Republier le fichier HTML (GitHub ou autre)

---

## 9. Pistes d'évolution

### Court terme
- **Supprimer `Vendredi HS.gs`** — script obsolète, remplacé par `fix_perte_vendredi.gs`
- **Ajouter `?type=transferts` au Apps Script** si ce n'est pas encore déployé (pour que la section Transferts du dashboard soit fonctionnelle)
- **Ajouter l'export CSV de l'onglet DATA** au même Apps Script `doGet()` si ce n'est pas déjà fait

### Moyen terme
- **Batch write dans `setupImportRange()`** : réécrire la fonction pour construire toutes les formules en mémoire et les écrire en un seul `setValues()` par onglet — élimine le risque de timeout
- **Automatisation de l'onglet DATA** : un script planifié (trigger horaire ou quotidien) qui reconstruit l'onglet DATA à partir des onglets mensuels, pour ne pas dépendre d'une mise à jour manuelle
- **Alertes email** : trigger Apps Script hebdomadaire qui envoie un email récapitulatif si le taux de perte dépasse un seuil

### Long terme
- **Hébergement sur GitHub Pages** : le dashboard HTML peut être servi directement depuis un dépôt GitHub public, accessible depuis n'importe quel navigateur sans installation
- **Séparation Code.gs** : le Apps Script `doGet()` qui sert les données mériterait d'être un script dédié et versionné séparément du setup
- **Ajout d'une vue "comparaison semaine N vs N-1"** dans le dashboard

---

*Dernière mise à jour : juin 2026*
*Auteur : CDS / La Petite Pause*
