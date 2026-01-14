import { updateAndSetMetadata } from '../factory.js';

type DecoratorOptions = { message?: string };

/**
 * Validates that the property value is one of the allowed enum values.
 * Works with TypeScript enums, arrays of values, or object enums.
 *
 * @param enumType - A TypeScript enum, an array of allowed values, or an object with enum values
 * @param options - Optional configuration including custom error message
 *
 * @example
 * // With TypeScript enum
 * enum Status { Active = 'active', Inactive = 'inactive' }
 * @IsEnum(Status)
 * status: Status;
 *
 * @example
 * // With array of values
 * @IsEnum(['pending', 'approved', 'rejected'])
 * status: string;
 */
export function IsEnum<T extends object | readonly any[]>(
	enumType: T,
	options?: DecoratorOptions,
): PropertyDecorator {
	return (target: object, propertyKey: string | symbol) => {
		const enumValues = getEnumValues(enumType);

		updateAndSetMetadata(target, propertyKey, (propValidations) => {
			propValidations.enum = enumValues;
			if (!propValidations.errorMessage) propValidations.errorMessage = {};
			propValidations.errorMessage.enum =
				options?.message ||
				`The property must be one of the following values: ${enumValues.join(', ')}.`;
		});
	};
}

/**
 * Extracts enum values from various enum-like types
 */
function getEnumValues<T extends object | readonly any[]>(enumType: T): (string | number)[] {
	// If it's an array, return it directly
	if (Array.isArray(enumType)) {
		return enumType;
	}

	// For TypeScript enums (which are objects)
	const values: (string | number)[] = [];

	for (const key of Object.keys(enumType)) {
		const value = (enumType as Record<string, unknown>)[key];
		// TypeScript numeric enums have reverse mappings (value -> key)
		// So we only include values that are not reverse mappings
		if (typeof value === 'number') {
			values.push(value);
		} else if (typeof value === 'string') {
			// Check if this is a reverse mapping for a numeric enum
			const possibleReverseKey = (enumType as Record<string, unknown>)[value];
			if (typeof possibleReverseKey !== 'number') {
				values.push(value);
			}
		}
	}

	return values;
}

