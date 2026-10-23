export type InspirationPhrase = {
  text: string;
};

const openings = [
  "Hoy", "Cada mañana", "En este momento", "Paso a paso", "Con paciencia", "A tu ritmo",
  "Cuando eliges avanzar", "En los días tranquilos", "Incluso en los días difíciles", "Con una intención clara",
  "Al volver a lo esencial", "Cuando te das permiso de pausar", "En cada pequeño intento", "Desde la calma",
  "Con cuidado", "Al comenzar de nuevo", "Cuando cuidas tu tiempo", "En medio de todo",
  "Con los pies en el presente", "Cuando confías en tu proceso", "Al escuchar lo que necesitas",
  "Con suavidad", "Cuando haces espacio", "Al elegir una sola cosa",
];

const middles = [
  "una acción pequeña también cuenta", "tu constancia crece sin hacer ruido", "lo importante encuentra su lugar",
  "cada decisión amable suma", "tu progreso merece reconocimiento", "la claridad aparece cuando reduces el ruido",
  "una pausa también es parte del avance", "el descanso protege tu energía", "lo que haces con calma dura más",
  "tus prioridades pueden ser sencillas", "la atención transforma lo cotidiano", "tu esfuerzo de hoy prepara el camino",
  "no necesitas resolverlo todo a la vez", "la intención vale más que la prisa", "cada límite cuida algo valioso",
  "tu ritmo también es un ritmo válido", "volver a empezar sigue siendo avanzar", "el enfoque se construye con práctica",
  "un momento presente puede cambiar tu día", "la paciencia deja espacio para aprender", "tu bienestar merece un lugar en la agenda",
  "lo suficiente también puede ser excelente", "la disciplina puede sentirse amable", "cada cierre abre espacio para lo siguiente",
];

const endings = [
  "; confía en el siguiente paso.",
  "; deja que hoy sea suficiente.",
  "; celebra que estás aquí.",
  "; no tienes que apresurarlo.",
];

export const INSPIRATION_LIBRARY: InspirationPhrase[] = openings.flatMap((opening) =>
  middles.flatMap((middle) => endings.map((ending) => ({ text: `${opening}, ${middle}${ending}` }))),
);

const englishLibrary = [
  "A small step still moves you forward.",
  "Your pace is allowed to be gentle today.",
  "Rest is part of making progress.",
  "Clarity grows when you make room for what matters.",
  "You do not have to do everything at once.",
  "Consistency can be quiet and still be powerful.",
  "Let today be enough for today.",
  "Your attention is a gift worth protecting.",
];

function numericSeed(seed: string | number) {
  return String(seed).split("").reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7);
}

export function getInspirationPhrase(seed: string | number, language: "es" | "en"): InspirationPhrase {
  const library = language === "es" ? INSPIRATION_LIBRARY : englishLibrary.map((text) => ({ text }));
  return library[numericSeed(seed) % library.length];
}
