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
exports.CrmController = void 0;
const common_1 = require("@nestjs/common");
const crm_service_1 = require("./crm.service");
const crm_dto_1 = require("./dto/crm.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let CrmController = class CrmController {
    crmService;
    constructor(crmService) {
        this.crmService = crmService;
    }
    async getCompanies(userId) {
        const companies = await this.crmService.getCompanies(userId);
        return {
            message: 'Companies directory fetched',
            data: companies,
        };
    }
    async getCompanyById(userId, companyId) {
        const company = await this.crmService.getCompanyById(userId, companyId);
        return {
            message: 'Company profile fetched',
            data: company,
        };
    }
    async createCompany(userId, dto) {
        const company = await this.crmService.createCompany(userId, dto);
        return {
            message: 'Company added to CRM',
            data: company,
        };
    }
    async updateCompany(userId, companyId, dto) {
        const updated = await this.crmService.updateCompany(userId, companyId, dto);
        return {
            message: 'Company updated',
            data: updated,
        };
    }
    async deleteCompany(userId, companyId) {
        await this.crmService.deleteCompany(userId, companyId);
        return {
            message: 'Company deleted from CRM',
        };
    }
    async getRecruiters(userId) {
        const recruiters = await this.crmService.getRecruiters(userId);
        return {
            message: 'Recruiter contacts fetched',
            data: recruiters,
        };
    }
    async createRecruiter(userId, dto) {
        const recruiter = await this.crmService.createRecruiter(userId, dto);
        return {
            message: 'Recruiter added to CRM',
            data: recruiter,
        };
    }
    async updateRecruiter(userId, recruiterId, dto) {
        const updated = await this.crmService.updateRecruiter(userId, recruiterId, dto);
        return {
            message: 'Recruiter updated',
            data: updated,
        };
    }
    async deleteRecruiter(userId, recruiterId) {
        await this.crmService.deleteRecruiter(userId, recruiterId);
        return {
            message: 'Recruiter deleted from CRM',
        };
    }
};
exports.CrmController = CrmController;
__decorate([
    (0, common_1.Get)('companies'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getCompanies", null);
__decorate([
    (0, common_1.Get)('companies/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getCompanyById", null);
__decorate([
    (0, common_1.Post)('companies'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, crm_dto_1.CreateCompanyDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "createCompany", null);
__decorate([
    (0, common_1.Patch)('companies/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, crm_dto_1.UpdateCompanyDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "updateCompany", null);
__decorate([
    (0, common_1.Delete)('companies/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "deleteCompany", null);
__decorate([
    (0, common_1.Get)('recruiters'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getRecruiters", null);
__decorate([
    (0, common_1.Post)('recruiters'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, crm_dto_1.CreateRecruiterDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "createRecruiter", null);
__decorate([
    (0, common_1.Patch)('recruiters/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, crm_dto_1.UpdateRecruiterDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "updateRecruiter", null);
__decorate([
    (0, common_1.Delete)('recruiters/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "deleteRecruiter", null);
exports.CrmController = CrmController = __decorate([
    (0, common_1.Controller)('crm'),
    __metadata("design:paramtypes", [crm_service_1.CrmService])
], CrmController);
//# sourceMappingURL=crm.controller.js.map