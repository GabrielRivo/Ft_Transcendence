import { createConstraintDecorator } from '../factory';

export const MinProperties = createConstraintDecorator<number>(
	'minProperties',
	['object'],
	(value) => `The property must have at least ${value} properties.`,
);
