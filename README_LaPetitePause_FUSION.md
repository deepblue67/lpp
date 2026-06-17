# Documentation La Petite Pause — Compilation des 4 projets

> **Document de fusion** regroupant l'intégralité des 4 fichiers README originaux, sans perte d'information.
> Chaque section ci-dessous correspond à **un fichier source distinct**, identifié par son nom de fichier d'origine.
> Les tables des matières internes à chaque document ont été conservées telles quelles.

---

## Sommaire général

| # | Section | Fichier source d'origine |
|---|---------|---------------------------|
| 1 | [CRM Rakhel — Dashboard Prospects](#1-crm-rakhel-dashboard-prospects-source-readmecrmmd) | `README_CRM.md` |
| 2 | [Commandes LPP — Documentation complète](#2-commandes-lpp-documentation-complète-source-readmecommandeslppmd) | `README_Commandes_LPP.md` |
| 3 | [La Petite Pause — Projet Dashboards CA](#3-la-petite-pause-projet-dashboards-ca-source-readmelivrecaissemd) | `README_LivreCaisse.md` |
| 4 | [La Petite Pause — Documentation technique CRM/Dashboard (Ventes & Stocks)](#4-la-petite-pause-documentation-technique-crmdashboard-ventes-stocks-source-readmeventesetstocksmd) | `README_VentesEtStocks.md` |

---

## 1. CRM Rakhel — Dashboard Prospects (source README_CRM.md)

*Fichier source original : `README_CRM.md`*

## CRM Rakhel — Dashboard Prospects

Dashboard web pour la gestion des prospects franchise, hébergé sur GitHub Pages et connecté à Google Sheets via Apps Script.

---

### Architecture

```
GitHub Pages (static)          Google Apps Script (backend)         Google Sheets
dashboard_CRM.html     ──►     Code.gs (Web App)            ──►     Spreadsheet
(HTML/JS/CSS)          ◄──     GET → JSON prospects         ◄──     onglet "Prospects"
                               POST → add / update
```

- **Pas de serveur** : le HTML est 100% statique, Apps Script joue le rôle d'API REST avec gestion CORS automatique.
- **Pas de build** : un seul fichier HTML auto-suffisant, déployable par simple `git push`.

---

### URLs & identifiants

| Ressource | Valeur |
|-----------|--------|
| GitHub Pages | `https://deepblue67.github.io/lpp/dashboard_CRM.html` |
| Apps Script Web App | `https://script.google.com/macros/s/AKfycbyTLZcAbsKrpVvJxgnOnFbntPRnaZj60KZTmIoOQ_KmztwdPojqFEAgLIwTGoFH14kT/exec` |
| Google Sheet ID | `1Lq1XEwUhhYAI6UwigQEYUdb-_A_WDsgkqnCJwNSoyWs` |
| Onglet | `Prospects` |

---

### Structure du Google Sheet

L'onglet `Prospects` commence à la **ligne 3** (ligne 1 = titre du fichier, ligne 2 = en-têtes).

| Col | Lettre | Champ | Type |
|-----|--------|-------|------|
| 0 | A | Prospect (nom) | Texte |
| 1 | B | Téléphone | Texte |
| 2 | C | Email | Texte |
| 3 | D | Source | Texte |
| 4 | E | Apport / Budget | Texte |
| 5 | F | Date Contact | Date `dd/MM/yyyy` |
| 6 | G | Date Rappel | Date `dd/MM/yyyy` |
| 7 | H | Présentation envoyée | Date `dd/MM/yyyy` |
| 8 | I | Date Visio | Date `dd/MM/yyyy` |
| 9 | J | Ville / Région | Texte |
| 10 | K | Note initiale (0–5) | Nombre |
| 11 | L | Note actuelle (0–5) | Nombre |
| 12 | M | Profil candidat | Texte |
| 13 | N | Notes complémentaires | Texte |
| 14 | O | Statut | `Actif` / `Inactif` |
| 15 | P | Type Contact | `Téléphone` / `Mail` / `Rencontre` / vide |

> **Important** : `buildRow()` dans Code.gs retourne exactement 16 valeurs dans cet ordre. Toute modification de l'ordre des colonnes dans le Sheet doit être répercutée dans `doGet` ET `buildRow`.

---

### Fichiers du projet

```
CRM/dashboard/
├── dashboard_CRM.html   # Application complète (HTML + CSS + JS inline)
├── Code.gs              # Google Apps Script (backend API)
└── README.md            # Ce fichier
```

---

### Fonctionnalités du dashboard

#### KPI Cards (5 boxes cliquables)
- **Total prospects** : remet tous les filtres à zéro
- **Notes élevées (≥4)** : filtre les prospects chauds
- **Rappels en retard** : rappels dont la date est passée
- **Rappels cette semaine** : rappels dans les 7 prochains jours
- **Visios planifiées** : prospects avec une date visio renseignée

> Cliquer une seconde fois sur une box active désactive le filtre.  
> Cliquer une box synchronise également le `<select>` de filtre correspondant dans la barre de filtres.

#### Graphiques (3 charts Chart.js 4.4.0, cliquables)
- **Par source** : bar chart — cliquer une barre filtre par source
- **Par note** : bar chart — cliquer une barre filtre par note
- **Par ville** : bar horizontal — cliquer une barre filtre par ville

#### Barre de filtres
- Recherche texte libre (nom, ville, email, source, apport)
- Filtre Source (liste déroulante auto-générée)
- Filtre Note (0 à 5)
- Filtre Ville (liste déroulante auto-générée)
- Filtre Rappel (En retard / Cette semaine)
- Filtre Type de contact (Téléphone / Mail / Rencontre)
- Filtre Statut (Actif / Inactif)
- Bouton ✕ reset tous les filtres

#### Table des prospects
- Pagination 25 lignes par page
- Tri par colonne (clic sur en-tête)
- Colonnes : Prospect, Source, Date contact, Apport, Ville, Date rappel, Note, Type contact, Statut, Téléphone
- Lignes inactives grisées (opacity 0.45)
- Clic sur le nom → ouvre la fiche d'édition

#### Modal Ajout prospect
- Champs : Nom*, Téléphone, Email, Source (saisie libre + autocomplete), Apport, Ville, Date contact, Type contact, Date rappel, Présentation envoyée, Date visio, Note initiale, Note actuelle, Profil, Notes
- La source saisie apparaît automatiquement dans la liste autocomplete lors des prochaines utilisations

#### Modal Édition / Fiche prospect
- Mêmes champs que l'ajout
- Mise à jour locale immédiate sans rechargement de page

---

### Code.gs — Points clés

#### Déploiement Apps Script
1. Ouvrir [script.google.com](https://script.google.com) → projet **CRM Rakhel**
2. Coller le contenu de `Code.gs`
3. **Déployer → Gérer les déploiements → icône crayon → Nouvelle version → Déployer**
4. ⚠️ Toujours choisir **"Nouvelle version"** sur le déploiement existant — ne pas créer un nouveau déploiement (l'URL changerait)

#### Fonctions de migration (à exécuter une seule fois)

```
migrateTypeContact()   — Parse la colonne F (ex: "Tel le 26/01/2024")
                         → écrit le type en col P, nettoie la date en col F

migratePresentation()  — Parse la colonne H (ex: "oui le 26/01/24")
                         → ne garde que la date
```

Pour les exécuter : dans l'éditeur Apps Script, sélectionner la fonction dans le menu déroulant → **Exécuter**. Le résultat s'affiche dans le **Journal d'exécution**.

#### Gestion des dates
- Le Sheet stocke les dates en `dd/MM/yyyy` (texte ou objet Date)
- `formatDateCell()` dans Code.gs normalise les deux formats vers `dd/MM/yyyy`
- `toInputDate()` dans le HTML convertit `dd/MM/yyyy` → `yyyy-MM-dd` (format `<input type="date">`)
- `fromInputDate()` fait l'inverse pour la sauvegarde
- `toInputDate()` gère aussi les chaînes brutes JS type `"Thu May 22 2025 09:00:00 GMT+0200"` que Sheets peut renvoyer pour certaines cellules

---

### Points d'attention pour la maintenance

#### 1. Ne jamais réorganiser les colonnes du Sheet sans mettre à jour Code.gs
`doGet` lit par index (`r[0]`, `r[1]`...) et `buildRow` écrit dans le même ordre. Si une colonne est insérée ou déplacée dans le Sheet, les deux fonctions doivent être mises à jour.

#### 2. Ajouter une colonne → 3 endroits à modifier
- `doGet` : ajouter la lecture de `r[N]`
- `buildRow` : ajouter la valeur en position correspondante
- `dashboard_CRM.html` : affichage table, filtres, modals, fonctions save

#### 3. Redéploiement Apps Script obligatoire après chaque modification de Code.gs
Enregistrer seul ne suffit pas — il faut créer une **nouvelle version** du déploiement existant.

#### 4. Source : saisie libre avec autocomplete
Le champ Source est un `<input type="text" list="sources-list">` (pas un `<select>`). La datalist est peuplée dynamiquement depuis les données. Une nouvelle source saisie par l'utilisateur sera disponible dans l'autocomplete dès le rechargement suivant (après sauvegarde dans le Sheet).

#### 5. Index-based onclick (bug fix appliqué)
Les boutons "nom de prospect" dans la table utilisent `data-idx="${realIdx}"` + `onclick="openFiche(this.dataset.idx)"` au lieu d'embarquer le JSON du prospect dans l'attribut onclick. Cela évite les bugs avec les apostrophes et caractères spéciaux dans les noms. **Ne pas revenir à l'ancienne méthode JSON-in-onclick.**

#### 6. String() sur les valeurs du Sheet
Certaines cellules numériques ou vides remontent comme non-string depuis Apps Script. Toujours utiliser `String(p.ville || "").trim()` et non `p.ville.trim()` directement — voir notamment les fonctions de filtre et de chart.

#### 7. Test en local impossible
Le dashboard appelle l'URL Apps Script au chargement. En local (fichier ouvert directement dans le navigateur ou serveur HTTP local), la requête échoue à cause de CORS ou de timeout. **Tester toujours sur GitHub Pages.**

#### 8. Données de démo embarquées
Le fichier HTML contient un tableau `DEMO_DATA` (15 prospects fictifs) utilisé comme fallback si l'appel Apps Script échoue. Ne pas supprimer — permet de voir le dashboard fonctionner même sans connexion au Sheet.

---

### Évolutions possibles

- **Colonne "Statut avancement"** : pipeline visuel type Kanban (Nouveau → Contacté → Présenté → Visio → En cours → Signé / Abandonné)
- **Export CSV / Excel** depuis le dashboard
- **Graphique temporel** : évolution du nombre de prospects par mois
- **Notifications** : alerte par email (Apps Script `MailApp`) pour les rappels en retard
- **Authentification** : actuellement l'Apps Script est public (`accès Tout le monde`) — ajouter une protection par token si nécessaire
- **Pagination côté serveur** : si la base dépasse ~1000 prospects, envisager de paginer les appels GET
- **Colonne "Canal acquisition"** distincte de Source : distinguer le support (salon, web, recommandation) du média (Franchise Direct, WordPress...)

---

### Historique des migrations de données

| Date | Fonction | Description |
|------|----------|-------------|
| Juin 2026 | `migrateTypeContact()` | Extraction type contact depuis col F, nettoyage dates col F, création col P |
| Juin 2026 | `migratePresentation()` | Nettoyage col H : suppression "oui le", conservation date seule |

---

## 2. Commandes LPP — Documentation complète (source README_Commandes_LPP.md)

*Fichier source original : `README_Commandes_LPP.md`*

## Commandes LPP — Documentation complète

> Système de gestion des commandes pour la chaîne **La Petite Pause (LPP)**  
> 5 magasins : Lingolsheim · Strasbourg · Eckbolsheim · Schiltigheim · Illkirch

---

### Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture du fichier Google Sheets](#2-architecture-du-fichier-google-sheets)
3. [Structure des onglets](#3-structure-des-onglets)
4. [Installation et premier démarrage](#4-installation-et-premier-démarrage)
5. [Utilisation au quotidien](#5-utilisation-au-quotidien)
6. [Référence des fonctions Apps Script](#6-référence-des-fonctions-apps-script)
7. [Configuration (constantes)](#7-configuration-constantes)
8. [Palettes de couleurs](#8-palettes-de-couleurs)
9. [Pièges et points d'attention](#9-pièges-et-points-dattention)
10. [Limites connues de Google Apps Script](#10-limites-connues-de-google-apps-script)
11. [Évolutions futures envisagées](#11-évolutions-futures-envisagées)

---

### 1. Vue d'ensemble

#### Objectif

Chaque semaine, les 5 magasins LPP passent deux types de commandes :
- **Commande Cuisine Centrale** : produits fabriqués en interne (salades, sauces, etc.)
- **Commande Fournisseurs** : produits achetés à l'extérieur

Le fichier Google Sheets centralise :
1. La liste des produits disponibles (avec activation/désactivation par produit)
2. La génération automatique des **fiches de saisie** pour chaque magasin
3. La **synthèse automatique** des quantités saisies par les magasins

#### Fichier Google Sheets

- **ID** : `1GczULcs2NczGTWg5vehi4QyojpjDH2Xq-62UZCdFAIQ`
- **Script** : `Commandes_LPP.gs` (Extensions > Apps Script dans Google Sheets)

---

### 2. Architecture du fichier Google Sheets

#### Ordre fixe des onglets

| Position | Onglet | Rôle | Couleur |
|----------|--------|------|---------|
| 1 | `Produits C.Centrale` | Référentiel produits cuisine centrale | — |
| 2 | `Produits Fournisseurs` | Référentiel produits fournisseurs | — |
| 3 | `PROD` | Synthèse commande centrale (généré) | Bleu marine |
| 4 | `FOUR` | Synthèse commande fournisseurs (généré) | Vert foncé |
| 5–9 | `Commande Lingo/Stras/Eckbo/Schil/Illki` | Fiches de saisie (générées) | Bicolore bleu/vert |
| fin | `Allergènes Été 2026` | Table allergènes carte été 2026 | Terracotta pastel |
| fin | `Recettes & Compo` | Fiches recettes et compositions | Indigo |

> **Règle critique** : ne jamais renommer un onglet manuellement sans mettre à jour la constante correspondante dans le script. Les onglets sont référencés par leur nom exact.

---

### 3. Structure des onglets

#### 3.1 Onglets référentiels (`Produits C.Centrale` et `Produits Fournisseurs`)

Ces deux onglets sont **gérés manuellement**. Leur structure est fixe :
- Les produits sont organisés en **catégories** (groupes de colonnes)
- Chaque catégorie occupe **5 colonnes** (`COLS_PER_CAT = 5`)
- **Ligne 3** : nom de la catégorie (colonne 1 du groupe)
- **Ligne 5+** : données produits

| Colonne dans le groupe | Contenu |
|------------------------|---------|
| +0 | Nom du produit |
| +1 | (non utilisé par le script) |
| +2 | Unité (ex : kg, pièce) |
| +3 | `Oui` / vide — **filtre d'activation** (seuls les `Oui` apparaissent dans les fiches) |
| +4 | (non utilisé par le script) |

- `Produits C.Centrale` : **9 catégories** (`N_CATS_CENTRALE = 9`)
- `Produits Fournisseurs` : **8 catégories** (`N_CATS_FOURN = 8`)

> Pour **activer** un produit dans les fiches : mettre `Oui` en colonne +3. Pour le **désactiver** : vider la cellule. La régénération des fiches prend en compte ce changement.

#### 3.2 Fiches magasin (`Commande Lingo`, etc.)

Chaque fiche est une **feuille de saisie** à 7 colonnes :

| Col | Contenu | Largeur | Remarque |
|-----|---------|---------|----------|
| A | Produit centrale | 215 px | Lu depuis `Produits C.Centrale` |
| B | Unité centrale | 76 px | |
| **C** | **QTÉ centrale** | 68 px | **Zone de saisie — lu par PROD** |
| D | Séparateur visuel | 14 px | Fond `#EFEFEF` |
| E | Produit fournisseur | 215 px | Lu depuis `Produits Fournisseurs` |
| F | Unité fournisseur | 76 px | |
| **G** | **QTÉ fournisseur** | 68 px | **Zone de saisie — lu par FOUR** |

Structure verticale :
- **Ligne 1** : Titre `COMMANDE — LINGOLSHEIM` (bleu marine) + date du jour (jaune, col F-G)
- **Ligne 2** : Filet décoratif bleu marine
- **Ligne 3** : En-têtes de section (🔵 Cuisine Centrale / 🟢 Fournisseurs)
- **Ligne 4** : Sous-en-têtes colonnes (Produit / Unité / QTÉ) — **lignes 1-4 gelées**
- **Ligne 5+** : Données (en-têtes de catégorie en surbrillance + produits en alternance)
- **Section DIVERS** : 5 lignes libres à la fin pour notes manuelles

#### 3.3 Onglet PROD (synthèse cuisine centrale)

- **7 colonnes** : Produit | Lingo | Stras | Eckbo | Schil | Illki | TOTAL
- Lecture automatique de la **colonne C** de chaque fiche magasin
- Thème **bleu marine**
- Le TOTAL est calculé par le script (pas de formule dans la cellule)
- Lignes 1-4 gelées
- Généré/regénéré à la demande via le menu

#### 3.4 Onglet FOUR (synthèse fournisseurs)

- **7 colonnes** : Produit | Lingo | Stras | Eckbo | Schil | Illki | TOTAL
- Lecture automatique de la **colonne G** de chaque fiche magasin
- Thème **vert foncé**
- Structure identique à PROD
- Toujours inséré immédiatement **après** PROD

#### 3.5 Onglet Allergènes Été 2026

- **17 colonnes** : Produit | Origine viande | Labels | 14 allergènes
- Allergènes : Gluten, Crustacés, Œufs, Poissons, Arachide, Soja, Lait, Fruits à coques, Céleri, Moutarde, Sésame, Lupin, Mollusques, Sulfites
- Présence = `●` fond terracotta (`#C17367`) | Absence = fond gris pâle (`#F0EEEE`)
- En-têtes allergènes **inclinés à 55°** pour compacité
- Thème pastel terracotta
- **Créé une seule fois** depuis l'éditeur Apps Script

#### 3.6 Onglet Recettes & Compo

- **2 colonnes** : Produit (215 px) | Composition/Ingrédients (640 px)
- `setWrap(true)` activé sur la colonne description
- Thème indigo
- **Créé une seule fois** depuis l'éditeur Apps Script

---

### 4. Installation et premier démarrage

#### Étape 1 — Copier le script

1. Ouvrir le Google Sheet (`1GczULcs2NczGTWg5vehi4QyojpjDH2Xq-62UZCdFAIQ`)
2. Menu **Extensions > Apps Script**
3. Coller le contenu de `Commandes_LPP.gs` dans l'éditeur
4. **Sauvegarder** (Ctrl+S ou ⌘S)

#### Étape 2 — Exécuter setupScript

1. Dans le menu déroulant des fonctions, sélectionner **`setupScript`**
2. Cliquer ▶ **Exécuter**
3. Google demande des autorisations → **Autoriser**
4. Vérifier dans les logs : `✅ Trigger installé sur : [nom du fichier]`

> `setupScript` installe un **trigger permanent** `onOpen` : le menu 🍽️ apparaîtra à chaque ouverture du fichier, même sans repasser par l'éditeur.

#### Étape 3 — Créer les onglets de référence (une seule fois)

Ces fonctions se lancent depuis l'éditeur Apps Script (pas depuis le menu) :

```
creerOngletAllergenes()   → crée l'onglet "Allergènes Été 2026"
creerOngletRecettes()     → crée l'onglet "Recettes & Compo"
```

Vérifier dans les logs Apps Script que les confirmations `✅` s'affichent.

#### Étape 4 — Vérifier la position des onglets

Après création, l'ordre attendu est :
```
[Produits C.Centrale] [Produits Fournisseurs] ... [Allergènes Été 2026] [Recettes & Compo]
```
Les onglets PROD et FOUR n'existent pas encore — ils seront générés via le menu.

---

### 5. Utilisation au quotidien

#### Workflow type (début de semaine)

```
1. Ouvrir le Google Sheet
2. 🍽️ Menu LPP > 🔄 Générer TOUTES les fiches commande
   → Choisir OUI (régénérer) ou NON (mettre à jour en conservant les saisies)
3. Les responsables de chaque magasin saisissent les QTÉ dans leur fiche
4. 🍽️ Menu LPP > 📋 Générer la commande centrale (PROD)
5. 🍽️ Menu LPP > 🟢 Générer la commande fournisseurs (FOUR)
```

#### Options du menu

| Action | Description |
|--------|-------------|
| 📋 Générer la commande centrale (PROD) | Relit toutes les fiches et reconstruit l'onglet PROD |
| 🟢 Générer la commande fournisseurs (FOUR) | Relit toutes les fiches et reconstruit l'onglet FOUR |
| 🔄 Générer TOUTES les fiches | Génère/régénère les 5 fiches (avec dialog OUI/NON/Annuler) |
| 🔄 Générer — [Magasin] | Génère/régénère une seule fiche |
| 🗑️ Vider TOUTES les fiches | Efface les quantités saisies (confirmation requise) |
| 🗑️ Vider — [Magasin] | Efface les saisies d'un seul magasin |

#### Dialogs de confirmation

- **OUI** → Régénérer (structure + contenu rechargés depuis les onglets référentiels, saisies effacées)
- **NON** → Mettre à jour (structure rechargée, saisies **conservées**)
- **Annuler** → Ne rien faire

---

### 6. Référence des fonctions Apps Script

#### Fonctions publiques (menu)

| Fonction | Déclencheur | Description |
|----------|-------------|-------------|
| `onOpen(e)` | Trigger installé + ouverture fichier | Affiche le menu LPP |
| `genererFiches()` | Menu | Génère les 5 fiches (avec dialog) |
| `genererFicheLingo/Stras/Eckbo/Schil/Illki()` | Menu | Génère une fiche individuelle |
| `genererCommandeCentrale()` | Menu | Construit/reconstruit l'onglet PROD |
| `genererCommandeFournisseur()` | Menu | Construit/reconstruit l'onglet FOUR |
| `viderToutesLesFiches()` | Menu | Vide les QTÉ des 5 fiches |
| `viderLingolsheim/Strasbourg/...()` | Menu | Vide les QTÉ d'une fiche |

#### Fonctions d'initialisation (depuis l'éditeur uniquement)

| Fonction | Description |
|----------|-------------|
| `setupScript()` | Installe le trigger `onOpen` permanent |
| `creerOngletAllergenes()` | Crée l'onglet Allergènes (opération unique) |
| `creerOngletRecettes()` | Crée l'onglet Recettes & Compo (opération unique) |

> Ces fonctions utilisent `Logger.log()` au lieu de `ss.toast()` car elles s'exécutent depuis l'éditeur, un contexte où `toast()` n'est pas disponible.

#### Fonctions internes (privées, préfixées `_`)

| Fonction | Description |
|----------|-------------|
| `_addMenu(ss)` | Construit le menu — appelé uniquement par `onOpen` |
| `_generateAllStoreSheets(keepData)` | Cœur de la génération des 5 fiches |
| `_genererUneFiche(store)` | Génère une seule fiche avec dialog |
| `_buildStoreSheet(ws, storeName, centrale, fourn)` | Construit visuellement une fiche magasin |
| `_buildProdSheet(ws, categories, storeMaps)` | Construit l'onglet PROD |
| `_buildFourSheet(ws, categories, storeMaps)` | Construit l'onglet FOUR |
| `_buildAllergenesSheet(ws)` | Construit l'onglet Allergènes |
| `_buildRecettesSheet(ws)` | Construit l'onglet Recettes |
| `readActiveProducts(sheetName, nCats)` | Lit les produits actifs (`Oui`) depuis un onglet référentiel |
| `_readStoreCentraleQty(storeName)` | Lit les QTÉ colonne C d'une fiche → `{produit: quantité}` |
| `_readStoreFournisseurQty(storeName)` | Lit les QTÉ colonne G d'une fiche → `{produit: quantité}` |
| `_flattenCategories(categories)` | Aplatit les catégories en liste ordonnée de lignes |
| `_saveQuantities(sheet)` | Sauvegarde QTÉ avant régénération → `{L|produit: val, R|produit: val}` |
| `_restoreQuantities(sheet, qty)` | Restaure les QTÉ sauvegardées |
| `_viderSheet(sheetName)` | Efface les colonnes C et G d'une fiche |
| `_range(ws, r1, c1, r2, c2)` | Raccourci pour `getRange` avec coordonnées inclusives |
| `_getAllergenesData()` | Retourne les données allergènes hardcodées |
| `_getRecettesData()` | Retourne les données recettes hardcodées |

---

### 7. Configuration (constantes)

```javascript
const SPREADSHEET_ID  = '1GczULcs2NczGTWg5vehi4QyojpjDH2Xq-62UZCdFAIQ';

const SHEET_CENTRALE  = 'Produits C.Centrale';     // Onglet référentiel cuisine centrale
const SHEET_FOURN     = 'Produits Fournisseurs';   // Onglet référentiel fournisseurs
const SHEET_ALLERGENES = 'Allergènes Été 2026';    // Onglet allergènes
const SHEET_RECETTES   = 'Recettes & Compo';       // Onglet recettes

const COLS_PER_CAT    = 5;    // Colonnes par catégorie dans les référentiels
const N_CATS_CENTRALE = 9;    // Nombre de catégories dans Produits C.Centrale
const N_CATS_FOURN    = 8;    // Nombre de catégories dans Produits Fournisseurs
const DATA_START_ROW  = 5;    // Première ligne de données dans les référentiels

const STORES = [
  { name: 'Commande Lingo', short: 'LINGOLSHEIM'  },
  { name: 'Commande Stras', short: 'STRASBOURG'   },
  { name: 'Commande Eckbo', short: 'ECKBOLSHEIM'  },
  { name: 'Commande Schil', short: 'SCHILTIGHEIM' },
  { name: 'Commande Illki', short: 'ILLKIRCH'     },
];
```

> `STORES[x].name` = nom exact de l'onglet dans Google Sheets  
> `STORES[x].short` = nom affiché dans le titre de la fiche

---

### 8. Palettes de couleurs

#### Palette principale (fiches + PROD + FOUR)

| Constante | Hex | Usage |
|-----------|-----|-------|
| `C.NAVY` | `#1F3864` | Titre fiches, fond PROD ligne 1-2 |
| `C.BLUE` | `#2E75B6` | En-tête section centrale, fond PROD ligne 3 |
| `C.BLUE_LIGHT` | `#BDD7EE` | Fond en-têtes catégorie (centrale) |
| `C.BLUE_XLIGHT` | `#EBF3FB` | Alternance lignes PROD |
| `C.GREEN_DARK` | `#1A4731` | Fond FOUR ligne 1-2, texte TOTAL |
| `C.GREEN_MED` | `#2E7D52` | En-tête section fournisseurs, en-têtes catégories FOUR |
| `C.GREEN_LIGHT` | `#C6EFCE` | Fond en-têtes catégorie (fournisseurs) |
| `C.GREEN_XLIGHT` | `#EBF7EF` | Alternance lignes FOUR |
| `C.YELLOW` | `#FFF2CC` | Fond cellules QTÉ (saisie) |
| `C.YELLOW_HDR` | `#FFD966` | Date dans les fiches, sous-en-tête QTÉ |

#### Palette allergènes (terracotta pastel)

| Constante | Hex | Usage |
|-----------|-----|-------|
| `TITLE_BG` | `#6D3B2E` | Titre |
| `CAT_BG` | `#8B5E52` | En-têtes catégories |
| `HDR_BG` | `#EDD5CF` | Fond en-têtes colonnes |
| `PRESENT_BG` | `#C17367` | Fond allergène présent |
| `ABSENT_BG` | `#F0EEEE` | Fond allergène absent |

#### Palette recettes (indigo)

| Constante | Hex | Usage |
|-----------|-----|-------|
| `TITLE_BG` | `#283593` | Titre |
| `CAT_BG` | `#3949AB` | En-têtes catégories |
| `HDR_BG` | `#C5CAE9` | Fond en-têtes |
| `ALT_ROW` | `#E8EAF6` | Alternance lignes paires |

---

### 9. Pièges et points d'attention

#### ⚠️ Renommage d'onglets

**Problème** : si un onglet est renommé manuellement dans Google Sheets, toutes les fonctions qui y font référence échouent silencieusement (l'onglet devient introuvable).

**Règle** : tout renommage d'onglet **doit** être accompagné de la mise à jour de la constante correspondante dans le script.

Correspondances critiques :
```
SHEET_CENTRALE  = 'Produits C.Centrale'   ← doit correspondre exactement
SHEET_FOURN     = 'Produits Fournisseurs' ← idem
STORES[x].name  = 'Commande Lingo' etc.  ← idem
'PROD' et 'FOUR' ← noms hardcodés dans genererCommandeCentrale/Fournisseur
```

#### ⚠️ Ajout d'une catégorie dans les référentiels

Si vous ajoutez une **nouvelle catégorie** dans `Produits C.Centrale` ou `Produits Fournisseurs` :
- Vérifier que `N_CATS_CENTRALE` ou `N_CATS_FOURN` reste cohérent avec le nombre réel de catégories dans la feuille
- Chaque catégorie = exactement 5 colonnes (pas plus, pas moins)

#### ⚠️ Performance des écritures

Le script utilise des **écritures en bloc** (`setValues`, `setBackgrounds`, `setFontColors`) pour éviter les timeouts. Ne jamais réécrire ces sections en boucles cellule par cellule : avec 80+ produits × 7 colonnes, cela dépasserait les quotas d'Apps Script.

#### ⚠️ Position des onglets

Les onglets PROD et FOUR sont **toujours supprimés et recréés** lors d'une génération. Leur position finale dépend du calcul dans le script :
- PROD : après `SHEET_CENTRALE` et `SHEET_FOURN`
- FOUR : après PROD
- Fiches magasin : après PROD et FOUR

Si un onglet fixe manque (ex : PROD supprimé manuellement), le fallback est une position index 2 ou 3. Pas de bug, mais la position peut être inattendue.

#### ⚠️ Données allergènes et recettes

Les données des onglets Allergènes et Recettes sont **hardcodées dans le script** (fonctions `_getAllergenesData()` et `_getRecettesData()`). Elles correspondent à la carte **Été 2026**.

Lors d'un changement de carte :
1. Modifier les données dans ces fonctions
2. Relancer `creerOngletAllergenes()` et/ou `creerOngletRecettes()` depuis l'éditeur Apps Script (l'onglet existant sera d'abord supprimé puis recréé)

#### ⚠️ Trigger et autorisations

Le trigger `onOpen` est **installé** (pas simple-trigger). Cela signifie :
- Il persiste même si vous fermez et rouvrez Apps Script
- Il nécessite les autorisations Google au premier lancement
- Si les autorisations sont révoquées, relancer `setupScript()` et réautoriser

Pour vérifier les triggers actifs : Apps Script > menu "Triggers" (horloge dans la barre latérale).

#### ⚠️ Sauvegarde/restauration des QTÉ

Lors d'une mise à jour (option NON), le script sauvegarde les quantités avec des clés composites :
- `L|[nom produit]` pour la colonne C (cuisine centrale)
- `R|[nom produit]` pour la colonne G (fournisseurs)

Si un produit est **renommé** dans les référentiels, la quantité sauvegardée ne sera pas restaurée (clé introuvable). C'est un comportement attendu : la fiche est mise à jour avec les nouveaux noms.

---

### 10. Limites connues de Google Apps Script

| Limitation | Impact | Contournement |
|------------|--------|---------------|
| `addMenu()` exige le contexte `onOpen` | Ne pas l'appeler depuis `setupScript()` | Appeler uniquement dans `onOpen(e)` |
| `ss.toast()` ne fonctionne pas depuis l'éditeur | `creerOngletAllergenes/Recettes` n'affichent pas de notification visuelle | Utiliser `Logger.log()` + vérifier les logs |
| `setColumnWidths(col, nb, [array])` n'accepte pas les tableaux | Impossible de passer un tableau de largeurs différentes | Appeler `setColumnWidth()` individuellement pour chaque colonne |
| `setHiddenGridlines(true)` (pas `hideGridlines()`) | Nom de méthode non intuitif | Se souvenir du nom exact |
| Pas de `HtmlService` fiable avec dialogs de confirmation complexes | Les iframes Google Sheets bloquent l'accès aux cookies | Utiliser `ui.alert()` avec `ButtonSet.YES_NO_CANCEL` (natif, sans restriction) |
| Quota d'exécution 6 min par trigger | Pas de problème avec le volume actuel | À surveiller si le nombre de produits augmente fortement |
| Pas d'accès aux fichiers locaux | Tout le code et les données sont dans le fichier GAS | Normal pour Apps Script |

---

### 11. Évolutions futures envisagées

#### 11.1 Envoi automatique par email (FOUR)

**Besoin identifié** : envoyer le contenu de l'onglet FOUR aux fournisseurs par email.

**Solution technique disponible dans Apps Script** :
```javascript
GmailApp.sendEmail(
  destinataire,
  objet,
  corps_texte,
  { htmlBody: corps_html }
);
```

**Questions à trancher avant implémentation** :
- Combien de fournisseurs ? Un seul email groupé ou un email par fournisseur ?
- Si plusieurs fournisseurs : quelle partition des produits par fournisseur ? (nécessite un mapping produit → fournisseur)
- Format souhaité : tableau HTML dans le corps du mail ? PDF joint ? Export CSV ?
- Déclenchement : via un bouton dans le menu LPP après génération de FOUR, ou automatique ?

**Approches possibles** :
1. **Email unique** : envoyer FOUR complet à une liste de destinataires fixes → simple, 10 lignes de code
2. **Email par fournisseur** : nécessite un onglet de mapping `produit → fournisseur + email`
3. **PDF joint** : `DriveApp` + `SpreadsheetApp.getSheetByName('FOUR').activate()` + export PDF via l'URL Drive → plus complexe mais rendu professionnel

#### 11.2 Changement de carte (passage Été → Automne, etc.)

- Mettre à jour les données dans `_getAllergenesData()` et `_getRecettesData()`
- Mettre à jour `SHEET_ALLERGENES` si le nom de l'onglet change
- Régénérer les deux onglets depuis l'éditeur
- Mettre à jour `N_CATS_CENTRALE` / `N_CATS_FOURN` si des catégories sont ajoutées/supprimées

#### 11.3 Ajout d'un 6e magasin

1. Ajouter une entrée dans le tableau `STORES`
2. Ajouter les fonctions `genererFiche[Nom]()` et `vider[Nom]()` correspondantes
3. Les mettre dans le menu (`_addMenu`)
4. PROD et FOUR s'adapteront automatiquement (ils lisent `STORES` dynamiquement)

#### 11.4 Protection des cellules

Pour éviter les modifications accidentelles des colonnes non saisies dans les fiches, il serait possible de protéger les colonnes A, B, D, E, F via `sheet.protect()`. À activer si les utilisateurs modifient involontairement la structure.

#### 11.5 Historique des commandes

Actuellement, PROD et FOUR sont écrasés à chaque génération. Pour garder un historique :
- Nommer les onglets avec la date : `PROD_2026-06-17`
- Ou archiver dans un fichier Sheets séparé via `SpreadsheetApp.openById(ID_ARCHIVE)`

---

### Annexe — Fichier source original

Les onglets Allergènes et Recettes ont été reconstruits à partir du fichier :
`Copie de Commande magasin carte ETE 2026.xls`

Les données allergènes dans le XLS original étaient encodées par **couleur de fond de cellule** (jaune = présent, gris = absent), extraites via Python `xlrd` avec `formatting_info=True`. Ces données sont maintenant directement hardcodées dans le script — le fichier XLS n'est plus nécessaire.

---

*Dernière mise à jour : juin 2026*

---

## 3. La Petite Pause — Projet Dashboards CA (source README_LivreCaisse.md)

*Fichier source original : `README_LivreCaisse.md`*

## La Petite Pause — Projet Dashboards CA

### Vue d'ensemble

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

### 1. Google Sheet — Source de vérité unique

**ID :** `1jh3Mce91LvENKRVGDsfAru1hRGvo7Uz1Ge2FsHYSw-k`
**URL :** https://docs.google.com/spreadsheets/d/1jh3Mce91LvENKRVGDsfAru1hRGvo7Uz1Ge2FsHYSw-k

C'est le **point de départ de tout le projet**. Toutes les données transitent par ce Google Sheet. Les dashboards ne lisent jamais directement les fichiers locaux.

#### Onglets du Google Sheet

---

##### Onglets magasins : `Lingo`, `Stras`, `Eckbo`, `Schilic`, `Illkirch`

Cinq onglets identiques en structure, un par magasin. Contiennent les **données de caisse journalières**.

**Structure interne :**
- Les données sont organisées par mois avec un en-tête de mois (ex: `JUIN`) à la ligne du mois
- Chaque jour est une ligne, identifié par son numéro (1, 2, 3…) en colonne A
- **26 colonnes de données** par ligne, de la colonne B à la colonne AA

**Mapping des 26 colonnes (B à AA) :**

| Col GS | Contenu |
|--------|---------|
| B | Jour (numéro) |
| C | CAISSE (total encaissé) |
| D | TVA 20% |
| E | TVA 5,5% |
| F | TVA 10% |
| G | **CA HT** ← valeur principale utilisée dans les dashboards |
| H | Virement |
| I | Espèces |
| J | Ticket Restaurant |
| K | Chèque |
| L | CB |
| M | TR2 |
| N | CB2 |
| O | Carte TR |
| P | Deliveroo |
| Q | **VIDE** ← colonne vide dans GS, n'existe pas dans le fichier xlsb source |
| R | Caisse |
| S | De côté |
| T | Fond de caisse 1 |
| U | Fond de caisse 2 |
| V | BQ Espèces |
| W | BQ Chèques |
| X | CONNECT |
| Y | **VIDE** ← colonne vide dans GS, n'existe pas dans le fichier xlsb source |
| Z | Libellé |
| AA | Montant |
| AB | Date référence |

> ⚠️ **Point critique pour la maintenance :** Les colonnes Q et Y du Google Sheet sont vides et n'ont pas d'équivalent dans le fichier Excel source (`.xlsb`). Tout script d'import doit gérer ce décalage (voir section 5 — Workflow mensuel).

---

##### Onglet `HISTORIQUE CA HT`

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

##### Onglet `Ventilation CA TTC`

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

**Ordre des colonnes dans le Google Sheet (par catégorie) :**
Pour chaque catégorie : 5 colonnes magasins (Lingo, Stras, Eckbo, Schilic, Illkirch) + 1 colonne total = 6 colonnes. Puis en fin de ligne : grand total (col 43).

---

##### Onglet `Calendrier`

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

### 2. Apps Script — Backend JSON

**Projet Apps Script :** "LPP Suivi CA"
**URL déployée :** `https://script.google.com/macros/s/AKfycbycKoHGdiUe0MREknK8zrduuIou2yqfRMyLo8MSEPN0xxe4F4W3m0w23Y1dT-of9PBU/exec`

Cette URL est **identique pour les 3 dashboards**. Le paramètre `type` détermine quelles données sont retournées.

#### Fichiers dans l'éditeur Apps Script

| Fichier | Rôle | Statut |
|---------|------|--------|
| `Code.gs` | Fonction `doGet()` — sert les données aux dashboards | **Actif, à modifier si évolution** |
| `histo.gs` | Fonctions complémentaires (historique) | Actif |
| `updateJuin2026.gs` | Import Juin 2026 dans les 7 onglets | ✅ Déjà exécuté — ne pas relancer |
| `createCalendrier.gs` | Création de l'onglet Calendrier | ✅ Déjà exécuté — ne pas relancer |

#### Fonctionnement de `doGet()` (Code.gs)

**Appel sans paramètre (ou `type=historique`) :**
- Lit l'onglet `HISTORIQUE CA HT`
- Lit l'onglet `Calendrier`
- Retourne `{ status:'ok', data: [...], calendrier: {...} }`
- Utilisé par : `dashboard_moy_jour.html` et `dashboard_ht.html`

**Appel avec `?type=ttc` :**
- Lit l'onglet `Ventilation CA TTC`
- Retourne `{ status:'ok', data: [...] }`
- Utilisé par : `dashboard_ttc.html`

#### Structure JSON retournée — branche historique

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

#### Structure JSON retournée — branche TTC

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

#### Redéployer après modification de Code.gs

> ⚠️ **Obligatoire après toute modification.** Modifier et sauvegarder sans redéployer n'a aucun effet sur l'URL publique.

1. Sauvegarder (Ctrl+S)
2. **Déployer → Gérer les déploiements**
3. Icône crayon → **Modifier**
4. Version : **Nouvelle version**
5. **Déployer** — l'URL reste identique

---

### 3. Dashboards HTML

**Dépôt GitHub :** https://github.com/deepblue67/lpp
**GitHub Pages :** https://deepblue67.github.io/lpp/

3 fichiers HTML autonomes — aucun framework, aucune dépendance serveur. Chaque fichier contient son propre CSS, son propre JavaScript, et fetchent directement l'Apps Script URL au chargement.

**Dépendances communes (CDN) :**
- Google Fonts Inter : `fonts.googleapis.com`
- Chart.js 4.4.0 : `cdn.jsdelivr.net/npm/chart.js@4.4.0`

---

#### `dashboard_moy_jour.html` — Suivi CA HT Moy/Jour

**URL publique :** https://deepblue67.github.io/lpp/dashboard_moy_jour.html
**Source Apps Script :** `?` (sans paramètre → type=historique)
**Données utilisées :** `HISTORIQUE CA HT` + `Calendrier`

**Objectif :** Suivre l'avancement du mois en cours pour chaque magasin, comparer à l'année N-1, et savoir quel CA journalier est nécessaire pour atteindre l'objectif.

##### Filtre

- **Période** : 6 / 12 / 18 / 24 derniers mois (glissants depuis aujourd'hui)

##### Structure d'un bloc magasin

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

##### Variables JavaScript clés

```javascript
const APPS_SCRIPT_URL = '...'; // URL Apps Script
let rawData = [];              // Données HISTORIQUE CA HT enrichies
let calendrier = {};           // { "juin": { "2026": 21 }, ... }
let CHARTS = {};               // Instances Chart.js par magasin
```

##### Fonctions principales

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

#### `dashboard_ht.html` — Analyse CA HT

**URL publique :** https://deepblue67.github.io/lpp/dashboard_ht.html
**Source Apps Script :** `?` (sans paramètre → type=historique)
**Données utilisées :** `HISTORIQUE CA HT` uniquement (n'utilise pas le Calendrier)

**Objectif :** Analyse approfondie du CA HT sur plusieurs années fiscales, avec comparaisons inter-années, classements et tableaux détaillés.

##### Filtres

- **Magasins** : multi-sélection (tous par défaut)
- **Années fiscales** : multi-sélection (2024-25 et 2025-26 présélectionnées par défaut)
- Barre de filtres actifs affichée si sélection partielle

##### Contenu du dashboard

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

##### Années fiscales connues

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

#### `dashboard_ttc.html` — Ventilation CA TTC

**URL publique :** https://deepblue67.github.io/lpp/dashboard_ttc.html
**Source Apps Script :** `?type=ttc`
**Données utilisées :** `Ventilation CA TTC` uniquement

**Objectif :** Analyser la répartition du CA TTC par type d'activité (midi, livraison, traiteur…) et par magasin.

##### Filtres

- **Magasins** : multi-sélection
- **Mois/Année** : multi-sélection (ex: "Juin 2026", "Mai 2026"…)
- **Activité** : multi-sélection des 7 catégories

##### Contenu du dashboard

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

### 4. Fichiers locaux de travail

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
| `createCalendrier.gs` | Apps Script | Création de l'onglet Calendrier | ✅ Exécuté — ne pas relancer |
| `Code.gs` | Apps Script | Copie locale du doGet() de Apps Script | Référence pour maintenance |
| `snippet_doGet_calendrier.gs` | Apps Script | Archive du snippet Calendrier ajouté à doGet() | Référence uniquement |
| `dashboard_moy_jour.html` | HTML | Dashboard principal Moy/Jour | Déployer sur GitHub Pages |
| `dashboard_ht.html` | HTML | Dashboard Analyse CA HT | Déployer sur GitHub Pages |
| `dashboard_ttc.html` | HTML | Dashboard Ventilation CA TTC | Déployer sur GitHub Pages |
| `README.md` | Markdown | Ce fichier de documentation | À maintenir |

---

### 5. Workflow mensuel de mise à jour des données

À faire chaque fin de mois quand les données de caisse sont disponibles.

#### Prérequis

```bash
pip install pyxlsb
```

#### Étape 1 — Extraire les données du fichier .xlsb

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

#### Étape 2 — Générer le script Apps Script

```bash
cd C:\Users\cdesmottes\Downloads\20260612
python gen_script.py
```

Génère `updateJuillet2026.gs` (adapter le nom du fichier dans `gen_script.py`).

#### Étape 3 — Exécuter le script dans Apps Script

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

#### Étape 4 — Mettre à jour l'onglet Calendrier

Dans l'onglet `Calendrier` du Google Sheet, renseigner le nombre de jours travaillés **prévus** pour le nouveau mois.

#### Étape 5 — Actualiser les dashboards

Cliquer sur **↻ Actualiser** dans chaque dashboard. Les données apparaissent immédiatement.

> ℹ️ Aucun redéploiement Apps Script nécessaire si seules les données ont changé. Le redéploiement n'est nécessaire que si `Code.gs` est modifié.

---

### 6. Points d'attention pour la maintenance

#### ⚠️ Mapping colonnes xlsb ↔ GS — le piège principal

Deux colonnes créent un décalage entre le fichier Excel local et le Google Sheet :
1. **Col 16 du xlsb (Q dans xlsb) est vide** et **n'existe pas dans GS** → à sauter dans l'extraction
2. **Col Y du GS est vide** et **n'existe pas dans xlsb** → insérer `''` à cette position

Si ce mapping est mal appliqué, toutes les colonnes à partir de R ou Y seront décalées **sans erreur apparente** — les données s'écrivent mais dans les mauvaises colonnes. Toujours vérifier 2-3 colonnes après la mise à jour.

#### ⚠️ Scripts one-shot — ne jamais relancer

`updateJuin2026.gs` et `createCalendrier.gs` ont déjà été exécutés. Les relancer écraserait des données existantes. Pour un nouveau mois, créer un nouveau fichier (ex: `updateJuillet2026.gs`).

#### ⚠️ Redéploiement Apps Script obligatoire après modification de Code.gs

Toute modification de `Code.gs` dans l'éditeur Apps Script **doit être suivie d'un nouveau déploiement** (nouvelle version). Sans ça, l'URL publique continue de servir l'ancienne version.

#### ℹ️ Onglet Calendrier — maintenance mensuelle

Renseigner le Calendrier **avant** la fin du mois pour que le bloc "CA/j à réaliser" soit actif. La valeur représente le nombre total de jours travaillés **prévus** pour le mois entier (pas seulement les jours déjà écoulés).

#### ℹ️ N-1 absent = jauge vide

Si l'onglet `HISTORIQUE CA HT` ne contient pas de données pour le même mois de l'année N-1, la jauge, l'Objectif N, l'Écart et le CA/j à réaliser affichent `—`. Les données historiques doivent remonter au moins à l'année précédente pour que le dashboard soit fonctionnel.

#### ℹ️ nb_jours évolue en cours de mois

Le champ `nb_jours` dans `HISTORIQUE CA HT` représente le nombre de jours **déjà saisis**, pas le total prévu. Il augmente à chaque mise à jour des données. L'Objectif N dans le dashboard est donc un "objectif glissant" qui évolue avec le nombre de jours travaillés, pas un objectif fixe de fin de mois. C'est le Calendrier qui fournit la cible fixe de fin de mois.

#### ℹ️ Accès public Apps Script (CORS)

Le `doGet()` est déployé avec accès **"Tout le monde"** (anonyme). C'est nécessaire pour que les dashboards HTML puissent le fetcher sans authentification. Ne pas restreindre l'accès aux utilisateurs connectés — les dashboards cessent de fonctionner.

---

### 7. Évolutions futures possibles

- **Alertes** : envoyer un email automatique si le CA/j nécessaire dépasse un seuil défini
- **Objectif personnalisé** : permettre de saisir un objectif manuel par mois, indépendant du calcul N-1
- **Dashboard consolidé** : vue globale tous magasins sur une seule page avec une jauge synthétique
- **Prévision fin de mois** : projeter le CA total si le rythme Moy/j N se maintient (extrapolation linéaire)
- **Comparaison N vs N-2** : ajouter une deuxième référence historique
- **Mobile** : la grille 270px + chart est responsive à partir de 1000px, à améliorer pour smartphone
- **Export PDF** : bouton d'impression formatée pour les réunions de direction

---

*Dernière mise à jour : 17 juin 2026*
*Magasins : Lingolsheim · Strasbourg · Eckbolsheim · Schiltigheim · Illkirch*

---

## 4. La Petite Pause — Documentation technique CRM/Dashboard (Ventes & Stocks) (source README_VentesEtStocks.md)

*Fichier source original : `README_VentesEtStocks.md`*

## La Petite Pause — Documentation technique du projet CRM/Dashboard

> Document de référence pour la maintenance et l'évolution du projet.
> Rédigé en juin 2026 après audit et correction du bug "perte du vendredi".

---

### Table des matières

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

### 1. Vue d'ensemble

Le projet "La Petite Pause" est un système de reporting multi-magasins composé de :

- **5 fichiers Google Sheets "magasin"** — un par franchise, saisi manuellement par les équipes
- **1 fichier Google Sheets central** ("lapetitepause") — agrège les données de tous les magasins via `IMPORTRANGE`
- **1 fichier Google Sheets "Transferts"** — trace les échanges de produits entre magasins
- **1 dashboard HTML** (`dashboard_ventes_stock.html`) — visualisation interactive, hébergeable localement ou via GitHub Pages
- **Plusieurs scripts Google Apps Script** — setup de l'architecture, corrections, déclencheurs, et API pour le dashboard

#### Flux de données

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

### 2. Inventaire des fichiers

#### Fichiers Google Sheets

| Rôle | Nom | ID Spreadsheet |
|------|-----|----------------|
| Fichier central | La Petite Pause | `1bHK0dRN5A_ELfqCTOFa5fpdSZlqAO9P-VwUb06gZLLc` |
| Magasin Lingolsheim | — | `1JA5s-FXxLLA8j0B329I_3Jhajb07qlHxr2Lf-q7u5kQ` |
| Magasin Strasbourg | — | `11toAvOPl-0aQ5AIPYVUfcblJsmY8FOcs44i0x9RtKCM` |
| Magasin Eckbolsheim | — | `1kFTMcvQRjEGtRCfPLw0jCLBWEzodPHI0Zqg5yP3DfGg` |
| Magasin Schiltigheim | — | `1KR4ntgkx5KGknwe4aLooDm5rRjnAJR4yyP9IN4Jjq_A` |
| Magasin Illkirch | — | `1mpnyMH7DWUyKpJ5cr_93T-HkMMU-NZKYMnwim4cTTSY` |
| Transferts inter-magasins | Registre Transferts | `1HE_bXUlYGXAgbzuNNnjkZN--ryx49SiSrqgm4D7Sk2w` |

#### Fichiers scripts (dans le projet Apps Script du fichier central)

| Fichier | Rôle | État |
|---------|------|------|
| `centralimportange.gs` | Setup complet de l'architecture IMPORTRANGE | Actif — NE PAS relancer sans précaution |
| `fix_perte_vendredi.gs` | Audit et correction ciblée des formules `_FR_x` | Actif — outil de maintenance |
| `declencheur.gs` | Trigger sur le fichier Transferts | Actif |
| `Vendredi HS.gs` | Ancienne correction partielle (uniquement `_FR_3`) | Hors service / obsolète |

#### Fichiers locaux / GitHub

| Fichier | Rôle |
|---------|------|
| `dashboard_ventes_stock.html` | Dashboard interactif tout-en-un |

---

### 3. Architecture des données

#### 3.1 Structure des fichiers magasin

Chaque fichier magasin contient **12 onglets mensuels** nommés exactement `Janvier`, `Février`, `Mars`, `Avril`, `Mai`, `Juin`, `Juillet`, `Août`, `Septembre`, `Octobre`, `Novembre`, `Décembre`.

Chaque onglet mensuel du magasin couvre la plage `A1:AA50` (27 colonnes × 50 lignes).

La colonne **AA** (colonne 27) correspond à la **perte du vendredi** (PDJ).

#### 3.2 Structure du fichier central

##### Onglets cachés de staging `_FR_0` à `_FR_4`

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

##### Onglets mensuels (Janvier → Décembre)

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

##### Onglet DATA

Export plat utilisé par le dashboard. Colonnes attendues :

```
Date | Franchise | Produit | Stock | Vente | Reste | CmdJ1 | Perte
```

Cet onglet est lu par le Apps Script `doGet()` et servi en CSV au dashboard.

#### 3.3 Fichier Transferts inter-magasins

Fichier ID : `1HE_bXUlYGXAgbzuNNnjkZN--ryx49SiSrqgm4D7Sk2w`

Onglet `Transferts` — colonnes attendues par le dashboard :

```
date | produit | quantite | donneur | receveur | note
```

Le `declencheur.gs` surveille ce fichier (trigger `onChange` sur éditions manuelles de l'onglet "Transferts").

---

### 4. Le Dashboard HTML

#### Fichier : `dashboard_ventes_stock.html`

Dashboard autonome (single-file HTML+JS+CSS) sans dépendance backend autre que Google Apps Script.

#### 4.1 Dépendances externes

- **Chart.js 4.4.0** (CDN jsDelivr) — graphiques
- **Google Fonts — Inter** — typographie
- **Google Apps Script** (déployé comme Web App) — API de données

#### 4.2 URL Apps Script active

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyDqicU_NwYNbyiC78nsWxqYeXBC0bjH05u2P4bAorxqhPTmpiZ80aZ53aguq0y__2E/exec';
```

Cette URL est définie **ligne ~323** du fichier HTML. Elle pointe vers le Apps Script déployé dans le fichier central.

#### 4.3 Stratégie de chargement des données (fetchCSV)

Le dashboard tente les sources dans cet ordre de priorité :

1. **Apps Script URL** (résout le problème CORS) — recommandé
2. **Accès direct Google Sheets** (fonctionne depuis un serveur HTTPS)
3. **Proxies CORS publics** (corsproxy.io, allorigins.win, thingproxy, cors.sh) — fallback depuis `file://`

Si tout échoue, le dashboard affiche un guide d'installation Apps Script avec le code à copier-coller.

#### 4.4 Fonctionnalités du dashboard

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

#### 4.5 Méthodologie de calcul des pertes

> Règle importante pour éviter les doubles comptages :

- Le **Plat du Jour (PDJ)** non vendu devient le **Plat de la Veille (PDV)** du lendemain → le "Reste PDJ" n'est **pas** une perte, c'est un recyclage.
- **Pertes réelles = Perte PDJ (vendredis uniquement, colonne `Perte`) + Reste PDV (invendus réels, colonne `Reste` pour le PDV)**
- Le stock entrant **exclut** le PDV (pour éviter de compter deux fois la même production).

#### 4.6 Couleurs des magasins

```javascript
LINGOLSHEIM:  '#F4A261'  (orange clair)
STRASBOURG:   '#E76F51'  (orange-rouge)
ECKBOLSHEIM:  '#2D6A4F'  (vert foncé)
SCHILTIGHEIM: '#F9C74F'  (jaune)
ILLKIRCH:     '#52B788'  (vert clair)
```

#### 4.7 Comment ouvrir le dashboard

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

### 5. Les scripts Google Apps Script

#### 5.1 `centralimportange.gs` — Setup de l'architecture

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

#### 5.2 `fix_perte_vendredi.gs` — Outil d'audit et correction

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

#### 5.3 `declencheur.gs` — Déclencheur Transferts

Trigger installé sur le fichier Transferts (`1HE_bXUl...`).
Se déclenche uniquement sur éditions manuelles de l'onglet "Transferts" (pas les modifications programmatiques).
N'affecte pas le fichier central.

#### 5.4 `Vendredi HS.gs` — Script obsolète

Ancienne tentative de correction, ciblant uniquement `_FR_3` (Schiltigheim) et uniquement la colonne AL→AA.
Portée trop étroite. Remplacé par `fix_perte_vendredi.gs`. Peut être supprimé.

#### 5.5 Code Apps Script embarqué dans le dashboard

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

### 6. Problèmes rencontrés et solutions appliquées

#### 6.1 Bug "perte du vendredi" — colonnes erronées dans les onglets mensuels

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

#### 6.2 Timeout Apps Script à 6 minutes

Tout script Apps Script sur compte Google consommateur est limité à **6 minutes d'exécution**.

`setupImportRange()` fait des milliers d'appels `setFormula()` individuels → dépasse systématiquement cette limite si le fichier est complet.

**Règles à respecter pour tout nouveau script :**
- Préférer `setValues()` en une seule fois sur un bloc (batch write) plutôt que des `setFormula()` un par un
- Éviter `getLastRow()` / `getLastColumn()` sur des feuilles avec mise en forme étendue (résultat faussé + lent)
- Ne pas utiliser `insertSheet()` / `deleteSheet()` dans des scripts qui tournent longtemps : ces opérations peuvent déclencher des triggers `onChange` installés, provoquant des exécutions en cascade et ralentissant encore l'exécution

#### 6.3 Problème CORS du dashboard en `file://`

Chrome bloque les requêtes vers des APIs externes quand le fichier HTML est ouvert depuis le disque local (`file://`).

**Solutions par ordre de préférence :**
1. URL Apps Script (déjà configurée, contourne CORS)
2. Serveur Python local (`python -m http.server 8080`)
3. GitHub Pages

---

### 7. Points d'attention pour la maintenance

#### 7.1 Ne jamais relancer `setupImportRange()` à la légère

Ce script réécrit toutes les formules de tous les onglets mensuels du fichier central. Il dépasse la limite de 6 minutes et laissera l'état du fichier dans un état partiel/incohérent. Si une correction ponctuelle est nécessaire, utiliser `fix_perte_vendredi.gs` à la place.

#### 7.2 L'onglet DATA doit correspondre au format attendu

Le dashboard s'attend à des colonnes précises dans l'onglet DATA du fichier central :
`Date | Franchise | Produit | Stock | Vente | Reste | CmdJ1 | Perte`

Toute modification de la structure de cet onglet cassera le dashboard. Les noms de colonnes sont parsés par le `parseCSV()` du dashboard qui mappe directement les entêtes.

#### 7.3 Les noms des magasins sont sensibles à la casse

Le dashboard et les formules distinguent `LINGOLSHEIM` (majuscules, dans l'onglet DATA) de `Lingolsheim` (mixte, dans le module Transferts). Les deux coexistent dans le code. Si un nouveau magasin est ajouté, vérifier la cohérence dans :
- `MAGASIN_ORDER` du dashboard (ligne ~328)
- `COLORS` du dashboard
- `MAG_COLORS_TR` du dashboard (section transferts)
- `FR_SS_IDS` de `centralimportange.gs`

#### 7.4 L'URL Apps Script doit être mise à jour si le déploiement est recréé

L'URL `APPS_SCRIPT_URL` dans le dashboard (ligne ~323) est liée à un déploiement spécifique. Si le Apps Script est supprimé et redéployé, une nouvelle URL sera générée — il faudra mettre à jour le dashboard et le republier.

#### 7.5 La "perte du vendredi" est la seule colonne Perte réellement utilisée

Dans la structure actuelle, la colonne `Perte` n'est alimentée que le **vendredi** (colonnes W à AA, offset +4). Les autres jours, la perte est nulle ou non renseignée. C'est un choix métier : les pertes sont constatées en fin de semaine le vendredi.

#### 7.6 Le Plat de la Veille est un cas spécial dans les calculs

Le PDV est le seul produit pour lequel "perte réelle = colonne `Reste`" (et non colonne `Perte`). Cette logique est implémentée dans le dashboard (voir `renderDashboard`) et doit être préservée si de nouveaux produits sont ajoutés.

#### 7.7 Vérifier les autorisations IMPORTRANGE après ajout d'un nouveau magasin

Toute nouvelle formule `IMPORTRANGE` vers un fichier tiers nécessite une autorisation manuelle dans Google Sheets (le propriétaire du fichier central doit cliquer "Autoriser l'accès" lors de la première ouverture).

---

### 8. Procédures utiles

#### Vérifier l'intégrité des formules `_FR_x` (audit)

1. Ouvrir [script.google.com](https://script.google.com/)
2. Sélectionner le projet attaché au fichier central
3. Lancer la fonction `auditFRReferences()` de `fix_perte_vendredi.gs`
4. Consulter l'onglet `Audit_FR_References` créé dans le fichier central
5. Si des anomalies sont listées, lancer `fixFRReferences()`
6. Supprimer l'onglet `Audit_FR_References` une fois terminé

#### Forcer le rechargement du dashboard

Cliquer le bouton **Actualiser** en haut à droite — le dashboard recharge les données depuis Apps Script sans recharger la page. Utile après une correction dans Google Sheets.

#### Ajouter un nouveau magasin

1. Créer le fichier Google Sheets du nouveau magasin avec les 12 onglets mensuels en `A1:AA50`
2. Ajouter son ID dans `FR_SS_IDS` de `centralimportange.gs`
3. Mettre à jour `MAGASIN_ORDER`, `COLORS`, `MAG_COLORS_TR` dans le dashboard HTML
4. Recréer les onglets staging `_FR_x` et les formules (via `setupImportRange()` — attention au timeout)
5. Republier le dashboard HTML

#### Redéployer le Apps Script (si URL expirée)

1. Ouvrir le projet Apps Script du fichier central
2. Déployer → Gérer les déploiements → Créer un nouveau déploiement
3. Type : Application Web / Accès : Tout le monde
4. Copier la nouvelle URL
5. Mettre à jour `APPS_SCRIPT_URL` dans `dashboard_ventes_stock.html` (ligne ~323)
6. Republier le fichier HTML (GitHub ou autre)

---

### 9. Pistes d'évolution

#### Court terme
- **Supprimer `Vendredi HS.gs`** — script obsolète, remplacé par `fix_perte_vendredi.gs`
- **Ajouter `?type=transferts` au Apps Script** si ce n'est pas encore déployé (pour que la section Transferts du dashboard soit fonctionnelle)
- **Ajouter l'export CSV de l'onglet DATA** au même Apps Script `doGet()` si ce n'est pas déjà fait

#### Moyen terme
- **Batch write dans `setupImportRange()`** : réécrire la fonction pour construire toutes les formules en mémoire et les écrire en un seul `setValues()` par onglet — élimine le risque de timeout
- **Automatisation de l'onglet DATA** : un script planifié (trigger horaire ou quotidien) qui reconstruit l'onglet DATA à partir des onglets mensuels, pour ne pas dépendre d'une mise à jour manuelle
- **Alertes email** : trigger Apps Script hebdomadaire qui envoie un email récapitulatif si le taux de perte dépasse un seuil

#### Long terme
- **Hébergement sur GitHub Pages** : le dashboard HTML peut être servi directement depuis un dépôt GitHub public, accessible depuis n'importe quel navigateur sans installation
- **Séparation Code.gs** : le Apps Script `doGet()` qui sert les données mériterait d'être un script dédié et versionné séparément du setup
- **Ajout d'une vue "comparaison semaine N vs N-1"** dans le dashboard

---

*Dernière mise à jour : juin 2026*
*Auteur : CDS / La Petite Pause*
