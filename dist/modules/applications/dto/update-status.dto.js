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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFollowUpDto = exports.UpdateEmailDraftDto = exports.GenerateEmailDto = exports.UpdateApplicationDetailsDto = exports.UpdateApplicationStatusDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class UpdateApplicationStatusDto {
    status;
    notes;
    appliedAt;
}
exports.UpdateApplicationStatusDto = UpdateApplicationStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ApplicationStatus, { message: 'Invalid application status' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateApplicationStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateApplicationStatusDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateApplicationStatusDto.prototype, "appliedAt", void 0);
class UpdateApplicationDetailsDto {
    selectedCvId;
    expectedSalary;
    salaryCurrency;
    portalUrl;
    applicationNotes;
}
exports.UpdateApplicationDetailsDto = UpdateApplicationDetailsDto;
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateApplicationDetailsDto.prototype, "selectedCvId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateApplicationDetailsDto.prototype, "expectedSalary", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateApplicationDetailsDto.prototype, "salaryCurrency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateApplicationDetailsDto.prototype, "portalUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateApplicationDetailsDto.prototype, "applicationNotes", void 0);
class GenerateEmailDto {
    type;
    recruiterName;
    recipientEmail;
    tone;
    customInstructions;
    customNotes;
}
exports.GenerateEmailDto = GenerateEmailDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.EmailType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "recruiterName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "recipientEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "tone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "customInstructions", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateEmailDto.prototype, "customNotes", void 0);
class UpdateEmailDraftDto {
    recipientName;
    recipientEmail;
    subject;
    bodyMarkdown;
    status;
}
exports.UpdateEmailDraftDto = UpdateEmailDraftDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmailDraftDto.prototype, "recipientName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmailDraftDto.prototype, "recipientEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmailDraftDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmailDraftDto.prototype, "bodyMarkdown", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.EmailStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmailDraftDto.prototype, "status", void 0);
class CreateFollowUpDto {
    scheduledDate;
    reminderTitle;
    notes;
}
exports.CreateFollowUpDto = CreateFollowUpDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateFollowUpDto.prototype, "scheduledDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateFollowUpDto.prototype, "reminderTitle", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateFollowUpDto.prototype, "notes", void 0);
//# sourceMappingURL=update-status.dto.js.map