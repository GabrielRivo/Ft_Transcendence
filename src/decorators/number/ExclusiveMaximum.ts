import { createConstraintDecorator } from '../factory';

export const ExclusiveMaximum = createConstraintDecorator<number>(
	'exclusiveMaximum',
	['number', 'integer'],
	(value) => `The property must be less than ${value}.`,
);
