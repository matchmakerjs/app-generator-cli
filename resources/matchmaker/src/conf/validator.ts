import { ApiResponse, Validator } from '@matchmakerjs/matchmaker';
import { validate, ValidationError } from 'class-validator';

const validator: Validator = async (payload: object, type: unknown) => {
    if (type === Array) {
        if (!Array.isArray(payload)) {
            return {
                successful: false,
                message: 'Array payload expected',
            } as ApiResponse<unknown>;
        }
        for (let i = 0; i < payload.length; i++) {
            const errors = await validate(payload[i], {
                validationError: { target: false },
                skipUndefinedProperties: true,
            });
            if (!errors?.length) {
                continue;
            }
            return {
                successful: false,
                data: errors,
                message: `Item ${i}: ${getFirstMessage(errors[0])}`,
            } as ApiResponse<unknown>;
        }
        return null;
    }
    if (Array.isArray(payload)) {
        return {
            successful: false,
            message: 'Object payload expected',
        } as ApiResponse<unknown>;
    }
    return validate(payload, {
        validationError: { target: false },
        skipUndefinedProperties: true,
    }).then((errors) => {
        if (!errors?.length) {
            return null;
        }
        return {
            successful: false,
            data: errors,
            message: getFirstMessage(errors[0]),
        } as ApiResponse<unknown>;
    });
};

function getFirstMessage(error: ValidationError): string {
    if (error.children?.length) {
        return getFirstMessage(error.children[0]);
    }
    return Object.values(error.constraints)[0];
}

export default validator;
