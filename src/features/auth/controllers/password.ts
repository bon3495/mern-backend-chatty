import crypto from 'crypto';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import publicIP from 'ip';
import moment from 'moment';
import { config } from '@root/config';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { BadRequestError } from '@global/helpers/error-handler';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { emailSchema, passwordSchema } from '@auth/schemas/password.schema';
import { authService } from '@service/db/auth.service';
import { forgotPasswordTemplate } from '@service/emails/templates/forgot-password';
import { resetPasswordTemplate } from '@service/emails/templates/reset-password';
import { emailQueue } from '@service/queues/email.queue';
import { IResetPasswordParams } from '@user/interfaces/user.interface';

export class Password {
  @joiValidation(emailSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const existingUser: IAuthDocument = await authService.getAuthUserByEmail(
      email
    );
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');

    await authService.updatePasswordToken(
      `${existingUser._id}`,
      randomCharacters,
      Date.now() * 60 * 60 * 1000
    );

    const resetLink = `${config.CLIENT_URL}/reset-password?token=${randomCharacters}`;
    const template: string = forgotPasswordTemplate.getTemplate(
      existingUser.username,
      resetLink
    );

    emailQueue.addEmailJob('forgotPasswordEmail', {
      receiverEmail: email,
      template,
      subject: 'Reset Your Password',
    });

    res.status(HTTP_STATUS.OK).json({
      message: 'Password reset email sent',
    });
  }

  @joiValidation(passwordSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const { password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      throw new BadRequestError('Password do not match');
    }
    const { token } = req.params;

    const existingUser: IAuthDocument =
      await authService.getAuthUserByPasswordResetToken(token);
    if (!existingUser) {
      throw new BadRequestError('Reset token has expired');
    }
    existingUser.password = password;
    // reset passwordResetToken and passwordResetExpires after update password
    existingUser.passwordResetToken = undefined;
    existingUser.passwordResetExpires = undefined;
    await existingUser.save();

    const resetPasswordData: IResetPasswordParams = {
      date: moment().format('DD/MM/YYYY HH:mm'),
      username: existingUser.username,
      email: existingUser.email,
      ipaddress: publicIP.address(),
    };

    const template: string =
      resetPasswordTemplate.getTemplate(resetPasswordData);

    emailQueue.addEmailJob('forgotPasswordEmail', {
      receiverEmail: existingUser.email,
      template,
      subject: 'Password Reset Confirmation',
    });

    res.status(HTTP_STATUS.OK).json({
      message: 'Password successfully updated',
    });
  }
}
