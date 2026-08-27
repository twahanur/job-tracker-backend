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
exports.MatchingController = void 0;
const common_1 = require("@nestjs/common");
const matching_service_1 = require("./matching.service");
const match_job_dto_1 = require("./dto/match-job.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let MatchingController = class MatchingController {
    matchingService;
    constructor(matchingService) {
        this.matchingService = matchingService;
    }
    async evaluateMatch(userId, jobId, dto) {
        const result = await this.matchingService.evaluateMatch(userId, jobId, dto);
        return {
            message: 'Match compatibility evaluation completed via Gemini Flash',
            data: result,
        };
    }
    async getMatchHistory(userId, jobId) {
        const results = await this.matchingService.getJobMatchResults(userId, jobId);
        return {
            message: 'Match history fetched',
            data: results,
        };
    }
};
exports.MatchingController = MatchingController;
__decorate([
    (0, common_1.Post)(':id/match'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, match_job_dto_1.MatchJobDto]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "evaluateMatch", null);
__decorate([
    (0, common_1.Get)(':id/matches'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "getMatchHistory", null);
exports.MatchingController = MatchingController = __decorate([
    (0, common_1.Controller)('jobs'),
    __metadata("design:paramtypes", [matching_service_1.MatchingService])
], MatchingController);
//# sourceMappingURL=matching.controller.js.map