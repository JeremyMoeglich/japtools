import type { LessonSubjectDataType } from '$lib/scripts/universal/datatypes';
import { writable, type Writable } from 'svelte/store';

export const subject_store: Writable<Map<number, LessonSubjectDataType>> = writable(new Map());
