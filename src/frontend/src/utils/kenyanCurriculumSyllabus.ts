/**
 * Kenyan Curriculum French – Syllabus & Grading Reference
 *
 * Two systems:
 *  1. Kenya 8-4-4 System (Form 3) – KCSE grading (12-point grade scale A → E)
 *  2. Kenya Competency Based Curriculum (CBC/CBE) Grade 10 – Achievement Levels
 *
 * Comments focus on French language competence within the Kenyan context,
 * referencing KCSE exam skills for Form 3 and CBC competency levels for Grade 10.
 */

// ---------------------------------------------------------------------------
// KENYA 8-4-4 KCSE Grade Boundaries (Form 3)
// KCSE uses a 12-point scale: A (12), A- (11), B+ (10), B (9), B- (8),
// C+ (7), C (6), C- (5), D+ (4), D (3), D- (2), E (1)
// Mapped here to percentage ranges.
// ---------------------------------------------------------------------------

export interface KcseGradeBoundary {
  grade: string; // e.g. "A", "B+", "C"
  points: number; // KCSE points (1-12)
  minPercent: number;
  maxPercent: number;
  label: string;
  descriptor: string;
  teacherNote: string;
}

export const KCSE_GRADE_BOUNDARIES: KcseGradeBoundary[] = [
  {
    grade: "A",
    points: 12,
    minPercent: 90,
    maxPercent: 100,
    label: "Excellent",
    descriptor:
      "Maîtrise exceptionnelle du français. L'élève comprend et produit des textes complexes avec précision et aisance, conformément aux exigences du niveau KCSE le plus élevé.",
    teacherNote:
      "Encourager à maintenir ce niveau et à viser les meilleures distinctions au KCSE. Pratiquer des textes authentiques de niveau avancé.",
  },
  {
    grade: "A-",
    points: 11,
    minPercent: 80,
    maxPercent: 89,
    label: "Très bien",
    descriptor:
      "Très bonne maîtrise du français. L'élève communique efficacement à l'oral et à l'écrit avec quelques imprécisions mineures qui n'affectent pas la compréhension.",
    teacherNote:
      "Consolider la précision grammaticale (accord, conjugaison des temps composés) pour atteindre le niveau A.",
  },
  {
    grade: "B+",
    points: 10,
    minPercent: 75,
    maxPercent: 79,
    label: "Bien +",
    descriptor:
      "Bonne maîtrise générale. L'élève comprend les textes courants et peut produire des réponses pertinentes avec un vocabulaire adéquat et une grammaire généralement correcte.",
    teacherNote:
      "Approfondir la production écrite et orale. Travailler la richesse du vocabulaire et la précision grammaticale.",
  },
  {
    grade: "B",
    points: 9,
    minPercent: 65,
    maxPercent: 74,
    label: "Bien",
    descriptor:
      "Bonne compréhension générale du français. L'élève peut communiquer à l'oral et à l'écrit sur des sujets connus avec une certaine aisance.",
    teacherNote:
      "Renforcer la pratique régulière de la lecture et de l'écriture. Revoir les structures grammaticales intermédiaires.",
  },
  {
    grade: "B-",
    points: 8,
    minPercent: 60,
    maxPercent: 64,
    label: "Assez bien",
    descriptor:
      "Compréhension et expression satisfaisantes sur des sujets familiers. Des lacunes dans certaines structures grammaticales limitent parfois la communication.",
    teacherNote:
      "Consolider les bases grammaticales et enrichir le vocabulaire thématique. Pratiquer des exercices ciblés de conjugaison.",
  },
  {
    grade: "C+",
    points: 7,
    minPercent: 55,
    maxPercent: 59,
    label: "Satisfaisant +",
    descriptor:
      "Compréhension partielle des textes. L'élève peut produire des réponses simples mais commet des erreurs qui gênent la communication.",
    teacherNote:
      "Travailler les compétences de compréhension écrite et orale. Réviser les structures de base : temps présent, passé composé, futur.",
  },
  {
    grade: "C",
    points: 6,
    minPercent: 50,
    maxPercent: 54,
    label: "Satisfaisant",
    descriptor:
      "Niveau de base atteint. L'élève démontre une compréhension limitée et peut communiquer des informations élémentaires avec des erreurs fréquentes.",
    teacherNote:
      "Renforcer les fondamentaux : vocabulaire de base, structures simples, conjugaison des verbes courants. Soutien personnalisé recommandé.",
  },
  {
    grade: "C-",
    points: 5,
    minPercent: 45,
    maxPercent: 49,
    label: "Passable",
    descriptor:
      "Niveau en dessous des attentes. Des difficultés importantes en compréhension et en production limitent sérieusement la communication en français.",
    teacherNote:
      "Intervention urgente nécessaire. Revoir les bases : alphabet, salutations, présentation, chiffres, jours, mois — avec des activités variées.",
  },
  {
    grade: "D+",
    points: 4,
    minPercent: 40,
    maxPercent: 44,
    label: "Insuffisant +",
    descriptor:
      "Performance insuffisante. L'élève présente de grandes lacunes dans la compréhension et la production du français.",
    teacherNote:
      "Soutien intensif recommandé. Se concentrer sur le vocabulaire du quotidien et les structures les plus simples.",
  },
  {
    grade: "D",
    points: 3,
    minPercent: 30,
    maxPercent: 39,
    label: "Insuffisant",
    descriptor:
      "Grandes difficultés dans toutes les compétences. Communication en français très limitée.",
    teacherNote:
      "Priorité aux bases absolues. Envisager un rattrapage ou un soutien individuel régulier.",
  },
  {
    grade: "D-",
    points: 2,
    minPercent: 20,
    maxPercent: 29,
    label: "Faible",
    descriptor:
      "Performance très faible. Seuls des mots et expressions isolés sont reconnus ou produits.",
    teacherNote:
      "Réévaluer l'approche pédagogique. Identifier les obstacles (langue maternelle, difficulté d'apprentissage) et adapter le soutien.",
  },
  {
    grade: "E",
    points: 1,
    minPercent: 0,
    maxPercent: 19,
    label: "Très faible",
    descriptor:
      "En dessous du seuil minimal. Aucune compétence mesurable en français n'est démontrée.",
    teacherNote:
      "Intervention pédagogique immédiate et urgente requise. Contacter la famille pour une prise en charge concertée.",
  },
];

export function getKcseGrade(percent: number): KcseGradeBoundary {
  for (const boundary of KCSE_GRADE_BOUNDARIES) {
    if (percent >= boundary.minPercent) return boundary;
  }
  return KCSE_GRADE_BOUNDARIES[KCSE_GRADE_BOUNDARIES.length - 1];
}

// ---------------------------------------------------------------------------
// KENYA CBC/CBE Achievement Levels (Grade 10)
// CBC uses 4 achievement levels:
//   Exceeds Expectation (EE) / Meets Expectation (ME) /
//   Approaches Expectation (AE) / Below Expectation (BE)
// ---------------------------------------------------------------------------

export interface CbcAchievementLevel {
  level: string; // e.g. "EE", "ME", "AE", "BE"
  label: string; // e.g. "Exceeds Expectation"
  labelFr: string; // French label
  minPercent: number;
  maxPercent: number;
  descriptor: string; // Full French descriptor
  teacherNote: string;
}

export const CBC_ACHIEVEMENT_LEVELS: CbcAchievementLevel[] = [
  {
    level: "EE",
    label: "Exceeds Expectation",
    labelFr: "Dépasse les attentes",
    minPercent: 80,
    maxPercent: 100,
    descriptor:
      "L'élève dépasse les compétences attendues en français dans le cadre du CBC. Il/Elle démontre une maîtrise approfondie des compétences linguistiques, fait preuve de créativité dans son expression et applique ses connaissances dans des contextes nouveaux et variés.",
    teacherNote:
      "Féliciter l'élève et lui proposer des activités d'enrichissement : lectures authentiques, projets créatifs, présentations orales élaborées.",
  },
  {
    level: "ME",
    label: "Meets Expectation",
    labelFr: "Répond aux attentes",
    minPercent: 60,
    maxPercent: 79,
    descriptor:
      "L'élève répond aux compétences attendues dans le programme CBC de Grade 10. Il/Elle comprend et utilise le français de manière adéquate pour les tâches communicatives prévues dans le programme.",
    teacherNote:
      "Encourager l'élève à approfondir sa maîtrise et à prendre des initiatives dans l'utilisation du français. Proposer des défis progressifs.",
  },
  {
    level: "AE",
    label: "Approaches Expectation",
    labelFr: "Progresse vers les attentes",
    minPercent: 40,
    maxPercent: 59,
    descriptor:
      "L'élève est en cours d'acquisition des compétences attendues. Il/Elle montre des progrès mais a encore besoin de consolidation dans les domaines fondamentaux du programme CBC.",
    teacherNote:
      "Cibler les compétences spécifiques non encore maîtrisées. Utiliser des activités différenciées pour consolider les bases.",
  },
  {
    level: "BE",
    label: "Below Expectation",
    labelFr: "En dessous des attentes",
    minPercent: 0,
    maxPercent: 39,
    descriptor:
      "L'élève n'a pas encore atteint les compétences de base attendues dans le cadre du programme CBC. Un soutien ciblé et régulier est nécessaire pour progresser.",
    teacherNote:
      "Mettre en place un plan de soutien individualisé. Revoir les fondamentaux et adapter les activités au niveau de l'élève. Communication avec les parents recommandée.",
  },
];

export function getCbcLevel(percent: number): CbcAchievementLevel {
  for (const level of CBC_ACHIEVEMENT_LEVELS) {
    if (percent >= level.minPercent) return level;
  }
  return CBC_ACHIEVEMENT_LEVELS[CBC_ACHIEVEMENT_LEVELS.length - 1];
}

// ---------------------------------------------------------------------------
// Shared grammar reference for Kenyan French curriculum
// Topics align with both 8-4-4 (Form 3) and CBC (Grade 10) expectations
// ---------------------------------------------------------------------------

export interface KenyaGrammarTopic {
  level: "fondamental" | "intermédiaire" | "avancé";
  topic: string;
  description: string;
  kcseRelevance: string; // Relevant for both KCSE and CBC
}

export const KENYA_FRENCH_GRAMMAR: KenyaGrammarTopic[] = [
  {
    level: "fondamental",
    topic: "Le présent de l'indicatif",
    description:
      "Conjugaison des verbes réguliers et irréguliers courants (être, avoir, faire, aller).",
    kcseRelevance: "Base de toute communication orale et écrite.",
  },
  {
    level: "fondamental",
    topic: "Le passé composé",
    description: "Formation avec avoir et être ; participes passés principaux.",
    kcseRelevance: "Essentiel pour raconter des expériences et événements.",
  },
  {
    level: "fondamental",
    topic: "L'imparfait",
    description: "Description du passé, habitudes passées.",
    kcseRelevance: "Requis pour les compositions écrites KCSE / CBC.",
  },
  {
    level: "fondamental",
    topic: "Le futur simple",
    description: "Parler de projets, de plans et d'événements futurs.",
    kcseRelevance: "Très fréquent dans les sujets de composition.",
  },
  {
    level: "intermédiaire",
    topic: "Le conditionnel présent",
    description: "Politesse (je voudrais), hypothèses (si + imparfait).",
    kcseRelevance: "Attendu dans les textes de niveau intermédiaire.",
  },
  {
    level: "intermédiaire",
    topic: "Les pronoms compléments",
    description: "COD (le, la, les), COI (lui, leur), y, en.",
    kcseRelevance: "Distingue les élèves de bon niveau.",
  },
  {
    level: "intermédiaire",
    topic: "Les propositions relatives",
    description: "qui, que, où, dont — pour construire des phrases complexes.",
    kcseRelevance: "Critère de richesse syntaxique dans les compositions.",
  },
  {
    level: "avancé",
    topic: "Le subjonctif présent",
    description:
      "Après il faut que, vouloir que, bien que — pour exprimer le souhait et la concession.",
    kcseRelevance: "Distingue les candidats de haut niveau.",
  },
  {
    level: "avancé",
    topic: "Le plus-que-parfait",
    description: "Action antérieure dans les récits complexes.",
    kcseRelevance: "Requis dans les compositions avancées.",
  },
];

export function getKenyaGrammarTopics(percent: number): KenyaGrammarTopic[] {
  if (percent < 45) {
    return KENYA_FRENCH_GRAMMAR.filter((g) => g.level === "fondamental");
  }
  if (percent < 65) {
    return KENYA_FRENCH_GRAMMAR.filter(
      (g) => g.level === "fondamental" || g.level === "intermédiaire",
    );
  }
  return KENYA_FRENCH_GRAMMAR;
}

// ---------------------------------------------------------------------------
// CBC Core Competency Areas (Grade 10 French)
// ---------------------------------------------------------------------------

export interface CbcCompetency {
  id: string;
  title: string;
  description: string;
  activities: string[];
}

export const CBC_FRENCH_COMPETENCIES: CbcCompetency[] = [
  {
    id: "communication",
    title: "Communication et collaboration",
    description:
      "Utiliser le français pour communiquer efficacement dans des situations de la vie réelle.",
    activities: [
      "Jeux de rôle et simulations",
      "Présentations orales",
      "Projets collaboratifs en groupe",
    ],
  },
  {
    id: "critical_thinking",
    title: "Pensée critique et résolution de problèmes",
    description:
      "Analyser des textes et situations pour produire des réponses pertinentes en français.",
    activities: [
      "Lecture critique de textes variés",
      "Rédaction d'opinions argumentées",
      "Débats encadrés en français",
    ],
  },
  {
    id: "creativity",
    title: "Créativité et imagination",
    description:
      "Produire des textes créatifs et des communications originales en français.",
    activities: [
      "Rédaction de récits créatifs",
      "Poèmes et chansons en français",
      "Projets multimédias en français",
    ],
  },
  {
    id: "digital_literacy",
    title: "Littératie numérique",
    description:
      "Utiliser des ressources numériques pour apprendre et pratiquer le français.",
    activities: [
      "Applications d'apprentissage des langues",
      "Recherche d'informations en français",
      "Productions numériques en français",
    ],
  },
  {
    id: "self_efficacy",
    title: "Autonomie et efficacité personnelle",
    description:
      "Développer des stratégies d'apprentissage autonome du français.",
    activities: [
      "Journal de bord en français",
      "Auto-évaluation des progrès",
      "Révision indépendante avec des ressources variées",
    ],
  },
];
