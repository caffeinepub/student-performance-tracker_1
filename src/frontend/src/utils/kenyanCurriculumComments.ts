/**
 * Kenyan Curriculum French – Personalized Student Comment Generator
 *
 * Two systems:
 *  1. Kenya 8-4-4 (Form 3) → KCSE grade-based comments (A to E scale)
 *  2. Kenya CBC/CBE (Grade 10) → Achievement-level comments (EE / ME / AE / BE)
 *
 * All generated text is in French (matching teacher's language of instruction).
 */

import type { IgcseComment, IgcseCommentParams } from "./igcseComments";
import {
  CBC_ACHIEVEMENT_LEVELS,
  CBC_FRENCH_COMPETENCIES,
  getCbcLevel,
  getKcseGrade,
  getKenyaGrammarTopics,
} from "./kenyanCurriculumSyllabus";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avgOf(scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

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

// ===========================================================================
// KENYA 8-4-4 (Form 3) — KCSE-aligned comments
// ===========================================================================

function buildKcse844Summary(params: IgcseCommentParams): string {
  const { studentName, overallAvg, trendLabel, deviation } = params;
  const grade = getKcseGrade(overallAvg);

  let levelSentence: string;
  if (overallAvg >= 80) {
    levelSentence = `${studentName} affiche d'excellents résultats en français avec une moyenne de ${Math.round(overallAvg)} % (note KCSE estimée : ${grade.grade} — ${grade.label}). Cette performance démontre une solide maîtrise du programme de français de Form 3 (8-4-4).`;
  } else if (overallAvg >= 60) {
    levelSentence = `${studentName} obtient de bons résultats en français avec une moyenne de ${Math.round(overallAvg)} % (note KCSE estimée : ${grade.grade} — ${grade.label}), reflétant une bonne compréhension des contenus essentiels du programme Form 3.`;
  } else if (overallAvg >= 45) {
    levelSentence = `${studentName} obtient une moyenne de ${Math.round(overallAvg)} % en français (note KCSE estimée : ${grade.grade} — ${grade.label}). Des lacunes persistent et un effort supplémentaire sera nécessaire pour atteindre les objectifs du KCSE.`;
  } else {
    levelSentence = `${studentName} rencontre des difficultés significatives en français avec une moyenne de ${Math.round(overallAvg)} % (note KCSE estimée : ${grade.grade} — ${grade.label}). Un soutien immédiat et ciblé est nécessaire pour préparer le KCSE.`;
  }

  let trendSentence: string;
  if (trendLabel === "Improving") {
    trendSentence =
      "La tendance est positive : les résultats récents montrent une progression encourageante, ce qui est de bon augure pour la préparation au KCSE.";
  } else if (trendLabel === "Declining") {
    trendSentence =
      "Une tendance à la baisse est observée dans les évaluations récentes. Il est essentiel de revoir les notions non maîtrisées et d'intensifier les révisions en vue du KCSE.";
  } else {
    trendSentence =
      "Les résultats sont relativement stables, ce qui indique une certaine régularité dans le travail, mais une progression plus nette est attendue pour les examens KCSE.";
  }

  let deviationSentence: string;
  if (deviation >= 5) {
    deviationSentence = `L'élève se situe nettement au-dessus de la moyenne de classe (+${Math.round(deviation)} %), ce qui est très encourageant.`;
  } else if (deviation >= 1) {
    deviationSentence = `L'élève se situe légèrement au-dessus de la moyenne de classe (+${Math.round(deviation)} %).`;
  } else if (deviation >= -4) {
    deviationSentence = `L'élève se situe dans la moyenne de classe (${Math.round(deviation)} %).`;
  } else {
    deviationSentence = `L'élève se situe en dessous de la moyenne de classe (${Math.round(deviation)} %), ce qui nécessite un travail supplémentaire pour combler l'écart avant le KCSE.`;
  }

  return `${levelSentence} ${trendSentence} ${deviationSentence}`;
}

function buildKcse844Strengths(params: IgcseCommentParams): string[] {
  const { overallAvg, deviation, trendLabel } = params;
  const strengths: string[] = [];

  const t1Avg = avgOf(t1Scores(params));
  const t2Avg = avgOf(t2Scores(params));
  const entries = entryScores(params);
  const endterms = endtermScores(params);
  const entryAvg = avgOf(entries);
  const endtermAvg = avgOf(endterms);

  if (
    t1Scores(params).length > 0 &&
    t2Scores(params).length > 0 &&
    t2Avg > t1Avg + 3
  ) {
    strengths.push(
      "Progression notable du premier au deuxième trimestre, témoignant d'un effort soutenu et d'une meilleure maîtrise du programme.",
    );
  }

  if (entries.length > 0 && endterms.length > 0 && endtermAvg > entryAvg + 3) {
    strengths.push(
      "Bonne évolution entre l'évaluation d'entrée et l'évaluation finale du trimestre, signe d'une bonne assimilation des notions enseignées.",
    );
  }

  if (overallAvg >= 80) {
    strengths.push(
      "Excellente maîtrise du vocabulaire et des structures grammaticales exigées dans le programme de français de Form 3 (8-4-4), avec une expression écrite et orale solide.",
    );
  } else if (overallAvg >= 70) {
    strengths.push(
      "Bonne maîtrise des compétences fondamentales du programme : compréhension écrite, expression guidée et structures grammaticales de base.",
    );
  }

  if (deviation >= 5) {
    strengths.push(
      "Performance supérieure à la moyenne de classe, ce qui reflète un investissement personnel sérieux dans la préparation au KCSE.",
    );
  }

  if (trendLabel === "Improving" && strengths.length < 2) {
    strengths.push(
      "Engagement croissant visible dans les évaluations récentes — cette dynamique positive est un atout précieux pour la préparation au KCSE.",
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "Participation régulière aux évaluations tout au long de l'année, montrant un effort de constance dans le travail.",
    );
  }
  if (strengths.length < 2) {
    strengths.push(
      "Capacité à répondre aux différentes formes d'évaluation proposées dans le cadre du programme Form 3 (entrée, mi-trimestre, fin de trimestre).",
    );
  }

  return strengths.slice(0, 3);
}

function buildKcse844Improvements(params: IgcseCommentParams): string[] {
  const { overallAvg, trendLabel, deviation } = params;
  const improvements: string[] = [];

  const entries = entryScores(params);
  const endterms = endtermScores(params);
  const entryAvg = avgOf(entries);
  const endtermAvg = avgOf(endterms);

  if (overallAvg < 50) {
    improvements.push(
      "Renforcer d'urgence les compétences de compréhension écrite : lire et analyser des textes simples en français chaque jour, en répondant à des questions de compréhension pour s'entraîner au format KCSE.",
    );
  }

  if (overallAvg < 60) {
    improvements.push(
      "Réviser les temps verbaux essentiels pour le KCSE : présent, passé composé, imparfait et futur simple. Des exercices de conjugaison quotidiens renforceront la précision grammaticale attendue en composition.",
    );
  }

  if (trendLabel === "Declining") {
    improvements.push(
      "La baisse récente des résultats nécessite une action immédiate : revoir les chapitres des trimestres précédents et suivre un planning de révision régulier pour éviter de perdre les acquis avant le KCSE.",
    );
  }

  if (deviation < -5) {
    improvements.push(
      "S'entraîner davantage à l'expression orale en classe : participer activement aux activités de conversation guidée pour développer la fluidité et la confiance à l'oral, compétence évaluée au KCSE.",
    );
  }

  if (entries.length > 0 && endterms.length > 0 && endtermAvg < entryAvg - 3) {
    improvements.push(
      "Consolider les notions étudiées en cours de trimestre par des révisions régulières : la baisse entre l'évaluation d'entrée et la fin de trimestre indique que certains contenus doivent être renforcés.",
    );
  }

  if (trendLabel === "Improving") {
    improvements.push(
      "Maintenir cet élan positif en continuant les révisions régulières et en s'entraînant avec des annales KCSE pour se familiariser avec le format des épreuves de français.",
    );
  }

  if (trendLabel === "Stable" && overallAvg >= 50 && overallAvg < 70) {
    improvements.push(
      "Pour progresser au-delà de ce niveau stable, s'exercer à la rédaction de compositions structurées en français : introduction, développement et conclusion, en visant la précision grammaticale et la richesse du vocabulaire.",
    );
  }

  const grammarTopics = getKenyaGrammarTopics(overallAvg);
  if (grammarTopics.length > 0 && improvements.length < 3) {
    const topic = grammarTopics[0];
    improvements.push(
      `Priorité grammaticale KCSE : « ${topic.topic} » — ${topic.description} (${topic.kcseRelevance})`,
    );
  }

  if (improvements.length === 0) {
    improvements.push(
      "Pratiquer régulièrement la rédaction de compositions courtes en français pour améliorer la fluidité de l'expression écrite, compétence centrale au KCSE.",
    );
  }
  if (improvements.length < 2) {
    improvements.push(
      "Utiliser des annales KCSE de français pour s'entraîner sur des sujets réels et développer des stratégies efficaces de gestion du temps en examen.",
    );
  }

  return improvements.slice(0, 3);
}

function buildKcse844TargetSkills(params: IgcseCommentParams): string[] {
  const { overallAvg, trendLabel } = params;
  const skills: string[] = [];

  if (overallAvg < 50) {
    skills.push("Compréhension écrite (KCSE Paper 1)");
    skills.push("Vocabulaire thématique de base");
    skills.push("Conjugaison : présent et passé composé");
  } else if (overallAvg < 65) {
    skills.push("Expression écrite guidée");
    skills.push("Grammaire : temps composés");
    skills.push("Lecture de textes variés");
  } else if (overallAvg < 80) {
    skills.push("Composition structurée (KCSE Paper 2)");
    skills.push("Expression orale et conversation");
    skills.push("Vocabulaire avancé en contexte");
  } else {
    skills.push("Rédaction avancée : essais et lettres formelles");
    skills.push("Compréhension orale");
    skills.push("Structures grammaticales complexes");
  }

  if (trendLabel === "Declining") {
    skills.push("Révision systématique du programme Form 3");
  }

  return skills.slice(0, 4);
}

// ===========================================================================
// KENYA CBC/CBE (Grade 10) — Competency-based comments
// ===========================================================================

function buildCbcSummary(params: IgcseCommentParams): string {
  const { studentName, overallAvg, trendLabel, deviation } = params;
  const level = getCbcLevel(overallAvg);

  let levelSentence: string;
  if (overallAvg >= 80) {
    levelSentence = `${studentName} démontre d'excellentes compétences en français dans le cadre du programme CBC de Grade 10, avec une moyenne de ${Math.round(overallAvg)} % (niveau : ${level.labelFr} — ${level.level}). ${level.descriptor}`;
  } else if (overallAvg >= 60) {
    levelSentence = `${studentName} répond aux attentes du programme CBC de Grade 10 en français avec une moyenne de ${Math.round(overallAvg)} % (niveau : ${level.labelFr} — ${level.level}). ${level.descriptor}`;
  } else if (overallAvg >= 40) {
    levelSentence = `${studentName} progresse vers les attentes du programme CBC de Grade 10 avec une moyenne de ${Math.round(overallAvg)} % (niveau : ${level.labelFr} — ${level.level}). ${level.descriptor}`;
  } else {
    levelSentence = `${studentName} se situe en dessous des attentes du programme CBC de Grade 10 avec une moyenne de ${Math.round(overallAvg)} % (niveau : ${level.labelFr} — ${level.level}). ${level.descriptor}`;
  }

  let trendSentence: string;
  if (trendLabel === "Improving") {
    trendSentence =
      "La progression est encourageante et témoigne d'un engagement croissant dans le développement des compétences communicatives en français.";
  } else if (trendLabel === "Declining") {
    trendSentence =
      "Une tendance à la baisse est observée dans les évaluations récentes. Un effort de consolidation des compétences acquises est nécessaire pour maintenir la progression dans le cadre du CBC.";
  } else {
    trendSentence =
      "Les résultats sont stables, reflétant une régularité dans le travail, avec un potentiel de progression vers le niveau supérieur.";
  }

  let deviationSentence: string;
  if (deviation >= 5) {
    deviationSentence = `L'élève se distingue positivement par rapport à la classe (+${Math.round(deviation)} %), démontrant un dépassement des compétences attendues.`;
  } else if (deviation >= 1) {
    deviationSentence = `L'élève se situe légèrement au-dessus de la moyenne de classe (+${Math.round(deviation)} %).`;
  } else if (deviation >= -4) {
    deviationSentence = `L'élève progresse dans la moyenne de classe (${Math.round(deviation)} %).`;
  } else {
    deviationSentence = `L'élève se situe en dessous de la moyenne de classe (${Math.round(deviation)} %). Un soutien ciblé permettra de progresser vers le niveau attendu dans le CBC.`;
  }

  return `${levelSentence} ${trendSentence} ${deviationSentence}`;
}

function buildCbcStrengths(params: IgcseCommentParams): string[] {
  const { overallAvg, deviation, trendLabel } = params;
  const strengths: string[] = [];

  const t1Avg = avgOf(t1Scores(params));
  const t2Avg = avgOf(t2Scores(params));
  const entries = entryScores(params);
  const endterms = endtermScores(params);
  const entryAvg = avgOf(entries);
  const endtermAvg = avgOf(endterms);

  if (
    t1Scores(params).length > 0 &&
    t2Scores(params).length > 0 &&
    t2Avg > t1Avg + 3
  ) {
    strengths.push(
      "Progression visible d'un trimestre à l'autre, ce qui démontre le développement des compétences communicatives attendues dans le cadre du CBC.",
    );
  }

  if (entries.length > 0 && endterms.length > 0 && endtermAvg > entryAvg + 3) {
    strengths.push(
      "Bonne intégration des apprentissages au fil du trimestre, visible entre l'évaluation d'entrée et l'évaluation finale — indicateur positif dans le cadre de l'approche CBC.",
    );
  }

  if (overallAvg >= 80) {
    strengths.push(
      "Maîtrise avancée des compétences communicatives en français : communication orale fluide, compréhension approfondie et expression écrite élaborée, conformément aux attentes du Grade 10 CBC.",
    );
  } else if (overallAvg >= 65) {
    strengths.push(
      "Bonne maîtrise des compétences de base en communication française : peut exprimer des idées, comprendre des textes simples et produire des textes courts adéquats pour le niveau Grade 10.",
    );
  }

  if (deviation >= 5) {
    strengths.push(
      "L'élève se démarque positivement au sein de la classe et démontre un niveau de compétence qui dépasse les attentes du programme CBC.",
    );
  }

  if (trendLabel === "Improving" && strengths.length < 2) {
    strengths.push(
      "Progression positive et régulière — l'élève développe activement ses compétences en français, conformément à la philosophie d'apprentissage continu du CBC.",
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "Participation aux différentes activités d'évaluation, montrant un engagement dans le développement des compétences communicatives en français.",
    );
  }
  if (strengths.length < 2) {
    strengths.push(
      "Développement progressif des compétences en langue française dans le cadre des activités proposées par le programme CBC de Grade 10.",
    );
  }

  return strengths.slice(0, 3);
}

function buildCbcImprovements(params: IgcseCommentParams): string[] {
  const { overallAvg, trendLabel, deviation } = params;
  const improvements: string[] = [];

  const entries = entryScores(params);
  const endterms = endtermScores(params);
  const entryAvg = avgOf(entries);
  const endtermAvg = avgOf(endterms);

  if (overallAvg < 50) {
    improvements.push(
      "Renforcer les compétences de base en communication française : utiliser des applications d'apprentissage, des jeux de vocabulaire et des activités d'écoute active pour développer la confiance dans l'utilisation du français.",
    );
  }

  if (overallAvg < 60) {
    improvements.push(
      "Consolider les structures grammaticales fondamentales à travers des activités contextualisées (projets, jeux de rôle, présentations orales) — conformément à l'approche basée sur les compétences du CBC.",
    );
  }

  if (trendLabel === "Declining") {
    improvements.push(
      "Revoir les compétences acquises lors des trimestres précédents : la baisse observée suggère un besoin de renforcement. Le portfolio de travaux peut aider à identifier les lacunes à combler.",
    );
  }

  if (deviation < -5) {
    improvements.push(
      "Prendre des initiatives dans l'utilisation du français en dehors de la classe : activités numériques en français, correspondance avec des locuteurs francophones, ou projets créatifs en groupe.",
    );
  }

  if (entries.length > 0 && endterms.length > 0 && endtermAvg < entryAvg - 3) {
    improvements.push(
      "Pratiquer des révisions actives des compétences enseignées en cours de trimestre pour éviter la perte d'acquis. Des activités récapitulatives régulières renforcent la consolidation des apprentissages dans le cadre du CBC.",
    );
  }

  if (trendLabel === "Improving") {
    improvements.push(
      "Continuer à développer les compétences en langue française en explorant des ressources créatives : podcasts, vidéos, projets numériques — en lien avec les compétences CBC de communication et de pensée critique.",
    );
  }

  const grammarTopics = getKenyaGrammarTopics(overallAvg);
  if (grammarTopics.length > 0 && improvements.length < 3) {
    const topic = grammarTopics[0];
    improvements.push(
      `Compétence linguistique prioritaire pour le Grade 10 CBC : « ${topic.topic} » — ${topic.description}`,
    );
  }

  if (improvements.length === 0) {
    improvements.push(
      "S'engager dans des projets communicatifs en français pour développer toutes les compétences CBC : communication, pensée critique, créativité et autonomie dans l'apprentissage.",
    );
  }
  if (improvements.length < 2) {
    improvements.push(
      "Utiliser des ressources numériques en français (applications, sites web, vidéos éducatives) pour pratiquer de manière autonome et enrichir les compétences conformément au profil CBC du learner.",
    );
  }

  return improvements.slice(0, 3);
}

function buildCbcTargetSkills(params: IgcseCommentParams): string[] {
  const { overallAvg, trendLabel } = params;
  const skills: string[] = [];

  if (overallAvg < 50) {
    skills.push("Communication de base (CBC)");
    skills.push("Vocabulaire fonctionnel");
    skills.push("Compréhension orale");
  } else if (overallAvg < 65) {
    skills.push("Expression orale communicative (CBC)");
    skills.push("Compréhension écrite");
    skills.push("Structures grammaticales essentielles");
  } else if (overallAvg < 80) {
    skills.push("Communication spontanée (CBC)");
    skills.push("Production écrite créative");
    skills.push("Pensée critique en français");
  } else {
    skills.push("Communication avancée (CBC EE)");
    skills.push("Projets créatifs en français");
    skills.push("Analyse de textes complexes");
  }

  if (trendLabel === "Declining") {
    skills.push("Consolidation des acquis du programme");
  }

  // Add a CBC competency
  const competency = CBC_FRENCH_COMPETENCIES[overallAvg >= 65 ? 1 : 0];
  if (competency) {
    skills.push(`Compétence CBC : ${competency.title}`);
  }

  return skills.slice(0, 4);
}

// ===========================================================================
// Full text builders
// ===========================================================================

function buildKcse844FullText(
  studentName: string,
  grade: string,
  overallAvg: number,
  summary: string,
  strengths: string[],
  improvements: string[],
  targetSkills: string[],
): string {
  const kcseGrade = getKcseGrade(overallAvg);
  const strengthLines = strengths.map((s) => `• ${s}`).join("\n");
  const improvementLines = improvements.map((i) => `• ${i}`).join("\n");
  const skillLines = targetSkills.map((s) => `• ${s}`).join("\n");

  return `Commentaires personnalisés – ${studentName} (${grade})
Système : Kenya 8-4-4 · Form 3 · Français
Note KCSE estimée : ${kcseGrade.grade} (${kcseGrade.points} pts) — ${kcseGrade.label}

${summary}

Points forts :
${strengthLines}

Axes d'amélioration :
${improvementLines}

Compétences à renforcer (programme Form 3 KCSE Français) :
${skillLines}

Note pour l'enseignant(e) :
${kcseGrade.teacherNote}`;
}

function buildCbcFullText(
  studentName: string,
  grade: string,
  overallAvg: number,
  summary: string,
  strengths: string[],
  improvements: string[],
  targetSkills: string[],
): string {
  const level = getCbcLevel(overallAvg);
  const strengthLines = strengths.map((s) => `• ${s}`).join("\n");
  const improvementLines = improvements.map((i) => `• ${i}`).join("\n");
  const skillLines = targetSkills.map((s) => `• ${s}`).join("\n");

  return `Commentaires personnalisés – ${studentName} (${grade})
Système : Kenya CBC/CBE · Grade 10 · Français
Niveau de réalisation : ${level.level} — ${level.labelFr}

${summary}

Points forts :
${strengthLines}

Axes de développement :
${improvementLines}

Compétences CBC à développer :
${skillLines}

Note pour l'enseignant(e) :
${level.teacherNote}`;
}

// ===========================================================================
// Main exports
// ===========================================================================

export function generateKcse844Comments(
  params: IgcseCommentParams,
): IgcseComment {
  const summary = buildKcse844Summary(params);
  const strengths = buildKcse844Strengths(params);
  const improvements = buildKcse844Improvements(params);
  const targetSkills = buildKcse844TargetSkills(params);
  const fullText = buildKcse844FullText(
    params.studentName,
    params.grade,
    params.overallAvg,
    summary,
    strengths,
    improvements,
    targetSkills,
  );

  const kcseGrade = getKcseGrade(params.overallAvg);

  return {
    summary,
    strengths,
    improvements,
    targetSkills,
    fullText,
    igcseGrade: kcseGrade.grade, // e.g. "B+"
    igcseGradeLabel: kcseGrade.label, // e.g. "Bien +"
    igcseUms: `${kcseGrade.points} pts`, // KCSE points
    teacherNote: kcseGrade.teacherNote,
  };
}

export function generateCbcComments(params: IgcseCommentParams): IgcseComment {
  const summary = buildCbcSummary(params);
  const strengths = buildCbcStrengths(params);
  const improvements = buildCbcImprovements(params);
  const targetSkills = buildCbcTargetSkills(params);
  const fullText = buildCbcFullText(
    params.studentName,
    params.grade,
    params.overallAvg,
    summary,
    strengths,
    improvements,
    targetSkills,
  );

  const level = getCbcLevel(params.overallAvg);

  return {
    summary,
    strengths,
    improvements,
    targetSkills,
    fullText,
    igcseGrade: level.level, // "EE", "ME", "AE", "BE"
    igcseGradeLabel: level.labelFr, // "Dépasse les attentes"
    igcseUms: `${Math.round(params.overallAvg)}%`,
    teacherNote: level.teacherNote,
  };
}
