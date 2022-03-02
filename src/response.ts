/**
 * Contains two values:
 *   1. responseType: "success" or "fail" string, as used before
 *   2. responsePayload: a string to be used optionally to detail extra information
 *          -Is of type string or void. Type void allows it to be used optionally,
 *              maintaining functionality of legacy code
 *          -Must be of type string when responseType is "fail", because responsePayload
 *              will be the value to throw
 *   Using Response as a return type from the workOn function, additional data can be 
 *      provided to the stages that call it
*/

type ResponseType = "success" | "fail";
export type ResponsePayload = string | void;

export type Response = {
    responseType: ResponseType;
    responsePayload: ResponsePayload;
}

export function getResponse(responseType: ResponseType, responsePayload: ResponsePayload): Response {
    return { responseType, responsePayload };
}
