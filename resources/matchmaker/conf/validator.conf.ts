import { ApiResponse, Validator } from "@matchmakerjs/matchmaker";
import { validate, ValidationError } from "class-validator";

export const validator: Validator = async (payload: any) => validate(payload, {
    validationError: { target: false },
    skipUndefinedProperties: true
}).then(errors => {
    if (!errors?.length) {
        return null;
    }
    return {
        successful: false,
        data: errors,
        message: getFirstMessage(errors[0])
    } as ApiResponse<any>;
});

function getFirstMessage(error: ValidationError): string {
    if (error.children?.length) {
        return getFirstMessage(error.children[0]);
    }
    return Object.values(error.constraints)[0];
}