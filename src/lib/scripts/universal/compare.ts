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

export function compare(str1: string, str2: string): boolean {
	const similarity_normal = similarity(str1, str2);
	const as_words = string_number_to_words(str2);
	const similarity_as_words = similarity(str1, as_words);
	return similarity_normal > 0.8 || similarity_as_words > 0.8;
}
