import 'reflect-metadata';
import { METADATA_KEYS } from '../metadata.keys.js';

type DecoratorOptions = { message?: string };

export function updateAndSetMetadata(
	target: object,
	propertyKey: string | symbol,
	callback: (validations: any) => void,
) {
	const validations = Reflect.getMetadata(METADATA_KEYS.validation, target.constructor) || {};
	const propKeyStr = String(propertyKey);

	if (!validations[propKeyStr]) {
		validations[propKeyStr] = { errorMessage: {} };
	}

	callback(validations[propKeyStr]);

	Reflect.defineMetadata(METADATA_KEYS.validation, validations, target.constructor);
}

export function createTypeDecorator(
	typeName: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object',
	defaultMessage: string,
) {
	return (options?: DecoratorOptions): PropertyDecorator => {
		return (target: object, propertyKey: string | symbol) => {
			updateAndSetMetadata(target, propertyKey, (propValidations) => {
				if (propValidations.type && propValidations.type !== typeName) {
					throw new Error(
						`Cannot mark property '${String(
							propertyKey,
						)}' as type '${typeName}' because it is already marked as type '${
							propValidations.type
						}'.`,
					);
				}
				propValidations.type = typeName;
				if (!propValidations.errorMessage) propValidations.errorMessage = {};
				propValidations.errorMessage.type = options?.message || defaultMessage;
			});
		};
	};
}

export function createConstraintDecorator<T>(
	validationKey: string,
	appliesToTypes: ('string' | 'number' | 'integer' | 'array' | 'object' | 'null')[],
	defaultMessage: (value: T) => string,
) {
	return (value: T, options?: DecoratorOptions): PropertyDecorator => {
		return (target: object, propertyKey: string | symbol) => {
			updateAndSetMetadata(target, propertyKey, (propValidations) => {
				if (!propValidations.constraints) {
					propValidations.constraints = [];
				}
				propValidations.constraints.push({
					key: validationKey,
					value: value,
					appliesToTypes: appliesToTypes,
					errorMessage: options?.message || defaultMessage(value),
				});
			});
		};
	};
}

export function createFormatDecorator(formatName: string, defaultMessage: string) {
	return (options?: DecoratorOptions): PropertyDecorator => {
		return (target: object, propertyKey: string | symbol) => {
			updateAndSetMetadata(target, propertyKey, (propValidations) => {
				const appliesToType = 'string';
				if (!propValidations.type) {
					propValidations.type = appliesToType;
				} else if (propValidations.type !== appliesToType) {
					throw new Error(
						`Decorator for format '${formatName}' can only be used on properties of type '${appliesToType}', but property '${String(
							propertyKey,
						)}' has type '${propValidations.type}'.`,
					);
				}

				propValidations.format = formatName;
				propValidations.errorMessage.format = options?.message || defaultMessage;
			});
		};
	};
}

interface CustomValidator {
	keyword: string;
	validate: (value: any) => boolean | Promise<boolean>;
}

export const customValidatorRegistry = new Map<string, CustomValidator>();

export function createCustomValidator<T>(
	keyword: string,
	validateFn: (value: T) => boolean | Promise<boolean>,
	defaultMessage: string,
) {
	customValidatorRegistry.set(keyword, {
		keyword,
		validate: validateFn,
	});

	return (options?: { message?: string }): PropertyDecorator => {
		return (target: object, propertyKey: string | symbol) => {
			updateAndSetMetadata(target, propertyKey, (propValidations) => {
				if (!propValidations.custom) {
					propValidations.custom = {};
				}

				propValidations.custom[keyword] = true;

				propValidations.errorMessage[keyword] = options?.message || defaultMessage;
			});
		};
	};
}
