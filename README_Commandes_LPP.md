# Commandes LPP — Documentation complète

> Système de gestion des commandes pour la chaîne **La Petite Pause (LPP)**  
> 5 magasins : Lingolsheim · Strasbourg · Eckbolsheim · Schiltigheim · Illkirch

---

## Table des matières

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

## 1. Vue d'ensemble

### Objectif

Chaque semaine, les 5 magasins LPP passent deux types de commandes :
- **Commande Cuisine Centrale** : produits fabriqués en interne (salades, sauces, etc.)
- **Commande Fournisseurs** : produits achetés à l'extérieur

Le fichier Google Sheets centralise :
1. La liste des produits disponibles (avec activation/désactivation par produit)
2. La génération automatique des **fiches de saisie** pour chaque magasin
3. La **synthèse automatique** des quantités saisies par les magasins

### Fichier Google Sheets

- **ID** : `1GczULcs2NczGTWg5vehi4QyojpjDH2Xq-62UZCdFAIQ`
- **Script** : `Commandes_LPP.gs` (Extensions > Apps Script dans Google Sheets)

---

## 2. Architecture du fichier Google Sheets

### Ordre fixe des onglets

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

## 3. Structure des onglets

### 3.1 Onglets référentiels (`Produits C.Centrale` et `Produits Fournisseurs`)

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

### 3.2 Fiches magasin (`Commande Lingo`, etc.)

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

### 3.3 Onglet PROD (synthèse cuisine centrale)

- **7 colonnes** : Produit | Lingo | Stras | Eckbo | Schil | Illki | TOTAL
- Lecture automatique de la **colonne C** de chaque fiche magasin
- Thème **bleu marine**
- Le TOTAL est calculé par le script (pas de formule dans la cellule)
- Lignes 1-4 gelées
- Généré/regénéré à la demande via le menu

### 3.4 Onglet FOUR (synthèse fournisseurs)

- **7 colonnes** : Produit | Lingo | Stras | Eckbo | Schil | Illki | TOTAL
- Lecture automatique de la **colonne G** de chaque fiche magasin
- Thème **vert foncé**
- Structure identique à PROD
- Toujours inséré immédiatement **après** PROD

### 3.5 Onglet Allergènes Été 2026

- **17 colonnes** : Produit | Origine viande | Labels | 14 allergènes
- Allergènes : Gluten, Crustacés, Œufs, Poissons, Arachide, Soja, Lait, Fruits à coques, Céleri, Moutarde, Sésame, Lupin, Mollusques, Sulfites
- Présence = `●` fond terracotta (`#C17367`) | Absence = fond gris pâle (`#F0EEEE`)
- En-têtes allergènes **inclinés à 55°** pour compacité
- Thème pastel terracotta
- **Créé une seule fois** depuis l'éditeur Apps Script

### 3.6 Onglet Recettes & Compo

- **2 colonnes** : Produit (215 px) | Composition/Ingrédients (640 px)
- `setWrap(true)` activé sur la colonne description
- Thème indigo
- **Créé une seule fois** depuis l'éditeur Apps Script

---

## 4. Installation et premier démarrage

### Étape 1 — Copier le script

1. Ouvrir le Google Sheet (`1GczULcs2NczGTWg5vehi4QyojpjDH2Xq-62UZCdFAIQ`)
2. Menu **Extensions > Apps Script**
3. Coller le contenu de `Commandes_LPP.gs` dans l'éditeur
4. **Sauvegarder** (Ctrl+S ou ⌘S)

### Étape 2 — Exécuter setupScript

1. Dans le menu déroulant des fonctions, sélectionner **`setupScript`**
2. Cliquer ▶ **Exécuter**
3. Google demande des autorisations → **Autoriser**
4. Vérifier dans les logs : `✅ Trigger installé sur : [nom du fichier]`

> `setupScript` installe un **trigger permanent** `onOpen` : le menu 🍽️ apparaîtra à chaque ouverture du fichier, même sans repasser par l'éditeur.

### Étape 3 — Créer les onglets de référence (une seule fois)

Ces fonctions se lancent depuis l'éditeur Apps Script (pas depuis le menu) :

```
creerOngletAllergenes()   → crée l'onglet "Allergènes Été 2026"
creerOngletRecettes()     → crée l'onglet "Recettes & Compo"
```

Vérifier dans les logs Apps Script que les confirmations `✅` s'affichent.

### Étape 4 — Vérifier la position des onglets

Après création, l'ordre attendu est :
```
[Produits C.Centrale] [Produits Fournisseurs] ... [Allergènes Été 2026] [Recettes & Compo]
```
Les onglets PROD et FOUR n'existent pas encore — ils seront générés via le menu.

---

## 5. Utilisation au quotidien

### Workflow type (début de semaine)

```
1. Ouvrir le Google Sheet
2. 🍽️ Menu LPP > 🔄 Générer TOUTES les fiches commande
   → Choisir OUI (régénérer) ou NON (mettre à jour en conservant les saisies)
3. Les responsables de chaque magasin saisissent les QTÉ dans leur fiche
4. 🍽️ Menu LPP > 📋 Générer la commande centrale (PROD)
5. 🍽️ Menu LPP > 🟢 Générer la commande fournisseurs (FOUR)
```

### Options du menu

| Action | Description |
|--------|-------------|
| 📋 Générer la commande centrale (PROD) | Relit toutes les fiches et reconstruit l'onglet PROD |
| 🟢 Générer la commande fournisseurs (FOUR) | Relit toutes les fiches et reconstruit l'onglet FOUR |
| 🔄 Générer TOUTES les fiches | Génère/régénère les 5 fiches (avec dialog OUI/NON/Annuler) |
| 🔄 Générer — [Magasin] | Génère/régénère une seule fiche |
| 🗑️ Vider TOUTES les fiches | Efface les quantités saisies (confirmation requise) |
| 🗑️ Vider — [Magasin] | Efface les saisies d'un seul magasin |

### Dialogs de confirmation

- **OUI** → Régénérer (structure + contenu rechargés depuis les onglets référentiels, saisies effacées)
- **NON** → Mettre à jour (structure rechargée, saisies **conservées**)
- **Annuler** → Ne rien faire

---

## 6. Référence des fonctions Apps Script

### Fonctions publiques (menu)

| Fonction | Déclencheur | Description |
|----------|-------------|-------------|
| `onOpen(e)` | Trigger installé + ouverture fichier | Affiche le menu LPP |
| `genererFiches()` | Menu | Génère les 5 fiches (avec dialog) |
| `genererFicheLingo/Stras/Eckbo/Schil/Illki()` | Menu | Génère une fiche individuelle |
| `genererCommandeCentrale()` | Menu | Construit/reconstruit l'onglet PROD |
| `genererCommandeFournisseur()` | Menu | Construit/reconstruit l'onglet FOUR |
| `viderToutesLesFiches()` | Menu | Vide les QTÉ des 5 fiches |
| `viderLingolsheim/Strasbourg/...()` | Menu | Vide les QTÉ d'une fiche |

### Fonctions d'initialisation (depuis l'éditeur uniquement)

| Fonction | Description |
|----------|-------------|
| `setupScript()` | Installe le trigger `onOpen` permanent |
| `creerOngletAllergenes()` | Crée l'onglet Allergènes (opération unique) |
| `creerOngletRecettes()` | Crée l'onglet Recettes & Compo (opération unique) |

> Ces fonctions utilisent `Logger.log()` au lieu de `ss.toast()` car elles s'exécutent depuis l'éditeur, un contexte où `toast()` n'est pas disponible.

### Fonctions internes (privées, préfixées `_`)

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

## 7. Configuration (constantes)

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

## 8. Palettes de couleurs

### Palette principale (fiches + PROD + FOUR)

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

### Palette allergènes (terracotta pastel)

| Constante | Hex | Usage |
|-----------|-----|-------|
| `TITLE_BG` | `#6D3B2E` | Titre |
| `CAT_BG` | `#8B5E52` | En-têtes catégories |
| `HDR_BG` | `#EDD5CF` | Fond en-têtes colonnes |
| `PRESENT_BG` | `#C17367` | Fond allergène présent |
| `ABSENT_BG` | `#F0EEEE` | Fond allergène absent |

### Palette recettes (indigo)

| Constante | Hex | Usage |
|-----------|-----|-------|
| `TITLE_BG` | `#283593` | Titre |
| `CAT_BG` | `#3949AB` | En-têtes catégories |
| `HDR_BG` | `#C5CAE9` | Fond en-têtes |
| `ALT_ROW` | `#E8EAF6` | Alternance lignes paires |

---

## 9. Pièges et points d'attention

### ⚠️ Renommage d'onglets

**Problème** : si un onglet est renommé manuellement dans Google Sheets, toutes les fonctions qui y font référence échouent silencieusement (l'onglet devient introuvable).

**Règle** : tout renommage d'onglet **doit** être accompagné de la mise à jour de la constante correspondante dans le script.

Correspondances critiques :
```
SHEET_CENTRALE  = 'Produits C.Centrale'   ← doit correspondre exactement
SHEET_FOURN     = 'Produits Fournisseurs' ← idem
STORES[x].name  = 'Commande Lingo' etc.  ← idem
'PROD' et 'FOUR' ← noms hardcodés dans genererCommandeCentrale/Fournisseur
```

### ⚠️ Ajout d'une catégorie dans les référentiels

Si vous ajoutez une **nouvelle catégorie** dans `Produits C.Centrale` ou `Produits Fournisseurs` :
- Vérifier que `N_CATS_CENTRALE` ou `N_CATS_FOURN` reste cohérent avec le nombre réel de catégories dans la feuille
- Chaque catégorie = exactement 5 colonnes (pas plus, pas moins)

### ⚠️ Performance des écritures

Le script utilise des **écritures en bloc** (`setValues`, `setBackgrounds`, `setFontColors`) pour éviter les timeouts. Ne jamais réécrire ces sections en boucles cellule par cellule : avec 80+ produits × 7 colonnes, cela dépasserait les quotas d'Apps Script.

### ⚠️ Position des onglets

Les onglets PROD et FOUR sont **toujours supprimés et recréés** lors d'une génération. Leur position finale dépend du calcul dans le script :
- PROD : après `SHEET_CENTRALE` et `SHEET_FOURN`
- FOUR : après PROD
- Fiches magasin : après PROD et FOUR

Si un onglet fixe manque (ex : PROD supprimé manuellement), le fallback est une position index 2 ou 3. Pas de bug, mais la position peut être inattendue.

### ⚠️ Données allergènes et recettes

Les données des onglets Allergènes et Recettes sont **hardcodées dans le script** (fonctions `_getAllergenesData()` et `_getRecettesData()`). Elles correspondent à la carte **Été 2026**.

Lors d'un changement de carte :
1. Modifier les données dans ces fonctions
2. Relancer `creerOngletAllergenes()` et/ou `creerOngletRecettes()` depuis l'éditeur Apps Script (l'onglet existant sera d'abord supprimé puis recréé)

### ⚠️ Trigger et autorisations

Le trigger `onOpen` est **installé** (pas simple-trigger). Cela signifie :
- Il persiste même si vous fermez et rouvrez Apps Script
- Il nécessite les autorisations Google au premier lancement
- Si les autorisations sont révoquées, relancer `setupScript()` et réautoriser

Pour vérifier les triggers actifs : Apps Script > menu "Triggers" (horloge dans la barre latérale).

### ⚠️ Sauvegarde/restauration des QTÉ

Lors d'une mise à jour (option NON), le script sauvegarde les quantités avec des clés composites :
- `L|[nom produit]` pour la colonne C (cuisine centrale)
- `R|[nom produit]` pour la colonne G (fournisseurs)

Si un produit est **renommé** dans les référentiels, la quantité sauvegardée ne sera pas restaurée (clé introuvable). C'est un comportement attendu : la fiche est mise à jour avec les nouveaux noms.

---

## 10. Limites connues de Google Apps Script

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

## 11. Évolutions futures envisagées

### 11.1 Envoi automatique par email (FOUR)

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

### 11.2 Changement de carte (passage Été → Automne, etc.)

- Mettre à jour les données dans `_getAllergenesData()` et `_getRecettesData()`
- Mettre à jour `SHEET_ALLERGENES` si le nom de l'onglet change
- Régénérer les deux onglets depuis l'éditeur
- Mettre à jour `N_CATS_CENTRALE` / `N_CATS_FOURN` si des catégories sont ajoutées/supprimées

### 11.3 Ajout d'un 6e magasin

1. Ajouter une entrée dans le tableau `STORES`
2. Ajouter les fonctions `genererFiche[Nom]()` et `vider[Nom]()` correspondantes
3. Les mettre dans le menu (`_addMenu`)
4. PROD et FOUR s'adapteront automatiquement (ils lisent `STORES` dynamiquement)

### 11.4 Protection des cellules

Pour éviter les modifications accidentelles des colonnes non saisies dans les fiches, il serait possible de protéger les colonnes A, B, D, E, F via `sheet.protect()`. À activer si les utilisateurs modifient involontairement la structure.

### 11.5 Historique des commandes

Actuellement, PROD et FOUR sont écrasés à chaque génération. Pour garder un historique :
- Nommer les onglets avec la date : `PROD_2026-06-17`
- Ou archiver dans un fichier Sheets séparé via `SpreadsheetApp.openById(ID_ARCHIVE)`

---

## Annexe — Fichier source original

Les onglets Allergènes et Recettes ont été reconstruits à partir du fichier :
`Copie de Commande magasin carte ETE 2026.xls`

Les données allergènes dans le XLS original étaient encodées par **couleur de fond de cellule** (jaune = présent, gris = absent), extraites via Python `xlrd` avec `formatting_info=True`. Ces données sont maintenant directement hardcodées dans le script — le fichier XLS n'est plus nécessaire.

---

*Dernière mise à jour : juin 2026*
