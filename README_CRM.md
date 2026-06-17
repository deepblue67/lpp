# CRM Rakhel — Dashboard Prospects

Dashboard web pour la gestion des prospects franchise, hébergé sur GitHub Pages et connecté à Google Sheets via Apps Script.

---

## Architecture

```
GitHub Pages (static)          Google Apps Script (backend)         Google Sheets
dashboard_CRM.html     ──►     Code.gs (Web App)            ──►     Spreadsheet
(HTML/JS/CSS)          ◄──     GET → JSON prospects         ◄──     onglet "Prospects"
                               POST → add / update
```

- **Pas de serveur** : le HTML est 100% statique, Apps Script joue le rôle d'API REST avec gestion CORS automatique.
- **Pas de build** : un seul fichier HTML auto-suffisant, déployable par simple `git push`.

---

## URLs & identifiants

| Ressource | Valeur |
|-----------|--------|
| GitHub Pages | `https://deepblue67.github.io/lpp/dashboard_CRM.html` |
| Apps Script Web App | `https://script.google.com/macros/s/AKfycbyTLZcAbsKrpVvJxgnOnFbntPRnaZj60KZTmIoOQ_KmztwdPojqFEAgLIwTGoFH14kT/exec` |
| Google Sheet ID | `1Lq1XEwUhhYAI6UwigQEYUdb-_A_WDsgkqnCJwNSoyWs` |
| Onglet | `Prospects` |

---

## Structure du Google Sheet

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

## Fichiers du projet

```
CRM/dashboard/
├── dashboard_CRM.html   # Application complète (HTML + CSS + JS inline)
├── Code.gs              # Google Apps Script (backend API)
└── README.md            # Ce fichier
```

---

## Fonctionnalités du dashboard

### KPI Cards (5 boxes cliquables)
- **Total prospects** : remet tous les filtres à zéro
- **Notes élevées (≥4)** : filtre les prospects chauds
- **Rappels en retard** : rappels dont la date est passée
- **Rappels cette semaine** : rappels dans les 7 prochains jours
- **Visios planifiées** : prospects avec une date visio renseignée

> Cliquer une seconde fois sur une box active désactive le filtre.  
> Cliquer une box synchronise également le `<select>` de filtre correspondant dans la barre de filtres.

### Graphiques (3 charts Chart.js 4.4.0, cliquables)
- **Par source** : bar chart — cliquer une barre filtre par source
- **Par note** : bar chart — cliquer une barre filtre par note
- **Par ville** : bar horizontal — cliquer une barre filtre par ville

### Barre de filtres
- Recherche texte libre (nom, ville, email, source, apport)
- Filtre Source (liste déroulante auto-générée)
- Filtre Note (0 à 5)
- Filtre Ville (liste déroulante auto-générée)
- Filtre Rappel (En retard / Cette semaine)
- Filtre Type de contact (Téléphone / Mail / Rencontre)
- Filtre Statut (Actif / Inactif)
- Bouton ✕ reset tous les filtres

### Table des prospects
- Pagination 25 lignes par page
- Tri par colonne (clic sur en-tête)
- Colonnes : Prospect, Source, Date contact, Apport, Ville, Date rappel, Note, Type contact, Statut, Téléphone
- Lignes inactives grisées (opacity 0.45)
- Clic sur le nom → ouvre la fiche d'édition

### Modal Ajout prospect
- Champs : Nom*, Téléphone, Email, Source (saisie libre + autocomplete), Apport, Ville, Date contact, Type contact, Date rappel, Présentation envoyée, Date visio, Note initiale, Note actuelle, Profil, Notes
- La source saisie apparaît automatiquement dans la liste autocomplete lors des prochaines utilisations

### Modal Édition / Fiche prospect
- Mêmes champs que l'ajout
- Mise à jour locale immédiate sans rechargement de page

---

## Code.gs — Points clés

### Déploiement Apps Script
1. Ouvrir [script.google.com](https://script.google.com) → projet **CRM Rakhel**
2. Coller le contenu de `Code.gs`
3. **Déployer → Gérer les déploiements → icône crayon → Nouvelle version → Déployer**
4. ⚠️ Toujours choisir **"Nouvelle version"** sur le déploiement existant — ne pas créer un nouveau déploiement (l'URL changerait)

### Fonctions de migration (à exécuter une seule fois)

```
migrateTypeContact()   — Parse la colonne F (ex: "Tel le 26/01/2024")
                         → écrit le type en col P, nettoie la date en col F

migratePresentation()  — Parse la colonne H (ex: "oui le 26/01/24")
                         → ne garde que la date
```

Pour les exécuter : dans l'éditeur Apps Script, sélectionner la fonction dans le menu déroulant → **Exécuter**. Le résultat s'affiche dans le **Journal d'exécution**.

### Gestion des dates
- Le Sheet stocke les dates en `dd/MM/yyyy` (texte ou objet Date)
- `formatDateCell()` dans Code.gs normalise les deux formats vers `dd/MM/yyyy`
- `toInputDate()` dans le HTML convertit `dd/MM/yyyy` → `yyyy-MM-dd` (format `<input type="date">`)
- `fromInputDate()` fait l'inverse pour la sauvegarde
- `toInputDate()` gère aussi les chaînes brutes JS type `"Thu May 22 2025 09:00:00 GMT+0200"` que Sheets peut renvoyer pour certaines cellules

---

## Points d'attention pour la maintenance

### 1. Ne jamais réorganiser les colonnes du Sheet sans mettre à jour Code.gs
`doGet` lit par index (`r[0]`, `r[1]`...) et `buildRow` écrit dans le même ordre. Si une colonne est insérée ou déplacée dans le Sheet, les deux fonctions doivent être mises à jour.

### 2. Ajouter une colonne → 3 endroits à modifier
- `doGet` : ajouter la lecture de `r[N]`
- `buildRow` : ajouter la valeur en position correspondante
- `dashboard_CRM.html` : affichage table, filtres, modals, fonctions save

### 3. Redéploiement Apps Script obligatoire après chaque modification de Code.gs
Enregistrer seul ne suffit pas — il faut créer une **nouvelle version** du déploiement existant.

### 4. Source : saisie libre avec autocomplete
Le champ Source est un `<input type="text" list="sources-list">` (pas un `<select>`). La datalist est peuplée dynamiquement depuis les données. Une nouvelle source saisie par l'utilisateur sera disponible dans l'autocomplete dès le rechargement suivant (après sauvegarde dans le Sheet).

### 5. Index-based onclick (bug fix appliqué)
Les boutons "nom de prospect" dans la table utilisent `data-idx="${realIdx}"` + `onclick="openFiche(this.dataset.idx)"` au lieu d'embarquer le JSON du prospect dans l'attribut onclick. Cela évite les bugs avec les apostrophes et caractères spéciaux dans les noms. **Ne pas revenir à l'ancienne méthode JSON-in-onclick.**

### 6. String() sur les valeurs du Sheet
Certaines cellules numériques ou vides remontent comme non-string depuis Apps Script. Toujours utiliser `String(p.ville || "").trim()` et non `p.ville.trim()` directement — voir notamment les fonctions de filtre et de chart.

### 7. Test en local impossible
Le dashboard appelle l'URL Apps Script au chargement. En local (fichier ouvert directement dans le navigateur ou serveur HTTP local), la requête échoue à cause de CORS ou de timeout. **Tester toujours sur GitHub Pages.**

### 8. Données de démo embarquées
Le fichier HTML contient un tableau `DEMO_DATA` (15 prospects fictifs) utilisé comme fallback si l'appel Apps Script échoue. Ne pas supprimer — permet de voir le dashboard fonctionner même sans connexion au Sheet.

---

## Évolutions possibles

- **Colonne "Statut avancement"** : pipeline visuel type Kanban (Nouveau → Contacté → Présenté → Visio → En cours → Signé / Abandonné)
- **Export CSV / Excel** depuis le dashboard
- **Graphique temporel** : évolution du nombre de prospects par mois
- **Notifications** : alerte par email (Apps Script `MailApp`) pour les rappels en retard
- **Authentification** : actuellement l'Apps Script est public (`accès Tout le monde`) — ajouter une protection par token si nécessaire
- **Pagination côté serveur** : si la base dépasse ~1000 prospects, envisager de paginer les appels GET
- **Colonne "Canal acquisition"** distincte de Source : distinguer le support (salon, web, recommandation) du média (Franchise Direct, WordPress...)

---

## Historique des migrations de données

| Date | Fonction | Description |
|------|----------|-------------|
| Juin 2026 | `migrateTypeContact()` | Extraction type contact depuis col F, nettoyage dates col F, création col P |
| Juin 2026 | `migratePresentation()` | Nettoyage col H : suppression "oui le", conservation date seule |
