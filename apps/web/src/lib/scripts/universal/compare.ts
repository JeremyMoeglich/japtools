import levenshtein from 'js-levenshtein';
import number_to_words from 'number-to-words';

function string_number_to_words(s: string) {
	const words = s.split(' ');
	const result = words
		.map((word) => {
			const number = parseInt(word);
			if (isNaN(number)) {
				return word;
			}
			return number_to_words.toWords(number);
		})
		.join(' ');
	return result;
}

function similarity(str1: string, str2: string): number {
	return (
		1 - levenshtein(str1.toLowerCase(), str2.toLowerCase()) / Math.max(str1.length, str2.length)
	);
}

export function compare(entered: string, correct: string): boolean {
	const try_words: [number, string][] = [[4, 'something']];
	const texts = try_words
		.filter(([min_length, text]) => text.length >= min_length)
		.map(([_, text]) => entered + ' ' + text);
	texts.push(entered);

	let highest_similarity = 0;
	for (const text of texts) {
		const similarity_normal = similarity(entered.trim(), correct.trim());
		const as_words = string_number_to_words(correct);
		const similarity_as_words = similarity(entered, as_words);
		if (similarity_normal > highest_similarity) {
			highest_similarity = similarity_normal;
		}
		if (similarity_as_words > highest_similarity) {
			highest_similarity = similarity_as_words;
		}
	}
	if (highest_similarity > 0.8) {
		return true;
	} else {
		return false;
	}
}
