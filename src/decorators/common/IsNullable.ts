import { createConstraintDecorator } from '../factory';

export const IsNullable = createConstraintDecorator<boolean>(
	'nullable',
	['string'],
	(value) => `The property must be nullable [${value}].`,
);
