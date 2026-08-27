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
exports.ApplicationsController = void 0;
const common_1 = require("@nestjs/common");
const applications_service_1 = require("./applications.service");
const update_status_dto_1 = require("./dto/update-status.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let ApplicationsController = class ApplicationsController {
    applicationsService;
    constructor(applicationsService) {
        this.applicationsService = applicationsService;
    }
    async getApplications(userId) {
        const apps = await this.applicationsService.getApplications(userId);
        return {
            message: 'Applications fetched',
            data: apps,
        };
    }
    async getApplicationById(userId, id) {
        const app = await this.applicationsService.getApplicationById(userId, id);
        return {
            message: 'Application details fetched',
            data: app,
        };
    }
    async updateStatus(userId, id, dto) {
        const updated = await this.applicationsService.updateStatus(userId, id, dto);
        return {
            message: 'Application stage updated successfully',
            data: updated,
        };
    }
    async updateDetails(userId, id, dto) {
        const updated = await this.applicationsService.updateDetails(userId, id, dto);
        return {
            message: 'Application details updated',
            data: updated,
        };
    }
    async generateEmail(userId, id, dto) {
        const draft = await this.applicationsService.generateEmailDraft(userId, id, dto);
        return {
            message: 'AI email draft generated successfully via Gemini Flash',
            data: draft,
        };
    }
    async updateEmailDraft(userId, emailId, dto) {
        const updated = await this.applicationsService.updateEmailDraft(userId, emailId, dto);
        return {
            message: 'Email draft updated',
            data: updated,
        };
    }
    async scheduleFollowUp(userId, id, dto) {
        const reminder = await this.applicationsService.scheduleFollowUp(userId, id, dto);
        return {
            message: 'Follow-up scheduled',
            data: reminder,
        };
    }
    async completeFollowUp(userId, followUpId) {
        const completed = await this.applicationsService.completeFollowUp(userId, followUpId);
        return {
            message: 'Follow-up marked as completed',
            data: completed,
        };
    }
};
exports.ApplicationsController = ApplicationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "getApplications", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "getApplicationById", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_status_dto_1.UpdateApplicationStatusDto]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_status_dto_1.UpdateApplicationDetailsDto]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "updateDetails", null);
__decorate([
    (0, common_1.Post)(':id/emails/generate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_status_dto_1.GenerateEmailDto]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "generateEmail", null);
__decorate([
    (0, common_1.Patch)('emails/:emailId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('emailId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_status_dto_1.UpdateEmailDraftDto]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "updateEmailDraft", null);
__decorate([
    (0, common_1.Post)(':id/follow-ups'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_status_dto_1.CreateFollowUpDto]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "scheduleFollowUp", null);
__decorate([
    (0, common_1.Patch)('follow-ups/:followUpId/complete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('followUpId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ApplicationsController.prototype, "completeFollowUp", null);
exports.ApplicationsController = ApplicationsController = __decorate([
    (0, common_1.Controller)('applications'),
    __metadata("design:paramtypes", [applications_service_1.ApplicationsService])
], ApplicationsController);
//# sourceMappingURL=applications.controller.js.map