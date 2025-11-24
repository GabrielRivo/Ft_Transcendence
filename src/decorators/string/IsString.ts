import { createTypeDecorator } from '../factory';

export const IsString = createTypeDecorator('string', 'The property must be a string.');
