/**
 * Cambridge IGCSE French – Personalized Student Comment Generator
 * All generated text is in French.
 * Comments are aligned to the Cambridge IGCSE French syllabus (0520 / 7156).
 *
 * Grade routing:
 *  - Year 8 / Year 9  → KS3 language acquisition framework
 *  - Form 3 / Grade 10 → Cambridge IGCSE exam preparation framework
 */
import {
  getIgcseGrade,
  getRecommendedTextTypes,
  getRelevantGrammarTopics,
  getRelevantThemes,
} from "./igcseSyllabus";
import {
  generateCbcComments,
  generateKcse844Comments,
} from "./kenyanCurriculumComments";
import { generateKs3Comments as generateKs3CommentsInternal } from "./ks3Comments";

export interface IgcseCommentParams {
  studentName: string;
  grade: string; // e.g. "Year 9", "Form 3", "Grade 10"
  overallAvg: number; // percentage 0-100
  trendSlope: number; // from linear regression
  trendLabel: string; // "Improving" | "Stable" | "Declining"
  deviation: number; // student avg minus class avg
  subjectBreakdown: Array<{
    subjectName: string;
    studentAvg: number;
    classAvg: number;
    deviation: number;
    markCount: number;
  }>;
  assessmentScores: Array<{
    assessmentName: string; // e.g. "T1 Entry", "T1 Midterm", "T1 Endterm"
    term: string;
    scorePercent: number;
  }>;
}

export interface IgcseComment {
  summary: string;
  strengths: string[];
  improvements: string[];
  targetSkills: string[];
  fullText: string;
  igcseGrade: string; // e.g. "B"
  igcseGradeLabel: string; // e.g. "Bien"
  igcseUms: string; // e.g. "6 / 5"
  teacherNote: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function t1Scores(params: IgcseCommentParams): number[] {
  return params.assessmentScores
    .filter(
      (a) => a.term === "T1" || a.assessmentName.toLowerCase().includes("t1"),
    )
    .map((a) => a.scorePercent);
}

function t2Scores(params: IgcseCommentParams): number[] {
  return params.assessmentScores
    .filter(
      (a) => a.term === "T2" || a.assessmentName.toLowerCase().includes("t2"),
    )
    .map((a) => a.scorePercent);
}

function avgOf(scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function entryScores(params: IgcseCommentParams): number[] {
  return params.assessmentScores
    .filter((a) => a.assessmentName.toLowerCase().includes("entry"))
    .map((a) => a.scorePercent);
}

function endtermScores(params: IgcseCommentParams): number[] {
  return params.assessmentScores
    .filter(
      (a) =>
        a.assessmentName.toLowerCase().includes("endterm") ||
        a.assessmentName.toLowerCase().includes("end term") ||
        a.assessmentName.toLowerCase().includes("end-term"),
    )
    .map((a) => a.scorePercent);
}

// ---------------------------------------------------------------------------
// Summary paragraph
// ---------------------------------------------------------------------------

function buildSummary(params: IgcseCommentParams): string {
  const { studentName, overallAvg, trendLabel, deviation } = params;

  const igcseGrade = getIgcseGrade(overallAvg);

  // Performance level sentence — references the actual IGCSE grade
  let levelSentence: string;
  if (overallAvg >= 80) {
    levelSentence = `${studentName} démontre d'excellentes compétences en français, avec une moyenne générale de ${Math.round(overallAvg)} % (niveau Cambridge IGCSE : ${igcseGrade.grade} — ${igcseGrade.label}), témoignant d'un travail rigoureux et d'une solide maîtrise des contenus du programme.`;
  } else if (overallAvg >= 60) {
    levelSentence = `${studentName} affiche des résultats satisfaisants en français avec une moyenne de ${Math.round(overallAvg)} % (niveau Cambridge IGCSE : ${igcseGrade.grade} — ${igcseGrade.label}), reflétant une bonne compréhension des notions fondamentales du programme.`;
  } else if (overallAvg >= 40) {
    levelSentence = `${studentName} obtient une moyenne de ${Math.round(overallAvg)} % en français (niveau Cambridge IGCSE : ${igcseGrade.grade} — ${igcseGrade.label}), ce qui indique une compréhension partielle des contenus du programme et un besoin de renforcement ciblé.`;
  } else {
    levelSentence = `${studentName} rencontre des difficultés importantes en français avec une moyenne de ${Math.round(overallAvg)} % (niveau Cambridge IGCSE : ${igcseGrade.grade} — ${igcseGrade.label}), ce qui nécessite une attention immédiate et un soutien personnalisé.`;
  }

  // Trend sentence
  let trendSentence: string;
  if (trendLabel === "Improving") {
    trendSentence =
      "Sa progression est encourageante : les résultats récents montrent une tendance à la hausse, signe d'un effort accru et d'une meilleure assimilation des contenus.";
  } else if (trendLabel === "Declining") {
    trendSentence =
      "Cependant, une tendance à la baisse est observée dans les évaluations récentes, ce qui mérite une attention particulière pour enrayer cette progression négative.";
  } else {
    trendSentence =
      "Les résultats sont globalement stables d'une évaluation à l'autre, ce qui indique une régularité dans le travail, même si une progression plus marquée reste souhaitable.";
  }

  // Deviation sentence
  let deviationSentence: string;
  if (deviation >= 5) {
    deviationSentence = `L'élève se situe nettement au-dessus de la moyenne de classe (+${Math.round(deviation)} %), ce qui est très positif.`;
  } else if (deviation >= 1) {
    deviationSentence = `L'élève se situe légèrement au-dessus de la moyenne de classe (+${Math.round(deviation)} %).`;
  } else if (deviation >= -4) {
    deviationSentence = `L'élève se situe dans la moyenne de classe (${Math.round(deviation)} %).`;
  } else {
    deviationSentence = `L'élève se situe en dessous de la moyenne de classe (${Math.round(deviation)} %), ce qui nécessite un travail supplémentaire pour combler l'écart.`;
  }

  return `${levelSentence} ${trendSentence} ${deviationSentence}`;
}

// ---------------------------------------------------------------------------
// Strengths
// ---------------------------------------------------------------------------

function buildStrengths(params: IgcseCommentParams): string[] {
  const { overallAvg, deviation, trendLabel } = params;
  const strengths: string[] = [];

  const t1Avg = avgOf(t1Scores(params));
  const t2Avg = avgOf(t2Scores(params));
  const entries = entryScores(params);
  const endterms = endtermScores(params);
  const entryAvg = avgOf(entries);
  const endtermAvg = avgOf(endterms);

  // T1 vs T2 comparison
  if (
    t1Scores(params).length > 0 &&
    t2Scores(params).length > 0 &&
    t1Avg > t2Avg + 3
  ) {
    strengths.push(
      "Bonne performance au premier trimestre, avec des résultats solides lors des premières évaluations de l'année.",
    );
  }

  // Entry vs Endterm progression
  if (entries.length > 0 && endterms.length > 0) {
    if (endtermAvg > entryAvg + 3) {
      strengths.push(
        "Progression visible entre l'évaluation d'entrée et l'évaluation finale, témoignant d'une bonne capacité d'apprentissage au fil des trimestres.",
      );
    } else if (entryAvg > endtermAvg + 3) {
      strengths.push(
        "Bonne préparation en début de période, avec un démarrage fort en évaluation d'entrée qui montre une bonne révision préalable.",
      );
    }
  }

  // High average
  if (overallAvg >= 80) {
    strengths.push(
      "Excellente compréhension des textes écrits (compréhension écrite) et maîtrise approfondie des structures grammaticales du programme IGCSE.",
    );
  } else if (overallAvg >= 70) {
    strengths.push(
      "Solide maîtrise du vocabulaire et des structures grammaticales de base attendues au niveau Cambridge IGCSE.",
    );
  }

  // Above class average
  if (deviation >= 5) {
    strengths.push(
      "Performance supérieure à la moyenne de classe, ce qui témoigne d'un investissement personnel remarquable.",
    );
  }

  // Improving trend
  if (trendLabel === "Improving" && strengths.length < 2) {
    strengths.push(
      "Tendance positive dans l'évolution des résultats, reflétant un engagement croissant dans le travail en français.",
    );
  }

  // Generic fallbacks to ensure at least 2 strengths
  if (strengths.length === 0) {
    strengths.push(
      "Effort régulier et participation active lors des évaluations tout au long de l'année scolaire.",
    );
  }
  if (strengths.length < 2) {
    strengths.push(
      "Capacité à compléter les différentes formes d'évaluation (entrée, mi-trimestre et fin de trimestre) proposées dans le cadre du programme IGCSE Français.",
    );
  }

  return strengths.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Improvements
// ---------------------------------------------------------------------------

function buildImprovements(params: IgcseCommentParams): string[] {
  const { overallAvg, trendLabel, deviation } = params;
  const improvements: string[] = [];

  const entries = entryScores(params);
  const endterms = endtermScores(params);
  const entryAvg = avgOf(entries);
  const endtermAvg = avgOf(endterms);

  // Low average – reading comprehension
  if (overallAvg < 50) {
    improvements.push(
      "Renforcer la compréhension écrite en lisant régulièrement des textes en français de niveau IGCSE (articles, extraits littéraires, textes informatifs) et en pratiquant des exercices de questions ciblées.",
    );
  }

  // Below 60 – grammar consolidation
  if (overallAvg < 60) {
    improvements.push(
      "Consolider les bases grammaticales, notamment l'usage des temps verbaux (passé composé, imparfait, futur simple et conditionnel) à travers des exercices réguliers de conjugaison et de production écrite guidée.",
    );
  }

  // Declining trend
  if (trendLabel === "Declining") {
    improvements.push(
      "Maintenir la régularité du travail : la baisse récente des résultats suggère un besoin de révision plus fréquente et de retour sur les notions déjà étudiées pour éviter les lacunes.",
    );
  }

  // Below class average (significant)
  if (deviation < -5) {
    improvements.push(
      "Participer davantage aux activités orales en classe pour améliorer l'expression orale et gagner en confiance lors des prises de parole, compétence clé de l'examen Cambridge IGCSE.",
    );
  }

  // Regression between entry and endterm
  if (entries.length > 0 && endterms.length > 0 && endtermAvg < entryAvg - 3) {
    improvements.push(
      "Revoir les notions étudiées en fin de trimestre pour consolider les acquis avant les examens : la baisse entre l'évaluation d'entrée et l'évaluation finale indique que certains contenus nécessitent une révision approfondie.",
    );
  }

  // Encouraging improving trend – sustain momentum
  if (trendLabel === "Improving") {
    improvements.push(
      "Maintenir cet élan positif en continuant la pratique régulière de la lecture et de l'écriture en français, et en explorant des ressources complémentaires (podcasts, films, textes en ligne) pour enrichir son vocabulaire.",
    );
  }

  // Stable at moderate level
  if (trendLabel === "Stable" && overallAvg >= 50 && overallAvg < 70) {
    improvements.push(
      "Pour progresser au-delà de ce niveau stable, s'exercer davantage à la rédaction guidée et à la production écrite libre, en ciblant la précision grammaticale et la richesse du vocabulaire.",
    );
  }

  // Syllabus-aligned: recommend specific grammar topics
  const grammarTopics = getRelevantGrammarTopics(overallAvg);
  if (grammarTopics.length > 0 && improvements.length < 3) {
    const topic = grammarTopics[0];
    improvements.push(
      `Réviser et pratiquer le point de grammaire suivant, prioritaire à ce niveau : « ${topic.topic} » — ${topic.description}`,
    );
  }

  // Syllabus-aligned: recommend a specific text type to practise
  const textTypes = getRecommendedTextTypes(overallAvg);
  if (textTypes.length > 0 && improvements.length < 3) {
    const tt = textTypes[0];
    improvements.push(
      `S'exercer à la production de « ${tt.type} » : ${tt.description} Exemple de sujet : « ${tt.examplePrompt} »`,
    );
  }

  // Ensure at least 2 improvements
  if (improvements.length === 0) {
    improvements.push(
      "Approfondir la maîtrise des registres de langue (formel et informel) en pratiquant la rédaction de différents types de textes : lettres, emails, comptes rendus et essais courts.",
    );
  }
  if (improvements.length < 2) {
    improvements.push(
      "S'entraîner régulièrement avec des annales Cambridge IGCSE pour se familiariser avec le format des examens et améliorer la gestion du temps lors des épreuves.",
    );
  }

  return improvements.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Target skills
// ---------------------------------------------------------------------------

function buildTargetSkills(params: IgcseCommentParams): string[] {
  const { overallAvg, trendLabel } = params;
  const skills: string[] = [];

  if (overallAvg < 50) {
    skills.push("Grammaire et conjugaison");
    skills.push("Vocabulaire thématique");
    if (skills.length < 3) skills.push("Compréhension écrite");
  } else if (overallAvg < 65) {
    skills.push("Expression écrite");
    skills.push("Rédaction guidée");
    if (skills.length < 3) skills.push("Grammaire et conjugaison");
  } else if (overallAvg < 80) {
    skills.push("Expression orale");
    skills.push("Compréhension orale");
    if (skills.length < 3) skills.push("Expression écrite");
  } else {
    skills.push("Expression orale");
    skills.push("Rédaction avancée");
    if (skills.length < 3) skills.push("Compréhension orale");
  }

  if (trendLabel === "Declining") {
    if (!skills.includes("Révision systématique des chapitres précédents")) {
      skills.push("Révision systématique des chapitres précédents");
    }
  }

  // Add one syllabus theme as a target vocabulary focus
  const themes = getRelevantThemes(overallAvg);
  if (themes.length > 0) {
    skills.push(`Vocabulaire du thème : « ${themes[0].title} »`);
  }

  return skills.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Full text formatter
// ---------------------------------------------------------------------------

function buildFullText(
  studentName: string,
  grade: string,
  overallAvg: number,
  summary: string,
  strengths: string[],
  improvements: string[],
  targetSkills: string[],
): string {
  const igcseGrade = getIgcseGrade(overallAvg);
  const strengthLines = strengths.map((s) => `• ${s}`).join("\n");
  const improvementLines = improvements.map((i) => `• ${i}`).join("\n");
  const skillLines = targetSkills.map((s) => `• ${s}`).join("\n");

  return `Commentaires personnalisés – ${studentName} (${grade})
Note Cambridge IGCSE : ${igcseGrade.grade} — ${igcseGrade.label}

${summary}

Points forts :
${strengthLines}

Axes d'amélioration :
${improvementLines}

Compétences à renforcer (IGCSE Français — programme 0520) :
${skillLines}

Note pour l'enseignant(e) :
${igcseGrade.teacherNote}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Grade-level detection
// ---------------------------------------------------------------------------

/**
 * Returns true when the student is in a KS1/2/3 year group (Year 8 / Year 9).
 * These students are focused on language acquisition, not IGCSE exam preparation.
 */
export function isKs3Grade(grade: string): boolean {
  const g = grade.toLowerCase().trim();
  return (
    g.includes("year 8") ||
    g.includes("yr 8") ||
    g.includes("y8") ||
    g.includes("year 9") ||
    g.includes("yr 9") ||
    g.includes("y9")
  );
}

/**
 * Returns true when the student is in Kenya 8-4-4 Form 3 (KCSE-bound).
 */
export function isKcse844Grade(grade: string): boolean {
  const g = grade.toLowerCase().trim();
  return g.includes("form 3") || g.includes("form3") || g.includes("f3");
}

/**
 * Returns true when the student is in Kenya CBC/CBE Grade 10.
 */
export function isCbcGrade(grade: string): boolean {
  const g = grade.toLowerCase().trim();
  return g.includes("grade 10") || g.includes("grade10") || g.includes("gr10");
}

/**
 * Returns a human-readable curriculum label for a given grade string.
 */
export function getCurriculumLabel(grade: string): string {
  if (isKs3Grade(grade)) return "KS3 Français (acquisition)";
  if (isKcse844Grade(grade)) return "Kenya 8-4-4 · Form 3 · KCSE Français";
  if (isCbcGrade(grade)) return "Kenya CBC/CBE · Grade 10 · Français";
  return "Cambridge IGCSE Français";
}

// ---------------------------------------------------------------------------
// Smart dispatcher – routes to correct curriculum generator based on grade
// ---------------------------------------------------------------------------

export function generateIgcseComments(
  params: IgcseCommentParams,
): IgcseComment {
  // Year 8 / Year 9 → KS3 language acquisition
  if (isKs3Grade(params.grade)) {
    return generateKs3CommentsInternal(params);
  }

  // Form 3 → Kenya 8-4-4 / KCSE
  if (isKcse844Grade(params.grade)) {
    return generateKcse844Comments(params);
  }

  // Grade 10 → Kenya CBC/CBE
  if (isCbcGrade(params.grade)) {
    return generateCbcComments(params);
  }

  // Default: Cambridge IGCSE (international)
  const summary = buildSummary(params);
  const strengths = buildStrengths(params);
  const improvements = buildImprovements(params);
  const targetSkills = buildTargetSkills(params);
  const fullText = buildFullText(
    params.studentName,
    params.grade,
    params.overallAvg,
    summary,
    strengths,
    improvements,
    targetSkills,
  );

  const igcseGrade = getIgcseGrade(params.overallAvg);

  return {
    summary,
    strengths,
    improvements,
    targetSkills,
    fullText,
    igcseGrade: igcseGrade.grade,
    igcseGradeLabel: igcseGrade.label,
    igcseUms: igcseGrade.umsEquivalent,
    teacherNote: igcseGrade.teacherNote,
  };
}
