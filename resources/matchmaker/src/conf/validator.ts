import { ApiResponse, Validator } from '@matchmakerjs/matchmaker';
import { validate, ValidationError } from 'class-validator';

const validator: Validator = async (payload: unknown) =>
    validate(payload as { [key: string]: unknown }, {
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

function getFirstMessage(error: ValidationError): string {
    if (error.children?.length) {
        return getFirstMessage(error.children[0]);
    }
    return Object.values(error.constraints)[0];
}

export default validator;
