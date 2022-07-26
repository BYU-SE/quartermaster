/**
 * Response Design Decisions:
 *   responseType: "success" or "fail" string, as used in previous versions
 *   responsePayload: a string to be used optionally to detail extra information
 *       -Is of type string or void. Type void allows it to be used optionally,
 *           maintaining functionality of legacy code
 *       -Must be of type string when responseType is "fail", because responsePayload
 *           will be the value to throw
 */

/**
 * If the response was a success or a failure (something thrown).
 * For legacy reasons, they are typed as strings.
 */
export type ResponseType = "success" | "fail";

/**
 * Arbitrary data returned from a stage, otherwise no return value.
 * 
 * A string value implicity handles more complex data types if needed through
 * serialization, however, the primary use case of Quartermaster shouldn't 
 * necessitate this.
 */
export type ResponsePayload = string | void;

/**
 * The value returned by a network of stages rather than any particular stage.
 * 
 * responseType encodes if it was a success or failure rather than using the 
 * return value or exception paradigm used by individual stages.
 * 
 * responsePayload is the return value finally passed up out of the network.
 */
export type Response = {
    responseType: ResponseType;
    responsePayload: ResponsePayload;
}

