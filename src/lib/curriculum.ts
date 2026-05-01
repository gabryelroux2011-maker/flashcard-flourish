// Référentiel scolaire français — Collège (5ème → 3ème) + Lycée (2nde → Terminale)
// Basé sur les programmes officiels de l'Éducation nationale (BO).
// Structure : Niveau → Matière → Chapitres/Thèmes

export interface SubjectChapters {
  subject: string;
  /** Icône emoji pour identifier la matière visuellement */
  icon: string;
  /** Couleur tailwind (gradient) */
  gradient: string;
  /** Spécialité (lycée) ou tronc commun */
  kind?: "tronc-commun" | "specialite" | "option";
  chapters: string[];
}

export interface LevelCurriculum {
  id: string;
  label: string;
  short: string;
  stage: "college" | "lycee";
  gradient: string;
  subjects: SubjectChapters[];
}

// Palettes par matière (réutilisées)
const S = {
  maths: { icon: "🧮", gradient: "from-blue-500 to-indigo-600" },
  francais: { icon: "📚", gradient: "from-rose-500 to-pink-600" },
  histgeo: { icon: "🌍", gradient: "from-amber-500 to-orange-600" },
  emc: { icon: "⚖️", gradient: "from-slate-500 to-zinc-600" },
  svt: { icon: "🌱", gradient: "from-emerald-500 to-green-600" },
  pc: { icon: "⚗️", gradient: "from-cyan-500 to-blue-600" },
  techno: { icon: "🛠️", gradient: "from-stone-500 to-amber-700" },
  anglais: { icon: "🇬🇧", gradient: "from-red-500 to-rose-600" },
  espagnol: { icon: "🇪🇸", gradient: "from-yellow-500 to-orange-500" },
  allemand: { icon: "🇩🇪", gradient: "from-zinc-700 to-red-600" },
  arts: { icon: "🎨", gradient: "from-fuchsia-500 to-purple-600" },
  musique: { icon: "🎵", gradient: "from-violet-500 to-purple-600" },
  eps: { icon: "⚽", gradient: "from-lime-500 to-emerald-600" },
  philo: { icon: "🦉", gradient: "from-indigo-500 to-violet-700" },
  ses: { icon: "📈", gradient: "from-teal-500 to-cyan-600" },
  nsi: { icon: "💻", gradient: "from-sky-600 to-blue-800" },
  si: { icon: "⚙️", gradient: "from-gray-600 to-slate-800" },
  llcer: { icon: "🗣️", gradient: "from-pink-500 to-rose-700" },
  hggsp: { icon: "🏛️", gradient: "from-orange-600 to-red-700" },
  hlp: { icon: "📜", gradient: "from-amber-600 to-yellow-700" },
  smtc: { icon: "🎶", gradient: "from-purple-600 to-fuchsia-700" },
  artspe: { icon: "🖼️", gradient: "from-pink-600 to-purple-700" },
  snt: { icon: "📡", gradient: "from-blue-400 to-indigo-500" },
  ses_tc: { icon: "💼", gradient: "from-teal-400 to-emerald-600" },
};

// =====================================================================
// COLLÈGE — Cycle 4 (5ème, 4ème, 3ème)
// =====================================================================

const collegeCommon = (level: "5e" | "4e" | "3e"): SubjectChapters[] => {
  const langues = (): SubjectChapters[] => [
    {
      subject: "Anglais (LV1)",
      ...S.anglais,
      chapters:
        level === "5e"
          ? [
              "Présent simple / présent continu",
              "Prétérit simple",
              "Modaux : can, must, should",
              "Comparatifs et superlatifs",
              "Vocabulaire : école, famille, loisirs",
              "Cultures du monde anglophone",
              "Compréhension orale et écrite (A2)",
            ]
          : level === "4e"
            ? [
                "Present perfect (since/for)",
                "Prétérit BE-ING",
                "Futur (will / be going to)",
                "Subordonnées (because, when, if)",
                "Vocabulaire : voyages, médias, environnement",
                "Civilisation : Royaume-Uni, USA",
                "Expression écrite et orale (A2/B1)",
              ]
            : [
                "Past perfect",
                "Voix passive",
                "Discours indirect",
                "Conditionnels (type 0, 1, 2)",
                "Phrasal verbs courants",
                "Civilisation : Commonwealth, mouvements sociaux",
                "Préparation au DNB (compréhension/production)",
              ],
    },
    {
      subject: "Espagnol (LV2)",
      ...S.espagnol,
      chapters:
        level === "5e"
          ? [
              "Alphabet, prononciation, salutations",
              "Présent de l'indicatif (verbes réguliers)",
              "Ser / Estar / Hay",
              "Vocabulaire : famille, école, goûts",
              "Culture hispanique : fêtes",
            ]
          : level === "4e"
            ? [
                "Passé composé (pretérito perfecto)",
                "Imparfait / passé simple",
                "Futur proche : ir a + infinitif",
                "Vocabulaire : ville, voyages, alimentation",
                "Civilisation : Espagne et Amérique latine",
              ]
            : [
                "Subjonctif présent",
                "Conditionnel",
                "Concordance des temps",
                "Vocabulaire : société, environnement, médias",
                "Civilisation : grandes figures hispaniques",
              ],
    },
  ];

  return [
    {
      subject: "Mathématiques",
      ...S.maths,
      chapters:
        level === "5e"
          ? [
              "Nombres relatifs : addition et soustraction",
              "Fractions : addition, soustraction, multiplication",
              "Proportionnalité, pourcentages",
              "Calcul littéral : développement, réduction",
              "Équations simples (ax + b = c)",
              "Triangles : construction, propriétés",
              "Parallélogrammes, symétrie centrale",
              "Aires et périmètres",
              "Volumes : prisme, cylindre",
              "Statistiques : effectifs, fréquences",
              "Initiation à la programmation (Scratch)",
            ]
          : level === "4e"
            ? [
                "Nombres relatifs : multiplication, division",
                "Puissances",
                "Calcul littéral : double distributivité, factorisation",
                "Équations et inéquations",
                "Théorème de Pythagore",
                "Théorème de Thalès (configurations simples)",
                "Cosinus dans un triangle rectangle",
                "Translation, rotation",
                "Pyramides et cônes",
                "Statistiques : moyenne, médiane",
                "Probabilités : notion de hasard",
                "Algorithmique avec Scratch",
              ]
            : [
                "Nombres : arithmétique, PGCD",
                "Calcul littéral : identités remarquables, factorisation",
                "Équations produits, équations du 2nd degré simples",
                "Fonctions : notion, lecture graphique",
                "Fonctions linéaires et affines",
                "Théorème de Thalès et réciproque",
                "Trigonométrie : sinus, cosinus, tangente",
                "Homothétie",
                "Sphère, boule",
                "Probabilités : événements, calculs",
                "Statistiques : étendue, quartiles",
                "Algorithmique et programmation Python (initiation)",
              ],
    },
    {
      subject: "Français",
      ...S.francais,
      chapters:
        level === "5e"
          ? [
              "Récits d'aventure (chevaliers, voyages)",
              "Le voyage et l'aventure (Moyen Âge, Renaissance)",
              "L'être humain et la nature",
              "Avec autrui : familles, amis, réseaux",
              "Imaginer des univers nouveaux",
              "Grammaire : classes et fonctions",
              "Conjugaison : présent, imparfait, passé simple, futur",
              "Orthographe lexicale et grammaticale",
              "Lecture d'œuvre intégrale (ex. Yvain ou le Chevalier au lion)",
            ]
          : level === "4e"
            ? [
                "La fiction pour interroger le réel (récits réalistes, fantastiques)",
                "Individu et société : confrontations de valeurs (XIXe siècle)",
                "La ville, lieu de tous les possibles",
                "Informer, s'informer, déformer",
                "Grammaire : phrase complexe, propositions",
                "Conjugaison : conditionnel, subjonctif",
                "Lecture d'œuvre intégrale (Maupassant, Hugo…)",
                "Initiation à l'argumentation",
              ]
            : [
                "Se raconter, se représenter (autobiographie)",
                "Dénoncer les travers de la société",
                "Visions poétiques du monde",
                "Agir dans la cité : individu et pouvoir",
                "Progrès et rêves scientifiques",
                "Grammaire : analyse logique complète",
                "Conjugaison : tous temps, voix passive",
                "Lecture d'œuvre intégrale (récit du XXe siècle)",
                "Préparation au DNB : dictée, rédaction, questions",
              ],
    },
    {
      subject: "Histoire-Géographie",
      ...S.histgeo,
      chapters:
        level === "5e"
          ? [
              "Histoire : Chrétientés et islam (VIe-XIIIe), des mondes en contact",
              "Histoire : Société, Église et pouvoir politique dans l'Occident féodal",
              "Histoire : Transformations de l'Europe (XVe-XVIIe) — Renaissance, Réformes",
              "Histoire : Le monde au temps de Charles Quint et Soliman",
              "Géographie : La question démographique et l'inégal développement",
              "Géographie : Des ressources limitées à gérer et renouveler",
              "Géographie : Prévenir les risques, s'adapter au changement global",
            ]
          : level === "4e"
            ? [
                "Histoire : Bourgeoisies marchandes, négoces et traites au XVIIIe",
                "Histoire : L'Europe des Lumières",
                "Histoire : La Révolution française et l'Empire",
                "Histoire : L'Europe et le monde au XIXe (industrialisation, colonisation)",
                "Histoire : Conquêtes et sociétés coloniales",
                "Géographie : L'urbanisation du monde",
                "Géographie : Les mobilités humaines transnationales",
                "Géographie : Des espaces transformés par la mondialisation",
              ]
            : [
                "Histoire : L'Europe, théâtre des guerres totales (1914-1945)",
                "Histoire : Démocraties fragilisées et expériences totalitaires",
                "Histoire : La Seconde Guerre mondiale, génocides",
                "Histoire : Le monde depuis 1945 (guerre froide, décolonisations)",
                "Histoire : Françaises et Français dans une République repensée",
                "Géographie : Dynamiques territoriales de la France contemporaine",
                "Géographie : Pourquoi et comment aménager le territoire ?",
                "Géographie : La France et l'Union européenne",
              ],
    },
    {
      subject: "SVT",
      ...S.svt,
      chapters:
        level === "5e"
          ? [
              "Le vivant et son évolution : reproduction sexuée",
              "Nutrition des plantes",
              "Respiration des êtres vivants",
              "Géologie : volcanisme, séismes",
              "Climats et météo : phénomènes atmosphériques",
              "Santé : alimentation équilibrée",
            ]
          : level === "4e"
            ? [
                "Reproduction humaine et sexualité",
                "Système nerveux et comportement",
                "Tectonique des plaques",
                "Météorologie et climatologie",
                "Énergie et transformations",
                "Microorganismes et santé",
              ]
            : [
                "Génétique : ADN, chromosomes, hérédité",
                "Évolution des êtres vivants",
                "Reproduction et maîtrise de la procréation",
                "Système immunitaire",
                "Risques géologiques et activité interne de la Terre",
                "Responsabilité humaine en matière d'environnement",
                "Préparation au DNB (épreuve sciences)",
              ],
    },
    {
      subject: "Physique-Chimie",
      ...S.pc,
      chapters:
        level === "5e"
          ? [
              "États et changements d'état de la matière",
              "Mélanges homogènes et hétérogènes",
              "Mouvements et vitesse",
              "Sources et formes d'énergie",
              "Signaux : lumière et son",
              "Le système solaire",
            ]
          : level === "4e"
            ? [
                "Atomes et molécules",
                "Combustions, transformation chimique",
                "Conduction électrique des solutions",
                "Circuits électriques : tension, intensité",
                "Loi d'Ohm",
                "Lumière : couleurs, lentilles",
                "Poids et masse",
              ]
            : [
                "Réactions chimiques : équations, conservation",
                "Acides, bases, pH",
                "Synthèse d'espèces chimiques",
                "Énergie : conversions et chaîne énergétique",
                "Puissance et énergie électrique",
                "Mouvements et interactions (force, gravitation)",
                "Signaux et information : ondes",
                "Préparation au DNB (épreuve sciences)",
              ],
    },
    {
      subject: "Technologie",
      ...S.techno,
      chapters: [
        "Design et innovation : analyse d'objets techniques",
        "Modélisation et représentation (croquis, 3D)",
        "Matériaux et procédés de fabrication",
        "Mécanismes et transmission de mouvement",
        "Énergie : sources, conversion, stockage",
        "Informatique embarquée : capteurs, actionneurs",
        "Programmation (Scratch, mBlock, Python initiation)",
        "Réseaux informatiques et Internet",
        "Projet collaboratif (mini-projet d'objet connecté)",
      ],
    },
    ...langues(),
    {
      subject: "Arts plastiques",
      ...S.arts,
      chapters: [
        "La représentation : ressemblance, écart à la réalité",
        "Matérialité de la production : matériaux, supports",
        "L'œuvre, l'espace, le spectateur",
        "Histoire des arts : périodes étudiées",
        "Pratique en deux et trois dimensions",
      ],
    },
    {
      subject: "Éducation musicale",
      ...S.musique,
      chapters: [
        "Voix et geste vocal : chant choral",
        "Timbre et son : familles d'instruments",
        "Forme musicale : structures",
        "Histoire de la musique (du Moyen Âge à aujourd'hui)",
        "Musiques du monde et des cultures",
        "Création et écoute critique",
      ],
    },
    {
      subject: "EPS",
      ...S.eps,
      chapters: [
        "Champ 1 : produire une performance optimale (athlétisme, natation)",
        "Champ 2 : adapter ses déplacements à des environnements variés (course d'orientation, escalade)",
        "Champ 3 : s'exprimer devant les autres (danse, acrosport)",
        "Champ 4 : conduire et maîtriser un affrontement (sports collectifs, raquettes, combat)",
        "Santé, sécurité, responsabilité",
      ],
    },
    {
      subject: "EMC",
      ...S.emc,
      chapters:
        level === "5e"
          ? [
              "La sensibilité : soi et les autres",
              "Le droit et la règle",
              "Égalité, respect des différences",
              "Engagement et solidarité",
            ]
          : level === "4e"
            ? [
                "Libertés individuelles et collectives",
                "Justice et droits en France",
                "Médias, information, esprit critique",
                "Discriminations et lutte contre le racisme",
              ]
            : [
                "République et citoyenneté",
                "Démocratie, institutions de la Ve République",
                "Défense nationale et sécurité",
                "Engagement : associations, citoyenneté européenne",
                "Préparation à l'épreuve orale du DNB (parcours citoyen)",
              ],
    },
  ];
};

// =====================================================================
// LYCÉE
// =====================================================================

// SECONDE — tronc commun
const seconde: SubjectChapters[] = [
  {
    subject: "Mathématiques",
    ...S.maths,
    chapters: [
      "Nombres et calculs : ensembles de nombres, valeur absolue",
      "Calcul littéral, équations, inéquations",
      "Fonctions : généralités, variations",
      "Fonctions de référence (carré, inverse, racine)",
      "Équations de droites, systèmes",
      "Géométrie repérée : vecteurs, colinéarité",
      "Géométrie dans l'espace",
      "Statistiques : indicateurs de position et de dispersion",
      "Probabilités : modèle équiprobable",
      "Échantillonnage : fluctuation",
      "Algorithmique et programmation Python",
    ],
  },
  {
    subject: "Français",
    ...S.francais,
    chapters: [
      "La poésie du XIXe au XXIe siècle",
      "La littérature d'idées et la presse du XIXe au XXIe siècle",
      "Le roman et le récit du XVIIIe au XXIe siècle",
      "Le théâtre du XVIIe au XXIe siècle",
      "Étude de la langue : grammaire de phrase",
      "Lecture d'œuvres intégrales (4 œuvres au programme)",
      "Méthodologie : commentaire, dissertation, contraction",
    ],
  },
  {
    subject: "Histoire-Géographie",
    ...S.histgeo,
    chapters: [
      "Histoire : Le monde méditerranéen — empreintes de l'Antiquité et du Moyen Âge",
      "Histoire : XVe-XVIe — un nouveau rapport au monde, mutations intellectuelles",
      "Histoire : L'État à l'époque moderne (France, Angleterre)",
      "Histoire : Dynamiques d'un monde en expansion (XVIe-XVIIIe)",
      "Histoire : Tensions, mutations et crispations (1789-1815)",
      "Géographie : Sociétés et environnements, équilibres fragiles",
      "Géographie : Territoires, populations et développement",
      "Géographie : Des mobilités généralisées",
      "Géographie : L'Afrique australe, un espace en profonde mutation",
    ],
  },
  {
    subject: "SVT",
    ...S.svt,
    chapters: [
      "La Terre, la vie et l'organisation du vivant : organisation fonctionnelle",
      "Métabolisme des cellules",
      "Biodiversité, résultat et étape de l'évolution",
      "Enjeux contemporains de la planète : érosion et activité humaine",
      "Ressources : agrosystèmes et développement durable",
      "Corps humain et santé : procréation et sexualité humaine",
      "Microorganismes et santé",
    ],
  },
  {
    subject: "Physique-Chimie",
    ...S.pc,
    chapters: [
      "Constitution et transformations de la matière : espèces chimiques, mole",
      "Solutions aqueuses, concentration",
      "Modélisation des transformations chimiques",
      "Mouvements et interactions : description, forces, principe d'inertie",
      "Ondes et signaux : émission/perception du son, vision et image",
      "Signaux et capteurs",
      "L'énergie : conversions et conservations",
    ],
  },
  {
    subject: "SES (Sciences économiques et sociales)",
    ...S.ses_tc,
    chapters: [
      "Comment crée-t-on les richesses et comment les mesure-t-on ?",
      "Comment se forment les prix sur un marché ?",
      "Comment les agents économiques se financent-ils ?",
      "Quels sont les grands rôles de la monnaie ?",
      "Comment devient-on acteur en société (socialisation) ?",
      "Comment s'organise la vie politique ?",
      "Comment se construisent et évoluent les liens sociaux ?",
      "Quelles relations entre le diplôme, l'emploi et le salaire ?",
    ],
  },
  {
    subject: "SNT (Sciences numériques et technologie)",
    ...S.snt,
    chapters: [
      "Internet : protocoles, routage, neutralité",
      "Le web : HTML, CSS, moteurs de recherche",
      "Les réseaux sociaux : graphes, impacts",
      "Les données structurées et leur traitement",
      "Localisation, cartographie et mobilité (GPS)",
      "Informatique embarquée et objets connectés",
      "La photographie numérique",
    ],
  },
  {
    subject: "Anglais (LV1)",
    ...S.anglais,
    chapters: [
      "L'art de vivre ensemble : famille, mémoire, communauté",
      "Voyages et migrations",
      "Imaginaires : créations, sciences, utopies",
      "Rencontres : amour, amitié, relations sociales",
      "Sauver la planète, penser les futurs possibles",
      "Le passé dans le présent",
      "Niveau visé : B1 vers B2",
    ],
  },
  {
    subject: "Espagnol (LV2)",
    ...S.espagnol,
    chapters: [
      "Vivre entre générations",
      "Univers professionnels, monde du travail",
      "Le village, le quartier, la ville",
      "Représentation de soi et rapport à autrui",
      "Sports et société",
      "La création et le rapport aux arts",
      "Niveau visé : A2 vers B1",
    ],
  },
  {
    subject: "EPS",
    ...S.eps,
    chapters: [
      "CA1 : Produire une performance optimale (demi-fond, relais, natation vitesse)",
      "CA2 : Adapter ses déplacements à des environnements variés (escalade, CO, sauvetage)",
      "CA3 : Réaliser une prestation corporelle artistique (danse, acro, gym)",
      "CA4 : Conduire un affrontement individuel ou collectif (sports co, raquettes, combat)",
      "CA5 : Réaliser une activité physique pour développer ses ressources (musculation, step, course en durée)",
    ],
  },
  {
    subject: "EMC",
    ...S.emc,
    chapters: [
      "La liberté, les libertés",
      "Garantir les libertés : l'État de droit",
      "Évolution des libertés et des droits en France",
    ],
  },
];

// PREMIÈRE — tronc commun
const premiereCommon: SubjectChapters[] = [
  {
    subject: "Français",
    ...S.francais,
    chapters: [
      "Objet d'étude : la poésie du XIXe au XXIe siècle",
      "Objet d'étude : la littérature d'idées du XVIe au XVIIIe siècle",
      "Objet d'étude : le roman et le récit du Moyen Âge au XXIe siècle",
      "Objet d'étude : le théâtre du XVIIe au XXIe siècle",
      "Étude de 4 œuvres au programme (renouvelées chaque année)",
      "Méthodologie : commentaire littéraire",
      "Méthodologie : dissertation sur œuvre",
      "Préparation à l'oral : explication linéaire, question de grammaire",
      "Préparation à l'EAF (Épreuves anticipées de français)",
    ],
  },
  {
    subject: "Histoire-Géographie",
    ...S.histgeo,
    chapters: [
      "Histoire : L'Europe face aux révolutions (1789-1848)",
      "Histoire : La France dans l'Europe des nationalités",
      "Histoire : La Troisième République avant 1914",
      "Histoire : La Première Guerre mondiale",
      "Géographie : La métropolisation, un processus mondial différencié",
      "Géographie : Une diversification des espaces et des acteurs de la production",
      "Géographie : Les espaces ruraux : multifonctionnalité ou fragmentation ?",
      "Géographie : La Chine, des recompositions spatiales multiples",
    ],
  },
  {
    subject: "Anglais (LVA)",
    ...S.anglais,
    chapters: [
      "Identités et échanges",
      "Espaces privés et publics",
      "Art et pouvoir",
      "Citoyenneté et mondes virtuels",
      "Fictions et réalités",
      "Innovations scientifiques et responsabilité",
      "Diversité et inclusion",
      "Territoire et mémoire",
      "Niveau visé : B2",
    ],
  },
  {
    subject: "Espagnol (LVB)",
    ...S.espagnol,
    chapters: [
      "Identités et échanges",
      "Espaces privés et publics",
      "Art et pouvoir",
      "Citoyenneté et mondes virtuels",
      "Fictions et réalités",
      "Innovations scientifiques et responsabilité",
      "Diversité et inclusion",
      "Territoire et mémoire",
    ],
  },
  {
    subject: "Enseignement scientifique",
    ...S.svt,
    chapters: [
      "Une longue histoire de la matière (du Big Bang aux atomes)",
      "Le Soleil, notre source d'énergie",
      "La Terre, un astre singulier",
      "Son et musique, porteurs d'information",
      "Projet expérimental et numérique",
    ],
  },
  {
    subject: "EPS",
    ...S.eps,
    chapters: [
      "Choix de 3 APSA parmi les 5 champs d'apprentissage",
      "Projet personnel d'entraînement (santé, performance)",
      "Méthodologie : préparation, récupération",
      "Évaluation continue (cycle de baccalauréat)",
    ],
  },
  {
    subject: "EMC",
    ...S.emc,
    chapters: [
      "Fondements et fragilités du lien social",
      "Les recompositions du lien social",
    ],
  },
];

// PREMIÈRE — Spécialités (3 choisies)
const premiereSpecs: SubjectChapters[] = [
  {
    subject: "Spé Mathématiques",
    ...S.maths,
    kind: "specialite",
    chapters: [
      "Algèbre : suites numériques (arithmétiques, géométriques)",
      "Analyse : second degré, polynômes",
      "Analyse : dérivation, applications",
      "Analyse : fonction exponentielle",
      "Trigonométrie : cercle trigonométrique, fonctions",
      "Géométrie : produit scalaire dans le plan",
      "Probabilités conditionnelles, indépendance",
      "Variables aléatoires, espérance, variance",
      "Algorithmique et programmation Python",
    ],
  },
  {
    subject: "Spé Physique-Chimie",
    ...S.pc,
    kind: "specialite",
    chapters: [
      "Constitution et transformations de la matière (composition, structure, suivi)",
      "Modélisation des transformations chimiques (acide-base, oxydoréduction)",
      "Mouvement et interactions (forces, lois de Newton)",
      "L'énergie : conversions et transferts (énergie mécanique, électrique)",
      "Ondes et signaux (intensité sonore, lentilles, lumière)",
      "Méthodes physiques d'analyse (spectroscopies)",
    ],
  },
  {
    subject: "Spé SVT",
    ...S.svt,
    kind: "specialite",
    chapters: [
      "Transmission, variation et expression du patrimoine génétique",
      "La dynamique interne de la Terre",
      "Variation génétique et santé",
      "Le fonctionnement du système immunitaire",
      "Écosystèmes et services environnementaux",
      "Comportements, mouvement et système nerveux",
    ],
  },
  {
    subject: "Spé SES",
    ...S.ses,
    kind: "specialite",
    chapters: [
      "Comment un marché concurrentiel fonctionne-t-il ?",
      "Comment les marchés imparfaitement concurrentiels fonctionnent-ils ?",
      "Quelles sont les principales défaillances du marché ?",
      "Comment les agents économiques se financent-ils ?",
      "Qu'est-ce que la monnaie et comment est-elle créée ?",
      "Comment la socialisation contribue-t-elle à expliquer les différences de comportement ?",
      "Comment se construisent et évoluent les liens sociaux ?",
      "Quels sont les processus sociaux qui contribuent à la déviance ?",
      "Comment se forme et s'exprime l'opinion publique ?",
      "Voter : une affaire individuelle ou collective ?",
    ],
  },
  {
    subject: "Spé HGGSP",
    ...S.hggsp,
    kind: "specialite",
    chapters: [
      "Thème introductif : la démocratie",
      "Thème 1 : analyser les dynamiques des puissances internationales",
      "Thème 2 : analyser les dynamiques des puissances internationales (suite : guerre, paix)",
      "Thème 3 : étudier les divisions politiques du monde — les frontières",
      "Thème 4 : s'informer — un regard critique sur les sources et modes de communication",
      "Thème 5 : analyser les relations entre États et religions",
    ],
  },
  {
    subject: "Spé HLP (Humanités, Littérature, Philosophie)",
    ...S.hlp,
    kind: "specialite",
    chapters: [
      "Les pouvoirs de la parole (Antiquité au Moyen Âge)",
      "L'art de la parole (rhétorique, éloquence)",
      "Les autorités de la parole",
      "Les séductions de la parole",
      "Les représentations du monde (Renaissance, âge classique, Lumières)",
      "Découverte du monde et pluralité des cultures",
      "Décrire, figurer, imaginer",
      "L'homme et l'animal",
    ],
  },
  {
    subject: "Spé NSI",
    ...S.nsi,
    kind: "specialite",
    chapters: [
      "Histoire de l'informatique",
      "Représentation des données : entiers, réels, booléens, texte",
      "Types construits : tuples, listes, dictionnaires",
      "Traitement de données en table (CSV)",
      "Interactions homme-machine sur le Web (HTML, CSS, JS, formulaires)",
      "Architectures matérielles : machine de Von Neumann",
      "Systèmes d'exploitation, processus",
      "Réseaux et protocoles de communication",
      "Langages et programmation : récursivité, paradigmes",
      "Algorithmique : tris, recherche, complexité",
    ],
  },
  {
    subject: "Spé LLCER Anglais",
    ...S.llcer,
    kind: "specialite",
    chapters: [
      "Imaginaires (créatures, mythes, monstres)",
      "Rencontres (amour, amitié, relations)",
      "Œuvres intégrales : 1 œuvre littéraire + 1 film",
      "Approche culturelle, civilisation, arts",
      "Méthodologie : synthèse, traduction, expression",
    ],
  },
  {
    subject: "Spé Sciences de l'ingénieur (SI)",
    ...S.si,
    kind: "specialite",
    chapters: [
      "Analyse des produits et des systèmes",
      "Modélisation cinématique et statique",
      "Énergie : transferts et stockage",
      "Information : acquisition, traitement, transmission",
      "Modélisation et simulation numérique",
      "Innovation et développement durable",
    ],
  },
  {
    subject: "Spé Arts plastiques",
    ...S.artspe,
    kind: "specialite",
    chapters: [
      "Pratique plastique en 2D / 3D / volume",
      "Questionnements plasticiens (matière, support, geste)",
      "Histoire de l'art : références majeures",
      "Projet personnel et carnet de bord",
    ],
  },
];

// TERMINALE — tronc commun
const terminaleCommon: SubjectChapters[] = [
  {
    subject: "Philosophie",
    ...S.philo,
    chapters: [
      "L'art",
      "Le bonheur",
      "La conscience",
      "Le devoir",
      "L'État",
      "L'inconscient",
      "La justice",
      "Le langage",
      "La liberté",
      "La nature",
      "La raison",
      "La religion",
      "La science",
      "La technique",
      "Le temps",
      "Le travail",
      "La vérité",
      "Étude d'œuvres au programme (3 œuvres)",
      "Méthodologie : dissertation, explication de texte",
    ],
  },
  {
    subject: "Histoire-Géographie",
    ...S.histgeo,
    chapters: [
      "Histoire : Fragilités des démocraties, totalitarismes, Seconde Guerre mondiale (1929-1945)",
      "Histoire : Le monde, l'Europe et la France de 1945 au début des années 1970",
      "Histoire : Les remises en cause économiques, politiques et sociales (1970-1991)",
      "Histoire : Le monde, l'Europe et la France depuis les années 1990",
      "Géographie : Mers et océans, au cœur de la mondialisation",
      "Géographie : Dynamiques territoriales, coopérations et tensions à l'échelle mondiale",
      "Géographie : L'Union européenne dans la mondialisation",
      "Géographie : La France et ses régions dans l'Europe et la mondialisation",
    ],
  },
  {
    subject: "Anglais (LVA)",
    ...S.anglais,
    chapters: [
      "Identités et échanges",
      "Espaces privés et publics",
      "Art et pouvoir",
      "Citoyenneté et mondes virtuels",
      "Fictions et réalités",
      "Innovations scientifiques et responsabilité",
      "Diversité et inclusion",
      "Territoire et mémoire",
      "Préparation à l'épreuve écrite et orale du bac",
      "Niveau visé : B2/C1",
    ],
  },
  {
    subject: "Espagnol (LVB)",
    ...S.espagnol,
    chapters: [
      "Identités et échanges",
      "Espaces privés et publics",
      "Art et pouvoir",
      "Citoyenneté et mondes virtuels",
      "Fictions et réalités",
      "Innovations scientifiques et responsabilité",
      "Diversité et inclusion",
      "Territoire et mémoire",
    ],
  },
  {
    subject: "Enseignement scientifique",
    ...S.svt,
    chapters: [
      "Science, climat et société",
      "Le futur des énergies",
      "Une histoire du vivant (évolution, biodiversité)",
      "L'intelligence artificielle (mathématiques, informatique)",
      "Projet expérimental et numérique",
    ],
  },
  {
    subject: "EPS",
    ...S.eps,
    chapters: [
      "3 APSA en CCF (Contrôle en cours de formation)",
      "Évaluation finale baccalauréat (coef 6 dans le bac général)",
      "Projet d'entraînement personnalisé",
    ],
  },
  {
    subject: "EMC",
    ...S.emc,
    chapters: [
      "Fondements et expériences de la démocratie",
      "Repenser et faire vivre la démocratie",
    ],
  },
];

// TERMINALE — Spécialités (2 conservées) + Maths Expertes / Complémentaires
const terminaleSpecs: SubjectChapters[] = [
  {
    subject: "Spé Mathématiques",
    ...S.maths,
    kind: "specialite",
    chapters: [
      "Suites : limites, raisonnement par récurrence",
      "Limites de fonctions, continuité",
      "Compléments sur la dérivation",
      "Logarithme népérien",
      "Fonctions trigonométriques",
      "Calcul intégral, primitives",
      "Géométrie dans l'espace : vecteurs, droites, plans",
      "Produit scalaire dans l'espace",
      "Combinatoire et dénombrement",
      "Probabilités conditionnelles, loi binomiale",
      "Variables aléatoires : concentration, loi des grands nombres",
      "Algorithmique : fonctions Python avancées",
    ],
  },
  {
    subject: "Maths Expertes (option Terminale)",
    ...S.maths,
    kind: "option",
    chapters: [
      "Nombres complexes : forme algébrique, trigonométrique, exponentielle",
      "Équations polynomiales dans C",
      "Arithmétique : divisibilité, congruences, théorème de Bézout, Gauss",
      "Matrices : opérations, inversion, suites couplées",
      "Graphes et matrices",
    ],
  },
  {
    subject: "Maths Complémentaires (option Terminale)",
    ...S.maths,
    kind: "option",
    chapters: [
      "Modèles définis par une fonction d'une variable (exp, ln)",
      "Modèles d'évolution (suites, équations différentielles simples)",
      "Approche historique de la fonction logarithme",
      "Calculs d'aires, intégrales",
      "Lois de probabilités à densité",
      "Statistique inférentielle, estimation",
    ],
  },
  {
    subject: "Spé Physique-Chimie",
    ...S.pc,
    kind: "specialite",
    chapters: [
      "Constitution et transformations de la matière (cinétique, équilibre, pH, titrages)",
      "Mouvement et interactions (mécanique du point, lois de Kepler)",
      "L'énergie : conversions et transferts (premier principe, énergie interne)",
      "Ondes et signaux (interférences, effet Doppler, lunette astronomique)",
      "Synthèses chimiques, stratégies",
      "Approche expérimentale et modélisation",
    ],
  },
  {
    subject: "Spé SVT",
    ...S.svt,
    kind: "specialite",
    chapters: [
      "Génétique et évolution (brassage, sélection naturelle, spéciation)",
      "À la recherche du passé géologique de notre planète",
      "Le domaine continental et sa dynamique",
      "Géothermie et propriétés thermiques de la Terre",
      "Climats passés et actuels",
      "Comportements, mouvement et système nerveux (suite)",
      "Glycémie et diabète",
      "Procréation et sexualité humaine",
    ],
  },
  {
    subject: "Spé SES",
    ...S.ses,
    kind: "specialite",
    chapters: [
      "Quels sont les sources et les défis de la croissance économique ?",
      "Quels sont les fondements du commerce international et de l'internationalisation de la production ?",
      "Comment lutter contre le chômage ?",
      "Comment expliquer les crises financières et réguler le système financier ?",
      "Comment est structurée la société française actuelle ?",
      "Quelle est l'action de l'École sur les destins individuels et sur la société ?",
      "Quels sont les caractères, les facteurs et les défis de l'engagement politique ?",
      "Comment l'action publique répond-elle aux problèmes environnementaux ?",
      "Quelle action publique pour l'environnement ?",
    ],
  },
  {
    subject: "Spé HGGSP",
    ...S.hggsp,
    kind: "specialite",
    chapters: [
      "De nouveaux espaces de conquête (mers, océans, espace, cyberespace)",
      "Faire la guerre, faire la paix : formes de conflits et modes de résolution",
      "Histoire et mémoires (Seconde Guerre mondiale, génocides)",
      "Identifier, protéger et valoriser le patrimoine : enjeux géopolitiques",
      "L'environnement, entre exploitation et protection",
      "L'enjeu de la connaissance",
    ],
  },
  {
    subject: "Spé HLP",
    ...S.hlp,
    kind: "specialite",
    chapters: [
      "La recherche de soi (XIXe-XXIe) : éducation, mémoire",
      "Expressions de la sensibilité",
      "Les métamorphoses du moi (psychanalyse, création de soi)",
      "L'humanité en question : création, technique, animalité",
      "Histoire et violence",
      "L'humain et ses limites",
    ],
  },
  {
    subject: "Spé NSI",
    ...S.nsi,
    kind: "specialite",
    chapters: [
      "Structures de données : listes, piles, files, arbres, graphes",
      "Bases de données relationnelles, SQL",
      "Architectures matérielles, systèmes d'exploitation, réseaux (suite)",
      "Programmation orientée objet (Python)",
      "Récursivité, diviser pour régner",
      "Algorithmique : programmation dynamique, gloutons, sur les graphes",
      "Génie logiciel : tests, mise au point, modularité",
      "Projet de programmation",
    ],
  },
  {
    subject: "Spé LLCER Anglais (Monde contemporain)",
    ...S.llcer,
    kind: "specialite",
    chapters: [
      "Faire société",
      "Environnements en mutation",
      "Relations au monde",
      "Œuvre intégrale : 1 œuvre littéraire + 1 film",
      "Méthodologie : synthèse, traduction, essai argumentatif",
    ],
  },
  {
    subject: "Spé Sciences de l'ingénieur (SI)",
    ...S.si,
    kind: "specialite",
    chapters: [
      "Ingénierie système et mécatronique",
      "Modélisation multi-physique",
      "Asservissement et régulation",
      "Programmation embarquée",
      "Projet pluri-technologique (épreuve finale)",
    ],
  },
  {
    subject: "Spé Arts plastiques",
    ...S.artspe,
    kind: "specialite",
    chapters: [
      "Questionnements plasticiens approfondis",
      "Question limitative annuelle (œuvres au programme)",
      "Pratique : projet personnel d'envergure",
      "Carnet de travail et écrit réflexif",
      "Préparation à l'épreuve écrite et pratique du bac",
    ],
  },
];

// =====================================================================
// EXPORT
// =====================================================================

export const CURRICULUM: LevelCurriculum[] = [
  {
    id: "5e",
    label: "5ème",
    short: "5e",
    stage: "college",
    gradient: "from-emerald-400 to-teal-500",
    subjects: collegeCommon("5e"),
  },
  {
    id: "4e",
    label: "4ème",
    short: "4e",
    stage: "college",
    gradient: "from-teal-400 to-cyan-500",
    subjects: collegeCommon("4e"),
  },
  {
    id: "3e",
    label: "3ème",
    short: "3e",
    stage: "college",
    gradient: "from-cyan-400 to-sky-500",
    subjects: collegeCommon("3e"),
  },
  {
    id: "2nde",
    label: "Seconde",
    short: "2nde",
    stage: "lycee",
    gradient: "from-sky-400 to-blue-500",
    subjects: seconde,
  },
  {
    id: "1ere",
    label: "Première",
    short: "1ère",
    stage: "lycee",
    gradient: "from-violet-400 to-purple-500",
    subjects: [...premiereCommon, ...premiereSpecs],
  },
  {
    id: "terminale",
    label: "Terminale",
    short: "Term",
    stage: "lycee",
    gradient: "from-fuchsia-500 to-pink-500",
    subjects: [...terminaleCommon, ...terminaleSpecs],
  },
];

export function getLevel(id: string) {
  return CURRICULUM.find((l) => l.id === id) ?? null;
}
