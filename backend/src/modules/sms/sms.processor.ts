// sms.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { SmsService } from './sms.service';

@Processor('sms-queue')
@Injectable()
export class SmsProcessor {
  constructor(private smsService: SmsService) {}

  @Process('send-otp')
  async handleSendOtp(job: Job) {
    const { phone, message } = job.data;

    // Hano wohereza SMS kuri real API
    await this.smsService.sendSMS(phone, message);

    console.log(`SMS sent to ${phone}: ${message}`);
  }
}