/**
 * KS3 French – Personalized Student Comment Generator
 *
 * Used for Year 8 and Year 9 students.
 * Focuses on language acquisition progress, confidence-building,
 * and communicative competence — NOT exam preparation.
 *
 * All generated text is in French.
 */

import type { IgcseComment, IgcseCommentParams } from "./igcseComments";
import {
  getKs3Band,
  getKs3GrammarTopics,
  getKs3Themes,
} from "./ks3FrenchSyllabus";

// ---------------------------------------------------------------------------
// Helpers (re-use patterns from igcseComments)
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

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function buildKs3Summary(params: IgcseCommentParams): string {
  const { studentName, overallAvg, trendLabel, deviation } = params;
  const band = getKs3Band(overallAvg);

  let levelSentence: string;
  if (overallAvg >= 80) {
    levelSentence = `${studentName} fait preuve d'excellentes aptitudes en français (${band.label}) et progresse avec aisance dans l'acquisition de la langue. Ses résultats témoignent d'une bonne maîtrise des compétences communicatives attendues à ce niveau.`;
  } else if (overallAvg >= 60) {
    levelSentence = `${studentName} affiche de bons progrès en français (${band.label}) et montre une compréhension solide des notions fondamentales introduites en classe. Il/Elle est capable de communiquer efficacement sur des sujets familiers.`;
  } else if (overallAvg >= 40) {
    levelSentence = `${studentName} est en cours d'acquisition des bases du français (${band.label}). Des progrès sont visibles, bien qu'un travail régulier supplémentaire soit nécessaire pour consolider les structures linguistiques de base.`;
  } else {
    levelSentence = `${studentName} débute son apprentissage du français (${band.label}) et rencontre encore des difficultés dans la compréhension et la production. Un soutien régulier et des activités motivantes l'aideront à gagner en confiance.`;
  }

  // Trend
  let trendSentence: string;
  if (trendLabel === "Improving") {
    trendSentence =
      "Les résultats montrent une progression encourageante d'une évaluation à l'autre, ce qui reflète un engagement croissant dans l'apprentissage du français.";
  } else if (trendLabel === "Declining") {
    trendSentence =
      "Une tendance à la baisse est cependant observée dans les évaluations récentes. Il serait bénéfique de revoir les notions abordées et de renforcer la pratique régulière à la maison.";
  } else {
    trendSentence =
      "Les résultats sont globalement réguliers d'une évaluation à l'autre, ce qui montre une certaine stabilité dans l'apprentissage, même si une progression plus marquée reste possible.";
  }

  // Deviation vs class
  let deviationSentence: string;
  if (deviation >= 5) {
    deviationSentence = `L'élève se distingue nettement par rapport à la moyenne de la classe (+${Math.round(deviation)} %), ce qui est très encourageant.`;
  } else if (deviation >= 1) {
    deviationSentence = `L'élève se situe légèrement au-dessus de la moyenne de la classe (+${Math.round(deviation)} %).`;
  } else if (deviation >= -4) {
    deviationSentence = `L'élève se situe dans la moyenne de classe (${Math.round(deviation)} %).`;
  } else {
    deviationSentence = `L'élève se situe en dessous de la moyenne de classe (${Math.round(deviation)} %). Un travail supplémentaire permettrait de combler cet écart progressivement.`;
  }

  return `${levelSentence} ${trendSentence} ${deviationSentence}`;
}

// ---------------------------------------------------------------------------
// Strengths
// ---------------------------------------------------------------------------

function buildKs3Strengths(params: IgcseCommentParams): string[] {
  const { overallAvg, deviation, trendLabel } = params;
  const strengths: string[] = [];

  const t1Avg = avgOf(t1Scores(params));
  const t2Avg = avgOf(t2Scores(params));
  const entries = entryScores(params);
  const endterms = endtermScores(params);
  const entryAvg = avgOf(entries);
  const endtermAvg = avgOf(endterms);

  // Progression across terms
  if (
    t1Scores(params).length > 0 &&
    t2Scores(params).length > 0 &&
    t2Avg > t1Avg + 3
  ) {
    strengths.push(
      "Progression visible d'un trimestre à l'autre, ce qui montre une bonne capacité à intégrer de nouvelles notions au fil de l'année.",
    );
  }

  // Entry vs Endterm
  if (entries.length > 0 && endterms.length > 0 && endtermAvg > entryAvg + 3) {
    strengths.push(
      "L'élève montre une belle évolution entre l'évaluation d'entrée et l'évaluation finale, signe que les notions enseignées sont bien assimilées en cours de trimestre.",
    );
  }

  // High average
  if (overallAvg >= 80) {
    strengths.push(
      "Excellente compréhension du français oral et écrit sur des sujets du quotidien, avec une communication fluide et naturelle pour son niveau.",
    );
  } else if (overallAvg >= 65) {
    strengths.push(
      "Bonne maîtrise du vocabulaire de base et des structures grammaticales fondamentales pour communiquer en français sur des sujets familiers.",
    );
  }

  // Above class
  if (deviation >= 5) {
    strengths.push(
      "L'élève se démarque positivement par rapport à la classe, ce qui témoigne d'un investissement personnel dans l'apprentissage du français.",
    );
  }

  // Improving trend
  if (trendLabel === "Improving" && strengths.length < 2) {
    strengths.push(
      "Tendance positive dans l'évolution des résultats : l'élève progresse régulièrement et gagne en confiance dans l'utilisation du français.",
    );
  }

  // Fallbacks
  if (strengths.length === 0) {
    strengths.push(
      "Participation active aux évaluations tout au long de l'année scolaire, montrant un effort de régularité dans l'apprentissage.",
    );
  }
  if (strengths.length < 2) {
    strengths.push(
      "Capacité à s'engager dans des activités variées (compréhension, expression écrite et orale) proposées dans le cadre du programme de français.",
    );
  }

  return strengths.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Improvements
// ---------------------------------------------------------------------------

function buildKs3Improvements(params: IgcseCommentParams): string[] {
  const { overallAvg, trendLabel, deviation } = params;
  const improvements: string[] = [];

  const entries = entryScores(params);
  const endterms = endtermScores(params);
  const entryAvg = avgOf(entries);
  const endtermAvg = avgOf(endterms);

  // Low average – vocabulary and listening
  if (overallAvg < 50) {
    improvements.push(
      "Enrichir le vocabulaire du quotidien en utilisant des flashcards bilingues, des jeux de mémoire ou des applications de langues pour pratiquer de manière ludique à la maison.",
    );
  }

  // Below 60 – grammar foundations
  if (overallAvg < 60) {
    improvements.push(
      "Revoir les structures grammaticales de base : la conjugaison des verbes en -er au présent, le passé composé et les articles définis/indéfinis. Ces fondements sont essentiels pour progresser en français.",
    );
  }

  // Declining
  if (trendLabel === "Declining") {
    improvements.push(
      "La baisse récente des résultats suggère un besoin de révision plus régulière. Consacrer 10 à 15 minutes par jour à la pratique du français (vocabulaire, lecture ou écoute) peut faire une grande différence.",
    );
  }

  // Below class – oral confidence
  if (deviation < -5) {
    improvements.push(
      "Prendre davantage de risques à l'oral en classe : oser parler français même avec des erreurs. La communication prime sur la perfection à ce stade de l'apprentissage.",
    );
  }

  // Regression entry to endterm
  if (entries.length > 0 && endterms.length > 0 && endtermAvg < entryAvg - 3) {
    improvements.push(
      "Revoir les notions vues en fin de trimestre avant les prochaines évaluations. Un résumé visuel (carte mentale ou fiche de révision) peut aider à mémoriser les points clés.",
    );
  }

  // Improving – maintain momentum
  if (trendLabel === "Improving") {
    improvements.push(
      "Continuer sur cette lancée positive : écouter des chansons françaises, regarder des vidéos courtes en français ou lire de petits textes simples pour maintenir le contact avec la langue en dehors de la classe.",
    );
  }

  // Stable at moderate level
  if (trendLabel === "Stable" && overallAvg >= 50 && overallAvg < 70) {
    improvements.push(
      "Pour franchir un palier, essayer de produire des phrases plus longues et plus variées à l'écrit, en utilisant des connecteurs simples (et, mais, parce que, donc) pour structurer les idées.",
    );
  }

  // KS3 grammar suggestion
  const grammarTopics = getKs3GrammarTopics(overallAvg);
  if (grammarTopics.length > 0 && improvements.length < 3) {
    const topic = grammarTopics[0];
    improvements.push(
      `Point de langue prioritaire : « ${topic.topic} » — ${topic.description} Conseil : ${topic.acquisitionTip}`,
    );
  }

  // KS3 theme suggestion
  const themes = getKs3Themes(overallAvg);
  if (themes.length > 0 && improvements.length < 3) {
    const theme = themes[0];
    improvements.push(
      `Enrichir le vocabulaire du thème « ${theme.title} » en pratiquant avec des activités de communication : ${theme.communicativeGoals[0]}.`,
    );
  }

  // Fallbacks
  if (improvements.length === 0) {
    improvements.push(
      "Pratiquer l'expression orale plus régulièrement en classe, en s'appuyant sur des jeux de rôle et des dialogues pour acquérir des automatismes linguistiques.",
    );
  }
  if (improvements.length < 2) {
    improvements.push(
      "Lire de courts textes simples en français (histoires illustrées, dialogues, comptines) pour développer la fluidité et enrichir le vocabulaire de manière progressive.",
    );
  }

  return improvements.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Target skills (KS3 framing)
// ---------------------------------------------------------------------------

function buildKs3TargetSkills(params: IgcseCommentParams): string[] {
  const { overallAvg, trendLabel } = params;
  const skills: string[] = [];

  if (overallAvg < 50) {
    skills.push("Vocabulaire du quotidien");
    skills.push("Conjugaison au présent");
    skills.push("Compréhension orale simple");
  } else if (overallAvg < 65) {
    skills.push("Expression orale");
    skills.push("Passé composé");
    skills.push("Structures de phrases variées");
  } else if (overallAvg < 80) {
    skills.push("Communication spontanée");
    skills.push("Compréhension de textes");
    skills.push("Expression écrite courte");
  } else {
    skills.push("Expression orale avancée");
    skills.push("Rédaction de textes variés");
    skills.push("Compréhension de textes authentiques");
  }

  if (trendLabel === "Declining") {
    if (!skills.includes("Révision des notions fondamentales")) {
      skills.push("Révision des notions fondamentales");
    }
  }

  // Add a theme focus
  const themes = getKs3Themes(overallAvg);
  if (themes.length > 0) {
    skills.push(`Vocabulaire du thème : « ${themes[0].title} »`);
  }

  return skills.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Full text
// ---------------------------------------------------------------------------

function buildKs3FullText(
  studentName: string,
  grade: string,
  overallAvg: number,
  summary: string,
  strengths: string[],
  improvements: string[],
  targetSkills: string[],
): string {
  const band = getKs3Band(overallAvg);
  const strengthLines = strengths.map((s) => `• ${s}`).join("\n");
  const improvementLines = improvements.map((i) => `• ${i}`).join("\n");
  const skillLines = targetSkills.map((s) => `• ${s}`).join("\n");

  return `Commentaires personnalisés – ${studentName} (${grade})
Niveau en français : ${band.label} (${band.band})

${summary}

Points forts :
${strengthLines}

Axes de développement :
${improvementLines}

Compétences à renforcer :
${skillLines}

Note pour l'enseignant(e) :
${band.teacherNote}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function generateKs3Comments(params: IgcseCommentParams): IgcseComment {
  const summary = buildKs3Summary(params);
  const strengths = buildKs3Strengths(params);
  const improvements = buildKs3Improvements(params);
  const targetSkills = buildKs3TargetSkills(params);
  const fullText = buildKs3FullText(
    params.studentName,
    params.grade,
    params.overallAvg,
    summary,
    strengths,
    improvements,
    targetSkills,
  );

  const band = getKs3Band(params.overallAvg);

  return {
    summary,
    strengths,
    improvements,
    targetSkills,
    fullText,
    // Reuse the IgcseComment interface but repurpose fields for KS3
    igcseGrade: band.band, // e.g. "Securing"
    igcseGradeLabel: band.label, // e.g. "Niveau consolidé"
    igcseUms: `${Math.round(params.overallAvg)}%`, // display as raw %
    teacherNote: band.teacherNote,
  };
}
