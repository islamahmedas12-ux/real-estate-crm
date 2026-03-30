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
var LoginController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const realm_guard_js_1 = require("../common/guards/realm.guard.js");
const current_realm_decorator_js_1 = require("../common/decorators/current-realm.decorator.js");
const public_decorator_js_1 = require("../common/decorators/public.decorator.js");
const rate_limit_guard_js_1 = require("../rate-limit/rate-limit.guard.js");
const login_service_js_1 = require("./login.service.js");
const oauth_service_js_1 = require("../oauth/oauth.service.js");
const consent_service_js_1 = require("../consent/consent.service.js");
const verification_service_js_1 = require("../verification/verification.service.js");
const email_service_js_1 = require("../email/email.service.js");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const crypto_service_js_1 = require("../crypto/crypto.service.js");
const password_policy_service_js_1 = require("../password-policy/password-policy.service.js");
const mfa_service_js_1 = require("../mfa/mfa.service.js");
const theme_render_service_js_1 = require("../theme/theme-render.service.js");
const theme_email_service_js_1 = require("../theme/theme-email.service.js");
const events_service_js_1 = require("../events/events.service.js");
const event_types_js_1 = require("../events/event-types.js");
const custom_attributes_service_js_1 = require("../custom-attributes/custom-attributes.service.js");
const risk_assessment_service_js_1 = require("../risk-assessment/risk-assessment.service.js");
const csrf_service_js_1 = require("../common/csrf/csrf.service.js");
const proxy_ip_util_js_1 = require("../common/utils/proxy-ip.util.js");
const login_dto_js_1 = require("./dto/login.dto.js");
const SCOPE_DESCRIPTIONS = {
    openid: 'Verify your identity',
    profile: 'Access your profile information (name, username)',
    email: 'Access your email address',
    roles: 'Access your role assignments',
};
let LoginController = LoginController_1 = class LoginController {
    loginService;
    oauthService;
    consentService;
    verificationService;
    emailService;
    prisma;
    crypto;
    config;
    passwordPolicyService;
    mfaService;
    themeRender;
    themeEmail;
    eventsService;
    customAttributesService;
    csrfService;
    riskAssessmentService;
    logger = new common_1.Logger(LoginController_1.name);
    constructor(loginService, oauthService, consentService, verificationService, emailService, prisma, crypto, config, passwordPolicyService, mfaService, themeRender, themeEmail, eventsService, customAttributesService, csrfService, riskAssessmentService) {
        this.loginService = loginService;
        this.oauthService = oauthService;
        this.consentService = consentService;
        this.verificationService = verificationService;
        this.emailService = emailService;
        this.prisma = prisma;
        this.crypto = crypto;
        this.config = config;
        this.passwordPolicyService = passwordPolicyService;
        this.mfaService = mfaService;
        this.themeRender = themeRender;
        this.themeEmail = themeEmail;
        this.eventsService = eventsService;
        this.customAttributesService = customAttributesService;
        this.csrfService = csrfService;
        this.riskAssessmentService = riskAssessmentService;
    }
    setCsrfCookie(realm, res) {
        const token = this.csrfService.generateToken();
        res.cookie(this.csrfService.cookieName(realm.name), token, {
            httpOnly: false,
            secure: process.env['NODE_ENV'] === 'production',
            sameSite: 'strict',
            path: `/realms/${realm.name}`,
        });
        return token;
    }
    validateCsrf(realm, body, req) {
        const bodyToken = body['_csrf'];
        const cookieToken = req.cookies?.[this.csrfService.cookieName(realm.name)];
        if (!this.csrfService.validate(bodyToken, cookieToken)) {
            throw new common_1.ForbiddenException('Invalid or missing CSRF token');
        }
    }
    showLoginForm(realm, query, req, res) {
        const csrfToken = this.setCsrfCookie(realm, res);
        this.themeRender.render(res, realm, 'login', 'login', {
            pageTitle: 'Sign In',
            registrationAllowed: realm.registrationAllowed,
            webAuthnEnabled: realm.webAuthnEnabled ?? false,
            client_id: query['client_id'] ?? '',
            redirect_uri: query['redirect_uri'] ?? '',
            response_type: query['response_type'] ?? '',
            scope: query['scope'] ?? '',
            state: query['state'] ?? '',
            nonce: query['nonce'] ?? '',
            code_challenge: query['code_challenge'] ?? '',
            code_challenge_method: query['code_challenge_method'] ?? '',
            error: query['error'] ?? '',
            info: query['info'] ?? '',
            csrfToken,
        }, req);
    }
    async handleLogin(realm, body, req, res) {
        this.validateCsrf(realm, body, req);
        try {
            const user = await this.loginService.validateCredentials(realm, body['username'], body['password'], (0, proxy_ip_util_js_1.resolveClientIp)(req));
            if (realm.adaptiveAuthEnabled && this.riskAssessmentService) {
                const riskContext = {
                    userId: user.id,
                    realmId: realm.id,
                    realmName: realm.name,
                    ipAddress: (0, proxy_ip_util_js_1.resolveClientIp)(req),
                    userAgent: req.headers['user-agent'] ?? null,
                    deviceFingerprint: body['device_fingerprint'] ?? null,
                    timestamp: new Date(),
                };
                const assessment = await this.riskAssessmentService.assessRisk(riskContext);
                if (assessment.action === 'BLOCK') {
                    if (user.email) {
                        void this.riskAssessmentService.sendBlockedLoginEmail(realm.name, user.email, riskContext, assessment.geoLocation);
                    }
                    this.eventsService.recordLoginEvent({
                        realmId: realm.id,
                        type: event_types_js_1.LoginEventType.LOGIN_ERROR,
                        userId: user.id,
                        clientId: body['client_id'],
                        ipAddress: (0, proxy_ip_util_js_1.resolveClientIp)(req),
                        error: `Login blocked by risk assessment (score=${assessment.riskScore})`,
                    });
                    const params = new URLSearchParams();
                    params.set('error', 'Login blocked due to suspicious activity. Check your email for details.');
                    for (const key of ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'nonce', 'code_challenge', 'code_challenge_method']) {
                        if (body[key])
                            params.set(key, body[key]);
                    }
                    return res.redirect(`/realms/${realm.name}/login?${params.toString()}`);
                }
                if (assessment.action === 'STEP_UP') {
                    const mfaAvailable = await this.mfaService.isMfaEnabled(user.id);
                    if (mfaAvailable) {
                        const oauthParamsForChallenge = {};
                        for (const key of ['response_type', 'client_id', 'redirect_uri', 'scope', 'state', 'nonce', 'code_challenge', 'code_challenge_method']) {
                            if (body[key])
                                oauthParamsForChallenge[key] = body[key];
                        }
                        const challengeToken = await this.mfaService.createMfaChallenge(user.id, realm.id, oauthParamsForChallenge);
                        res.cookie('AUTHME_MFA_CHALLENGE', challengeToken, {
                            httpOnly: true,
                            secure: process.env['NODE_ENV'] === 'production',
                            sameSite: 'lax',
                            maxAge: 5 * 60 * 1000,
                            path: `/realms/${realm.name}`,
                        });
                        return res.redirect(`/realms/${realm.name}/totp`);
                    }
                }
                void this.riskAssessmentService.updateUserProfile(user.id, realm.id, riskContext, assessment.geoLocation);
            }
            if (realm.requireEmailVerification && user.email && !user.emailVerified) {
                const params = new URLSearchParams();
                params.set('error', 'Please verify your email address before signing in. Check your inbox for the verification link.');
                for (const key of ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'nonce', 'code_challenge', 'code_challenge_method']) {
                    if (body[key])
                        params.set(key, body[key]);
                }
                return res.redirect(`/realms/${realm.name}/login?${params.toString()}`);
            }
            const oauthParams = {};
            for (const key of ['response_type', 'client_id', 'redirect_uri', 'scope', 'state', 'nonce', 'code_challenge', 'code_challenge_method']) {
                if (body[key])
                    oauthParams[key] = body[key];
            }
            if (this.passwordPolicyService.isExpired(user, realm)) {
                const changeToken = this.crypto.generateSecret(32);
                await this.verificationService.createTokenWithHash(user.id, 'change_password', 300, this.crypto.sha256(changeToken));
                return res.redirect(`/realms/${realm.name}/change-password?token=${changeToken}&info=${encodeURIComponent('Your password has expired and must be changed.')}`);
            }
            const mfaRequired = await this.mfaService.isMfaRequired(realm, user.id);
            const mfaEnabled = await this.mfaService.isMfaEnabled(user.id);
            if (mfaEnabled) {
                const challengeToken = await this.mfaService.createMfaChallenge(user.id, realm.id, oauthParams);
                res.cookie('AUTHME_MFA_CHALLENGE', challengeToken, {
                    httpOnly: true,
                    secure: process.env['NODE_ENV'] === 'production',
                    sameSite: 'lax',
                    maxAge: 5 * 60 * 1000,
                    path: `/realms/${realm.name}`,
                });
                return res.redirect(`/realms/${realm.name}/totp`);
            }
            if (mfaRequired && !mfaEnabled) {
                const sessionToken = await this.loginService.createLoginSession(realm, user, (0, proxy_ip_util_js_1.resolveClientIp)(req), req.headers['user-agent'], req.cookies?.['AUTHME_SESSION']);
                res.cookie('AUTHME_SESSION', sessionToken, {
                    httpOnly: true,
                    secure: process.env['NODE_ENV'] === 'production',
                    sameSite: 'lax',
                    path: `/realms/${realm.name}`,
                });
                return res.redirect(`/realms/${realm.name}/account/totp-setup?info=${encodeURIComponent('Two-factor authentication is required. Please set it up now.')}`);
            }
            return await this.completeLogin(realm, user, body, oauthParams, req, res);
        }
        catch (err) {
            const errMessage = err instanceof Error ? err.message : 'Invalid credentials';
            this.eventsService.recordLoginEvent({
                realmId: realm.id,
                type: event_types_js_1.LoginEventType.LOGIN_ERROR,
                clientId: body['client_id'],
                ipAddress: (0, proxy_ip_util_js_1.resolveClientIp)(req),
                error: errMessage,
            });
            const params = new URLSearchParams();
            params.set('error', errMessage);
            for (const key of ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'nonce', 'code_challenge', 'code_challenge_method']) {
                if (body[key])
                    params.set(key, body[key]);
            }
            res.redirect(`/realms/${realm.name}/login?${params.toString()}`);
        }
    }
    async completeLogin(realm, user, body, oauthParams, req, res) {
        let client;
        if (oauthParams['client_id']) {
            client = await this.oauthService.validateAuthRequest(realm, oauthParams);
        }
        const sessionToken = await this.loginService.createLoginSession(realm, user, (0, proxy_ip_util_js_1.resolveClientIp)(req), req.headers['user-agent'], req.cookies?.['AUTHME_SESSION']);
        res.cookie('AUTHME_SESSION', sessionToken, {
            httpOnly: true,
            secure: process.env['NODE_ENV'] === 'production',
            sameSite: 'lax',
            maxAge: body['rememberMe'] ? 30 * 24 * 60 * 60 * 1000 : undefined,
            path: `/realms/${realm.name}`,
        });
        this.eventsService.recordLoginEvent({
            realmId: realm.id,
            type: event_types_js_1.LoginEventType.LOGIN,
            userId: user.id,
            clientId: oauthParams['client_id'],
            ipAddress: (0, proxy_ip_util_js_1.resolveClientIp)(req),
        });
        if (!client) {
            return res.redirect(302, `/realms/${realm.name}/account`);
        }
        if (client.requireConsent) {
            const scopes = (oauthParams['scope'] ?? 'openid').split(' ').filter(Boolean);
            const hasConsent = await this.consentService.hasConsent(user.id, client.id, scopes);
            if (!hasConsent) {
                const reqId = await this.consentService.storeConsentRequest({
                    userId: user.id,
                    clientId: client.id,
                    clientName: client.name ?? client.clientId,
                    realmName: realm.name,
                    scopes,
                    oauthParams,
                });
                return res.redirect(302, `/realms/${realm.name}/consent?req=${reqId}`);
            }
        }
        const result = await this.oauthService.authorizeWithUser(realm, user, oauthParams);
        res.redirect(302, result.redirectUrl);
    }
    showTotpForm(realm, error, req, res) {
        const csrfToken = this.setCsrfCookie(realm, res);
        this.themeRender.render(res, realm, 'login', 'totp', {
            pageTitle: 'Two-Factor Authentication',
            error: error ?? '',
            csrfToken,
        }, req);
    }
    async handleTotp(realm, body, req, res) {
        this.validateCsrf(realm, body, req);
        const challengeToken = req.cookies?.['AUTHME_MFA_CHALLENGE'];
        if (!challengeToken) {
            return res.redirect(`/realms/${realm.name}/login?error=${encodeURIComponent('MFA session expired. Please login again.')}`);
        }
        const challenge = await this.mfaService.validateMfaChallengeWithAttemptCheck(challengeToken);
        if (!challenge) {
            res.clearCookie('AUTHME_MFA_CHALLENGE', { path: `/realms/${realm.name}` });
            return res.redirect(`/realms/${realm.name}/login?error=${encodeURIComponent('MFA session expired or too many failed attempts. Please login again.')}`);
        }
        if (challenge.realmId !== realm.id) {
            this.logger.warn(`MFA cross-realm token use attempt: challenge realm ${challenge.realmId} used against realm ${realm.id}`);
            res.clearCookie('AUTHME_MFA_CHALLENGE', { path: `/realms/${realm.name}` });
            return res.redirect(`/realms/${realm.name}/login?error=${encodeURIComponent('MFA session expired. Please login again.')}`);
        }
        const code = body['code'];
        const recoveryCode = body['recoveryCode'];
        let verified = false;
        if (code) {
            verified = await this.mfaService.verifyTotp(challenge.userId, code);
        }
        else if (recoveryCode) {
            verified = await this.mfaService.verifyRecoveryCode(challenge.userId, recoveryCode);
        }
        if (!verified) {
            this.eventsService.recordLoginEvent({
                realmId: realm.id,
                type: event_types_js_1.LoginEventType.MFA_VERIFY_ERROR,
                userId: challenge.userId,
                ipAddress: (0, proxy_ip_util_js_1.resolveClientIp)(req),
                error: 'Invalid MFA code',
            });
            return res.redirect(`/realms/${realm.name}/totp?error=${encodeURIComponent('Invalid code. Please try again.')}`);
        }
        await this.mfaService.consumeMfaChallenge(challengeToken);
        res.clearCookie('AUTHME_MFA_CHALLENGE', { path: `/realms/${realm.name}` });
        const user = await this.loginService.findUserById(challenge.userId);
        if (!user) {
            return res.redirect(`/realms/${realm.name}/login?error=${encodeURIComponent('User not found.')}`);
        }
        return await this.completeLogin(realm, user, body, challenge.oauthParams ?? {}, req, res);
    }
    showChangePasswordForm(realm, query, req, res) {
        const policyHints = [];
        if (realm.passwordMinLength > 1)
            policyHints.push(`At least ${realm.passwordMinLength} characters`);
        if (realm.passwordRequireUppercase)
            policyHints.push('At least one uppercase letter');
        if (realm.passwordRequireLowercase)
            policyHints.push('At least one lowercase letter');
        if (realm.passwordRequireDigits)
            policyHints.push('At least one digit');
        if (realm.passwordRequireSpecialChars)
            policyHints.push('At least one special character');
        const csrfToken = this.setCsrfCookie(realm, res);
        this.themeRender.render(res, realm, 'login', 'change-password', {
            pageTitle: 'Change Password',
            token: query['token'] ?? '',
            error: query['error'] ?? '',
            info: query['info'] ?? '',
            policyHints: policyHints.length > 0 ? policyHints : null,
            csrfToken,
        }, req);
    }
    async handleChangePassword(realm, body, req, res) {
        this.validateCsrf(realm, body, req);
        const token = body['token'];
        const currentPassword = body['currentPassword'];
        const newPassword = body['newPassword'];
        const confirmPassword = body['confirmPassword'];
        const redirectBase = `/realms/${realm.name}/change-password?token=${token ?? ''}`;
        if (!token || !currentPassword || !newPassword) {
            return res.redirect(`${redirectBase}&error=${encodeURIComponent('All fields are required.')}`);
        }
        if (newPassword !== confirmPassword) {
            return res.redirect(`${redirectBase}&error=${encodeURIComponent('New passwords do not match.')}`);
        }
        const tokenHash = this.crypto.sha256(token);
        const record = await this.prisma.verificationToken.findUnique({ where: { tokenHash } });
        if (!record || record.type !== 'change_password' || record.expiresAt < new Date()) {
            return res.redirect(`/realms/${realm.name}/login?error=${encodeURIComponent('Change password session expired. Please login again.')}`);
        }
        const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
        if (!user || !user.passwordHash) {
            return res.redirect(`/realms/${realm.name}/login?error=${encodeURIComponent('User not found.')}`);
        }
        const valid = await this.crypto.verifyPassword(user.passwordHash, currentPassword);
        if (!valid) {
            return res.redirect(`${redirectBase}&error=${encodeURIComponent('Current password is incorrect.')}`);
        }
        const validation = this.passwordPolicyService.validate(realm, newPassword);
        if (!validation.valid) {
            return res.redirect(`${redirectBase}&error=${encodeURIComponent(validation.errors.join('. '))}`);
        }
        if (realm.passwordHistoryCount > 0) {
            const inHistory = await this.passwordPolicyService.checkHistory(user.id, realm.id, newPassword, realm.passwordHistoryCount);
            if (inHistory) {
                return res.redirect(`${redirectBase}&error=${encodeURIComponent('Password was used recently. Choose a different password.')}`);
            }
        }
        const passwordHash = await this.crypto.hashPassword(newPassword);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash, passwordChangedAt: new Date() },
        });
        await this.passwordPolicyService.recordHistory(user.id, realm.id, passwordHash, realm.passwordHistoryCount);
        await this.prisma.verificationToken.delete({ where: { id: record.id } });
        const info = encodeURIComponent('Password changed successfully. You can now sign in.');
        res.redirect(`/realms/${realm.name}/login?info=${info}`);
    }
    async showConsentForm(realm, reqId, req, res) {
        if (!reqId) {
            throw new common_1.BadRequestException('Missing consent request ID');
        }
        const consentReq = await this.consentService.getConsentRequest(reqId);
        if (!consentReq) {
            throw new common_1.BadRequestException('Consent request expired or invalid');
        }
        const newReqId = await this.consentService.storeConsentRequest(consentReq);
        const scopeDescriptions = consentReq.scopes.map((s) => SCOPE_DESCRIPTIONS[s] ?? s);
        const csrfToken = this.setCsrfCookie(realm, res);
        this.themeRender.render(res, realm, 'login', 'consent', {
            pageTitle: 'Grant Access',
            clientName: consentReq.clientName,
            scopes: scopeDescriptions,
            authReqId: newReqId,
            csrfToken,
        }, req);
    }
    async handleConsent(realm, body, req, res) {
        this.validateCsrf(realm, body, req);
        const reqId = body['auth_req_id'];
        if (!reqId) {
            throw new common_1.BadRequestException('Missing consent request ID');
        }
        const consentReq = await this.consentService.getConsentRequest(reqId);
        if (!consentReq) {
            throw new common_1.BadRequestException('Consent request expired or invalid');
        }
        if (body['action'] === 'deny') {
            const redirectUri = new URL(consentReq.oauthParams['redirect_uri']);
            redirectUri.searchParams.set('error', 'access_denied');
            redirectUri.searchParams.set('error_description', 'User denied the consent request');
            if (consentReq.oauthParams['state']) {
                redirectUri.searchParams.set('state', consentReq.oauthParams['state']);
            }
            return res.redirect(302, redirectUri.toString());
        }
        await this.consentService.grantConsent(consentReq.userId, consentReq.clientId, consentReq.scopes);
        const user = await this.loginService.findUserById(consentReq.userId);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const result = await this.oauthService.authorizeWithUser(realm, user, consentReq.oauthParams);
        res.redirect(302, result.redirectUrl);
    }
    async showRegistrationForm(realm, query, req, res) {
        if (!realm.registrationAllowed) {
            return res.redirect(`/realms/${realm.name}/login?error=${encodeURIComponent('Registration is not allowed for this realm.')}`);
        }
        const hints = [];
        if (realm.passwordMinLength > 1)
            hints.push(`at least ${realm.passwordMinLength} characters`);
        if (realm.passwordRequireUppercase)
            hints.push('an uppercase letter');
        if (realm.passwordRequireLowercase)
            hints.push('a lowercase letter');
        if (realm.passwordRequireDigits)
            hints.push('a digit');
        if (realm.passwordRequireSpecialChars)
            hints.push('a special character');
        const customAttributes = await this.customAttributesService.getRegistrationAttributes(realm.id);
        const csrfToken = this.setCsrfCookie(realm, res);
        this.themeRender.render(res, realm, 'login', 'register', {
            pageTitle: 'Create Account',
            passwordMinLength: realm.passwordMinLength || 8,
            passwordHint: hints.length ? `Must contain ${hints.join(', ')}` : '',
            username: query['username'] ?? '',
            email: query['email'] ?? '',
            firstName: query['firstName'] ?? '',
            lastName: query['lastName'] ?? '',
            error: query['error'] ?? '',
            info: query['info'] ?? '',
            client_id: query['client_id'] ?? '',
            redirect_uri: query['redirect_uri'] ?? '',
            response_type: query['response_type'] ?? '',
            scope: query['scope'] ?? '',
            state: query['state'] ?? '',
            nonce: query['nonce'] ?? '',
            code_challenge: query['code_challenge'] ?? '',
            code_challenge_method: query['code_challenge_method'] ?? '',
            customAttributes: customAttributes.map((a) => ({
                name: a.name,
                displayName: a.displayName,
                type: a.type,
                required: a.required,
                options: a.options ?? [],
                value: query[`attr_${a.name}`] ?? '',
            })),
            termsOfServiceUrl: realm.termsOfServiceUrl ?? null,
            registrationApprovalRequired: realm.registrationApprovalRequired ?? false,
            csrfToken,
        }, req);
    }
    async handleRegistration(realm, body, req, res) {
        this.validateCsrf(realm, body, req);
        if (!realm.registrationAllowed) {
            return res.redirect(`/realms/${realm.name}/login?error=${encodeURIComponent('Registration is not allowed for this realm.')}`);
        }
        const username = (body['username'] ?? '').trim();
        const email = (body['email'] ?? '').trim();
        const firstName = (body['firstName'] ?? '').trim();
        const lastName = (body['lastName'] ?? '').trim();
        const password = body['password'] ?? '';
        const confirmPassword = body['confirmPassword'] ?? '';
        const oauthParamNames = ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'nonce', 'code_challenge', 'code_challenge_method'];
        const oauthParams = oauthParamNames
            .filter(p => body[p])
            .map(p => `${p}=${encodeURIComponent(body[p])}`)
            .join('&');
        const oauthSuffix = oauthParams ? `&${oauthParams}` : '';
        const preserveFields = oauthSuffix;
        if (!username || username.length < 2) {
            return res.redirect(`/realms/${realm.name}/register?error=${encodeURIComponent('Username must be at least 2 characters.')}${preserveFields}`);
        }
        const htmlPattern = /[<>]/;
        if (htmlPattern.test(username) || htmlPattern.test(firstName) || htmlPattern.test(lastName)) {
            return res.redirect(`/realms/${realm.name}/register?error=${encodeURIComponent('Fields must not contain HTML tags or angle brackets.')}${preserveFields}`);
        }
        if (!email) {
            return res.redirect(`/realms/${realm.name}/register?error=${encodeURIComponent('Email is required.')}${preserveFields}`);
        }
        if (realm.allowedEmailDomains.length > 0) {
            const emailDomain = email.split('@')[1]?.toLowerCase() ?? '';
            const allowed = realm.allowedEmailDomains.map((d) => d.toLowerCase());
            if (!allowed.includes(emailDomain)) {
                return res.redirect(`/realms/${realm.name}/register?error=${encodeURIComponent(`Registration is only allowed for email domains: ${allowed.join(', ')}`)}${preserveFields}`);
            }
        }
        if (realm.termsOfServiceUrl && !body['terms_accepted']) {
            return res.redirect(`/realms/${realm.name}/register?error=${encodeURIComponent('You must accept the terms of service to register.')}${preserveFields}`);
        }
        if (!password) {
            return res.redirect(`/realms/${realm.name}/register?error=${encodeURIComponent('Password is required.')}${preserveFields}`);
        }
        if (password !== confirmPassword) {
            return res.redirect(`/realms/${realm.name}/register?error=${encodeURIComponent('Passwords do not match.')}${preserveFields}`);
        }
        const validation = this.passwordPolicyService.validate(realm, password);
        if (!validation.valid) {
            return res.redirect(`/realms/${realm.name}/register?error=${encodeURIComponent(validation.errors.join('. '))}${preserveFields}`);
        }
        const registrationAttributes = await this.customAttributesService.getRegistrationAttributes(realm.id);
        for (const attr of registrationAttributes) {
            const value = (body[`attr_${attr.name}`] ?? '').trim();
            if (attr.required && !value) {
                return res.redirect(`/realms/${realm.name}/register?error=${encodeURIComponent(`'${attr.displayName}' is required.`)}${preserveFields}`);
            }
        }
        const existingByUsername = await this.prisma.user.findUnique({
            where: { realmId_username: { realmId: realm.id, username } },
        });
        const existingByEmail = await this.prisma.user.findUnique({
            where: { realmId_email: { realmId: realm.id, email } },
        });
        if (existingByUsername || existingByEmail) {
            return res.redirect(`/realms/${realm.name}/register?error=${encodeURIComponent('An account with that username or email already exists.')}${preserveFields}`);
        }
        const requiresApproval = realm.registrationApprovalRequired === true;
        const passwordHash = await this.crypto.hashPassword(password);
        let user;
        try {
            user = await this.prisma.user.create({
                data: {
                    realmId: realm.id,
                    username,
                    email,
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                    enabled: !requiresApproval,
                    passwordHash,
                    passwordChangedAt: new Date(),
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return res.redirect(`/realms/${realm.name}/register?error=${encodeURIComponent('An account with that username or email already exists.')}${preserveFields}`);
            }
            throw error;
        }
        if (realm.passwordHistoryCount > 0) {
            await this.passwordPolicyService.recordHistory(user.id, realm.id, passwordHash, realm.passwordHistoryCount);
        }
        try {
            await this.customAttributesService.validateAndSaveRegistrationAttributes(realm, user.id, body);
        }
        catch {
            await this.prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
            return res.redirect(`/realms/${realm.name}/register?error=${encodeURIComponent('Failed to save custom attribute values. Please try again.')}${preserveFields}`);
        }
        this.eventsService.recordLoginEvent({
            realmId: realm.id,
            type: event_types_js_1.LoginEventType.REGISTER,
            userId: user.id,
        });
        if (email) {
            try {
                const configured = await this.emailService.isConfigured(realm.name);
                if (configured) {
                    const rawToken = await this.verificationService.createToken(user.id, 'email_verification', 86400);
                    const baseUrl = this.config.get('BASE_URL', 'http://localhost:3000');
                    const verifyUrl = `${baseUrl}/realms/${realm.name}/verify-email?token=${rawToken}`;
                    const fullRealm = await this.prisma.realm.findUnique({ where: { name: realm.name } });
                    if (fullRealm) {
                        const subject = this.themeEmail.getSubject(fullRealm, 'verifyEmailSubject');
                        const html = this.themeEmail.renderEmail(fullRealm, 'verify-email', { verifyUrl });
                        await this.emailService.sendEmail(realm.name, email, subject, html);
                    }
                }
            }
            catch {
            }
        }
        let message;
        if (requiresApproval) {
            message = 'Account created successfully! Your account is pending approval by an administrator.';
        }
        else if (realm.requireEmailVerification) {
            message = 'Account created successfully! Please check your email to verify your account, then sign in.';
        }
        else {
            message = 'Account created successfully! You can now sign in.';
        }
        const info = encodeURIComponent(message);
        res.redirect(`/realms/${realm.name}/login?info=${info}${oauthSuffix}`);
    }
    async verifyEmail(realm, token, req, res) {
        if (!token) {
            return this.themeRender.render(res, realm, 'login', 'verify-email', {
                pageTitle: 'Email Verification',
                success: false,
                error: 'Missing verification token.',
            }, req);
        }
        const result = await this.verificationService.validateToken(token, 'email_verification');
        if (!result) {
            return this.themeRender.render(res, realm, 'login', 'verify-email', {
                pageTitle: 'Email Verification',
                success: false,
                error: 'This verification link is invalid or has expired.',
            }, req);
        }
        await this.prisma.user.update({
            where: { id: result.userId },
            data: { emailVerified: true },
        });
        this.themeRender.render(res, realm, 'login', 'verify-email', {
            pageTitle: 'Email Verification',
            success: true,
        }, req);
    }
    showForgotPasswordForm(realm, query, req, res) {
        const csrfToken = this.setCsrfCookie(realm, res);
        this.themeRender.render(res, realm, 'login', 'forgot-password', {
            pageTitle: 'Forgot Password',
            info: query['info'] ?? '',
            error: query['error'] ?? '',
            csrfToken,
        }, req);
    }
    async handleForgotPassword(realm, body, req, res) {
        this.validateCsrf(realm, body, req);
        const email = body['email'];
        const successMessage = encodeURIComponent('If an account with that email exists, we sent a password reset link.');
        if (email) {
            const user = await this.prisma.user.findUnique({
                where: { realmId_email: { realmId: realm.id, email } },
            });
            if (user) {
                try {
                    const configured = await this.emailService.isConfigured(realm.name);
                    if (configured) {
                        const rawToken = await this.verificationService.createToken(user.id, 'password_reset', 3600);
                        const baseUrl = this.config.get('BASE_URL', 'http://localhost:3000');
                        const resetUrl = `${baseUrl}/realms/${realm.name}/reset-password?token=${rawToken}`;
                        const fullRealm = await this.prisma.realm.findUnique({ where: { name: realm.name } });
                        if (fullRealm) {
                            const subject = this.themeEmail.getSubject(fullRealm, 'resetPasswordSubject');
                            const html = this.themeEmail.renderEmail(fullRealm, 'reset-password', { resetUrl });
                            await this.emailService.sendEmail(realm.name, email, subject, html);
                        }
                    }
                }
                catch {
                }
            }
        }
        res.redirect(`/realms/${realm.name}/forgot-password?info=${successMessage}`);
    }
    async showResetPasswordForm(realm, token, error, req, res) {
        if (!token) {
            return this.themeRender.render(res, realm, 'login', 'reset-password', {
                pageTitle: 'Reset Password',
                error: 'Missing reset token.',
                token: '',
            }, req);
        }
        const tokenHash = this.crypto.sha256(token);
        const record = await this.prisma.verificationToken.findUnique({
            where: { tokenHash },
        });
        if (!record || record.type !== 'password_reset' || record.expiresAt < new Date()) {
            return this.themeRender.render(res, realm, 'login', 'reset-password', {
                pageTitle: 'Reset Password',
                error: 'This reset link is invalid or has expired.',
                token: '',
            }, req);
        }
        const csrfToken = this.setCsrfCookie(realm, res);
        this.themeRender.render(res, realm, 'login', 'reset-password', {
            pageTitle: 'Reset Password',
            token,
            error: error ?? '',
            csrfToken,
        }, req);
    }
    async handleResetPassword(realm, body, req, res) {
        this.validateCsrf(realm, body, req);
        const token = body['token'];
        const password = body['password'];
        const confirmPassword = body['confirmPassword'];
        if (!token || !password) {
            return res.redirect(`/realms/${realm.name}/reset-password?token=${token ?? ''}&error=${encodeURIComponent('Missing required fields.')}`);
        }
        if (password !== confirmPassword) {
            return res.redirect(`/realms/${realm.name}/reset-password?token=${token}&error=${encodeURIComponent('Passwords do not match.')}`);
        }
        const validation = this.passwordPolicyService.validate(realm, password);
        if (!validation.valid) {
            return res.redirect(`/realms/${realm.name}/reset-password?token=${token}&error=${encodeURIComponent(validation.errors.join('. '))}`);
        }
        const result = await this.verificationService.validateToken(token, 'password_reset');
        if (!result) {
            return res.redirect(`/realms/${realm.name}/reset-password?error=${encodeURIComponent('This reset link is invalid or has expired.')}`);
        }
        const passwordHash = await this.crypto.hashPassword(password);
        await this.prisma.user.update({
            where: { id: result.userId },
            data: { passwordHash, passwordChangedAt: new Date() },
        });
        const user = await this.prisma.user.findUnique({ where: { id: result.userId } });
        if (user) {
            await this.passwordPolicyService.recordHistory(user.id, realm.id, passwordHash, realm.passwordHistoryCount);
        }
        this.eventsService.recordLoginEvent({
            realmId: realm.id,
            type: event_types_js_1.LoginEventType.PASSWORD_RESET,
            userId: result.userId,
        });
        const info = encodeURIComponent('Your password has been reset. You can now sign in.');
        res.redirect(`/realms/${realm.name}/login?info=${info}`);
    }
};
exports.LoginController = LoginController;
__decorate([
    (0, common_1.Get)('login'),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], LoginController.prototype, "showLoginForm", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.UseGuards)(rate_limit_guard_js_1.RateLimitGuard),
    (0, rate_limit_guard_js_1.RateLimitByIp)(),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_js_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], LoginController.prototype, "handleLogin", null);
__decorate([
    (0, common_1.Get)('totp'),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Query)('error')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", void 0)
], LoginController.prototype, "showTotpForm", null);
__decorate([
    (0, common_1.Post)('totp'),
    (0, common_1.UseGuards)(rate_limit_guard_js_1.RateLimitGuard),
    (0, rate_limit_guard_js_1.RateLimitByIp)(),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_js_1.TotpDto, Object, Object]),
    __metadata("design:returntype", Promise)
], LoginController.prototype, "handleTotp", null);
__decorate([
    (0, common_1.Get)('change-password'),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], LoginController.prototype, "showChangePasswordForm", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.UseGuards)(rate_limit_guard_js_1.RateLimitGuard),
    (0, rate_limit_guard_js_1.RateLimitByIp)(),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_js_1.ChangePasswordDto, Object, Object]),
    __metadata("design:returntype", Promise)
], LoginController.prototype, "handleChangePassword", null);
__decorate([
    (0, common_1.Get)('consent'),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Query)('req')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], LoginController.prototype, "showConsentForm", null);
__decorate([
    (0, common_1.Post)('consent'),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], LoginController.prototype, "handleConsent", null);
__decorate([
    (0, common_1.Get)('register'),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], LoginController.prototype, "showRegistrationForm", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.UseGuards)(rate_limit_guard_js_1.RateLimitGuard),
    (0, rate_limit_guard_js_1.RateLimitByIp)(),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], LoginController.prototype, "handleRegistration", null);
__decorate([
    (0, common_1.Get)('verify-email'),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Query)('token')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], LoginController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Get)('forgot-password'),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], LoginController.prototype, "showForgotPasswordForm", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.UseGuards)(rate_limit_guard_js_1.RateLimitGuard),
    (0, rate_limit_guard_js_1.RateLimitByIp)(),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_js_1.ForgotPasswordDto, Object, Object]),
    __metadata("design:returntype", Promise)
], LoginController.prototype, "handleForgotPassword", null);
__decorate([
    (0, common_1.Get)('reset-password'),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Query)('token')),
    __param(2, (0, common_1.Query)('error')),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], LoginController.prototype, "showResetPasswordForm", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.UseGuards)(rate_limit_guard_js_1.RateLimitGuard),
    (0, rate_limit_guard_js_1.RateLimitByIp)(),
    __param(0, (0, current_realm_decorator_js_1.CurrentRealm)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_js_1.ResetPasswordDto, Object, Object]),
    __metadata("design:returntype", Promise)
], LoginController.prototype, "handleResetPassword", null);
exports.LoginController = LoginController = LoginController_1 = __decorate([
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('realms/:realmName'),
    (0, common_1.UseGuards)(realm_guard_js_1.RealmGuard),
    (0, public_decorator_js_1.Public)(),
    __param(15, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [login_service_js_1.LoginService,
        oauth_service_js_1.OAuthService,
        consent_service_js_1.ConsentService,
        verification_service_js_1.VerificationService,
        email_service_js_1.EmailService,
        prisma_service_js_1.PrismaService,
        crypto_service_js_1.CryptoService,
        config_1.ConfigService,
        password_policy_service_js_1.PasswordPolicyService,
        mfa_service_js_1.MfaService,
        theme_render_service_js_1.ThemeRenderService,
        theme_email_service_js_1.ThemeEmailService,
        events_service_js_1.EventsService,
        custom_attributes_service_js_1.CustomAttributesService,
        csrf_service_js_1.CsrfService,
        risk_assessment_service_js_1.RiskAssessmentService])
], LoginController);
//# sourceMappingURL=login.controller.js.map