const answerIndexPattern = /\b(?:correct|answer)\s*:\s*(\d+)\b/g;

export async function getQuestionCount(scriptUrl, signal) {
  const response = await fetch(scriptUrl, { signal });
  if (!response.ok) {
    throw new Error(`Не удалось прочитать данные теста (${response.status}).`);
  }

  const source = await response.text();
  const answerIndexes = [...source.matchAll(answerIndexPattern)];
  if (answerIndexes.length === 0) {
    throw new Error("В скрипте не найден список вопросов с ключами ответов.");
  }

  const hasInvalidAnswer = answerIndexes.some(
    (match) => Number(match[1]) < 0 || Number(match[1]) > 2,
  );
  if (hasInvalidAnswer) {
    throw new Error("В одном из вопросов не распознан правильный вариант.");
  }

  return answerIndexes.length;
}
