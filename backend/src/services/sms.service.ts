import { env } from '../config/env.js';

/**
 * [SERVICE] SMS Service (MSG91 Gateway)
 * Dispatches authentic SMS OTP messages to Devotees and Purohits across India.
 * Falls back safely to terminal logging when MSG91 credentials are not configured.
 */
export class SmsService {
  /**
   * Dispatch 6-digit SMS OTP to an Indian mobile number
   */
  async sendOtpSms(
    phoneNumber: string,
    otp: string,
    role: 'DEVOTEE' | 'PUROHIT' = 'DEVOTEE'
  ): Promise<{ success: boolean; messageId?: string }> {
    // Standardize to 10 digits for Indian phone numbers
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    const phone10 = cleanDigits.slice(-10);
    const destination = `91${phone10}`;

    console.log('\n============================================================');
    console.log(`[SMS DISPATCH - ${role}] Destination: +91 ${phone10}`);
    console.log(`[SMS DISPATCH - ${role}] 6-Digit OTP: ${otp}`);
    console.log(`[SMS DISPATCH - ${role}] Valid for: 10 minutes`);
    console.log('============================================================\n');

    if (env.MSG91_AUTH_KEY) {
      try {
        // 1. Direct MSG91 OTP Endpoint with configured template ID (Fastest & most reliable)
        let otpUrl = `https://control.msg91.com/api/v5/otp?mobile=${destination}&authkey=${encodeURIComponent(
          env.MSG91_AUTH_KEY
        )}&otp=${encodeURIComponent(otp)}`;

        if (env.MSG91_TEMPLATE_ID) {
          otpUrl += `&template_id=${encodeURIComponent(env.MSG91_TEMPLATE_ID)}`;
        }

        const otpRes = await fetch(otpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const otpData: any = await otpRes.json().catch(() => null);

        if (otpRes.ok && (otpData?.type === 'success' || otpData?.request_id)) {
          console.log(`✅ [MSG91 OTP SUCCESS] SMS OTP successfully dispatched to +${destination} (RequestId: ${otpData?.request_id || 'OK'})`);
          return { success: true, messageId: otpData?.request_id || otpData?.message };
        } else {
          console.warn(`⚠️ [MSG91 OTP NOTICE] OTP endpoint response:`, otpData);
        }

        // 2. Fallback to Campaign Flow if configured
        if (env.MSG91_CAMPAIGN_SLUG) {
          const campaignUrl = `https://control.msg91.com/api/v5/campaign/api/campaigns/${encodeURIComponent(
            env.MSG91_CAMPAIGN_SLUG
          )}/run`;

          const response = await fetch(campaignUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'authkey': env.MSG91_AUTH_KEY,
            },
            body: JSON.stringify({
              data: {
                sendTo: [
                  {
                    to: [destination],
                    variables: {
                      OTP: otp,
                      otp: otp,
                    },
                  },
                ],
              },
            }),
          });

          const data: any = await response.json().catch(() => null);

          if (response.ok && (data?.status === 'success' || data?.type === 'success' || data?.data)) {
            console.log(`✅ [MSG91 CAMPAIGN SUCCESS] SMS OTP successfully sent to +${destination}`);
            return { success: true, messageId: data?.data?.requestId || 'OK' };
          }
        }

        return { success: false };
      } catch (err: any) {
        console.error(`❌ [MSG91 ERROR] Exception sending SMS to +${destination}:`, err.message);
        return { success: false };
      }
    } else {
      console.log(`ℹ️ MSG91: AuthKey not set in .env. Running in dynamic terminal dispatch mode for +91 ${phone10}.`);
      return { success: true };
    }
  }
}

export const smsService = new SmsService();
