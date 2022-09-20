const serializer = (_: unknown, value: unknown) => {
	if (value instanceof Map) {
		return `Map(${JSON.stringify([...value], serializer)})`;
	} else if (value instanceof Set) {
		return `Set(${JSON.stringify([...value], serializer)})`;
	} else if (value instanceof Date) {
		return `Date(${value.toISOString()})`;
	} else if (value === undefined) {
		return 'undefined';
	} else if (value === null) {
		return 'null';
	}
	return value;
};

export function serialize(data: unknown): string {
	return JSON.stringify(data, serializer);
}
