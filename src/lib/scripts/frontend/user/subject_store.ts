import type { lesson_subject_data_type } from '$lib/scripts/universal/datatypes';
import { writable, type Writable } from 'svelte/store';

export const subject_store: Writable<Map<number, lesson_subject_data_type>> = writable(new Map());
