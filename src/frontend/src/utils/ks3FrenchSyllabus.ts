/**
 * KS1/2/3 French – Language Acquisition Framework
 *
 * Designed for Year 8 and Year 9 students who are developing their
 * French communicative competence and are NOT yet preparing for IGCSE exams.
 *
 * Comments and advice focus on:
 *  - Genuine language acquisition (listening, speaking, reading, writing)
 *  - Building confidence and curiosity about French culture
 *  - General progress indicators (rather than exam grade boundaries)
 */

// ---------------------------------------------------------------------------
// KS3 Proficiency bands
// ---------------------------------------------------------------------------

export interface Ks3Band {
  band: string; // e.g. "Emerging", "Developing", "Securing", "Exceeding"
  minPercent: number;
  maxPercent: number;
  label: string; // short display label
  descriptor: string; // full description (French)
  teacherNote: string;
}

export const KS3_FRENCH_BANDS: Ks3Band[] = [
  {
    band: "Exceeding",
    minPercent: 80,
    maxPercent: 100,
    label: "Niveau avancé",
    descriptor:
      "L'élève communique avec aisance et confiance en français. Il/Elle comprend des textes et des dialogues variés, produit des phrases complexes et montre une vraie curiosité pour la langue et la culture françaises.",
    teacherNote:
      "Encourager des lectures authentiques en français (bandes dessinées, articles simples, chansons) et la prise de parole spontanée en classe.",
  },
  {
    band: "Securing",
    minPercent: 60,
    maxPercent: 79,
    label: "Niveau consolidé",
    descriptor:
      "L'élève maîtrise les bases du français et commence à utiliser la langue avec plus d'autonomie. Il/Elle peut communiquer des informations simples à l'oral et à l'écrit sur des sujets familiers.",
    teacherNote:
      "Consolider les structures acquises et encourager la prise de risque linguistique : essayer de nouvelles formes plutôt que de se limiter aux structures sûres.",
  },
  {
    band: "Developing",
    minPercent: 40,
    maxPercent: 59,
    label: "Niveau en progression",
    descriptor:
      "L'élève est en train d'acquérir les structures fondamentales du français. Il/Elle comprend des instructions simples et peut produire des phrases courtes sur des sujets connus, avec l'aide du professeur.",
    teacherNote:
      "Renforcer le vocabulaire du quotidien et les structures de base à travers des activités variées et ludiques. La régularité est clé à ce stade.",
  },
  {
    band: "Emerging",
    minPercent: 0,
    maxPercent: 39,
    label: "Niveau débutant",
    descriptor:
      "L'élève commence son apprentissage du français. Il/Elle reconnaît des mots familiers et peut produire des réponses très simples sur des sujets immédiatement connus.",
    teacherNote:
      "Créer un environnement rassurant pour l'expression orale. Utiliser des supports visuels, des jeux de mémoire et des activités d'écoute courtes pour développer la confiance.",
  },
];

export function getKs3Band(percent: number): Ks3Band {
  for (const band of KS3_FRENCH_BANDS) {
    if (percent >= band.minPercent) return band;
  }
  return KS3_FRENCH_BANDS[KS3_FRENCH_BANDS.length - 1];
}

// ---------------------------------------------------------------------------
// KS3 Core themes – language acquisition focus
// ---------------------------------------------------------------------------

export interface Ks3Theme {
  id: string;
  title: string;
  communicativeGoals: string[];
  keyVocabulary: string[];
  grammarFocus: string[];
}

export const KS3_FRENCH_THEMES: Ks3Theme[] = [
  {
    id: "me_my_world",
    title: "Moi et mon monde",
    communicativeGoals: [
      "Se présenter et présenter sa famille",
      "Décrire son apparence et sa personnalité",
      "Parler de ses goûts et préférences",
    ],
    keyVocabulary: [
      "je m'appelle, j'ai … ans",
      "grand(e), petit(e), sympa, amusant(e)",
      "j'aime, je n'aime pas, je préfère",
    ],
    grammarFocus: [
      "Le présent : être, avoir, s'appeler",
      "Les adjectifs (accord et position)",
      "Les articles définis et indéfinis",
    ],
  },
  {
    id: "daily_life",
    title: "La vie quotidienne",
    communicativeGoals: [
      "Parler de sa routine journalière",
      "Décrire sa maison et son quartier",
      "Raconter ce qu'on fait le week-end",
    ],
    keyVocabulary: [
      "se lever, prendre le petit-déjeuner, aller à l'école",
      "la maison, la chambre, le salon",
      "le week-end, le matin, le soir",
    ],
    grammarFocus: [
      "Les verbes pronominaux au présent",
      "L'heure et les expressions du temps",
      "Les adverbes de fréquence (souvent, parfois)",
    ],
  },
  {
    id: "school_friends",
    title: "L'école et les amis",
    communicativeGoals: [
      "Parler de ses matières préférées",
      "Décrire son collège",
      "Parler de ses amis et de ses activités en groupe",
    ],
    keyVocabulary: [
      "les matières : les maths, les sciences, le français",
      "la cantine, la salle de classe, la récréation",
      "mon ami(e), on joue, on parle",
    ],
    grammarFocus: [
      "Le présent des verbes réguliers (-er)",
      "Les questions simples (est-ce que…, qu'est-ce que…)",
      "Les pronoms sujets",
    ],
  },
  {
    id: "free_time",
    title: "Le temps libre",
    communicativeGoals: [
      "Parler de ses loisirs et activités sportives",
      "Décrire un week-end ou des vacances passés",
      "Exprimer ses opinions sur les loisirs",
    ],
    keyVocabulary: [
      "jouer au foot, faire de la natation, lire",
      "c'est amusant, ennuyeux, super",
      "le week-end dernier, pendant les vacances",
    ],
    grammarFocus: [
      "Le passé composé (événements passés)",
      "Les expressions d'opinion : je pense que, je trouve que",
      "Jouer à / Faire de + activité",
    ],
  },
  {
    id: "food_culture",
    title: "La nourriture et la culture française",
    communicativeGoals: [
      "Commander un repas et parler de la nourriture",
      "Découvrir des aspects de la culture francophone",
      "Exprimer ses préférences alimentaires",
    ],
    keyVocabulary: [
      "je voudrais, c'est délicieux, j'ai faim",
      "le pain, le fromage, la baguette, un croissant",
      "la France, la Belgique, le Sénégal",
    ],
    grammarFocus: [
      "Le conditionnel de politesse : je voudrais",
      "Les partitifs : du, de la, de l'",
      "Les expressions de quantité",
    ],
  },
];

// ---------------------------------------------------------------------------
// KS3 Grammar reference – acquisition order
// ---------------------------------------------------------------------------

export interface Ks3GrammarPoint {
  level: "débutant" | "intermédiaire" | "avancé";
  topic: string;
  description: string;
  acquisitionTip: string;
}

export const KS3_FRENCH_GRAMMAR: Ks3GrammarPoint[] = [
  {
    level: "débutant",
    topic: "Le présent des verbes en -er",
    description:
      "Conjuguer parler, aimer, habiter, écouter… au présent. Base de toute communication orale et écrite.",
    acquisitionTip:
      "Chanter des conjugaisons ou jouer à des jeux de questions-réponses rapides pour mémoriser les terminaisons.",
  },
  {
    level: "débutant",
    topic: "Les verbes être et avoir",
    description:
      "Conjugaison complète au présent — indispensables pour se présenter et décrire.",
    acquisitionTip:
      "Utiliser des flashcards bilingues et des mini-dialogues quotidiens pour automatiser ces formes.",
  },
  {
    level: "débutant",
    topic: "Les articles définis et indéfinis",
    description: "le, la, les / un, une, des — accord en genre et en nombre.",
    acquisitionTip:
      "Apprendre chaque nouveau nom avec son article (le chat, la maison) dès le début.",
  },
  {
    level: "débutant",
    topic: "Les négations simples",
    description:
      "ne … pas — former des phrases négatives pour exprimer ce qu'on n'aime pas.",
    acquisitionTip:
      "Pratiquer avec des phrases de la vie réelle : « Je n'aime pas les devoirs. »",
  },
  {
    level: "intermédiaire",
    topic: "Les verbes pronominaux",
    description:
      "Se lever, se coucher, s'appeler — indispensables pour parler de la routine.",
    acquisitionTip:
      "Créer un emploi du temps illustré en français avec les verbes pronominaux.",
  },
  {
    level: "intermédiaire",
    topic: "Le passé composé",
    description:
      "Raconter des événements passés avec avoir ou être + participe passé.",
    acquisitionTip:
      "Tenir un mini-journal en français chaque semaine pour pratiquer naturellement le passé composé.",
  },
  {
    level: "intermédiaire",
    topic: "Le futur proche",
    description: "aller + infinitif — exprimer ses projets et intentions.",
    acquisitionTip:
      "Parler de ses projets du week-end ou des vacances en classe pour pratiquer en contexte.",
  },
  {
    level: "avancé",
    topic: "L'imparfait",
    description:
      "Décrire le passé et les habitudes — contraste avec le passé composé.",
    acquisitionTip:
      "Lire de courts textes narratifs et repérer les deux temps pour comprendre leur usage.",
  },
  {
    level: "avancé",
    topic: "Le conditionnel de politesse",
    description:
      "je voudrais, j'aimerais — formules de politesse essentielles.",
    acquisitionTip:
      "Pratiquer dans des jeux de rôle (au restaurant, à la boulangerie) pour intégrer naturellement ces formes.",
  },
];

/**
 * Returns grammar points appropriate for a KS3 student at the given performance level.
 */
export function getKs3GrammarTopics(percent: number): Ks3GrammarPoint[] {
  if (percent < 40) {
    return KS3_FRENCH_GRAMMAR.filter((g) => g.level === "débutant");
  }
  if (percent < 65) {
    return KS3_FRENCH_GRAMMAR.filter(
      (g) => g.level === "débutant" || g.level === "intermédiaire",
    );
  }
  return KS3_FRENCH_GRAMMAR;
}

/**
 * Returns the most appropriate KS3 themes to focus on for vocabulary development.
 */
export function getKs3Themes(percent: number): Ks3Theme[] {
  if (percent < 50) {
    return KS3_FRENCH_THEMES.filter((t) =>
      ["me_my_world", "daily_life"].includes(t.id),
    );
  }
  if (percent < 70) {
    return KS3_FRENCH_THEMES.filter((t) =>
      ["daily_life", "school_friends", "free_time"].includes(t.id),
    );
  }
  return KS3_FRENCH_THEMES.filter((t) =>
    ["free_time", "food_culture"].includes(t.id),
  );
}
