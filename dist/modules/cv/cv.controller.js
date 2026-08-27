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
exports.CvController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path = require("path");
const fs = require("fs");
const cv_service_1 = require("./cv.service");
const create_cv_dto_1 = require("./dto/create-cv.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
let CvController = class CvController {
    cvService;
    constructor(cvService) {
        this.cvService = cvService;
    }
    async uploadCv(userId, file, dto) {
        const cv = await this.cvService.uploadAndParseCv(userId, file, dto);
        return {
            message: 'CV uploaded and structured profile parsed successfully via Gemini Flash',
            data: cv,
        };
    }
    async uploadNewVersion(userId, cvId, file) {
        const updated = await this.cvService.uploadNewVersion(userId, cvId, file);
        return {
            message: 'New CV version uploaded and parsed successfully',
            data: updated,
        };
    }
    async getMyCvs(userId) {
        const cvs = await this.cvService.getUserCvs(userId);
        return {
            message: 'CV list fetched',
            data: cvs,
        };
    }
    async getCvDetails(userId, cvId) {
        const cv = await this.cvService.getCvById(userId, cvId);
        return {
            message: 'CV details fetched',
            data: cv,
        };
    }
    async setPrimary(userId, cvId) {
        const cv = await this.cvService.setPrimaryCv(userId, cvId);
        return {
            message: 'Primary CV updated successfully',
            data: cv,
        };
    }
    async updateParsedData(userId, cvId, dto) {
        const cv = await this.cvService.updateParsedData(userId, cvId, dto);
        return {
            message: 'CV details updated',
            data: cv,
        };
    }
    async deleteCv(userId, cvId) {
        const result = await this.cvService.deleteCv(userId, cvId);
        return result;
    }
};
exports.CvController = CvController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: uploadDir,
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = path.extname(file.originalname);
                cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
        }),
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
        fileFilter: (req, file, cb) => {
            const allowedExtensions = ['.pdf', '.docx', '.txt'];
            const ext = path.extname(file.originalname).toLowerCase();
            if (allowedExtensions.includes(ext)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Only PDF, DOCX, and TXT files are allowed'), false);
            }
        },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_cv_dto_1.CreateCvDto]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "uploadCv", null);
__decorate([
    (0, common_1.Post)(':id/version'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: uploadDir,
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = path.extname(file.originalname);
                cb(null, `cv-version-${uniqueSuffix}${ext}`);
            },
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "uploadNewVersion", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "getMyCvs", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "getCvDetails", null);
__decorate([
    (0, common_1.Patch)(':id/primary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "setPrimary", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_cv_dto_1.UpdateParsedCvDto]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "updateParsedData", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "deleteCv", null);
exports.CvController = CvController = __decorate([
    (0, common_1.Controller)('cv'),
    __metadata("design:paramtypes", [cv_service_1.CvService])
], CvController);
//# sourceMappingURL=cv.controller.js.map