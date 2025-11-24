import { createConstraintDecorator } from '../factory';

export const Maximum = createConstraintDecorator<number>(
	'maximum',
	['number', 'integer'],
	(value) => `The property must be at most ${value}.`,
);
