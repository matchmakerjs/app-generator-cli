import { AccessClaimsResolver, BearerTokenClaimsResolver, JwtClaims, JwtValidator } from "@matchmakerjs/jwt-validator";
import { IncomingMessage } from "http";

export const getCookieValue = (req: IncomingMessage, cookieName: string) => {
    const entries: string[] = req.headers.cookie?.split(/ *; */) || [];
    for (const entry of entries) {
        const [name, value] = entry.split(/ *= */);
        if (name === cookieName) {
            return value;
        }
    }
}

export const getAccessTokenFromCookie = (req: IncomingMessage) => getCookieValue(req, process.env.ACCESS_TOKEN_COOKIE_NAME || 'access_token');

export class BearerTokenAccessClaimsResolverWithCookieSupport implements AccessClaimsResolver<IncomingMessage>{

    bearerClaimsResolver: AccessClaimsResolver<string>;

    constructor(private jwtValidator: JwtValidator) {
        this.bearerClaimsResolver = new BearerTokenClaimsResolver(jwtValidator);
    }

    async getClaims(req: IncomingMessage): Promise<JwtClaims> {
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            return this.bearerClaimsResolver.getClaims(authHeader);
        }
        let accessToken = getAccessTokenFromCookie(req);
        if (accessToken) return this.jwtValidator.validateBearerToken(accessToken);
    }
}