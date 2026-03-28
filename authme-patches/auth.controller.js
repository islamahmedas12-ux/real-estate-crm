"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const auth_service_js_1 = require("./auth.service.js");
const token_request_dto_js_1 = require("./dto/token-request.dto.js");
const realm_guard_js_1 = require("../common/guards/realm.guard.js");
const current_realm_decorator_js_1 = require("../common/decorators/current-realm.decorator.js");
const public_decorator_js_1 = require("../common/decorators/public.decorator.js");
const rate_limit_guard_js_1 = require("../rate-limit/rate-limit.guard.js");
const proxy_ip_util_js_1 = require("../common/utils/proxy-ip.util.js");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async token(realm, body, req, res) {
        res.set('Cache-Control', 'no-store');
        res.set('Pragma', 'no-cache');
        if (!body || typeof body !== 'object' || !body['grant_type']) {
            throw new common_1.BadRequestException('grant_type is required');
        }
        if (body['grant_type'] === 'password') {
            res.set('Deprecation', 'true');
            res.set('Warning', '299 - "The OAuth 2.0 password grant is deprecated by OAuth 2.1 and will be removed in a future release. Migrate to authorization_code with PKCE."');
        }
        try {
            return await this.authService.handleTokenRequest(realm, body, (0, proxy_ip_util_js_1.resolveClientIp)(req), req.headers['user-agent']);
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException) {
                const msg = err.message;
                if (msg === 'authorization_pending' || msg === 'slow_down') {
                    res.status(400).json({ error: msg });
                    return;
                }
            }
            throw err;
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Token endpoint (password, client_credentials, refresh_token, authorization_code)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token issued successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request or unsupported grant type' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid client credentials or user credentials' }),
    (0, swagger_1.ApiConsumes)('application/x-www-form-urlencoded', 'application/json'),
    (0, swagger_1.ApiBody)({ type: token_request_dto_js_1.TokenRequestDto }),
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.UseGuards)(rate_limit_guard_js_1.RateLimitGuard),
    (0, rate_limit_guard_js_1.RateLimitByIp)(),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "token", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('realms/:realmName/protocol/openid-connect'),
    (0, common_1.UseGuards)(realm_guard_js_1.RealmGuard),
    (0, public_decorator_js_1.Public)(),
    __metadata("design:paramtypes", [auth_service_js_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map
