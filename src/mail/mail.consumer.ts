import { Controller, Inject } from 'my-fastify-decorators';
import { Ctx, EventPattern, Payload } from 'my-fastify-decorators-microservices';
import { MailService } from './mail.service.js';

@Controller()
export class MailController {

	@Inject(MailService)
	private mailService!: MailService;

    // @EventPattern('user_created')
    // async handleUserCreated(@Payload() data: { email: string }) {
    //     console.log('Worker received task: Send mail to', data.email);
    //     await this.mailService.sendWelcomeEmail(data.email);
    //     console.log('Task completed.', data);
    // }

    @EventPattern('send_otp')
    async handleSendOtp(@Payload() data: { mail: string; otp: string }, @Ctx() context: any) {
        console.log('Worker received task: Send OTP to', data.mail);
        
        try {
            await this.mailService.sendOtpEmail(data.mail, data.otp);
            console.log('OTP Task completed.', data);
        } catch (error: any) {
            console.error('Error processing OTP email:', error);

            const isPermanent = error.statusCode && error.statusCode >= 400 && error.statusCode < 500;
            
            if (isPermanent) {
                console.error('Permanent error detected, dropping message.', error.message);
                return;
            }

            console.log('Scheduling retry...');
            const channel = context.channel;
            const originalMessage = context.originalMessage;

            await channel.assertQueue('mail_queue_wait', {
                durable: true,
                deadLetterExchange: '',
                deadLetterRoutingKey: 'mail_queue',
                messageTtl: 60000
            });

            channel.sendToQueue('mail_queue_wait', originalMessage.content, {
                persistent: true
            });
            console.log('Message sent to wait queue for retry in 60s.');
        }
    }
}