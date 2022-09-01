<script lang="ts">
	import type { SymbolAndMeaning } from '$lib/scripts/universal/lesson_type';
	import type { MaybePromise } from '@sveltejs/kit/types/private';
    import levenshtein from 'js-levenshtein';

	function choice<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	export let current_lesson: SymbolAndMeaning<number>;
	export let callback: (correct: boolean) => MaybePromise<void>;

	$: data = current_lesson.required_data;
	$: question = data.to === 'meanings' ? choice(data.meanings) : data.symbol;
	$: correct_answer = data.to === 'meanings' ? data.symbol : data.meanings

	let answer: string = '';

    let show_correct = false;
    
    function compare(str1: string, str2: string): boolean {
        const similarity = 1 - levenshtein(str1, str2) / Math.max(str1.length, str2.length);
        return similarity > 0.8;
    }

    function check_answer() {
        if (correct_answer instanceof Array) {
            if (correct_answer.some((str) => compare(str, answer))) {
                callback(true);
            } else {
                show_correct = true;
            }
        } else {
            if (compare(correct_answer, answer)) {
                callback(true);
            } else {
                show_correct = true;
            }
        }
    }
</script>


<div>
    <p>{question}</p>
</div>