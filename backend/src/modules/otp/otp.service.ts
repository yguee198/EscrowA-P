import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { OtpPurpose, OtpChannel } from '@prisma/client';

@Injectable()
export class OtpService {
    constructor(private prisma: PrismaService) { }

    generateCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async createOTP(userId: string, phone: string, purpose: OtpPurpose, ip?: string, device?: string, transactionId?: string, channel: OtpChannel = OtpChannel.SMS) {
        const code = this.generateCode();
        const hashedCode = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await this.prisma.otp.create({
            data: {
                phone,
                code: hashedCode,
                purpose,      //Transaction OTP
                channel,     // SMS
                ipAddress: ip,
                deviceInfo: device,
                expiresAt,

                user: userId
                    ? {
                        connect: { id: userId },
                    }
                    : undefined,

                transaction: transactionId ? { connect: { id: transactionId } } : undefined,
            },
        });

        return code;
    }

    async verifyOTP(userId: string, phone: string, inputCode: string, transactionId: string, purpose: OtpPurpose = OtpPurpose.TRANSACTION) {
        const otp = await this.prisma.otp.findFirst({
            where: { phone, used: false, transactionId, purpose, userId },
            orderBy: { createdAt: 'desc' },
        });

        if (!otp) throw new BadRequestException('OTP not found');
        if (otp.attempts >= 5) {
            throw new BadRequestException('Too many attempts. Please request a new OTP.');
        }
        if (new Date() > otp.expiresAt) throw new BadRequestException('OTP expired');

        const isValid = await bcrypt.compare(inputCode, otp.code);
        if (!isValid) {
            await this.prisma.otp.update({
                where: { id: otp.id },
                data: { attempts: otp.attempts + 1 },
            });
            throw new BadRequestException('Invalid OTP');
        }

        await this.prisma.otp.update({
            where: { id: otp.id },
            data: { used: true },
        });

        return true;
    }

    
}