/**
 * Cambridge IGCSE French – Syllabus Data (0520 / 7156)
 *
 * Based on the Cambridge Assessment International Education syllabus for
 * Cambridge IGCSE French (First Language and Foreign Language).
 *
 * This data is used to produce syllabus-aligned improvement comments
 * in the Student Performance Tracker.
 */

// ---------------------------------------------------------------------------
// Assessment components (Paper structure)
// ---------------------------------------------------------------------------

export interface AssessmentComponent {
  code: string;
  title: string; // French label
  description: string;
  weighting: number; // % of total marks
  skills: string[];
}

export const IGCSE_FRENCH_COMPONENTS: AssessmentComponent[] = [
  {
    code: "Paper 1",
    title: "Écoute (Compréhension orale)",
    description:
      "Les candidats écoutent des enregistrements en français et répondent à des questions de compréhension.",
    weighting: 25,
    skills: [
      "Comprendre des informations essentielles et des opinions",
      "Identifier les idées principales et les détails dans des textes oraux",
      "Comprendre des accents variés et des registres de langue différents",
    ],
  },
  {
    code: "Paper 2",
    title: "Lecture (Compréhension écrite)",
    description:
      "Les candidats lisent des textes authentiques en français et répondent à des questions de compréhension.",
    weighting: 25,
    skills: [
      "Comprendre des textes de différents types (articles, publicités, lettres, extraits littéraires)",
      "Dégager les idées principales et les informations spécifiques",
      "Déduire le sens de mots ou expressions inconnus par le contexte",
    ],
  },
  {
    code: "Paper 3",
    title: "Expression orale",
    description:
      "Les candidats participent à une conversation et présentent un rôle ou un sujet avec l'examinateur.",
    weighting: 25,
    skills: [
      "Communiquer des informations, des idées et des opinions de façon claire",
      "Répondre spontanément aux questions",
      "Utiliser une gamme variée de vocabulaire et de structures grammaticales",
      "Prononcer correctement et avec fluidité",
    ],
  },
  {
    code: "Paper 4",
    title: "Expression écrite",
    description:
      "Les candidats rédigent des textes en français : messages, lettres, articles, essais, etc.",
    weighting: 25,
    skills: [
      "Écrire pour différents publics et objectifs",
      "Utiliser un registre approprié (formel / informel)",
      "Organiser les idées de façon cohérente et logique",
      "Utiliser correctement la grammaire, l'orthographe et la ponctuation",
      "Employer un vocabulaire varié et précis",
    ],
  },
];

// ---------------------------------------------------------------------------
// Core themes and topics
// ---------------------------------------------------------------------------

export interface SyllabusTheme {
  id: string;
  title: string; // French label
  subTopics: string[];
  keyVocabulary: string[];
  grammarFocus: string[];
}

export const IGCSE_FRENCH_THEMES: SyllabusTheme[] = [
  {
    id: "everyday_life",
    title: "La vie quotidienne",
    subTopics: [
      "La routine quotidienne",
      "Les repas et la nourriture",
      "Les achats et l'argent",
      "Les transports",
      "La maison et le foyer",
      "Les loisirs et les passe-temps",
    ],
    keyVocabulary: [
      "se lever, se coucher, petit-déjeuner",
      "faire les courses, un supermarché",
      "prendre le bus / le train / le métro",
      "la cuisine, le salon, la chambre",
      "lire, regarder la télé, écouter de la musique",
    ],
    grammarFocus: [
      "Les verbes pronominaux (se lever, se coucher)",
      "L'heure et les expressions temporelles",
      "Les adjectifs possessifs",
      "Le présent de l'indicatif",
    ],
  },
  {
    id: "personal_world",
    title: "Le monde personnel",
    subTopics: [
      "La famille et les relations",
      "Les amis et la vie sociale",
      "La personnalité et les descriptions physiques",
      "Les émotions et les sentiments",
      "Les fêtes et les célébrations",
    ],
    keyVocabulary: [
      "les membres de la famille : frère, sœur, parents",
      "s'entendre avec, se disputer",
      "grand(e), petit(e), les cheveux, les yeux",
      "heureux/heureuse, triste, en colère",
      "Noël, Pâques, un anniversaire",
    ],
    grammarFocus: [
      "Les adjectifs qualificatifs et leur accord",
      "La comparaison (plus … que, moins … que)",
      "Le passé composé avec être et avoir",
      "Les pronoms personnels",
    ],
  },
  {
    id: "school_work",
    title: "L'école et le travail",
    subTopics: [
      "La vie scolaire et les matières",
      "Les règles et le règlement",
      "Les projets d'avenir et les ambitions",
      "Les métiers et les professions",
      "Les études supérieures",
    ],
    keyVocabulary: [
      "les matières : les maths, l'histoire, le français",
      "les devoirs, un examen, une note",
      "un métier, un emploi, travailler",
      "l'université, un diplôme, une formation",
      "un stage, une candidature, un CV",
    ],
    grammarFocus: [
      "Le futur simple",
      "Le conditionnel présent (je voudrais, j'aimerais)",
      "Les expressions de souhait et d'intention",
      "L'infinitif après les verbes de volonté",
    ],
  },
  {
    id: "leisure_tourism",
    title: "Les loisirs et le tourisme",
    subTopics: [
      "Les vacances et les voyages",
      "Les sports et les activités physiques",
      "La musique, le cinéma, les arts",
      "La lecture et les médias",
      "Les sorties et les divertissements",
    ],
    keyVocabulary: [
      "partir en vacances, réserver, un hôtel",
      "faire du sport, jouer au football, nager",
      "un film, un concert, une exposition",
      "un journal, un magazine, les réseaux sociaux",
      "une sortie, s'amuser, profiter de",
    ],
    grammarFocus: [
      "L'imparfait (description du passé)",
      "Le passé composé vs l'imparfait",
      "Les pronoms COD et COI",
      "Les expressions de fréquence",
    ],
  },
  {
    id: "environment_society",
    title: "L'environnement et la société",
    subTopics: [
      "L'environnement naturel et la géographie",
      "Les problèmes environnementaux",
      "La société et la communauté",
      "Les médias et la technologie",
      "La santé et le bien-être",
    ],
    keyVocabulary: [
      "la pollution, le réchauffement climatique, recycler",
      "la nature, la forêt, la mer, la montagne",
      "les sans-abri, la pauvreté, l'égalité",
      "Internet, un téléphone portable, les réseaux sociaux",
      "la santé, faire de l'exercice, une alimentation équilibrée",
    ],
    grammarFocus: [
      "Le subjonctif présent (après il faut que, bien que)",
      "Les expressions d'opinion (je pense que, à mon avis)",
      "Le passif",
      "Les connecteurs logiques (cependant, pourtant, donc)",
    ],
  },
  {
    id: "world_global",
    title: "Le monde global",
    subTopics: [
      "Les pays francophones et la francophonie",
      "Les langues et les cultures",
      "Les droits de l'homme et la justice",
      "Le monde du travail et l'économie",
      "Les défis mondiaux",
    ],
    keyVocabulary: [
      "la France, la Belgique, le Québec, l'Afrique francophone",
      "une langue, parler couramment, une culture",
      "les droits, l'égalité, la justice, la liberté",
      "le chômage, l'économie, le commerce",
      "la pauvreté, le développement durable, l'aide humanitaire",
    ],
    grammarFocus: [
      "Le plus-que-parfait",
      "Le discours indirect",
      "Les relatives (qui, que, dont, où)",
      "La nominalisation",
    ],
  },
];

// ---------------------------------------------------------------------------
// Grammar reference – organised by level of difficulty
// ---------------------------------------------------------------------------

export interface GrammarTopic {
  level: "fondamental" | "intermédiaire" | "avancé";
  topic: string;
  description: string;
  examRelevance: string;
}

export const IGCSE_FRENCH_GRAMMAR: GrammarTopic[] = [
  // Fondamental
  {
    level: "fondamental",
    topic: "Le présent de l'indicatif",
    description:
      "Conjugaison des verbes réguliers (-er, -ir, -re) et des principaux irréguliers (être, avoir, faire, aller, vouloir, pouvoir, devoir).",
    examRelevance: "Utilisé dans tous les types de production écrite et orale.",
  },
  {
    level: "fondamental",
    topic: "Les articles (défini, indéfini, partitif)",
    description: "le, la, les / un, une, des / du, de la, de l'.",
    examRelevance: "Erreurs fréquentes dans la production écrite.",
  },
  {
    level: "fondamental",
    topic: "L'accord des adjectifs",
    description: "Accord en genre et en nombre, position de l'adjectif.",
    examRelevance: "Critère d'évaluation de l'expression écrite.",
  },
  {
    level: "fondamental",
    topic: "Le passé composé",
    description:
      "Formation avec avoir et être ; participes passés réguliers et irréguliers ; accord du participe passé.",
    examRelevance: "Indispensable pour raconter des événements passés.",
  },
  {
    level: "fondamental",
    topic: "L'imparfait",
    description:
      "Formation et usage : description dans le passé, habitudes passées.",
    examRelevance: "Contrasté avec le passé composé dans les récits.",
  },
  {
    level: "fondamental",
    topic: "Le futur simple",
    description:
      "Formation régulière et irréguliers principaux (aller, avoir, être, faire, vouloir…).",
    examRelevance: "Projets d'avenir, prédictions.",
  },
  {
    level: "fondamental",
    topic: "Les négations",
    description: "ne…pas, ne…jamais, ne…rien, ne…plus, ne…personne.",
    examRelevance: "Critère de précision grammaticale.",
  },
  // Intermédiaire
  {
    level: "intermédiaire",
    topic: "Le conditionnel présent",
    description:
      "Formation et usage : politesse (je voudrais), hypothèse (si + imparfait + conditionnel).",
    examRelevance: "Fréquent dans les questions d'opinion et les essais.",
  },
  {
    level: "intermédiaire",
    topic: "Les pronoms compléments (COD, COI)",
    description: "me, te, le, la, les, lui, leur, y, en — place et ordre.",
    examRelevance: "Évalué dans la fluidité de l'expression écrite et orale.",
  },
  {
    level: "intermédiaire",
    topic: "Les verbes pronominaux",
    description: "Conjugaison au présent, passé composé et impératif.",
    examRelevance: "Très fréquents pour décrire la routine.",
  },
  {
    level: "intermédiaire",
    topic: "Les propositions relatives",
    description: "qui, que, où, dont.",
    examRelevance: "Permettent de produire des phrases complexes.",
  },
  {
    level: "intermédiaire",
    topic: "Le discours indirect",
    description: "Transformation des verbes et expressions temporelles.",
    examRelevance: "Utilisé dans les récits et la synthèse de textes.",
  },
  // Avancé
  {
    level: "avancé",
    topic: "Le subjonctif présent",
    description:
      "Formation et déclencheurs principaux : il faut que, bien que, pour que, avant que, vouloir que.",
    examRelevance: "Distingue les candidats de haut niveau (A*).",
  },
  {
    level: "avancé",
    topic: "Le plus-que-parfait",
    description:
      "Formation et usage : action antérieure à une autre dans le passé.",
    examRelevance: "Utilisé dans les récits complexes.",
  },
  {
    level: "avancé",
    topic: "Le passif",
    description: "Formation et usage ; agent introduit par par.",
    examRelevance: "Textes formels, articles, essais.",
  },
  {
    level: "avancé",
    topic: "Le gérondif et le participe présent",
    description: "en + participe présent, emplois du participe présent.",
    examRelevance: "Style soutenu dans l'expression écrite.",
  },
];

// ---------------------------------------------------------------------------
// Writing text types
// ---------------------------------------------------------------------------

export interface TextType {
  type: string; // French label
  description: string;
  keyFeatures: string[];
  examplePrompt: string;
}

export const IGCSE_FRENCH_TEXT_TYPES: TextType[] = [
  {
    type: "La lettre formelle",
    description:
      "Courrier adressé à une institution, un employeur ou une organisation.",
    keyFeatures: [
      "Formule d'appel : Monsieur/Madame,",
      "Registre formel, vouvoiement",
      "Structure en paragraphes",
      "Formule de politesse finale",
    ],
    examplePrompt:
      "Écrivez une lettre à la mairie pour signaler un problème dans votre quartier.",
  },
  {
    type: "La lettre / le message informel",
    description:
      "Courrier ou message à un(e) ami(e), un(e) correspondant(e) ou un membre de la famille.",
    keyFeatures: [
      "Formule d'appel : Cher/Chère + prénom,",
      "Tutoiement, langage familier acceptable",
      "Ton amical et personnel",
    ],
    examplePrompt:
      "Écrivez un email à votre ami(e) français(e) pour décrire votre week-end.",
  },
  {
    type: "L'article",
    description:
      "Texte informatif ou d'opinion pour un journal ou un magazine scolaire.",
    keyFeatures: [
      "Titre accrocheur",
      "Introduction, développement, conclusion",
      "Exemples et faits pour soutenir les arguments",
    ],
    examplePrompt:
      "Écrivez un article pour le journal de votre école sur les avantages du sport.",
  },
  {
    type: "Le compte rendu / rapport",
    description:
      "Document informatif présentant des faits, des résultats ou une situation.",
    keyFeatures: [
      "Titres et sous-titres",
      "Registre neutre et objectif",
      "Données chiffrées si disponibles",
    ],
    examplePrompt:
      "Rédigez un rapport sur les habitudes alimentaires des jeunes de votre école.",
  },
  {
    type: "L'essai / la rédaction d'opinion",
    description: "Texte argumentatif présentant et défendant un point de vue.",
    keyFeatures: [
      "Thèse clairement énoncée",
      "Arguments développés avec exemples",
      "Contre-arguments reconnus",
      "Connecteurs logiques variés",
      "Conclusion synthétique",
    ],
    examplePrompt:
      "« Les téléphones portables devraient être interdits dans les écoles. » Discutez.",
  },
  {
    type: "La narration / le récit",
    description: "Texte racontant une histoire réelle ou imaginaire.",
    keyFeatures: [
      "Temps du passé (passé composé + imparfait)",
      "Descriptions et dialogues",
      "Structure narrative : début, péripétie, dénouement",
    ],
    examplePrompt: "Racontez une aventure que vous avez vécue ou imaginée.",
  },
];

// ---------------------------------------------------------------------------
// IGCSE grade boundaries – Cambridge UMS (Uniform Mark Scheme)
// Cambridge IGCSE French (0520 / 7156)
// ---------------------------------------------------------------------------

export interface GradeBoundary {
  grade: string;
  umsEquivalent: string; // IGCSE numeric equivalent (9-scale where used)
  minPercent: number; // Lower boundary as a % of total UMS
  maxPercent: number; // Upper boundary as a % of total UMS
  label: string; // French descriptor
  descriptor: string; // Full French performance descriptor
  teacherNote: string; // Guidance for teacher comments
}

export const IGCSE_GRADE_BOUNDARIES: GradeBoundary[] = [
  {
    grade: "A*",
    umsEquivalent: "9 / 8",
    minPercent: 90,
    maxPercent: 100,
    label: "Exceptionnel",
    descriptor:
      "Performance exceptionnelle. L'élève maîtrise l'ensemble des compétences du programme avec une grande précision. Expression écrite et orale très élaborée, grammaire quasi-irréprochable, vocabulaire riche et varié.",
    teacherNote:
      "Encourager à viser l'excellence dans l'expression orale et la rédaction avancée. Préparer à la distinction Cambridge.",
  },
  {
    grade: "A",
    umsEquivalent: "7",
    minPercent: 80,
    maxPercent: 89,
    label: "Excellent",
    descriptor:
      "Excellente performance. Solide maîtrise des quatre compétences (écoute, lecture, expression écrite, expression orale). Quelques erreurs mineures qui n'affectent pas la compréhension.",
    teacherNote:
      "Consolider la précision grammaticale (subjonctif, conditionnel) et enrichir le registre formel pour progresser vers A*.",
  },
  {
    grade: "B",
    umsEquivalent: "6 / 5",
    minPercent: 70,
    maxPercent: 79,
    label: "Bien",
    descriptor:
      "Bonne performance. Bonne compréhension des textes écrits et oraux. Production écrite généralement correcte avec quelques erreurs grammaticales. Vocabulaire adéquat pour les thèmes principaux.",
    teacherNote:
      "Travailler l'expression orale spontanée et la production de textes argumentatifs. Revoir les temps composés et le conditionnel.",
  },
  {
    grade: "C",
    umsEquivalent: "5 / 4",
    minPercent: 60,
    maxPercent: 69,
    label: "Satisfaisant — seuil IGCSE",
    descriptor:
      "Performance satisfaisante. Seuil minimum de réussite Cambridge IGCSE. Compréhension correcte des textes simples. Peut communiquer des informations de base mais commet des erreurs fréquentes qui gênent parfois la compréhension.",
    teacherNote:
      "Renforcer la grammaire de base (accords, conjugaisons) et le vocabulaire thématique. S'entraîner sur les annales pour consolider la méthode.",
  },
  {
    grade: "D",
    umsEquivalent: "3",
    minPercent: 50,
    maxPercent: 59,
    label: "Passable",
    descriptor:
      "Performance en dessous du seuil Cambridge. Compréhension partielle ; des lacunes importantes en grammaire et en vocabulaire limitent la communication. Des efforts sont nécessaires pour atteindre le seuil de réussite (C).",
    teacherNote:
      "Cibler les structures grammaticales fondamentales et les thèmes vocabulaires clés du programme. Révisions régulières et pratique guidée.",
  },
  {
    grade: "E",
    umsEquivalent: "2",
    minPercent: 40,
    maxPercent: 49,
    label: "Insuffisant",
    descriptor:
      "Performance insuffisante. Difficultés notables dans toutes les compétences. La communication en français est très limitée. Un soutien personnalisé intensif est recommandé.",
    teacherNote:
      "Retour aux fondamentaux : présent, passé composé, vocabulaire du quotidien. Envisager un tutorat ou un soutien individualisé.",
  },
  {
    grade: "F",
    umsEquivalent: "2",
    minPercent: 30,
    maxPercent: 39,
    label: "Faible",
    descriptor:
      "Performance faible. Les bases de la langue française ne sont pas acquises. La compréhension et la production sont très limitées. Un programme de rattrapage est fortement conseillé.",
    teacherNote:
      "Priorité absolue aux bases : alphabet phonétique, articles, verbes être et avoir, phrases simples au présent.",
  },
  {
    grade: "G",
    umsEquivalent: "1",
    minPercent: 20,
    maxPercent: 29,
    label: "Très faible",
    descriptor:
      "Performance très faible. L'élève ne démontre qu'une compréhension et une production minimales en français. Une intervention pédagogique urgente est nécessaire.",
    teacherNote:
      "Intervention urgente requise. Évaluer les obstacles à l'apprentissage (langue maternelle, difficultés cognitives) et adapter le soutien en conséquence.",
  },
  {
    grade: "U",
    umsEquivalent: "—",
    minPercent: 0,
    maxPercent: 19,
    label: "Non classé",
    descriptor:
      "En dessous du seuil minimum. Non classé selon les critères Cambridge IGCSE. L'élève n'a pas démontré de compétences mesurables en français.",
    teacherNote:
      "Revoir complètement l'approche pédagogique. Envisager un entretien avec l'élève et les parents pour identifier les obstacles.",
  },
];

/**
 * Returns the full IGCSE grade boundary record corresponding to a percentage score.
 */
export function getIgcseGrade(percent: number): GradeBoundary {
  for (const boundary of IGCSE_GRADE_BOUNDARIES) {
    if (percent >= boundary.minPercent) {
      return boundary;
    }
  }
  return IGCSE_GRADE_BOUNDARIES[IGCSE_GRADE_BOUNDARIES.length - 1];
}

/**
 * Returns grammar topics relevant to a given performance level.
 */
export function getRelevantGrammarTopics(percent: number): GrammarTopic[] {
  if (percent < 40) {
    return IGCSE_FRENCH_GRAMMAR.filter((g) => g.level === "fondamental");
  }
  if (percent < 65) {
    return IGCSE_FRENCH_GRAMMAR.filter(
      (g) => g.level === "fondamental" || g.level === "intermédiaire",
    );
  }
  return IGCSE_FRENCH_GRAMMAR; // all levels
}

/**
 * Returns the most relevant syllabus themes based on which assessments are weak.
 * If no weak themes can be identified, returns the first two themes.
 */
export function getRelevantThemes(percent: number): SyllabusTheme[] {
  if (percent < 50) {
    // Focus on high-frequency everyday themes
    return IGCSE_FRENCH_THEMES.filter((t) =>
      ["everyday_life", "personal_world", "school_work"].includes(t.id),
    );
  }
  if (percent < 70) {
    return IGCSE_FRENCH_THEMES.filter((t) =>
      ["school_work", "leisure_tourism", "environment_society"].includes(t.id),
    );
  }
  return IGCSE_FRENCH_THEMES.filter((t) =>
    ["environment_society", "world_global"].includes(t.id),
  );
}

/**
 * Returns the recommended text types to practise based on overall performance.
 */
export function getRecommendedTextTypes(percent: number): TextType[] {
  if (percent < 50) {
    return IGCSE_FRENCH_TEXT_TYPES.filter((t) =>
      ["La lettre / le message informel", "La narration / le récit"].includes(
        t.type,
      ),
    );
  }
  if (percent < 70) {
    return IGCSE_FRENCH_TEXT_TYPES.filter((t) =>
      ["La lettre formelle", "L'article", "La narration / le récit"].includes(
        t.type,
      ),
    );
  }
  return IGCSE_FRENCH_TEXT_TYPES.filter((t) =>
    [
      "L'essai / la rédaction d'opinion",
      "Le compte rendu / rapport",
      "La lettre formelle",
    ].includes(t.type),
  );
}
