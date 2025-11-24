import { createConstraintDecorator } from '../factory';

export const MaxLength = createConstraintDecorator<number>(
	'maxLength',
	['string'],
	(value) => `The property must be at most ${value} characters long.`,
);
