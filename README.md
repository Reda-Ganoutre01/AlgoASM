# AlgoASM — Visualiseur d'Algorithmes

**AlgoASM** est une application web interactive conçue pour visualiser de manière dynamique les algorithmes fondamentaux en informatique. Le projet propose une interface moderne et intuitive pour explorer étape par étape le fonctionnement des algorithmes de tri, des structures d'arbres et des algorithmes de parcours de graphes.

**Auteurs :** Reda Ganoutre & Youssef Elmeliani

---

## 🌟 Fonctionnalités Principales

Le visualiseur est divisé en trois modes principaux :

### 1. Algorithmes de Tri (Sort)
Permet de visualiser en temps réel les échanges et comparaisons des éléments d'un tableau.
* **Tri à bulles** (Bubble Sort)
* **Tri par sélection** (Selection Sort)
* **Tri par insertion** (Insertion Sort)
* **Tri rapide** (Quick Sort)
* **Tri fusion** (Merge Sort)

### 2. Arbres (Trees)
Insertion et construction d'arbres avec animations fluides des nœuds et des liens.
* **Arbre binaire de recherche** (BST - Binary Search Tree)
* **Arbre Rouge-Noir** (RBT - Red-Black Tree) avec gestion de l'équilibrage.

### 3. Graphes (Graphs)
Visualisation de la traversée et de la découverte des nœuds au sein d'un graphe.
* **Parcours en largeur** (BFS - Breadth-First Search)
* **Parcours en profondeur** (DFS - Depth-First Search)

---

## 🛠️ Outils et Technologies
* **HTML5** : Structure de l'application (`index.html`).
* **CSS3** : Design moderne, animations fluides, mode sombre, responsive design (`style.css`).
* **JavaScript (Vanilla)** : Logique algorithmique, manipulation du DOM et gestion du rendu sur Canvas (`script.js`).
* Aucune bibliothèque externe n'est requise.

---

## 🚀 Comment utiliser l'application

1. Clonez ce dépôt ou téléchargez les fichiers.
2. Ouvrez simplement le fichier `index.html` dans votre navigateur web préféré (Chrome, Firefox, Edge, etc.).
3. Cliquez sur **"CLICK TO CONTINUE"** à l'écran de démarrage.
4. Sélectionnez la catégorie de votre choix via la roue animée (Sort, Trees, Graph).
5. Utilisez le menu supérieur pour configurer la taille des données (`N`), la vitesse (`SPD`), et sélectionnez l'algorithme désiré.
6. Cliquez sur **▶ START** pour lancer l'animation, ou **▸ STEP** pour avancer étape par étape.
7. Vous pouvez également interagir avec le clavier :
   * `Espace` : Lecture / Pause
   * `Flèche Droite` : Avancer d'une étape
   * `R` : Réinitialiser
   * `+ / -` : Modifier la vitesse

---

## 📊 Tableau de bord et Statistiques
Pendant l'exécution d'un algorithme, la barre latérale affiche :
* Le nombre de **comparaisons** et d'**échanges**.
* La **complexité algorithmique** théorique (Meilleur, Moyen, Pire, Espace mémoire).
* Le **pseudo-code** de l'algorithme avec surlignage de l'étape courante en temps réel.
* Une légende dynamique et des informations détaillées selon l'algorithme choisi.
