import { range } from 'functional-utilities';

export function date_diff(date1: Date, date2: Date): number {
	return Math.abs(date1.getTime() - date2.getTime());
}

export function get_next_date_offset(n: number): number {
	n--;
	if (n < 0) {
		n = 0;
	}
	const hour_offset = range(n).reduce((acc) => acc + acc ** 1.12 + 1.1, 0);
	return hour_offset;
}

export function get_next_date(n: number): Date {
	return new Date(Date.now() + get_next_date_offset(n) * 3600000);
}

export function reverse_get_next_date(hour_offset: number): number {
	let n = 0;
	while (get_next_date_offset(n) < hour_offset) {
		n++;
	}
	return n;
}
