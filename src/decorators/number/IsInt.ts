import { createTypeDecorator } from '../factory';

export const IsInt = createTypeDecorator('integer', 'The property must be an integer.');
