import { createConstraintDecorator } from '../factory';

export const MinItems = createConstraintDecorator<number>(
	'minItems',
	['array'],
	(value) => `The property must have at least ${value} items.`,
);
