import { createConstraintDecorator } from '../factory';

export const MaxItems = createConstraintDecorator<number>(
	'maxItems',
	['array'],
	(value) => `The property must have at most ${value} items.`,
);
