import 'reflect-metadata';
import Ajv from 'ajv';
import * as ajvErrors from 'ajv-errors';
import { registerValidators } from 'my-class-validator';
import { useMemo, useCallback } from 'my-react';

export interface ValidationError {
	field: string;
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

let ajvInstance: Ajv | null = null;

function getAjv(): Ajv {
	if (!ajvInstance) {
		const addAjvErrors = ajvErrors.default;
		ajvInstance = new Ajv({ allErrors: true, $data: true, messages: true, coerceTypes: false });
		addAjvErrors.default(ajvInstance);
		registerValidators(ajvInstance);
	}
	return ajvInstance;
}

function parseErrors(errors: Ajv['errors']): ValidationError[] {
	if (!errors) return [];

	return errors.map((err) => {
		let field = err.instancePath.replace(/^\//, '') || err.params?.missingProperty || 'unknown';
		
		field = field.replace(/\//g, '.');

		let message = err.message || 'Invalid value';

		switch (err.keyword) {
			case 'required':
				field = err.params?.missingProperty || field;
				message = `Ce champ est requis`;
				break;
			case 'minLength':
				message = `Minimum ${err.params?.limit} caractères requis`;
				break;
			case 'maxLength':
				message = `Maximum ${err.params?.limit} caractères autorisés`;
				break;
			case 'format':
				if (err.params?.format === 'email') {
					message = 'Email invalide';
				}
				break;
			case 'type':
				message = `Type invalide (attendu: ${err.params?.type})`;
				break;
		}

		return { field, message };
	});
}

export function useValidation<T>(schema: object) {
	const ajv = useMemo(() => getAjv(), []);
	const validateFn = useMemo(() => ajv.compile<T>(schema), [ajv, schema]);

	const validate = useCallback(
		(data: unknown): ValidationResult => {
			const valid = validateFn(data);
			const errors = valid ? [] : parseErrors(validateFn.errors);
			return { valid, errors };
		},
		[validateFn],
	);

	const getFieldError = useCallback(
		(errors: ValidationError[], field: string): string | undefined => {
			return errors.find((e) => e.field === field)?.message;
		},
		[],
	);

	return {
		validate,
		getFieldError,
	};
}

export function validateSchema<T>(schema: object, data: unknown): ValidationResult {
	const ajv = getAjv();
	const validate = ajv.compile<T>(schema);
	const valid = validate(data);
	const errors = valid ? [] : parseErrors(validate.errors);
	return { valid, errors };
}

