import { createTypeDecorator } from '../factory';

export const IsNumber = createTypeDecorator('number', 'The property must be a number.');
